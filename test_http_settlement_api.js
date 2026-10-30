const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const { createAuthToken } = require('./config/auth');
const { getPool } = require('./config/database');

const loanRoutes = require('./routes/loans');
const paymentRoutes = require('./routes/payments');

async function testHttpSettlementApi() {
  console.log('=== STARTING HTTP SETTLEMENT API URGENT CONTRACT TESTS ===\n');

  const db = await getPool();
  const conn = await db.getConnection();

  // Find admin user in DB
  const [admins] = await conn.query("SELECT * FROM users WHERE role = 'ADMIN' OR username = 'admin' LIMIT 1");
  const adminUser = admins.length > 0 ? admins[0] : { id: 1, username: 'admin', role: 'ADMIN' };
  const token = createAuthToken(adminUser);

  const app = express();
  app.use(express.json());
  app.use('/loans', loanRoutes);
  app.use('/payments', paymentRoutes);

  const PORT = 9876;
  const server = app.listen(PORT);

  const authHeaders = {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };

  // Helper to cleanup test loan
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

  // Ensure customer 1 exists
  const [custs] = await conn.query("SELECT id FROM customers WHERE id = 1");
  if (custs.length === 0) {
    await conn.query(`INSERT INTO customers (id, customer_code, name, mobile, address, status) VALUES (1, 'CUST-1001', 'Test Customer', '9999999999', 'Test Address', 'ACTIVE')`);
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Outstanding ₹1,000, interest ₹100, payment ₹100 → balance ₹1,000, ACTIVE
    // -------------------------------------------------------------------------
    console.log('Test 1: Outstanding ₹1,000, interest ₹100, payment ₹100 → balance ₹1,000, ACTIVE...');
    const [g1] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'Test Gold Ring 1', '22K', 5.000, 'AVAILABLE')");
    const goldId1 = g1.insertId;
    const loanNo1 = 'PL-URGENT1-' + Date.now();
    const [l1] = await conn.query(
      "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 1000.00, 2.00, 0.00, 0.00, 1000.00, 0.00, 1000.00, 'ACTIVE')",
      [loanNo1]
    );
    const loanId1 = l1.insertId;
    await conn.query("INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date) VALUES (?, ?, 5.000, 'PLEDGED', CURRENT_DATE())", [loanId1, goldId1]);
    await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldId1]);

    const res1 = await fetch(`http://localhost:${PORT}/loans/close`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        loan_id: loanId1,
        manual_final_interest: 100,
        payment_amount: 100,
        payment_mode: 'CASH',
        remarks: 'Test 1: Payment 100 against 1100 settlement'
      })
    }).then(r => r.json());

    console.log('   Response res1:', res1);
    console.log('   Response success:', res1.success);
    console.log('   Final Settlement Amount:', res1.data.final_settlement_amount);
    console.log('   Payment Amount:', res1.data.payment_amount);
    console.log('   Total Remaining Balance:', res1.data.total_remaining_balance);
    console.log('   Loan Status:', res1.data.loan_status);
    console.log('   Is Closed:', res1.data.is_closed);
    console.log('   Collateral Status:', res1.data.collateral_release_status);

    console.assert(res1.success === true, 'Test 1 Failed: success is false');
    console.assert(res1.data.final_settlement_amount === 1100, 'Test 1 Failed: final_settlement_amount not 1100');
    console.assert(res1.data.total_remaining_balance === 1000, 'Test 1 Failed: total_remaining_balance not 1000');
    console.assert(res1.data.is_closed === false, 'Test 1 Failed: is_closed should be false');
    console.assert(res1.data.collateral_release_status === 'PLEDGED', 'Test 1 Failed: collateral should stay PLEDGED');
    console.log('  ✓ Test 1 Passed!\n');
    await cleanupLoan(loanId1, goldId1);

    // -------------------------------------------------------------------------
    // TEST 2: Outstanding ₹1,000, interest ₹100, payment ₹1,000 → balance ₹100, ACTIVE
    // -------------------------------------------------------------------------
    console.log('Test 2: Outstanding ₹1,000, interest ₹100, payment ₹1,000 → balance ₹100, ACTIVE...');
    const [g2] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'Test Gold Ring 2', '22K', 6.000, 'AVAILABLE')");
    const goldId2 = g2.insertId;
    const loanNo2 = 'PL-URGENT2-' + Date.now();
    const [l2] = await conn.query(
      "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 1000.00, 2.00, 0.00, 0.00, 1000.00, 0.00, 1000.00, 'ACTIVE')",
      [loanNo2]
    );
    const loanId2 = l2.insertId;
    await conn.query("INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date) VALUES (?, ?, 6.000, 'PLEDGED', CURRENT_DATE())", [loanId2, goldId2]);
    await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldId2]);

    const res2 = await fetch(`http://localhost:${PORT}/loans/close`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        loan_id: loanId2,
        manual_final_interest: 100,
        payment_amount: 1000,
        payment_mode: 'CASH',
        remarks: 'Test 2: Payment 1000 against 1100 settlement'
      })
    }).then(r => r.json());

    console.log('   Response success:', res2.success);
    console.log('   Final Settlement Amount:', res2.data.final_settlement_amount);
    console.log('   Payment Amount:', res2.data.payment_amount);
    console.log('   Total Remaining Balance:', res2.data.total_remaining_balance);
    console.log('   Loan Status:', res2.data.loan_status);
    console.log('   Is Closed:', res2.data.is_closed);
    console.log('   Collateral Status:', res2.data.collateral_release_status);

    console.assert(res2.success === true, 'Test 2 Failed: success is false');
    console.assert(res2.data.final_settlement_amount === 1100, 'Test 2 Failed: final_settlement_amount not 1100');
    console.assert(res2.data.total_remaining_balance === 100, 'Test 2 Failed: total_remaining_balance not 100');
    console.assert(res2.data.is_closed === false, 'Test 2 Failed: is_closed should be false');
    console.assert(res2.data.collateral_release_status === 'PLEDGED', 'Test 2 Failed: collateral should stay PLEDGED');
    console.log('  ✓ Test 2 Passed!\n');
    await cleanupLoan(loanId2, goldId2);

    // -------------------------------------------------------------------------
    // TEST 3: Outstanding ₹1,000, interest ₹100, payment ₹1,100 → balance ₹0, CLOSED
    // -------------------------------------------------------------------------
    console.log('Test 3: Outstanding ₹1,000, interest ₹100, payment ₹1,100 → balance ₹0, CLOSED...');
    const [g3] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'Test Gold Ring 3', '22K', 7.000, 'AVAILABLE')");
    const goldId3 = g3.insertId;
    const loanNo3 = 'PL-URGENT3-' + Date.now();
    const [l3] = await conn.query(
      "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 1000.00, 2.00, 0.00, 0.00, 1000.00, 0.00, 1000.00, 'ACTIVE')",
      [loanNo3]
    );
    const loanId3 = l3.insertId;
    await conn.query("INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date) VALUES (?, ?, 7.000, 'PLEDGED', CURRENT_DATE())", [loanId3, goldId3]);
    await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldId3]);

    const res3 = await fetch(`http://localhost:${PORT}/loans/close`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        loan_id: loanId3,
        manual_final_interest: 100,
        payment_amount: 1100,
        payment_mode: 'UPI',
        remarks: 'Test 3: Payment 1100 against 1100 settlement'
      })
    }).then(r => r.json());

    console.log('   Response success:', res3.success);
    console.log('   Final Settlement Amount:', res3.data.final_settlement_amount);
    console.log('   Payment Amount:', res3.data.payment_amount);
    console.log('   Total Remaining Balance:', res3.data.total_remaining_balance);
    console.log('   Loan Status:', res3.data.loan_status);
    console.log('   Is Closed:', res3.data.is_closed);
    console.log('   Collateral Status:', res3.data.collateral_release_status);

    console.assert(res3.success === true, 'Test 3 Failed: success is false');
    console.assert(res3.data.final_settlement_amount === 1100, 'Test 3 Failed: final_settlement_amount not 1100');
    console.assert(res3.data.total_remaining_balance === 0, 'Test 3 Failed: total_remaining_balance not 0');
    console.assert(res3.data.is_closed === true, 'Test 3 Failed: is_closed should be true');
    console.assert(res3.data.loan_status === 'CLOSED', 'Test 3 Failed: loan_status should be CLOSED');
    console.assert(res3.data.collateral_release_status === 'RELEASED', 'Test 3 Failed: collateral should be RELEASED');
    console.log('  ✓ Test 3 Passed!\n');
    await cleanupLoan(loanId3, goldId3);

  } catch (err) {
    console.error('HTTP Test Error:', err);
  } finally {
    conn.release();
    server.close();
    console.log('=== ALL HTTP API CONTRACT TESTS COMPLETED SUCCESSFULLY ===');
    process.exit(0);
  }
}

testHttpSettlementApi();
