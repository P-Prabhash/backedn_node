const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { requirePermission } = require('../middleware/authMiddleware');

// ============================================================
// GET /dashboard/summary (.php)
// ============================================================
router.get(['/summary', '/summary.php'], requirePermission('dashboard.view'), async (req, res) => {
  try {
    const db = await getPool();

    // 1. Total Customers
    const [custRows] = await db.query("SELECT COUNT(*) AS total FROM customers WHERE status = 'ACTIVE'");
    const totalCustomers = parseInt(custRows[0].total || '0', 10);

    // 2. Gold Stats
    const [goldRows] = await db.query(`
      SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) AS available_count,
          SUM(CASE WHEN status = 'PLEDGED' THEN 1 ELSE 0 END) AS pledged_count,
          SUM(CASE WHEN status = 'RELEASED' THEN 1 ELSE 0 END) AS released_count,
          COALESCE(SUM(weight), 0) AS total_weight,
          COALESCE(SUM(CASE WHEN status = 'AVAILABLE' THEN weight ELSE 0 END), 0) AS available_weight,
          COALESCE(SUM(CASE WHEN status = 'PLEDGED' THEN weight ELSE 0 END), 0) AS pledged_weight,
          COALESCE(SUM(CASE WHEN status = 'RELEASED' THEN weight ELSE 0 END), 0) AS released_weight
      FROM gold_items
    `);
    const goldStats = goldRows[0] || {};
    const totalGoldItems = parseInt(goldStats.total || '0', 10);

    // 3. Total Given Loan
    const [loanRows] = await db.query("SELECT COALESCE(SUM(principal_amount), 0) AS total FROM loans");
    const totalGivenLoan = parseFloat(loanRows[0].total || '0');

    // 4. Today Given Loans
    const [todayLoanRows] = await db.query(`
      SELECT
          COALESCE(SUM(principal_amount), 0) AS today_amount,
          COUNT(*) AS today_count
      FROM loans
      WHERE DATE(opened_date) = CURRENT_DATE()
    `);
    const todayGivenLoanAmount = parseFloat(todayLoanRows[0].today_amount || '0');
    const todayGivenLoanCount = parseInt(todayLoanRows[0].today_count || '0', 10);

    // 5. Today Closed Loans
    const [todayClosedRows] = await db.query(`
      SELECT
          COUNT(*) AS closed_count,
          COALESCE(SUM(principal_amount), 0) AS closed_amount
      FROM loans
      WHERE status = 'CLOSED' AND DATE(closed_date) = CURRENT_DATE()
    `);
    const todayClosedLoansCount = parseInt(todayClosedRows[0].closed_count || '0', 10);
    const todayClosedAmount = parseFloat(todayClosedRows[0].closed_amount || '0');

    // 6. Total Closed Loans
    const [totalClosedRows] = await db.query("SELECT COUNT(*) AS total FROM loans WHERE status = 'CLOSED'");
    const totalClosedLoans = parseInt(totalClosedRows[0].total || '0', 10);

    // 7. Total Collection
    const [collRows] = await db.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments");
    const totalCollection = parseFloat(collRows[0].total || '0');

    // 8. Total Outstanding
    const [outRows] = await db.query("SELECT COALESCE(SUM(remaining_balance), 0) AS total FROM loans WHERE status != 'CLOSED'");
    const totalOutstanding = parseFloat(outRows[0].total || '0');

    // 9. Total Partial
    const [partRows] = await db.query(`
      SELECT
          COALESCE(SUM(amount), 0) AS partial_amount,
          COUNT(*) AS partial_count
      FROM payments
      WHERE payment_type = 'PARTIAL'
    `);
    const totalPartialAmount = parseFloat(partRows[0].partial_amount || '0');
    const totalPartialCount = parseInt(partRows[0].partial_count || '0', 10);

    // 10. Total Releases
    const [relRows] = await db.query(`
      SELECT
          COUNT(*) AS total_count,
          COALESCE(SUM(total_weight_released), 0) AS total_weight
      FROM partial_releases
    `);
    const totalReleasesCount = parseInt(relRows[0].total_count || '0', 10);
    const totalReleasedWeight = parseFloat(relRows[0].total_weight || '0');

    // Feeds
    const [recentLoans] = await db.query(`
      SELECT l.*, c.name AS customer_name, c.customer_code, c.mobile
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      ORDER BY l.id DESC
      LIMIT 6
    `);

    const [recentPayments] = await db.query(`
      SELECT p.*, l.loan_no, c.name AS customer_name, c.customer_code
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN customers c ON p.customer_id = c.id
      ORDER BY p.id DESC
      LIMIT 6
    `);

    const [recentReleases] = await db.query(`
      SELECT r.*, l.loan_no, c.name AS customer_name, c.customer_code
      FROM partial_releases r
      JOIN loans l ON r.loan_id = l.id
      JOIN customers c ON r.customer_id = c.id
      ORDER BY r.id DESC
      LIMIT 6
    `);

    return res.json({
      success: true,
      data: {
        total_customers: totalCustomers,
        total_gold_items: totalGoldItems,
        gold_available_count: parseInt(goldStats.available_count || '0', 10),
        gold_pledged_count: parseInt(goldStats.pledged_count || '0', 10),
        gold_released_count: parseInt(goldStats.released_count || '0', 10),
        total_gold_weight: parseFloat(goldStats.total_weight || '0'),
        pledged_gold_weight: parseFloat(goldStats.pledged_weight || '0'),
        released_gold_weight: parseFloat(goldStats.released_weight || '0'),
        available_gold_weight: parseFloat(goldStats.available_weight || '0'),

        total_given_loan: totalGivenLoan,
        today_given_loan: todayGivenLoanAmount,
        today_given_loan_count: todayGivenLoanCount,
        today_closed_loans: todayClosedLoansCount,
        today_closed_amount: todayClosedAmount,
        total_closed_loans: totalClosedLoans,
        total_collection: totalCollection,
        total_outstanding: totalOutstanding,
        total_partial: totalPartialAmount,
        total_partial_count: totalPartialCount,
        total_releases: totalReleasesCount,
        total_released_weight: totalReleasedWeight,

        recent_loans: recentLoans,
        recent_payments: recentPayments,
        recent_releases: recentReleases,
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load dashboard summary.', error: err.message });
  }
});

module.exports = router;
