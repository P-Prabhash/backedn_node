const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

// ============================================================
// GET/POST /seed (.php)
// ============================================================
router.all(['/', '/seed', '/seed.php'], async (req, res) => {
  try {
    const db = await getPool();
    const [custRows] = await db.query('SELECT COUNT(*) AS cnt FROM customers');
    const [loanRows] = await db.query('SELECT COUNT(*) AS cnt FROM loans');

    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Gold & Silver Pawn ERP - Database Seed</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5;">
        <div style="max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px;">
          <h1>Gold & Silver Pawn ERP</h1>
          <h2>Database Status Check</h2>
          <p style="color: green; font-weight: bold;">✓ Node.js & MySQL Database Connection Successful.</p>
          <p><strong>Database Name:</strong> backend_api</p>
          <p><strong>Total Customers:</strong> ${custRows[0].cnt}</p>
          <p><strong>Total Loans:</strong> ${loanRows[0].cnt}</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    return res.status(500).send(`<h1>Database Connection Error</h1><p>${err.message}</p>`);
  }
});

module.exports = router;
