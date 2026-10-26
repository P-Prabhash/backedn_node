const express = require('express');
const router = express.Router();
const { requirePermission } = require('../middleware/authMiddleware');

// ============================================================
// POST or GET /interest/calculate (.php)
// ============================================================
router.all(['/calculate', '/calculate.php'], requirePermission('loan.view'), async (req, res) => {
  const input = { ...req.query, ...req.body };

  const principal = parseFloat(input.principal || '0');
  const monthlyRate = parseFloat(input.monthly_rate || '2.0');
  const startDate = String(input.start_date || '').trim();
  const endDate = String(input.end_date || '').trim() || new Date().toISOString().split('T')[0];
  let monthsCount = input.months !== undefined ? parseFloat(input.months) : null;

  if (principal <= 0) {
    return res.status(422).json({ success: false, message: 'Principal amount must be greater than 0' });
  }

  if (monthsCount === null && startDate) {
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    monthsCount = Math.max(1.0, Math.round((diffDays / 30.0) * 100) / 100);
  } else if (monthsCount === null) {
    monthsCount = 1.0;
  }

  const interestAmount = Math.round(((principal * monthlyRate * monthsCount) / 100.0) * 100) / 100;
  const totalDue = Math.round((principal + interestAmount) * 100) / 100;

  return res.json({
    success: true,
    data: {
      principal,
      monthly_rate: monthlyRate,
      months: monthsCount,
      interest_amount: interestAmount,
      total_due: totalDue
    }
  });
});

module.exports = router;
