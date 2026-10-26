const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { requirePermission } = require('../middleware/authMiddleware');

// ============================================================
// GET /transactions/ledger (.php)
// ============================================================
router.get(['/ledger', '/ledger.php'], requirePermission('loan.view'), async (req, res) => {
  const loanId = parseInt(req.query.loan_id || '0', 10);
  const customerId = parseInt(req.query.customer_id || '0', 10);
  const search = String(req.query.search || '').trim();

  try {
    const db = await getPool();
    let sql = `
      SELECT t.*, c.name AS customer_name, c.customer_code, l.loan_no
      FROM loan_transactions t
      JOIN customers c ON t.customer_id = c.id
      JOIN loans l ON t.loan_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (loanId > 0) {
      sql += ' AND t.loan_id = ?';
      params.push(loanId);
    }

    if (customerId > 0) {
      sql += ' AND t.customer_id = ?';
      params.push(customerId);
    }

    if (search) {
      sql += ' AND (t.transaction_code LIKE ? OR l.loan_no LIKE ? OR c.name LIKE ? OR c.customer_code LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY t.id DESC';

    const [rows] = await db.query(sql, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load transaction ledger.', error: err.message });
  }
});

module.exports = router;
