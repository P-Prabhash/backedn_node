const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { requirePermission } = require('../middleware/authMiddleware');

// ============================================================
// GET /gold/list (.php)
// ============================================================
router.get(['/list', '/list.php'], requirePermission('gold.view'), async (req, res) => {
  const customerId = parseInt(req.query.customer_id || '0', 10);
  const statusFilter = String(req.query.status || '').trim().toUpperCase();
  const search = String(req.query.search || '').trim();

  try {
    const db = await getPool();
    let sql = `
      SELECT g.*,
             c.name AS customer_name,
             c.customer_code,
             c.mobile,
             l.loan_no,
             l.id AS loan_id,
             COALESCE(
               NULLIF(g.locker_no, ''),
               IF(l.id IS NOT NULL, CONCAT('LCK-', LPAD(l.id, 3, '0')), CONCAT('LCK-CUST-', LPAD(g.customer_id, 3, '0')))
             ) AS locker_no
      FROM gold_items g
      JOIN customers c ON g.customer_id = c.id
      LEFT JOIN loan_gold_items lgi ON g.id = lgi.gold_item_id AND lgi.status = 'PLEDGED'
      LEFT JOIN loans l ON lgi.loan_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (customerId > 0) {
      sql += ` AND g.customer_id = ?`;
      params.push(customerId);
    }

    if (statusFilter) {
      sql += ` AND UPPER(g.status) = ?`;
      params.push(statusFilter);
    }

    if (search) {
      sql += ` AND (g.item_name LIKE ? OR c.name LIKE ? OR c.customer_code LIKE ? OR c.mobile LIKE ? OR l.loan_no LIKE ? OR g.locker_no LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    sql += ` ORDER BY g.id DESC`;

    const [items] = await db.query(sql, params);

    return res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load gold items.', error: err.message });
  }
});

// ============================================================
// POST /gold/create (.php) & /gold/add (.php)
// ============================================================
router.post(['/create', '/create.php', '/add', '/add.php'], requirePermission('gold.create'), async (req, res) => {
  const customerId = parseInt(req.body.customer_id || '0', 10);
  const itemName = String(req.body.item_name || '').trim();
  const purity = String(req.body.purity || '22K').trim();
  const weight = parseFloat(req.body.weight || '0');
  const remarks = String(req.body.remarks || '').trim();
  const photoUrl = String(req.body.photo_url || '').trim();
  const lockerNo = String(req.body.locker_no || '').trim();

  if (customerId <= 0) {
    return res.status(422).json({ success: false, message: 'Valid customer ID is required.' });
  }

  if (!itemName) {
    return res.status(422).json({ success: false, message: 'Item name is required.' });
  }

  if (weight <= 0) {
    return res.status(422).json({ success: false, message: 'Weight must be greater than 0.' });
  }

  try {
    const db = await getPool();

    // Verify customer exists
    const [cust] = await db.query('SELECT id FROM customers WHERE id = ?', [customerId]);
    if (cust.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    const [insertRes] = await db.query(
      `INSERT INTO gold_items (customer_id, item_name, purity, weight, remarks, photo_url, locker_no, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')`,
      [customerId, itemName, purity, weight, remarks || null, photoUrl || null, lockerNo || null]
    );

    const [created] = await db.query('SELECT * FROM gold_items WHERE id = ?', [insertRes.insertId]);

    return res.status(201).json({
      success: true,
      message: 'Gold item added successfully.',
      data: created[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to add gold item.', error: err.message });
  }
});

// ============================================================
// POST/PUT /gold/update (.php)
// ============================================================
router.post(['/update', '/update.php'], requirePermission('gold.edit'), async (req, res) => {
  const id = parseInt(req.body.id || '0', 10);
  const itemName = String(req.body.item_name || '').trim();
  const purity = String(req.body.purity || '').trim();
  const weight = parseFloat(req.body.weight || '0');
  const remarks = String(req.body.remarks || '').trim();
  const photoUrl = String(req.body.photo_url || '').trim();
  const lockerNo = String(req.body.locker_no || '').trim();

  if (id <= 0) {
    return res.status(400).json({ success: false, message: 'Gold item ID is required.' });
  }

  if (!itemName || weight <= 0) {
    return res.status(422).json({ success: false, message: 'Item name and valid weight are required.' });
  }

  try {
    const db = await getPool();

    await db.query(
      `UPDATE gold_items SET item_name = ?, purity = COALESCE(NULLIF(?, ''), purity), weight = ?, remarks = ?, photo_url = COALESCE(NULLIF(?, ''), photo_url), locker_no = COALESCE(NULLIF(?, ''), locker_no), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [itemName, purity, weight, remarks || null, photoUrl, lockerNo, id]
    );

    const [updated] = await db.query('SELECT * FROM gold_items WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Gold item updated successfully.',
      data: updated[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update gold item.', error: err.message });
  }
});

// ============================================================
// GET /gold/available_for_additional (.php)
// ============================================================
router.get(['/available_for_additional', '/available_for_additional.php'], requirePermission('loan.view'), async (req, res) => {
  const customerId = parseInt(req.query.customer_id || '0', 10);
  if (customerId <= 0) {
    return res.status(400).json({ success: false, message: 'Customer ID is required.' });
  }

  try {
    const db = await getPool();
    const [items] = await db.query(
      `SELECT * FROM gold_items WHERE customer_id = ? AND status = 'AVAILABLE' ORDER BY id DESC`,
      [customerId]
    );

    return res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch available gold items.', error: err.message });
  }
});

module.exports = router;
