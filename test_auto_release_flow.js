const { getPool } = require('./config/database');

async function testAutoRelease() {
  const db = await getPool();
  console.log('Testing Automatic Gold Release Flow...');

  // 1. Create a customer gold item
  const [gRes] = await db.query(`
    INSERT INTO gold_items (customer_id, item_name, purity, weight, status)
    VALUES (1, '22K Testing Necklace', '22K', 15.500, 'AVAILABLE')
  `);
  const goldItemId = gRes.insertId;
  console.log('1. Created Gold Item ID:', goldItemId);

  // 2. Create a new pawn loan
  const loanNo = 'PL-TEST-' + Date.now();
  const [lRes] = await db.query(`
    INSERT INTO loans (loan_no, customer_id, loan_type, opened_date, principal_amount, monthly_interest_rate, total_due, remaining_balance, status)
    VALUES (?, 1, 'NEW_LOAN', CURRENT_DATE(), 20000.00, 2.00, 20000.00, 20000.00, 'ACTIVE')
  `, [loanNo]);
  const loanId = lRes.insertId;
  console.log('2. Created Loan ID:', loanId, 'Loan No:', loanNo);

  // 3. Attach gold item as PLEDGED collateral
  await db.query(`
    INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date)
    VALUES (?, ?, 15.500, 'PLEDGED', CURRENT_DATE())
  `, [loanId, goldItemId]);
  await db.query(`UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?`, [goldItemId]);
  console.log('3. Gold Item attached as PLEDGED collateral.');

  // 4. Pay final settlement
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3OTI2NDkzNDMsImV4cCI6MTc5MjczNTc0M30.Hg_TUjz4QIt7hPRWiV6DkV2PxytLS_671gXdJsdJDhk';
  const pRes = await fetch('http://localhost/gold_pawn_erp/backend/payments/create.php', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      loan_id: loanId,
      principal_payment: 20000,
      manual_interest: 200,
      payment_mode: 'CASH',
      remarks: 'Full Loan Settlement Test'
    })
  }).then(r => r.json());

  console.log('4. Payment Response:', pRes.message);

  // 5. Verify Automatic Gold Release Created
  const [releases] = await db.query('SELECT * FROM partial_releases WHERE loan_id = ?', [loanId]);
  console.log('5. Auto Releases Found for Loan:', releases.length);
  if (releases.length > 0) {
    const rel = releases[0];
    console.log('   ✓ Release No:', rel.release_no);
    console.log('   ✓ Release Type:', rel.release_type);
    console.log('   ✓ Weight Released:', rel.total_weight_released, 'g');
    console.log('   ✓ Remarks:', rel.remarks);
  }

  // 6. Verify Gold Item Status
  const [giUpdated] = await db.query('SELECT status FROM gold_items WHERE id = ?', [goldItemId]);
  console.log('6. Gold Item Status in Inventory:', giUpdated[0].status);

  // Cleanup test loan
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  await db.query('DELETE FROM release_items WHERE release_id IN (SELECT id FROM partial_releases WHERE loan_id = ?)', [loanId]);
  await db.query('DELETE FROM partial_releases WHERE loan_id = ?', [loanId]);
  await db.query('DELETE FROM loan_transactions WHERE loan_id = ?', [loanId]);
  await db.query('DELETE FROM receipts WHERE loan_id = ?', [loanId]);
  await db.query('DELETE FROM payments WHERE loan_id = ?', [loanId]);
  await db.query('DELETE FROM loan_gold_items WHERE loan_id = ?', [loanId]);
  await db.query('DELETE FROM gold_items WHERE id = ?', [goldItemId]);
  await db.query('DELETE FROM loans WHERE id = ?', [loanId]);
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log('Test completed & cleaned up cleanly.');
  process.exit(0);
}

testAutoRelease().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
