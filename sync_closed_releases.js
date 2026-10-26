const { getPool } = require('./config/database');

async function syncAllClosedLoans() {
  const db = await getPool();
  console.log('Syncing all closed loans with Gold Release Records...');

  const [closedLoans] = await db.query(`
    SELECT l.*, c.name AS customer_name
    FROM loans l
    JOIN customers c ON l.customer_id = c.id
    WHERE l.status = 'CLOSED' AND l.id NOT IN (SELECT DISTINCT loan_id FROM partial_releases)
  `);

  console.log('Found closed loans needing release records:', closedLoans.length);

  for (const loan of closedLoans) {
    const [collateral] = await db.query(`
      SELECT lgi.*, g.item_name, g.purity, g.weight
      FROM loan_gold_items lgi
      JOIN gold_items g ON lgi.gold_item_id = g.id
      WHERE lgi.loan_id = ?
    `, [loan.id]);

    let totalWeight = 0;
    if (collateral.length > 0) {
      for (const c of collateral) {
        totalWeight += parseFloat(c.pledged_weight || c.weight || 0);
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const cleanLoanNo = String(loan.loan_no).replace(/[^a-zA-Z0-9]/g, '');
    const releaseNo = 'REL-FULL-' + todayStr.replace(/-/g, '') + '-' + cleanLoanNo;

    const [pmtRows] = await db.query('SELECT id, amount FROM payments WHERE loan_id = ? ORDER BY id DESC LIMIT 1', [loan.id]);
    const pmtId = pmtRows.length > 0 ? pmtRows[0].id : null;

    const [relRes] = await db.query(`
      INSERT INTO partial_releases (release_no, loan_id, customer_id, payment_id, release_type, total_weight_released, release_date, release_time, remarks, created_by)
      VALUES (?, ?, ?, ?, 'FULL', ?, ?, '12:00:00', 'Automatic full release upon loan closure', 'STAFF')
    `, [releaseNo, loan.id, loan.customer_id, pmtId, totalWeight, todayStr]);

    const releaseId = relRes.insertId;

    if (collateral.length > 0) {
      for (const col of collateral) {
        await db.query(`
          INSERT INTO release_items (release_id, gold_item_id, item_name, purity, weight)
          VALUES (?, ?, ?, ?, ?)
        `, [releaseId, col.gold_item_id, col.item_name, col.purity, col.weight]);

        await db.query('UPDATE loan_gold_items SET status = "RELEASED", released_weight = pledged_weight WHERE id = ?', [col.id]);
        await db.query('UPDATE gold_items SET status = "RELEASED" WHERE id = ?', [col.gold_item_id]);
      }
    }

    console.log(`✓ Created FULL RELEASE (${releaseNo}) for Loan ${loan.loan_no} (${loan.customer_name})`);
  }

  console.log('Sync complete!');
  process.exit(0);
}

syncAllClosedLoans().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
