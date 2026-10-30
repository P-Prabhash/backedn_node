const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const { createAuthToken } = require('./config/auth');
const { getPool } = require('./config/database');

const loanRoutes = require('./routes/loans');
const paymentRoutes = require('./routes/payments');

async function testHttpSettlementApi() {
  console.log('=== STARTING HTTP SETTLEMENT API CONTRACT TESTS ===\n');

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
    // HTTP TEST 1: Example A — Principal-only payment (Rs 5000 paid on Rs 5100 due)
    // -------------------------------------------------------------------------
    console.log('HTTP Test 1: Example A (Principal-only payment)...');
    const [g1] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'HTTP Test Gold Ring', '22K', 15.000, 'AVAILABLE')");
    const goldId1 = g1.insertId;
    const loanNo1 = 'PL-HTTP1-' + Date.now();
    const [l1] = await conn.query(
      "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 5000.00, 2.00, 0.00, 0.00, 5000.00, 0.00, 5000.00, 'ACTIVE')",
      [loanNo1]
    );
    const loanId1 = l1.insertId;
    await conn.query("INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date) VALUES (?, ?, 15.000, 'PLEDGED', CURRENT_DATE())", [loanId1, goldId1]);
    await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldId1]);

    const res1 = await fetch(`http://localhost:${PORT}/loans/close`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        loan_id: loanId1,
        manual_final_interest: 100,
        payment_amount: 5000,
        payment_mode: 'CASH',
        remarks: 'Example A Principal Only Payment'
      })
    }).then(r => r.json());

    console.log('   Response success:', res1.success);
    console.log('   Message:', res1.message);
    console.log('   Remaining Principal:', res1.data.remaining_principal);
    console.log('   Remaining Interest:', res1.data.remaining_interest);
    console.log('   Total Remaining Balance:', res1.data.total_remaining_balance);
    console.log('   Loan Status:', res1.data.loan_status);
    console.log('   Is Closed:', res1.data.is_closed);
    console.log('   Collateral Release Status:', res1.data.collateral_release_status);

    console.assert(res1.success === true, 'HTTP Test 1 Failed: success is false');
    console.assert(res1.data.remaining_principal === 0, 'HTTP Test 1 Failed: remaining_principal not 0');
    console.assert(res1.data.remaining_interest === 100, 'HTTP Test 1 Failed: remaining_interest not 100');
    console.assert(res1.data.total_remaining_balance === 100, 'HTTP Test 1 Failed: total_remaining_balance not 100');
    console.assert(res1.data.is_closed === false, 'HTTP Test 1 Failed: is_closed should be false');
    console.assert(res1.data.collateral_release_status === 'PLEDGED', 'HTTP Test 1 Failed: collateral_release_status should be PLEDGED');
    console.log('  ✓ HTTP Test 1 Passed!\n');
    await cleanupLoan(loanId1, goldId1);

    // -------------------------------------------------------------------------
    // HTTP TEST 2: Example B — Full settlement (Rs 5100 paid on Rs 5100 due)
    // -------------------------------------------------------------------------
    console.log('HTTP Test 2: Example B (Full settlement)...');
    const [g2] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'HTTP Test Gold Necklace', '22K', 25.000, 'AVAILABLE')");
    const goldId2 = g2.insertId;
    const loanNo2 = 'PL-HTTP2-' + Date.now();
    const [l2] = await conn.query(
      "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 5000.00, 2.00, 0.00, 0.00, 5000.00, 0.00, 5000.00, 'ACTIVE')",
      [loanNo2]
    );
    const loanId2 = l2.insertId;
    await conn.query("INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date) VALUES (?, ?, 25.000, 'PLEDGED', CURRENT_DATE())", [loanId2, goldId2]);
    await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldId2]);

    const res2 = await fetch(`http://localhost:${PORT}/loans/close`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        loan_id: loanId2,
        manual_final_interest: 100,
        payment_amount: 5100,
        payment_mode: 'UPI',
        remarks: 'Example B Full Settlement'
      })
    }).then(r => r.json());

    console.log('   Response success:', res2.success);
    console.log('   Message:', res2.message);
    console.log('   Receipt No:', res2.data.receipt_no);
    console.log('   Total Remaining Balance:', res2.data.total_remaining_balance);
    console.log('   Loan Status:', res2.data.loan_status);
    console.log('   Is Closed:', res2.data.is_closed);
    console.log('   Collateral Release Status:', res2.data.collateral_release_status);

    console.assert(res2.success === true, 'HTTP Test 2 Failed: success is false');
    console.assert(res2.data.total_remaining_balance === 0, 'HTTP Test 2 Failed: total_remaining_balance not 0');
    console.assert(res2.data.is_closed === true, 'HTTP Test 2 Failed: is_closed should be true');
    console.assert(res2.data.loan_status === 'CLOSED', 'HTTP Test 2 Failed: loan_status should be CLOSED');
    console.assert(res2.data.collateral_release_status === 'RELEASED', 'HTTP Test 2 Failed: collateral_release_status should be RELEASED');
    console.log('  ✓ HTTP Test 2 Passed!\n');

    // -------------------------------------------------------------------------
    // HTTP TEST 3: Calling /loans/close on an ALREADY CLOSED loan
    // -------------------------------------------------------------------------
    console.log('HTTP Test 3: Closing an already closed loan should fail (400)...');
    const res3 = await fetch(`http://localhost:${PORT}/loans/close`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        loan_id: loanId2,
        payment_amount: 100
      })
    });
    const res3Data = await res3.json();
    console.log('   HTTP Status Code:', res3.status);
    console.log('   Response:', res3Data);

    console.assert(res3.status === 400, 'HTTP Test 3 Failed: status code not 400');
    console.assert(res3Data.success === false, 'HTTP Test 3 Failed: success should be false');
    console.log('  ✓ HTTP Test 3 Passed!\n');
    await cleanupLoan(loanId2, goldId2);

    // -------------------------------------------------------------------------
    // HTTP TEST 4: Example C — Partial payment (Rs 3000 paid on Rs 5100 due)
    // -------------------------------------------------------------------------
    console.log('HTTP Test 4: Example C (Partial payment)...');
    const [g4] = await conn.query("INSERT INTO gold_items (customer_id, item_name, purity, weight, status) VALUES (1, 'HTTP Test Gold Bangles', '22K', 18.000, 'AVAILABLE')");
    const goldId4 = g4.insertId;
    const loanNo4 = 'PL-HTTP4-' + Date.now();
    const [l4] = await conn.query(
      "INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_interest, manual_final_interest, total_due, total_paid, remaining_balance, status) VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 5000.00, 2.00, 0.00, 0.00, 5000.00, 0.00, 5000.00, 'ACTIVE')",
      [loanNo4]
    );
    const loanId4 = l4.insertId;
    await conn.query("INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date) VALUES (?, ?, 18.000, 'PLEDGED', CURRENT_DATE())", [loanId4, goldId4]);
    await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldId4]);

    const res4 = await fetch(`http://localhost:${PORT}/loans/close`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        loan_id: loanId4,
        manual_final_interest: 100,
        payment_amount: 3000,
        payment_mode: 'CASH',
        remarks: 'Example C Partial Payment'
      })
    }).then(r => r.json());

    console.log('   Response success:', res4.success);
    console.log('   Message:', res4.message);
    console.log('   Remaining Principal:', res4.data.remaining_principal);
    console.log('   Remaining Interest:', res4.data.remaining_interest);
    console.log('   Total Remaining Balance:', res4.data.total_remaining_balance);
    console.log('   Loan Status:', res4.data.loan_status);
    console.log('   Is Closed:', res4.data.is_closed);

    console.assert(res4.success === true, 'HTTP Test 4 Failed: success is false');
    console.assert(res4.data.remaining_principal === 2000, 'HTTP Test 4 Failed: remaining_principal not 2000');
    console.assert(res4.data.remaining_interest === 100, 'HTTP Test 4 Failed: remaining_interest not 100');
    console.assert(res4.data.total_remaining_balance === 2100, 'HTTP Test 4 Failed: total_remaining_balance not 2100');
    console.assert(res4.data.is_closed === false, 'HTTP Test 4 Failed: is_closed should be false');
    console.log('  ✓ HTTP Test 4 Passed!\n');

    // -------------------------------------------------------------------------
    // HTTP TEST 5: GET /loans/get returns updated loan balances & breakdown
    // -------------------------------------------------------------------------
    console.log('HTTP Test 5: GET /loans/get returns correct remaining principal and interest...');
    const res5 = await fetch(`http://localhost:${PORT}/loans/get?id=${loanId4}`, {
      method: 'GET',
      headers: authHeaders
    }).then(r => r.json());

    console.log('   GET /loans/get loan remaining_principal:', res5.data.loan.remaining_principal);
    console.log('   GET /loans/get loan remaining_interest:', res5.data.loan.remaining_interest);
    console.log('   GET /loans/get loan remaining_balance:', res5.data.loan.remaining_balance);

    console.assert(res5.data.loan.remaining_principal === 2000, 'HTTP Test 5 Failed: remaining_principal not 2000');
    console.assert(res5.data.loan.remaining_interest === 100, 'HTTP Test 5 Failed: remaining_interest not 100');
    console.assert(res5.data.loan.remaining_balance === 2100, 'HTTP Test 5 Failed: remaining_balance not 2100');
    console.log('  ✓ HTTP Test 5 Passed!\n');

    await cleanupLoan(loanId4, goldId4);

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
