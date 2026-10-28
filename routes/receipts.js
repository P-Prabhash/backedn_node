const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { requirePermission } = require('../middleware/authMiddleware');

function enrichReceiptPayload(data, loan, customer, payment, collateral) {
  const currentPayment = parseFloat(
    payment ? payment.amount :
    (data.current_payment || data.payment_amount || data.amount || data.amount_paid || (data.financial ? data.financial.current_payment : 0))
  );

  const principal = parseFloat(
    loan ? loan.principal_amount :
    (data.principal_amount || (data.financial ? data.financial.principal_amount : (data.principal_paid || 0)))
  );

  const totalDue = parseFloat(
    loan ? loan.total_due :
    (data.total_due || (data.financial ? data.financial.total_due : (principal > 0 ? principal : currentPayment)))
  );

  const totalPaid = parseFloat(
    payment ? payment.new_total_paid :
    (loan ? loan.total_paid : (data.total_paid || data.new_total_paid || (data.financial ? data.financial.total_paid : currentPayment)))
  );

  const remaining = parseFloat(
    payment ? payment.remaining_balance :
    (loan ? loan.remaining_balance : (data.remaining_balance !== undefined ? data.remaining_balance : (data.financial ? data.financial.remaining_balance : Math.max(0, totalDue - totalPaid))))
  );

  const previousPaid = parseFloat(
    payment ? payment.previous_paid :
    (data.previous_paid !== undefined ? data.previous_paid : (data.financial ? data.financial.previous_paid : Math.max(0, totalPaid - currentPayment)))
  );

  const paymentMode = payment ? payment.payment_mode : (data.payment_mode || (data.financial ? data.financial.payment_mode : 'CASH'));

  const openedDate = loan ? loan.opened_date : (data.opened_date || data.date || '');
  const paymentDate = payment ? payment.payment_date : (data.date || openedDate || new Date().toISOString().split('T')[0]);
  const paymentTime = payment ? payment.payment_time : (data.time || '12:00:00');

  const customerObj = {
    id: customer ? customer.id : (data.customer ? data.customer.id : ''),
    customer_code: customer ? customer.customer_code : (data.customer ? (data.customer.customer_code || data.customer.customerCode) : (data.customer_code || '')),
    name: customer ? customer.name : (data.customer ? (data.customer.name || data.customer.full_name) : (data.customer_name || '')),
    mobile: customer ? customer.mobile : (data.customer ? data.customer.mobile : (data.mobile || '')),
    address: customer ? customer.address : (data.customer ? data.customer.address : (data.address || '')),
    photo_url: customer ? customer.photo_url : (data.customer ? data.customer.photo_url : '')
  };

  const fin = {
    principal_amount: principal,
    total_due: totalDue,
    payment_amount: currentPayment,
    current_payment: currentPayment,
    amount: currentPayment,
    previous_paid: previousPaid,
    total_paid: totalPaid,
    remaining_balance: remaining,
    payment_mode: paymentMode
  };

  return {
    ...data,
    loan_no: loan ? loan.loan_no : (data.loan_no || ''),
    loan_type: loan ? loan.loan_type : (data.loan_type || 'NEW_LOAN'),
    opened_date: openedDate,
    date: paymentDate || openedDate,
    time: paymentTime,
    customer: customerObj,
    financial: fin,
    loan_financial: fin,
    payment: {
      ...(data.payment || {}),
      payment_id: payment ? payment.id : (data.payment ? data.payment.payment_id : 0),
      amount: currentPayment,
      payment_amount: currentPayment,
      current_payment: currentPayment,
      previous_paid: previousPaid,
      total_paid: totalPaid,
      new_total_paid: totalPaid,
      remaining_balance: remaining,
      payment_mode: paymentMode,
      payment_date: paymentDate,
      payment_time: paymentTime
    },
    principal_amount: principal,
    total_due: totalDue,
    previous_paid: previousPaid,
    current_payment: currentPayment,
    total_paid: totalPaid,
    remaining_balance: remaining,
    collateral: (collateral && collateral.length > 0) ? collateral : (data.collateral || data.gold_items || [])
  };
}

