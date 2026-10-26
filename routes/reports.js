const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { requirePermission } = require('../middleware/authMiddleware');

// ============================================================
// GET /reports/summary (.php)
// ============================================================
router.get(['/summary', '/summary.php'], requirePermission('report.view'), async (req, res) => {
  const startDate = String(req.query.start_date || '').trim();
  const endDate = String(req.query.end_date || '').trim();

  try {
    const db = await getPool();

    let dateLoanFilter = '';
    let datePmtFilter = '';
    const loanParams = [];
    const pmtParams = [];

    if (startDate && endDate) {
      dateLoanFilter = ' WHERE opened_date BETWEEN ? AND ?';
      datePmtFilter = ' WHERE payment_date BETWEEN ? AND ?';
      loanParams.push(startDate, endDate);
      pmtParams.push(startDate, endDate);
    }

    // 1. Loan Disbursement Breakdown (by loan_type)
    const [loansSummary] = await db.query(`
      SELECT
        loan_type,
        COUNT(*) AS loan_count,
        COALESCE(SUM(principal_amount), 0) AS total_principal,
        COALESCE(SUM(remaining_balance), 0) AS total_remaining
      FROM loans
      ${dateLoanFilter}
      GROUP BY loan_type
      ORDER BY total_principal DESC
    `, loanParams);

    // 2. Collections by Payment Mode & Payment Type
    const [paymentsSummary] = await db.query(`
      SELECT
        payment_mode,
        payment_type,
        COUNT(*) AS payment_count,
        COALESCE(SUM(COALESCE(total_received, amount)), 0) AS total_amount
      FROM payments
      ${datePmtFilter}
      GROUP BY payment_mode, payment_type
      ORDER BY total_amount DESC
    `, pmtParams);

    // 3. Gold Collateral Inventory Status
    const [goldInventory] = await db.query(`
      SELECT
        status,
        COUNT(*) AS count,
        COALESCE(SUM(weight), 0) AS total_weight
      FROM gold_items
      GROUP BY status
      ORDER BY count DESC
    `);

    // 4. Top Outstanding Borrowers
    const [topBorrowers] = await db.query(`
      SELECT
        c.id,
        c.name,
        c.customer_code,
        c.mobile,
        COALESCE(SUM(l.remaining_balance), 0) AS total_outstanding
      FROM customers c
      JOIN loans l ON l.customer_id = c.id
      WHERE l.status != 'CLOSED' AND l.remaining_balance > 0
      GROUP BY c.id
      ORDER BY total_outstanding DESC
      LIMIT 10
    `);

    // Overall summary metrics
    const [loansAgg] = await db.query(`
      SELECT
        COUNT(*) AS total_loans,
        COALESCE(SUM(principal_amount), 0) AS total_principal,
        COALESCE(SUM(total_interest + manual_final_interest), 0) AS total_interest,
        COALESCE(SUM(remaining_balance), 0) AS total_outstanding
      FROM loans ${dateLoanFilter}
    `, loanParams);

    const [pmtsAgg] = await db.query(`
      SELECT
        COUNT(*) AS total_payments,
        COALESCE(SUM(COALESCE(total_received, amount)), 0) AS total_collected
      FROM payments ${datePmtFilter}
    `, pmtParams);

    const [relAgg] = await db.query(`
      SELECT
        COUNT(*) AS total_releases,
        COALESCE(SUM(total_weight_released), 0) AS total_released_weight
      FROM partial_releases
    `);

    return res.json({
      success: true,
      data: {
        loans_summary: loansSummary.map(row => ({
          loan_type: row.loan_type,
          loan_count: parseInt(row.loan_count || '0', 10),
          total_principal: parseFloat(row.total_principal || '0'),
          total_remaining: parseFloat(row.total_remaining || '0')
        })),
        payments_summary: paymentsSummary.map(row => ({
          payment_mode: row.payment_mode,
          payment_type: row.payment_type,
          payment_count: parseInt(row.payment_count || '0', 10),
          total_amount: parseFloat(row.total_amount || '0')
        })),
        gold_inventory: goldInventory.map(row => ({
          status: row.status,
          count: parseInt(row.count || '0', 10),
          total_weight: parseFloat(row.total_weight || '0')
        })),
        top_outstanding_customers: topBorrowers.map(row => ({
          id: row.id,
          name: row.name,
          customer_code: row.customer_code,
          mobile: row.mobile,
          total_outstanding: parseFloat(row.total_outstanding || '0')
        })),
        summary: {
          total_loans: parseInt(loansAgg[0].total_loans || '0', 10),
          total_principal: parseFloat(loansAgg[0].total_principal || '0'),
          total_interest: parseFloat(loansAgg[0].total_interest || '0'),
          total_outstanding: parseFloat(loansAgg[0].total_outstanding || '0'),
          total_payments: parseInt(pmtsAgg[0].total_payments || '0', 10),
          total_collected: parseFloat(pmtsAgg[0].total_collected || '0'),
          total_releases: parseInt(relAgg[0].total_releases || '0', 10),
          total_released_weight: parseFloat(relAgg[0].total_released_weight || '0')
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load report summary.', error: err.message });
  }
});

module.exports = router;
