const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { requirePermission } = require('../middleware/authMiddleware');

// ============================================================
// GET /payments/list (.php)
// ============================================================
router.get(['/list', '/list.php'], requirePermission('payment.view'), async (req, res) => {
  const loanId = parseInt(req.query.loan_id || '0', 10);
  const customerId = parseInt(req.query.customer_id || '0', 10);
  const search = String(req.query.search || '').trim();

  try {
    const db = await getPool();
    let sql = `
      SELECT p.*, l.loan_no, c.name AS customer_name, c.customer_code, c.mobile
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN customers c ON p.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (loanId > 0) {
      sql += ` AND p.loan_id = ?`;
      params.push(loanId);
    }

    if (customerId > 0) {
      sql += ` AND p.customer_id = ?`;
      params.push(customerId);
    }

    if (search) {
      sql += ` AND (p.receipt_no LIKE ? OR l.loan_no LIKE ? OR c.name LIKE ? OR c.customer_code LIKE ? OR c.mobile LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    sql += ` ORDER BY p.id DESC`;

    const [rows] = await db.query(sql, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load payments list.', error: err.message });
  }
});

// ============================================================
// POST /payments/create (.php)
// ============================================================
router.post(['/create', '/create.php'], requirePermission('payment.create'), async (req, res) => {
  const loanId = parseInt(req.body.loan_id || '0', 10);
  const principalPayment = parseFloat(req.body.principal_payment || req.body.principal_payment_amount || req.body.amount || '0');
  const manualInterest = parseFloat(req.body.manual_interest || req.body.manual_interest_amount || '0');
  const totalAmountReceived = principalPayment + manualInterest;
  const paymentMode = String(req.body.payment_mode || 'CASH').trim();
  const remarks = String(req.body.remarks || '').trim();

  if (loanId <= 0 || (principalPayment <= 0 && manualInterest <= 0)) {
    return res.status(422).json({ success: false, message: 'Valid loan ID and payment amount required.' });
  }

  const db = await getPool();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [loanRows] = await conn.query('SELECT * FROM loans WHERE id = ? FOR UPDATE', [loanId]);
    if (loanRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Loan not found.' });
    }

    const loan = loanRows[0];
    const customerId = loan.customer_id;

    const [custRows] = await conn.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    const customer = custRows[0] || {};

    const [collateralRows] = await conn.query(`
      SELECT lgi.*, g.item_name, g.purity, g.weight, g.photo_url
      FROM loan_gold_items lgi
      JOIN gold_items g ON lgi.gold_item_id = g.id
      WHERE lgi.loan_id = ?
    `, [loanId]);

    const principal = parseFloat(loan.principal_amount || 0);
    const existingTotalInterest = parseFloat(loan.total_interest || 0);
    const existingManualInterest = parseFloat(loan.manual_final_interest || 0);
    const currentTotalPaid = parseFloat(loan.total_paid || 0);

    const newManualInterest = existingManualInterest + manualInterest;
    const totalDue = principal + existingTotalInterest + newManualInterest;
    const currentRemaining = Math.max(0, Math.round((totalDue - currentTotalPaid) * 100) / 100);

    if (principalPayment > currentRemaining + 0.01) {
      await conn.rollback();
      conn.release();
      return res.status(422).json({ success: false, message: `Principal payment amount (Rs ${principalPayment}) cannot exceed remaining balance (Rs ${currentRemaining}).` });
    }

    if (manualInterest > 0) {
      await conn.query(
        `INSERT INTO interest_records (loan_id, period_start, period_end, monthly_rate, interest_amount, is_manual, remarks)
         VALUES (?, CURRENT_DATE(), CURRENT_DATE(), 0.00, ?, 1, 'Manual Payment Interest')`,
        [loanId, manualInterest]
      );
    }

    const newTotalPaid = currentTotalPaid + principalPayment;
    const newRemainingBalance = Math.max(0, Math.round((totalDue - newTotalPaid) * 100) / 100);
    const paymentType = newRemainingBalance <= 0 ? 'FINAL_SETTLEMENT' : 'PARTIAL';

    const receiptNo = 'RCP-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2,7).toUpperCase();
    const paymentDate = new Date().toISOString().split('T')[0];
    const paymentTime = new Date().toTimeString().split(' ')[0];

    const [pmtRes] = await conn.query(
      `INSERT INTO payments (
        receipt_no, loan_id, customer_id, payment_type, amount, manual_interest, total_received, payment_date, payment_time,
        payment_mode, previous_paid, new_total_paid, remaining_balance, remarks, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'STAFF')`,
      [receiptNo, loanId, customerId, paymentType, principalPayment, manualInterest, totalAmountReceived, paymentDate, paymentTime, paymentMode, currentTotalPaid, newTotalPaid, newRemainingBalance, remarks || null]
    );

    const paymentId = pmtRes.insertId;

    await conn.query(
      `INSERT INTO payment_allocations (payment_id, principal_paid, interest_paid, manual_interest_paid)
       VALUES (?, ?, 0.00, ?)`,
      [paymentId, principalPayment, manualInterest]
    );

    // Update loan
    const newLoanStatus = newRemainingBalance <= 0 ? 'CLOSED' : 'PARTIALLY_PAID';
    const closedDate = newRemainingBalance <= 0 ? paymentDate : null;

    await conn.query(
      `UPDATE loans SET manual_final_interest = ?, total_due = ?, total_paid = ?, remaining_balance = ?, status = ?, closed_date = COALESCE(?, closed_date) WHERE id = ?`,
      [newManualInterest, totalDue, newTotalPaid, newRemainingBalance, newLoanStatus, closedDate, loanId]
    );

    // AUTOMATIC FULL GOLD RELEASE IF LOAN IS FULLY SETTLED (newRemainingBalance <= 0)
    let autoReleaseRecord = null;
    if (newRemainingBalance <= 0) {
      const [existingRel] = await conn.query('SELECT id FROM partial_releases WHERE loan_id = ? AND release_type = "FULL" LIMIT 1', [loanId]);
      if (existingRel.length === 0) {
        const [pledgedItems] = await conn.query(`
          SELECT lgi.*, g.item_name, g.purity, g.weight, g.photo_url
          FROM loan_gold_items lgi
          JOIN gold_items g ON lgi.gold_item_id = g.id
          WHERE lgi.loan_id = ? AND lgi.status = 'PLEDGED'
        `, [loanId]);

        if (pledgedItems.length > 0) {
          let totalWeightReleased = 0;
          for (const pItem of pledgedItems) {
            totalWeightReleased += parseFloat(pItem.pledged_weight || pItem.weight || 0);
          }

          const autoReleaseNo = 'REL-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2,7).toUpperCase();

          const [relRes] = await conn.query(
            `INSERT INTO partial_releases (release_no, loan_id, customer_id, payment_id, release_type, total_weight_released, release_date, release_time, remarks, created_by)
             VALUES (?, ?, ?, ?, 'FULL', ?, ?, ?, 'Automatic full release upon complete loan settlement', 'STAFF')`,
            [autoReleaseNo, loanId, customerId, paymentId, totalWeightReleased, paymentDate, paymentTime]
          );

          const releaseId = relRes.insertId;

          for (const pItem of pledgedItems) {
            await conn.query(
              `INSERT INTO release_items (release_id, gold_item_id, item_name, purity, weight)
               VALUES (?, ?, ?, ?, ?)`,
              [releaseId, pItem.gold_item_id, pItem.item_name, pItem.purity, pItem.weight]
            );

            await conn.query("UPDATE loan_gold_items SET status = 'RELEASED', released_weight = pledged_weight, release_date = ? WHERE id = ?", [paymentDate, pItem.id]);
            await conn.query("UPDATE gold_items SET status = 'RELEASED' WHERE id = ?", [pItem.gold_item_id]);
          }

          const txCode = 'TXN-REL-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          await conn.query(
            `INSERT INTO loan_transactions (transaction_code, customer_id, loan_id, transaction_type, amount, weight, reference_id, date, time, created_by, remarks)
             VALUES (?, ?, ?, 'FULL_RELEASE', 0.00, ?, ?, ?, ?, 'STAFF', 'Full release of gold collateral upon loan closure')`,
            [txCode, customerId, loanId, totalWeightReleased, autoReleaseNo, paymentDate, paymentTime]
          );

          const autoReleaseReceiptData = {
            shop_name: 'GOLD & SILVER PAWN MANAGEMENT ERP',
            receipt_no: autoReleaseNo,
            receipt_type: 'FULL_RELEASE',
            loan_no: loan.loan_no,
            loan_type: loan.loan_type,
            release_no: autoReleaseNo,
            release_type: 'FULL',
            date: paymentDate,
            time: paymentTime,
            customer: {
              id: customer.id,
              customer_code: customer.customer_code,
              name: customer.name,
              mobile: customer.mobile,
              address: customer.address
            },
            financial: {
              principal_amount: principal,
              total_paid: newTotalPaid,
              remaining_balance: 0.00,
              payment_reference: receiptNo
            },
            released_items: pledgedItems,
            total_released_weight: totalWeightReleased
          };

          await conn.query(
            `INSERT INTO receipts (receipt_no, receipt_type, reference_id, customer_id, loan_id, receipt_data_json)
             VALUES (?, 'FULL_RELEASE', ?, ?, ?, ?)`,
            [autoReleaseNo, String(releaseId), customerId, loanId, JSON.stringify(autoReleaseReceiptData)]
          );

          autoReleaseRecord = {
            id: releaseId,
            release_no: autoReleaseNo,
            total_weight_released: totalWeightReleased
          };
        }
      }
    }

    // Central Transaction
    const code = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const txRemarks = `Principal Payment: Rs ${principalPayment.toFixed(2)}, Manual Interest: Rs ${manualInterest.toFixed(2)}, Total Received: Rs ${totalAmountReceived.toFixed(2)}`;

    await conn.query(
      `INSERT INTO loan_transactions (transaction_code, customer_id, loan_id, transaction_type, amount, weight, reference_id, date, time, created_by, remarks)
       VALUES (?, ?, ?, ?, ?, 0.000, ?, ?, ?, 'STAFF', ?)`,
      [code, customerId, loanId, paymentType === 'FINAL_SETTLEMENT' ? 'FULL_PAYMENT' : 'PAYMENT', totalAmountReceived, receiptNo, paymentDate, paymentTime, txRemarks]
    );

    // Rich Receipt Payload
    const fin = {
      principal_amount: principal,
      total_due: totalDue,
      outstanding_principal_before: currentRemaining,
      principal_payment_amount: principalPayment,
      manual_interest_collected: manualInterest,
      total_amount_received: totalAmountReceived,
      previous_paid_principal: currentTotalPaid,
      total_paid_principal: newTotalPaid,
      outstanding_principal_after: newRemainingBalance,
      remaining_balance: newRemainingBalance,
      payment_mode: paymentMode
    };

    const receiptData = {
      shop_name: 'GOLD & SILVER PAWN MANAGEMENT ERP',
      receipt_no: receiptNo,
      receipt_type: 'PAYMENT',
      loan_no: loan.loan_no,
      loan_type: loan.loan_type,
      loan_status: newLoanStatus,
      opened_date: loan.opened_date,
      date: paymentDate,
      time: paymentTime,
      customer: {
        id: customer.id,
        customer_code: customer.customer_code,
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address,
        photo_url: customer.photo_url || ''
      },
      payment: {
        payment_id: paymentId,
        payment_type: paymentType,
        amount: principalPayment,
        principal_payment_amount: principalPayment,
        manual_interest: manualInterest,
        manual_interest_amount: manualInterest,
        total_amount_received: totalAmountReceived,
        payment_mode: paymentMode,
        previous_paid: currentTotalPaid,
        new_total_paid: newTotalPaid,
        remaining_balance: newRemainingBalance,
        payment_date: paymentDate,
        payment_time: paymentTime,
        remarks
      },
      financial: fin,
      loan_financial: fin,
      principal_amount: principal,
      total_due: totalDue,
      previous_paid: currentTotalPaid,
      principal_payment_amount: principalPayment,
      manual_interest: manualInterest,
      total_amount_received: totalAmountReceived,
      total_paid: newTotalPaid,
      remaining_balance: newRemainingBalance,
      collateral: collateralRows
    };

    await conn.query(
      `INSERT INTO receipts (receipt_no, receipt_type, reference_id, customer_id, loan_id, receipt_data_json)
       VALUES (?, 'PAYMENT', ?, ?, ?, ?)`,
      [receiptNo, String(paymentId), customerId, loanId, JSON.stringify(receiptData)]
    );

    await conn.commit();
    conn.release();

    const [createdPayment] = await db.query('SELECT * FROM payments WHERE id = ?', [paymentId]);

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: createdPayment[0],
      receipt: receiptData
    });

  } catch (err) {
    await conn.rollback();
    conn.release();
    return res.status(500).json({ success: false, message: 'Failed to record payment.', error: err.message });
  }
});

module.exports = router;