// ============================================================
// GET /receipts/get (.php) & GET /receipts/:receiptId
// ============================================================
router.get(['/get', '/get.php', '/:receiptId'], requirePermission('receipt.view'), async (req, res) => {
  const paramId = req.params.receiptId ? String(req.params.receiptId).trim() : '';
  let receiptNo = String(req.query.receipt_no || req.query.no || '').trim();

  if (!receiptNo && paramId && paramId !== 'get' && paramId !== 'get.php') {
    receiptNo = paramId;
  }

  const paymentId = parseInt(req.query.payment_id || '0', 10);
  const releaseId = parseInt(req.query.release_id || '0', 10);
  const loanId = parseInt(req.query.loan_id || '0', 10);
  const type = String(req.query.type || '').trim().toUpperCase();

  try {
    const db = await getPool();

    let sql = 'SELECT * FROM receipts WHERE 1=1';
    const params = [];

    if (receiptNo) {
      if (/^\d+$/.test(receiptNo)) {
        sql += ' AND (id = ? OR receipt_no = ?)';
        params.push(parseInt(receiptNo, 10), receiptNo);
      } else {
        sql += ' AND receipt_no = ?';
        params.push(receiptNo);
      }
    } else if (paymentId > 0) {
      sql += " AND reference_id = ? AND receipt_type = 'PAYMENT'";
      params.push(String(paymentId));
    } else if (releaseId > 0) {
      sql += " AND reference_id = ? AND receipt_type = 'PARTIAL_RELEASE'";
      params.push(String(releaseId));
    } else if (loanId > 0) {
      if (type) {
        sql += ' AND loan_id = ? AND receipt_type = ? ORDER BY id DESC LIMIT 1';
        params.push(loanId, type);
      } else {
        sql += ' AND loan_id = ? ORDER BY id DESC LIMIT 1';
        params.push(loanId);
      }
    } else {
      return res.status(400).json({ success: false, message: 'Receipt parameter required' });
    }

    const [rows] = await db.query(sql, params);
    let receipt = rows.length > 0 ? rows[0] : null;

    let targetLoanId = loanId || (receipt ? receipt.loan_id : 0);
    let targetCustId = receipt ? receipt.customer_id : 0;

    let loan = null;
    let customer = null;
    let payment = null;
    let collateral = [];

    if (targetLoanId > 0) {
      const [lRows] = await db.query('SELECT * FROM loans WHERE id = ?', [targetLoanId]);
      if (lRows.length > 0) {
        loan = lRows[0];
        targetCustId = loan.customer_id;
      }

      const [cRows] = await db.query(`
        SELECT lgi.*, g.item_name, g.purity, g.weight, g.photo_url
        FROM loan_gold_items lgi
        JOIN gold_items g ON lgi.gold_item_id = g.id
        WHERE lgi.loan_id = ?
      `, [targetLoanId]);
      collateral = cRows;

      const [pRows] = await db.query('SELECT * FROM payments WHERE loan_id = ? ORDER BY id DESC LIMIT 1', [targetLoanId]);
      if (pRows.length > 0) payment = pRows[0];
    }

    if (targetCustId > 0) {
      const [custRows] = await db.query('SELECT * FROM customers WHERE id = ?', [targetCustId]);
      if (custRows.length > 0) customer = custRows[0];
    }

    let dataJson = {};
    if (receipt) {
      try {
        dataJson = typeof receipt.receipt_data_json === 'string' ? JSON.parse(receipt.receipt_data_json) : receipt.receipt_data_json;
      } catch (e) {
        dataJson = receipt.receipt_data_json || {};
      }
    }

    const enriched = enrichReceiptPayload(dataJson, loan, customer, payment, collateral);

    return res.json({
      success: true,
      data: {
        receipt_no: receipt ? receipt.receipt_no : (enriched.receipt_no || 'RCP-PAY-DEFAULT'),
        receipt_type: receipt ? receipt.receipt_type : (enriched.receipt_type || 'PAYMENT'),
        generated_at: receipt ? receipt.generated_at : new Date().toISOString(),
        receipt_data: enriched
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch receipt.', error: err.message });
  }
});

module.exports = router;
