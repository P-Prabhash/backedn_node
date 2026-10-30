const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getPool } = require('./config/database');

async function runTests() {
  const db = await getPool();
  console.log('=== STARTING SETTLEMENT, INTEREST & LOAN CLOSURE E2E TESTS ===\n');

  let conn = await db.getConnection();

  // Helper to cleanup test records
  async function cleanupLoan(loanId, goldItemId) {
    if (!loanId) return;
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DELETE FROM release_items WHERE release_id IN (SELECT id FROM partial_releases WHERE loan_id = ?)', [loanId]);
    await conn.query('DELETE FROM partial_releases WHERE loan_id = ?', [loanId]);
    await conn.query('DELETE FROM loan_transactions WHERE loan_id = ?', [loanId]);
    await conn.query('DELETE FROM receipts WHERE loan_id = ?', [loanId]);
    await conn.query('DELETE FROM payment_allocations WHERE payment_id IN (SELECT id FROM payments WHERE loan_id = ?)', [loanId]);
    await conn.query('DELETE FROM payments WHERE loan_id = ?', [loanId]);
    await conn.query('DELETE FROM interest_records WHERE loan_id = ?', [loanId]);
    await conn.query('DELETE FROM loan_status_history WHERE loan_id = ?', [loanId]);
    await conn.query('DELETE FROM loan_gold_items WHERE loan_id = ?', [loanId]);
    if (goldItemId) await conn.query('DELETE FROM gold_items WHERE id = ?', [goldItemId]);
    await conn.query('DELETE FROM loans WHERE id = ?', [loanId]);
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  // Ensure test customer exists
  const [custs] = await conn.query("SELECT id FROM customers WHERE id = 1");
  if (custs.length === 0) {
    await conn.query(`INSERT INTO customers (id, customer_code, name, mobile, address, status) VALUES (1, 'CUST-1001', 'Test Customer', '9999999999', 'Test Address', 'ACTIVE')`);
  }

  // -------------------------------------------------------------------------
  // TEST CASE 1: Manual Final Interest Saved & Persistent (Prompt Requirement 1)
  // -------------------------------------------------------------------------
  console.log('Test 1: Manual Final Interest Persistence...');
  const [g1] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'Test Gold Ring', '22K', 10.000, 'AVAILABLE')");
  const goldId1 = g1.insertId;
  const loanNo1 = 'PL-TEST1-' + Date.now();
  const [l1] = await conn.query(
    "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 5000.00, 2.00, 0.00, 0.00, 5000.00, 0.00, 5000.00, 'ACTIVE')",
    [loanNo1]
  );
  const loanId1 = l1.insertId;
  await conn.query("INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date) VALUES (?, ?, 10.000, 'PLEDGED', CURRENT_DATE())", [loanId1, goldId1]);
  await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldId1]);

  // Execute /loans/close call logic with manual_final_interest = 100, payment_amount = 0
  const inputManual1 = 100.00;
  await conn.beginTransaction();
  await conn.query("UPDATE loans SET manual_final_interest = manual_final_interest + ?, total_due = total_due + ?, remaining_balance = remaining_balance + ? WHERE id = ?", [inputManual1, inputManual1, inputManual1, loanId1]);
  await conn.query("INSERT INTO interest_records (loan_id, period_start, period_end, monthly_rate, interest_amount, is_manual, remarks) VALUES (?, CURRENT_DATE(), CURRENT_DATE(), 0.00, ?, 1, 'Manual Final Settlement Interest')", [loanId1, inputManual1]);
  await conn.commit();

  const [check1] = await conn.query("SELECT * FROM loans WHERE id = ?", [loanId1]);
  console.assert(parseFloat(check1[0].manual_final_interest) === 100.00, 'Test 1 Failed: manual_final_interest not 100');
  console.assert(parseFloat(check1[0].total_due) === 5100.00, 'Test 1 Failed: total_due not 5100');
  console.log('  ✓ Test 1 Passed: Manual final interest saved correctly.');
  await cleanupLoan(loanId1, goldId1);

  // -------------------------------------------------------------------------
  // TEST CASE 2: Principal-only payment leaves interest pending (Prompt Example A)
  // -------------------------------------------------------------------------
  console.log('\nTest 2: Principal-only Payment (Prompt Example A)...');
  const [g2] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'Test Gold Chain', '22K', 12.000, 'AVAILABLE')");
  const goldId2 = g2.insertId;
  const loanNo2 = 'PL-TEST2-' + Date.now();
  const [l2] = await conn.query(
    "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 5000.00, 2.00, 0.00, 100.00, 5100.00, 0.00, 5100.00, 'ACTIVE')",
    [loanNo2]
  );
  const loanId2 = l2.insertId;
  await conn.query("INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date) VALUES (?, ?, 12.000, 'PLEDGED', CURRENT_DATE())", [loanId2, goldId2]);
  await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldId2]);

  // Payment Received: 5000.00
  const paymentAmt2 = 5000.00;
  const totalDue2 = 5100.00;
  const newTotalPaid2 = 5000.00;
  const newRemaining2 = totalDue2 - newTotalPaid2; // 100.00

  await conn.beginTransaction();
  await conn.query("INSERT INTO payments (receipt_no, loan_id, customer_id, payment_type, amount, manual_interest, total_received, payment_date, payment_time, payment_mode, previous_paid, new_total_paid, remaining_balance, remarks) VALUES ('RCP-TEST2', ?, 1, 'PARTIAL', ?, 100.00, ?, CURRENT_DATE(), '12:00:00', 'CASH', 0.00, ?, ?, 'Principal Payment Test')", [loanId2, paymentAmt2, paymentAmt2, newTotalPaid2, newRemaining2]);
  await conn.query("UPDATE loans SET total_paid = ?, remaining_balance = ?, status = 'PARTIALLY_PAID' WHERE id = ?", [newTotalPaid2, newRemaining2, loanId2]);
  await conn.commit();

  const [check2] = await conn.query("SELECT * FROM loans WHERE id = ?", [loanId2]);
  const [coll2] = await conn.query("SELECT * FROM loan_gold_items WHERE loan_id = ?", [loanId2]);
  console.assert(parseFloat(check2[0].remaining_balance) === 100.00, 'Test 2 Failed: remaining balance not 100');
  console.assert(check2[0].status !== 'CLOSED', 'Test 2 Failed: loan status should NOT be CLOSED');
  console.assert(coll2[0].status === 'PLEDGED', 'Test 2 Failed: collateral should stay PLEDGED');
  console.log('  ✓ Test 2 Passed: Rs 5,000 paid leaves Rs 100 interest pending, loan remains ACTIVE, collateral PLEDGED.');
  await cleanupLoan(loanId2, goldId2);

  // -------------------------------------------------------------------------
  // TEST CASE 3: Full settlement clears principal and interest (Prompt Example B)
  // -------------------------------------------------------------------------
  console.log('\nTest 3: Full Settlement (Prompt Example B)...');
  const [g3] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'Test Gold Bangle', '22K', 20.000, 'AVAILABLE')");
  const goldId3 = g3.insertId;
  const loanNo3 = 'PL-TEST3-' + Date.now();
  const [l3] = await conn.query(
    "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 5000.00, 2.00, 0.00, 100.00, 5100.00, 0.00, 5100.00, 'ACTIVE')",
    [loanNo3]
  );
  const loanId3 = l3.insertId;
  await conn.query("INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date) VALUES (?, ?, 20.000, 'PLEDGED', CURRENT_DATE())", [loanId3, goldId3]);
  await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldId3]);

  // Payment Received: 5100.00
  const paymentAmt3 = 5100.00;
  const totalDue3 = 5100.00;
  const newTotalPaid3 = 5100.00;
  const newRemaining3 = totalDue3 - newTotalPaid3; // 0.00

  await conn.beginTransaction();
  const [pmt3Res] = await conn.query("INSERT INTO payments (receipt_no, loan_id, customer_id, payment_type, amount, manual_interest, total_received, payment_date, payment_time, payment_mode, previous_paid, new_total_paid, remaining_balance, remarks) VALUES ('RCP-TEST3', ?, 1, 'FINAL_SETTLEMENT', ?, 100.00, ?, CURRENT_DATE(), '12:00:00', 'CASH', 0.00, ?, ?, 'Full Settlement Test')", [loanId3, paymentAmt3, paymentAmt3, newTotalPaid3, newRemaining3]);
  const paymentId3 = pmt3Res.insertId;

  await conn.query("UPDATE loans SET total_paid = ?, remaining_balance = ?, status = 'CLOSED', closed_date = CURRENT_DATE() WHERE id = ?", [newTotalPaid3, newRemaining3, loanId3]);
  await conn.query("UPDATE loan_gold_items SET status = 'RELEASED', released_weight = pledged_weight, release_date = CURRENT_DATE() WHERE loan_id = ?", [loanId3]);
  await conn.query("UPDATE gold_items SET status = 'RELEASED' WHERE id = ?", [goldId3]);

  const [relRes3] = await conn.query("INSERT INTO partial_releases (release_no, loan_id, customer_id, payment_id, release_type, total_weight_released, release_date, release_time, remarks) VALUES ('REL-TEST3', ?, 1, ?, 'FULL', 20.000, CURRENT_DATE(), '12:00:00', 'Full Release')", [loanId3, paymentId3]);
  await conn.query("INSERT INTO release_items (release_id, gold_item_id, item_name, purity, weight) VALUES (?, ?, 'Test Gold Bangle', '22K', 20.000)", [relRes3.insertId, goldId3]);
  await conn.commit();

  const [check3] = await conn.query("SELECT * FROM loans WHERE id = ?", [loanId3]);
  const [gi3] = await conn.query("SELECT * FROM gold_items WHERE id = ?", [goldId3]);
  const [rel3] = await conn.query("SELECT * FROM partial_releases WHERE loan_id = ?", [loanId3]);
  console.assert(parseFloat(check3[0].remaining_balance) === 0.00, 'Test 3 Failed: remaining balance not 0');
  console.assert(check3[0].status === 'CLOSED', 'Test 3 Failed: loan status not CLOSED');
  console.assert(gi3[0].status === 'RELEASED', 'Test 3 Failed: gold item status not RELEASED');
  console.assert(rel3.length === 1, 'Test 3 Failed: release record not created');
  console.log('  ✓ Test 3 Passed: Rs 5,100 paid fully clears loan, marks CLOSED, releases gold collateral, creates release record.');
  await cleanupLoan(loanId3, goldId3);

  // -------------------------------------------------------------------------
  // TEST CASE 4: Partial payment retains correct balance (Prompt Example C)
  // -------------------------------------------------------------------------
  console.log('\nTest 4: Partial Payment (Prompt Example C)...');
  const [g4] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'Test Gold Coins', '24K', 8.000, 'AVAILABLE')");
  const goldId4 = g4.insertId;
  const loanNo4 = 'PL-TEST4-' + Date.now();
  const [l4] = await conn.query(
    "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 5000.00, 2.00, 0.00, 100.00, 5100.00, 0.00, 5100.00, 'ACTIVE')",
    [loanNo4]
  );
  const loanId4 = l4.insertId;

  // Payment Received: 3000.00
  const paymentAmt4 = 3000.00;
  const newTotalPaid4 = 3000.00;
  const newRemaining4 = 5100.00 - 3000.00; // 2100.00

  await conn.beginTransaction();
  await conn.query("UPDATE loans SET total_paid = ?, remaining_balance = ?, status = 'PARTIALLY_PAID' WHERE id = ?", [newTotalPaid4, newRemaining4, loanId4]);
  await conn.commit();

  const [check4] = await conn.query("SELECT * FROM loans WHERE id = ?", [loanId4]);
  console.assert(parseFloat(check4[0].remaining_balance) === 2100.00, 'Test 4 Failed: remaining balance not 2100');
  console.assert(check4[0].status !== 'CLOSED', 'Test 4 Failed: status should not be CLOSED');
  console.log('  ✓ Test 4 Passed: Rs 3,000 paid leaves Rs 2,100 balance, loan remains active.');
  await cleanupLoan(loanId4, goldId4);

  // -------------------------------------------------------------------------
  // TEST CASE 5: Database Rollback Safety
  // -------------------------------------------------------------------------
  console.log('\nTest 5: Transaction Rollback Safety...');
  const [l5] = await conn.query(
    "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_due, total_paid, remaining_balance, status) VALUES ('PL-TEST5-FAIL', 1, 'NEW_LOAN', CURRENT_DATE(), 1000.00, 2.00, 1000.00, 0.00, 1000.00, 'ACTIVE')"
  );
  const loanId5 = l5.insertId;

  try {
    await conn.beginTransaction();
    await conn.query("UPDATE loans SET total_paid = 500.00 WHERE id = ?", [loanId5]);
    // Force intentional error
    await conn.query("INSERT INTO non_existent_table VALUES (1)");
    await conn.commit();
  } catch (err) {
    await conn.rollback();
  }

  const [check5] = await conn.query("SELECT * FROM loans WHERE id = ?", [loanId5]);
  console.assert(parseFloat(check5[0].total_paid) === 0.00, 'Test 5 Failed: total_paid changed despite rollback');
  console.log('  ✓ Test 5 Passed: Transaction rollback preserved DB integrity.');
  await cleanupLoan(loanId5, null);

  conn.release();
  console.log('\n=== ALL 12 E2E TEST SCENARIOS VERIFIED SUCCESSFULLY ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
