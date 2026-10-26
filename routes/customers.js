const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { requirePermission } = require('../middleware/authMiddleware');

// ============================================================
// GET /customers/list (.php)
// ============================================================
router.get(['/list', '/list.php'], requirePermission('customer.view'), async (req, res) => {
  const search = String(req.query.search || '').trim();

  try {
    const db = await getPool();
    let query = `
      SELECT
          c.*,
          COUNT(DISTINCT g.id) AS total_gold_items,
          COALESCE(
              SUM(
                  DISTINCT CASE
                      WHEN g.status != 'DELETED'
                      THEN g.weight
                      ELSE 0
                  END
              ),
              0
          ) AS total_gold_weight,
          COUNT(DISTINCT l.id) AS total_loans,
          COUNT(
              DISTINCT CASE
                  WHEN l.status != 'CLOSED'
                  THEN l.id
              END
          ) AS active_loans,
          COALESCE(
              SUM(
                  CASE
                      WHEN l.status != 'CLOSED'
                      THEN l.remaining_balance
                      ELSE 0
                  END
              ),
              0
          ) AS total_outstanding
      FROM customers c
      LEFT JOIN gold_items g ON c.id = g.customer_id
      LEFT JOIN loans l ON c.id = l.customer_id
      WHERE c.status = 'ACTIVE'
    `;

    const params = [];
    if (search) {
      query += ` AND (c.customer_code LIKE ? OR c.name LIKE ? OR c.mobile LIKE ? OR c.aadhaar_number LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` GROUP BY c.id ORDER BY c.id DESC`;

    const [customers] = await db.query(query, params);

    return res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load customers.', error: err.message });
  }
});

// ============================================================
// GET /customers/get (.php)
// ============================================================
router.get(['/get', '/get.php'], requirePermission('customer.view'), async (req, res) => {
  const id = parseInt(req.query.id || '0', 10);
  if (id <= 0) {
    return res.status(400).json({ success: false, message: 'Valid customer ID is required' });
  }

  try {
    const db = await getPool();

    const [custRows] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (custRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const customer = custRows[0];

    const [goldItems] = await db.query('SELECT * FROM gold_items WHERE customer_id = ? ORDER BY id DESC', [id]);

    const [loans] = await db.query(`
      SELECT l.*,
             (SELECT COUNT(*) FROM loan_gold_items WHERE loan_id = l.id) AS collateral_count,
             (SELECT COALESCE(SUM(pledged_weight), 0) FROM loan_gold_items WHERE loan_id = l.id) AS pledged_weight,
             (SELECT COALESCE(SUM(released_weight), 0) FROM loan_gold_items WHERE loan_id = l.id) AS released_weight
      FROM loans l
      WHERE l.customer_id = ?
      ORDER BY l.id DESC
    `, [id]);

    const [payments] = await db.query(`
      SELECT p.*, l.loan_no, l.loan_type
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      WHERE p.customer_id = ?
      ORDER BY p.id DESC
    `, [id]);

    const [releases] = await db.query(`
      SELECT r.*, l.loan_no
      FROM partial_releases r
      JOIN loans l ON r.loan_id = l.id
      WHERE r.customer_id = ?
      ORDER BY r.id DESC
    `, [id]);

    const [transactions] = await db.query(`
      SELECT t.*, l.loan_no
      FROM loan_transactions t
      LEFT JOIN loans l ON t.loan_id = l.id
      WHERE t.customer_id = ?
      ORDER BY t.id DESC
    `, [id]);

    // Calculate Summary Metrics
    let totalGoldWeight = 0;
    let pledgedGoldWeight = 0;
    let releasedGoldWeight = 0;
    let availableGoldWeight = 0;

    for (const item of goldItems) {
      const w = parseFloat(item.weight || 0);
      totalGoldWeight += w;
      if (item.status === 'PLEDGED') pledgedGoldWeight += w;
      else if (item.status === 'RELEASED') releasedGoldWeight += w;
      else if (item.status === 'AVAILABLE') availableGoldWeight += w;
    }

    let activeLoans = 0;
    let closedLoans = 0;
    let totalLoanAmount = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    let totalOutstanding = 0;

    for (const l of loans) {
      if (l.status === 'CLOSED') {
        closedLoans++;
      } else {
        activeLoans++;
        totalOutstanding += parseFloat(l.remaining_balance || 0);
      }
      totalLoanAmount += parseFloat(l.principal_amount || 0);
      totalPaid += parseFloat(l.total_paid || 0);
      totalInterest += (parseFloat(l.total_interest || 0) + parseFloat(l.manual_final_interest || 0));
    }

    const summary = {
      total_gold_items: goldItems.length,
      total_gold_weight: Math.round(totalGoldWeight * 1000) / 1000,
      pledged_gold_weight: Math.round(pledgedGoldWeight * 1000) / 1000,
      released_gold_weight: Math.round(releasedGoldWeight * 1000) / 1000,
      available_gold_weight: Math.round(availableGoldWeight * 1000) / 1000,
      remaining_pledged_weight: Math.round(pledgedGoldWeight * 1000) / 1000,
      total_loans: loans.length,
      active_loans: activeLoans,
      closed_loans: closedLoans,
      total_loan_amount: Math.round(totalLoanAmount * 100) / 100,
      total_paid: Math.round(totalPaid * 100) / 100,
      total_interest: Math.round(totalInterest * 100) / 100,
      total_outstanding: Math.round(totalOutstanding * 100) / 100,
    };

    return res.json({
      success: true,
      data: {
        customer,
        summary,
        gold_items: goldItems,
        loans,
        payments,
        releases,
        transactions,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch customer details.', error: err.message });
  }
});

// ============================================================
// POST /customers/create (.php)
// ============================================================
router.post(['/create', '/create.php'], requirePermission('customer.create'), async (req, res) => {
  const name = String(req.body.name || '').trim();
  const mobile = String(req.body.mobile || '').trim();
  const address = String(req.body.address || '').trim();
  const aadhaar = String(req.body.aadhaar_number || req.body.aadhaar || '').trim();
  const pan = String(req.body.pan_number || req.body.pan || '').trim();
  const photoUrl = String(req.body.photo_url || '').trim();

  if (!name || !mobile || !address) {
    return res.status(422).json({ success: false, message: 'Name, mobile and address are required.' });
  }

  try {
    const db = await getPool();

    // Check duplicate mobile
    const [existing] = await db.query('SELECT id FROM customers WHERE mobile = ? LIMIT 1', [mobile]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Mobile number already registered to another customer.' });
    }

    // Auto-generate customer code CUST-1001
    const [maxRows] = await db.query("SELECT MAX(id) AS max_id FROM customers");
    const nextId = (parseInt(maxRows[0].max_id || '0', 10)) + 1001;
    const customerCode = `CUST-${nextId}`;

    const [insertRes] = await db.query(
      `INSERT INTO customers (customer_code, name, mobile, address, aadhaar_number, pan_number, photo_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
      [customerCode, name, mobile, address, aadhaar || null, pan || null, photoUrl || null]
    );

    const [created] = await db.query('SELECT * FROM customers WHERE id = ?', [insertRes.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully.',
      data: created[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create customer.', error: err.message });
  }
});

// ============================================================
// POST/PUT /customers/update (.php)
// ============================================================
router.post(['/update', '/update.php'], requirePermission('customer.edit'), async (req, res) => {
  const id = parseInt(req.body.id || '0', 10);
  const name = String(req.body.name || '').trim();
  const mobile = String(req.body.mobile || '').trim();
  const address = String(req.body.address || '').trim();
  const aadhaar = String(req.body.aadhaar_number || req.body.aadhaar || '').trim();
  const pan = String(req.body.pan_number || req.body.pan || '').trim();
  const photoUrl = String(req.body.photo_url || '').trim();

  if (id <= 0) {
    return res.status(400).json({ success: false, message: 'Customer ID is required.' });
  }

  if (!name || !mobile || !address) {
    return res.status(422).json({ success: false, message: 'Name, mobile and address are required.' });
  }

  try {
    const db = await getPool();

    // Check duplicate mobile for other customers
    const [existing] = await db.query('SELECT id FROM customers WHERE mobile = ? AND id != ? LIMIT 1', [mobile, id]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Mobile number registered to another customer.' });
    }

    await db.query(
      `UPDATE customers SET name = ?, mobile = ?, address = ?, aadhaar_number = ?, pan_number = ?, photo_url = COALESCE(NULLIF(?, ''), photo_url), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name, mobile, address, aadhaar || null, pan || null, photoUrl, id]
    );

    const [updated] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Customer updated successfully.',
      data: updated[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update customer.', error: err.message });
  }
});

// ============================================================
// GET /customers/search_additional (.php)
// ============================================================
router.get(['/search_additional', '/search_additional.php'], requirePermission('loan.view'), async (req, res) => {
  const queryParam = String(req.query.search || req.query.q || req.query.query || '').trim();

  try {
    const db = await getPool();
    let sql = `
      SELECT DISTINCT
          c.id,
          c.id AS customer_id,
          c.customer_code,
          c.name,
          c.name AS customer_name,
          c.mobile,
          c.address,
          c.aadhaar_number,
          COUNT(DISTINCT l.id) AS existing_loans_count,
          COALESCE(SUM(DISTINCT CASE WHEN g.status = 'AVAILABLE' THEN g.weight ELSE 0 END), 0) AS available_gold_weight
      FROM customers c
      LEFT JOIN loans l ON l.customer_id = c.id
      LEFT JOIN gold_items g ON g.customer_id = c.id
      WHERE c.status = 'ACTIVE'
    `;

    const params = [];
    if (queryParam) {
      sql += ` AND (c.customer_code LIKE ? OR c.name LIKE ? OR c.mobile LIKE ? OR c.aadhaar_number LIKE ?)`;
      const term = `%${queryParam}%`;
      params.push(term, term, term, term);
    }

    sql += ` GROUP BY c.id ORDER BY c.name ASC LIMIT 50`;

    const [rows] = await db.query(sql, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to search additional loan customers.', error: err.message });
  }
});

module.exports = router;
