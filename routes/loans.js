const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { requirePermission } = require('../middleware/authMiddleware');
const { formatPhotoUrl } = require('../utils/imageHelper');

async function logTransaction(db, customerId, loanId, txType, amount, weight, refId, remarks, createdBy = 'STAFF') {
  const code = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  await db.query(
    `INSERT INTO loan_transactions (transaction_code, customer_id, loan_id, transaction_type, amount, weight, reference_id, date, time, created_by, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, customerId, loanId, txType, amount, weight, refId || null, dateStr, timeStr, createdBy, remarks || null]
  );
}

// ============================================================
// GET /loans/list (.php)
// ============================================================
router.get(['/list', '/list.php'], requirePermission('loan.view'), async (req, res) => {
  const status = String(req.query.status || '').trim().toUpperCase();
  const customerId = parseInt(req.query.customer_id || '0', 10);
  const search = String(req.query.search || '').trim();

  try {
    const db = await getPool();
    let sql = `
      SELECT l.*,
             c.name AS customer_name,
             c.customer_code,
             c.mobile,
             c.photo_url AS customer_photo,
             (SELECT COUNT(*) FROM loan_gold_items WHERE loan_id = l.id) AS collateral_count,
             (SELECT COUNT(*) FROM loan_gold_items WHERE loan_id = l.id) AS total_items_count,
             (SELECT COALESCE(SUM(pledged_weight), 0) FROM loan_gold_items WHERE loan_id = l.id) AS pledged_weight,
             (SELECT COALESCE(SUM(pledged_weight), 0) FROM loan_gold_items WHERE loan_id = l.id) AS total_pledged_weight,
             (SELECT COALESCE(SUM(released_weight), 0) FROM loan_gold_items WHERE loan_id = l.id) AS released_weight,
             (SELECT COALESCE(SUM(released_weight), 0) FROM loan_gold_items WHERE loan_id = l.id) AS total_released_weight,
             (SELECT COALESCE(SUM(pledged_weight - released_weight), 0) FROM loan_gold_items WHERE loan_id = l.id) AS remaining_pledged_weight
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      sql += ` AND UPPER(l.status) = ?`;
      params.push(status);
    }

    if (customerId > 0) {
      sql += ` AND l.customer_id = ?`;
      params.push(customerId);
    }

    if (search) {
      sql += ` AND (l.loan_no LIKE ? OR l.manual_loan_no LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY l.id DESC`;

    const [loans] = await db.query(sql, params);

    for (const l of loans) {
      l.customer_photo = formatPhotoUrl(req, l.customer_photo);
      const principal = parseFloat(l.principal_amount || 0);
      const totalInterest = parseFloat(l.total_interest || 0) + parseFloat(l.manual_final_interest || 0);
      const totalDue = parseFloat(l.total_due || (principal + totalInterest));
      const totalPaid = parseFloat(l.total_paid || 0);
      const remBal = Math.max(0, Math.round((totalDue - totalPaid) * 100) / 100);
      const paidPrincipal = Math.min(totalPaid, principal);
      l.remaining_principal = Math.max(0, Math.round((principal - paidPrincipal) * 100) / 100);
      l.remaining_interest = Math.max(0, Math.round((remBal - l.remaining_principal) * 100) / 100);
      l.remaining_balance = remBal;
    }

    return res.json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load loans list.', error: err.message });
  }
});

// ============================================================
// GET /loans/get (.php)
// ============================================================
router.get(['/get', '/get.php'], requirePermission('loan.view'), async (req, res) => {
  const id = parseInt(req.query.id || req.query.loan_id || '0', 10);
  if (id <= 0) {
    return res.status(400).json({ success: false, message: 'Valid loan ID is required' });
  }

  try {
    const db = await getPool();

    const [loanRows] = await db.query(`
      SELECT l.*,
             c.id AS customer_id, c.name AS customer_name, c.customer_code, c.mobile, c.address, c.aadhaar_number, c.photo_url AS customer_photo_url
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      WHERE l.id = ?
    `, [id]);

    if (loanRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const loan = loanRows[0];
    const principal = parseFloat(loan.principal_amount || 0);
    const totalInterest = parseFloat(loan.total_interest || 0) + parseFloat(loan.manual_final_interest || 0);
    const totalDue = parseFloat(loan.total_due || (principal + totalInterest));
    const totalPaid = parseFloat(loan.total_paid || 0);
    const remBal = Math.max(0, Math.round((totalDue - totalPaid) * 100) / 100);
    const paidPrincipal = Math.min(totalPaid, principal);
    loan.remaining_principal = Math.max(0, Math.round((principal - paidPrincipal) * 100) / 100);
    loan.remaining_interest = Math.max(0, Math.round((remBal - loan.remaining_principal) * 100) / 100);
    loan.remaining_balance = remBal;

    const customer = {
      id: loan.customer_id,
      customer_code: loan.customer_code,
      name: loan.customer_name,
      mobile: loan.mobile,
      address: loan.address,
      aadhaar_number: loan.aadhaar_number,
      photo_url: formatPhotoUrl(req, loan.customer_photo_url)
    };

    const [collateral] = await db.query(`
      SELECT lgi.*,
             lgi.id AS loan_gold_item_id,
             lgi.status AS collateral_status,
             g.item_name, g.purity, g.weight, g.weight AS total_weight, g.weight AS original_item_weight, g.photo_url, g.photo_url AS gold_photo_url, g.remarks AS item_remarks
      FROM loan_gold_items lgi
      JOIN gold_items g ON lgi.gold_item_id = g.id
      WHERE lgi.loan_id = ?
      ORDER BY lgi.id ASC
    `, [id]);

    let totalPledgedWeight = 0;
    let totalReleasedWeight = 0;
    for (const c of collateral) {
      c.photo_url = formatPhotoUrl(req, c.photo_url);
      c.gold_photo_url = formatPhotoUrl(req, c.photo_url || c.gold_photo_url);
      totalPledgedWeight += parseFloat(c.pledged_weight || c.weight || 0);
      totalReleasedWeight += parseFloat(c.released_weight || 0);
    }
    const remainingPledgedWeight = Math.max(0, totalPledgedWeight - totalReleasedWeight);

    const weights = {
      total_pledged_weight: totalPledgedWeight,
      released_pledged_weight: totalReleasedWeight,
      remaining_pledged_weight: remainingPledgedWeight
    };

    const [payments] = await db.query('SELECT * FROM payments WHERE loan_id = ? ORDER BY id DESC', [id]);
    const [releases] = await db.query('SELECT * FROM partial_releases WHERE loan_id = ? ORDER BY id DESC', [id]);
    const [transactions] = await db.query('SELECT * FROM loan_transactions WHERE loan_id = ? ORDER BY id DESC', [id]);

    const responseData = {
      loan,
      customer,
      collateral,
      weights,
      payments,
      releases,
      transactions
    };

    return res.json({
      success: true,
      data: responseData,
      ...responseData
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch loan details.', error: err.message });
  }
});

function toSqlDate(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (!str || str === 'null' || str === 'undefined' || str === '0000-00-00') return null;
  if (str.includes('T')) return str.split('T')[0];
  if (str.includes(' ')) return str.split(' ')[0];
  return str;
}

// ============================================================
// SHARED LOAN CREATOR (NEW & EXISTING HISTORICAL LOANS)
// ============================================================
async function handleCreateLoan(req, res, defaultLoanType = 'NEW_LOAN') {
  const customerId = parseInt(req.body.customer_id || req.body.customerId || req.body.customer || '0', 10);
  const manualLoanNo = String(req.body.manual_loan_no || req.body.manualLoanNo || req.body.loan_no || req.body.loanNo || '').trim();
  const openedDate = toSqlDate(req.body.opened_date || req.body.openedDate || req.body.manual_opened_date || req.body.date) || new Date().toISOString().split('T')[0];
  const closedDate = toSqlDate(req.body.closed_date || req.body.closedDate || req.body.manual_closed_date);
  const principalAmount = parseFloat(req.body.principal_amount || req.body.principalAmount || req.body.amount || '0');
  const monthlyRate = parseFloat(req.body.monthly_interest_rate || req.body.monthlyInterestRate || req.body.interest_rate || req.body.interestRate || '2.0');
  const initialInterest = parseFloat(req.body.initial_interest || req.body.initialInterest || req.body.manual_interest || req.body.total_interest || '0');
  const totalPaid = parseFloat(req.body.total_paid || req.body.totalPaid || req.body.amount_paid || '0');

  let status = String(req.body.status || 'ACTIVE').trim().toUpperCase();
  if (!['ACTIVE', 'CLOSED', 'PARTIALLY_PAID', 'PARTIALLY_RELEASED'].includes(status)) {
    status = 'ACTIVE';
  }

  const remarks = String(req.body.remarks || '').trim();

  let items = req.body.items || req.body.gold_item_ids || req.body.gold_items || req.body.goldItems || [];
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch (e) {
      if (items.includes(',')) {
        items = items.split(',').map(s => s.trim());
      } else if (items.trim()) {
        items = [items.trim()];
      } else {
        items = [];
      }
    }
  }

  let loanType = String(req.body.loan_type || req.body.loanType || defaultLoanType).trim().toUpperCase();
  if (!['NEW_LOAN', 'EXISTING_LOAN', 'ADDITIONAL_LOAN'].includes(loanType)) {
    if (loanType.includes('EXISTING')) {
      loanType = 'EXISTING_LOAN';
    } else if (loanType.includes('ADDITIONAL')) {
      loanType = 'ADDITIONAL_LOAN';
    } else {
      loanType = 'NEW_LOAN';
    }
  }

  if (customerId <= 0) {
    return res.status(422).json({ success: false, message: 'Valid customer ID is required.' });
  }

  if (principalAmount <= 0) {
    return res.status(422).json({ success: false, message: 'Valid principal loan amount is required.' });
  }

  const db = await getPool();
  let conn = null;

  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [custRows] = await conn.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (custRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    const customer = custRows[0];

    // Generate Unique Loan No PL-YYYY-XXXX
    let nextNum = 1001;
    const [maxRows] = await conn.query("SELECT MAX(id) AS max_id, COUNT(*) as cnt FROM loans");
    if (maxRows.length > 0) {
      nextNum = Math.max(1001, (parseInt(maxRows[0].max_id || '0', 10)) + 1001, (parseInt(maxRows[0].cnt || '0', 10)) + 1001);
    }

    let loanNo = `PL-${new Date().getFullYear()}-${nextNum}`;
    let [checkDup] = await conn.query("SELECT id FROM loans WHERE loan_no = ?", [loanNo]);
    while (checkDup.length > 0) {
      nextNum++;
      loanNo = `PL-${new Date().getFullYear()}-${nextNum}`;
      [checkDup] = await conn.query("SELECT id FROM loans WHERE loan_no = ?", [loanNo]);
    }

    const totalInterest = initialInterest;
    const totalDue = Math.round((principalAmount + initialInterest) * 100) / 100;
    const remainingBalance = Math.max(0, Math.round((totalDue - totalPaid) * 100) / 100);

    const [loanRes] = await conn.query(
      `INSERT INTO loans (
        loan_no, manual_loan_no, customer_id, loan_type, opened_date, manual_opened_date,
        closed_date, manual_closed_date, principal_amount, monthly_interest_rate,
        total_interest, total_due, total_paid, remaining_balance, status, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loanNo,
        manualLoanNo || null,
        customerId,
        loanType,
        openedDate,
        openedDate,
        closedDate,
        closedDate,
        principalAmount,
        monthlyRate,
        totalInterest,
        totalDue,
        totalPaid,
        remainingBalance,
        status,
        remarks || null
      ]
    );

    const loanId = loanRes.insertId;

    // Attach gold collateral items
    let totalPledgedWeight = 0;
    const pledgedItemsDetails = [];

    if (Array.isArray(items)) {
      for (const item of items) {
        let goldItemId = 0;
        let pledgedWeight = 0;

        if (typeof item === 'object' && item !== null) {
          const itemGId = parseInt(item.gold_item_id || item.id || item.gold_id || '0', 10);
          const itemName = String(item.item_name || item.name || item.title || '').trim();
          const purity = String(item.purity || item.karat || '22K').trim();
          const weightVal = parseFloat(item.weight || item.pledged_weight || item.net_weight || '0') || 0;
          const itemRemarks = item.remarks ? String(item.remarks).trim() : null;

          if (itemGId > 0) {
            goldItemId = itemGId;
            pledgedWeight = weightVal;
          } else if (itemName) {
            const [gRes] = await conn.query(
              `INSERT INTO gold_items (customer_id, item_name, purity, weight, remarks, status)
               VALUES (?, ?, ?, ?, ?, 'PLEDGED')`,
              [customerId, itemName, purity, weightVal, itemRemarks]
            );
            goldItemId = gRes.insertId;
            pledgedWeight = weightVal;
          }
        } else {
          goldItemId = parseInt(item, 10);
        }

        if (goldItemId > 0) {
          const [gi] = await conn.query('SELECT * FROM gold_items WHERE id = ?', [goldItemId]);
          if (gi.length > 0) {
            const goldObj = gi[0];
            if (pledgedWeight <= 0) pledgedWeight = parseFloat(goldObj.weight || 0);

            await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ?", [goldItemId]);
            await conn.query(
              `INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, status, pledge_date)
               VALUES (?, ?, ?, 'PLEDGED', ?)`,
              [loanId, goldItemId, pledgedWeight, openedDate]
            );

            totalPledgedWeight += pledgedWeight;
            pledgedItemsDetails.push(goldObj);
          }
        }
      }
    }

    await logTransaction(conn, customerId, loanId, 'LOAN_CREATED', principalAmount, totalPledgedWeight, loanNo, `Pawn Loan ${loanNo} created for Rs ${principalAmount}`, 'STAFF');

    const receiptNo = 'RCP-NEW-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2,8).toUpperCase();
    const receiptData = {
      shop_name: 'GOLD & SILVER PAWN MANAGEMENT ERP',
      receipt_no: receiptNo,
      receipt_type: loanType,
      loan_no: loanNo,
      loan_type: loanType,
      date: openedDate,
      time: new Date().toTimeString().split(' ')[0],
      customer: {
        id: customerId,
        customer_code: customer.customer_code,
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address
      },
      financial: {
        principal_amount: principalAmount,
        monthly_interest_rate: monthlyRate,
        initial_interest: initialInterest,
        total_due: totalDue,
        total_paid: totalPaid,
        remaining_balance: remainingBalance
      },
      collateral: pledgedItemsDetails
    };

    await conn.query(
      `INSERT INTO receipts (receipt_no, receipt_type, reference_id, customer_id, loan_id, receipt_data_json)
       VALUES (?, 'LOAN', ?, ?, ?, ?)`,
      [receiptNo, loanNo, customerId, loanId, JSON.stringify(receiptData)]
    );

    await conn.commit();
    conn.release();

    const [createdLoan] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);

    return res.status(201).json({
      success: true,
      message: 'Pawn loan recorded successfully.',
      data: {
        ...createdLoan[0],
        receipt: receiptData,
        receipt_no: receiptNo
      }
    });

  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (rErr) {}
      try { conn.release(); } catch (rErr) {}
    }
    console.error('[CREATE LOAN ERROR]', err);
    return res.status(500).json({ success: false, message: 'Failed to record loan: ' + err.message, error: err.message });
  }
}

// ============================================================
// POST /loans/create (.php), /loans/create_new (.php)
// ============================================================
router.post(['/create', '/create.php', '/create_new', '/create_new.php'], requirePermission('loan.create'), async (req, res) => {
  return handleCreateLoan(req, res, 'NEW_LOAN');
});

// ============================================================
// POST /loans/create_additional (.php)
// ============================================================
router.post(['/create_additional', '/create_additional.php'], requirePermission('loan.additional'), async (req, res) => {
  const customerId = parseInt(req.body.customer_id || '0', 10);
  const loanId = parseInt(req.body.loan_id || req.body.parent_loan_id || '0', 10);
  const additionalAmount = parseFloat(req.body.principal_amount || req.body.additional_amount || '0');
  const monthlyRate = parseFloat(req.body.monthly_interest_rate || '2.0');
  const interestType = String(req.body.interest_type || 'MONTHLY_SIMPLE').trim();
  const initialInterest = parseFloat(req.body.initial_interest || '0');
  const remarks = String(req.body.remarks || '').trim();
  const additionalType = String(req.body.additional_type || 'AMOUNT_ONLY').trim().toUpperCase();
  const goldItemIds = req.body.gold_item_ids || [];

  if (customerId <= 0) {
    return res.status(422).json({ success: false, message: 'Customer ID is required.' });
  }

  if (loanId <= 0) {
    return res.status(422).json({ success: false, message: 'Existing pawn loan ID is required.' });
  }

  if (additionalAmount <= 0) {
    return res.status(422).json({ success: false, message: 'Additional loan amount must be greater than 0.' });
  }

  const db = await getPool();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Verify Customer
    const [custRows] = await conn.query("SELECT * FROM customers WHERE id = ? AND status = 'ACTIVE' LIMIT 1", [customerId]);
    if (custRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Active customer not found.' });
    }
    const customer = custRows[0];

    // 2. Fetch Existing Pawn Loan FOR UPDATE
    const [loanRows] = await conn.query('SELECT * FROM loans WHERE id = ? AND customer_id = ? FOR UPDATE', [loanId, customerId]);
    if (loanRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Existing pawn loan not found for this customer.' });
    }

    const loan = loanRows[0];
    if (String(loan.status || '').toUpperCase() === 'CLOSED') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Additional loan cannot be added because this pawn loan is closed.' });
    }

    // 3. Compute Updated Financial Totals
    const currentPrincipal = parseFloat(loan.principal_amount || 0);
    const currentTotalInterest = parseFloat(loan.total_interest || 0);
    const currentTotalDue = parseFloat(loan.total_due || 0);
    const currentTotalPaid = parseFloat(loan.total_paid || 0);
    const currentRemainingBalance = parseFloat(loan.remaining_balance || 0);

    const newPrincipal = currentPrincipal + additionalAmount;
    const newTotalInterest = currentTotalInterest + initialInterest;
    const newTotalDue = currentTotalDue + additionalAmount + initialInterest;
    const newRemainingBalance = currentRemainingBalance + additionalAmount + initialInterest;

    // 4. Additional Gold Collateral Handling (if any passed)
    let selectedGoldItems = [];
    let totalPledgedWeight = 0;

    if (additionalType === 'GOLD_ITEM' && Array.isArray(goldItemIds) && goldItemIds.length > 0) {
      const cleanIds = [...new Set(goldItemIds.map(id => parseInt(id, 10)).filter(id => id > 0))];
      if (cleanIds.length > 0) {
        const [gItems] = await conn.query(`SELECT * FROM gold_items WHERE id IN (?) AND customer_id = ? FOR UPDATE`, [cleanIds, customerId]);
        if (gItems.length !== cleanIds.length) {
          await conn.rollback();
          conn.release();
          return res.status(422).json({ success: false, message: 'One or more selected gold items do not exist or belong to another customer.' });
        }

        for (const item of gItems) {
          if (item.status !== 'AVAILABLE') {
            await conn.rollback();
            conn.release();
            return res.status(422).json({ success: false, message: `Gold item '${item.item_name}' is not available.` });
          }
          totalPledgedWeight += parseFloat(item.weight || 0);
          selectedGoldItems.push(item);
        }

        const openedDate = new Date().toISOString().split('T')[0];
        for (const item of selectedGoldItems) {
          await conn.query(
            `INSERT INTO loan_gold_items (loan_id, gold_item_id, pledged_weight, released_weight, status, pledge_date)
             VALUES (?, ?, ?, 0.000, 'PLEDGED', ?)`,
            [loanId, item.id, item.weight, openedDate]
          );
          await conn.query("UPDATE gold_items SET status = 'PLEDGED' WHERE id = ? AND customer_id = ?", [item.id, customerId]);
        }
      }
    }

    // 5. UPDATE EXISTING LOAN (DO NOT CREATE NEW LOAN NUMBER OR NEW LOAN ROW)
    await conn.query(
      `UPDATE loans
       SET
          principal_amount = ?,
          monthly_interest_rate = ?,
          interest_type = ?,
          total_interest = ?,
          total_due = ?,
          total_paid = ?,
          remaining_balance = ?,
          remarks = CASE WHEN ? <> '' THEN ? ELSE remarks END,
          updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND customer_id = ?`,
      [
        newPrincipal,
        monthlyRate,
        interestType,
        newTotalInterest,
        newTotalDue,
        currentTotalPaid,
        newRemainingBalance,
        remarks,
        remarks,
        loanId,
        customerId
      ]
    );

    // 6. CENTRAL TRANSACTION AUDIT LEDGER
    const desc = `Additional disbursement of Rs ${additionalAmount.toFixed(2)} under loan ${loan.loan_no}. Combined principal: Rs ${newPrincipal.toFixed(2)}`;
    await logTransaction(conn, customerId, loanId, 'ADDITIONAL_LOAN', additionalAmount, totalPledgedWeight, loan.loan_no, desc, 'STAFF');

    // 7. RECORD IN LOAN STATUS HISTORY
    await conn.query(
      `INSERT INTO loan_status_history (loan_id, old_status, new_status, reason, changed_by)
       VALUES (?, ?, ?, ?, 'STAFF')`,
      [loanId, loan.status, loan.status, `Additional disbursement of Rs ${additionalAmount.toFixed(2)}`, 'STAFF']
    );

    // 8. RECEIPT GENERATION FOR ADDITIONAL DISBURSEMENT
    const receiptNo = 'RCP-ADD-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(36).substring(2,8).toUpperCase();
    const receiptData = {
      shop_name: 'GOLD & SILVER PAWN MANAGEMENT ERP',
      receipt_no: receiptNo,
      receipt_type: 'ADDITIONAL_LOAN',
      loan_no: loan.loan_no,
      loan_type: loan.loan_type,
      additional_type: additionalType,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0],
      customer: {
        id: customer.id,
        customer_code: customer.customer_code,
        name: customer.name,
        mobile: customer.mobile,
        address: customer.address
      },
      financial: {
        principal_amount: newPrincipal,
        original_principal: currentPrincipal,
        additional_amount: additionalAmount,
        total_due: newTotalDue,
        previous_paid: currentTotalPaid,
        total_paid: currentTotalPaid,
        remaining_balance: newRemainingBalance,
        monthly_interest_rate: monthlyRate
      },
      loan: {
        loan_id: loanId,
        loan_no: loan.loan_no,
        original_principal: currentPrincipal,
        additional_amount: additionalAmount,
        combined_principal: newPrincipal,
        remaining_balance: newRemainingBalance,
        status: loan.status
      }
    };

    await conn.query(
      `INSERT INTO receipts (receipt_no, receipt_type, reference_id, customer_id, loan_id, receipt_data_json)
       VALUES (?, 'LOAN', ?, ?, ?, ?)`,
      [receiptNo, loan.loan_no, customerId, loanId, JSON.stringify(receiptData)]
    );

    await conn.commit();
    conn.release();

    const [updatedRows] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);

    return res.json({
      success: true,
      message: `Additional disbursement of ₹${additionalAmount} added to existing loan ${loan.loan_no} successfully`,
      data: {
        loan: updatedRows[0],
        receipt: receiptData,
        receipt_no: receiptNo,
        original_principal: currentPrincipal,
        additional_amount: additionalAmount,
        combined_principal: newPrincipal,
        remaining_balance: newRemainingBalance
      }
    });

  } catch (err) {
    await conn.rollback();
    conn.release();
    return res.status(500).json({ success: false, message: 'Failed to update pawn loan: ' + err.message });
  }
});

// ============================================================
// POST /loans/create_existing (.php)
// ============================================================
router.post(['/create_existing', '/create_existing.php'], requirePermission('loan.existing'), async (req, res) => {
  return handleCreateLoan(req, res, 'EXISTING_LOAN');
});

// ============================================================
// POST /loans/close (.php)
// ============================================================
router.post(['/close', '/close.php'], requirePermission('loan.close'), async (req, res) => {
  const loanId = parseInt(req.body.loan_id || req.body.loanId || req.body.id || '0', 10);
  const manualFinalInterest = parseFloat(req.body.manual_final_interest || req.body.manualFinalInterest || req.body.manual_interest || '0');
  const paymentAmount = parseFloat(req.body.payment_amount || req.body.paymentAmount || req.body.amount || req.body.payment_received || '0');
  const paymentMode = String(req.body.payment_mode || req.body.paymentMode || 'CASH').trim().toUpperCase();
  const paymentReference = String(req.body.payment_reference || req.body.paymentReference || req.body.reference_id || req.body.ref_no || '').trim();
  const remarks = String(req.body.remarks || req.body.notes || '').trim();
  const txDate = toSqlDate(req.body.transaction_date || req.body.transactionDate || req.body.payment_date || req.body.date) || new Date().toISOString().split('T')[0];
  const txTime = new Date().toTimeString().split(' ')[0];

  if (loanId <= 0) {
    return res.status(400).json({ success: false, message: 'Valid Loan ID is required' });
  }

  if (isNaN(manualFinalInterest) || manualFinalInterest < 0) {
    return res.status(422).json({ success: false, message: 'Manual final interest must be a valid non-negative number' });
  }

  if (isNaN(paymentAmount) || paymentAmount < 0) {
    return res.status(422).json({ success: false, message: 'Payment amount must be a valid non-negative number' });
  }

  const db = await getPool();
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [loanRows] = await conn.query('SELECT * FROM loans WHERE id = ? FOR UPDATE', [loanId]);
    if (loanRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }

    const loan = loanRows[0];
    if (loan.status === 'CLOSED') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Loan is already closed' });
    }

    const customerId = loan.customer_id;
    const [custRows] = await conn.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    const customer = custRows[0] || {};

    const currentPrincipal = parseFloat(loan.principal_amount || 0);
    const existingTotalInterest = parseFloat(loan.total_interest || 0);
    const existingManualInterest = parseFloat(loan.manual_final_interest || 0);
    const currentTotalPaid = parseFloat(loan.total_paid || 0);

    const currentOutstandingBefore = Math.max(0, Math.round(((currentPrincipal + existingTotalInterest + existingManualInterest) - currentTotalPaid) * 100) / 100);
    const alreadyPaidInterest = Math.max(0, Math.round((currentTotalPaid - currentPrincipal) * 100) / 100);
    const currentOutstandingPrincipal = Math.max(0, Math.round((currentPrincipal - Math.min(currentTotalPaid, currentPrincipal)) * 100) / 100);

    let appliedManualInterest = manualFinalInterest;
    if (appliedManualInterest === 0 && req.body.final_settlement_amount) {
      const passedSettlementAmount = parseFloat(req.body.final_settlement_amount || '0');
      if (passedSettlementAmount > currentOutstandingPrincipal) {
        appliedManualInterest = Math.round((passedSettlementAmount - currentOutstandingPrincipal) * 100) / 100;
      }
    }

    let newTotalInterest = existingTotalInterest;
    let newManualInterest = existingManualInterest;

    if (req.body.manual_final_interest !== undefined || req.body.manualFinalInterest !== undefined || req.body.manual_interest !== undefined || req.body.final_settlement_amount !== undefined) {
      newManualInterest = Math.round((alreadyPaidInterest + appliedManualInterest) * 100) / 100;
      newTotalInterest = 0.00;
    }

    const totalInterestCombined = Math.round((newTotalInterest + newManualInterest) * 100) / 100;
    const totalDue = Math.round((currentPrincipal + totalInterestCombined) * 100) / 100;
    const finalSettlementAmount = Math.max(0, Math.round((totalDue - currentTotalPaid) * 100) / 100);

    if (appliedManualInterest > 0) {
      await logTransaction(conn, customerId, loanId, 'FINAL_MANUAL_INTEREST', appliedManualInterest, 0, loan.loan_no, `Manual Final Interest of Rs ${appliedManualInterest.toFixed(2)} applied`, 'STAFF');
      await conn.query(
        `INSERT INTO interest_records (loan_id, period_start, period_end, monthly_rate, interest_amount, is_manual, remarks)
         VALUES (?, ?, ?, 0.00, ?, 1, 'Manual Final Settlement Interest')`,
        [loanId, txDate, txDate, appliedManualInterest]
      );
    }

    if (paymentAmount > finalSettlementAmount + 0.01) {
      await conn.rollback();
      conn.release();
      return res.status(422).json({
        success: false,
        message: `Payment amount (Rs ${paymentAmount.toFixed(2)}) cannot exceed final settlement amount (Rs ${finalSettlementAmount.toFixed(2)})`
      });
    }

    const newTotalPaid = Math.round((currentTotalPaid + paymentAmount) * 100) / 100;
    const newRemainingBalance = Math.max(0, Math.round((totalDue - newTotalPaid) * 100) / 100);

    const prevPrincipalPaid = Math.min(currentTotalPaid, currentPrincipal);
    const newPrincipalPaidTotal = Math.min(newTotalPaid, currentPrincipal);
    const principalPaidThisTx = Math.max(0, Math.round((newPrincipalPaidTotal - prevPrincipalPaid) * 100) / 100);
    const interestPaidThisTx = Math.max(0, Math.round((paymentAmount - principalPaidThisTx) * 100) / 100);

    const remainingPrincipal = Math.max(0, Math.round((currentPrincipal - newPrincipalPaidTotal) * 100) / 100);
    const remainingInterest = Math.max(0, Math.round((newRemainingBalance - remainingPrincipal) * 100) / 100);

    let paymentId = null;
    let paymentReceiptNo = null;

    if (paymentAmount > 0) {
      paymentReceiptNo = 'RCP-SET-' + txDate.replace(/-/g,'') + '-' + Math.random().toString(36).substring(2,7).toUpperCase();
      const paymentType = (newRemainingBalance <= 0) ? 'FINAL_SETTLEMENT' : 'PARTIAL';

      const [payRes] = await conn.query(
        `INSERT INTO payments (
          receipt_no, loan_id, customer_id, payment_type, amount, manual_interest, total_received, payment_date, payment_time, payment_mode,
          previous_paid, new_total_paid, remaining_balance, remarks, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'STAFF')`,
        [
          paymentReceiptNo,
          loanId,
          customerId,
          paymentType,
          paymentAmount,
          appliedManualInterest,
          paymentAmount,
          txDate,
          txTime,
          paymentMode,
          currentTotalPaid,
          newTotalPaid,
          newRemainingBalance,
          remarks || (paymentType === 'FINAL_SETTLEMENT' ? 'Final Settlement Payment' : 'Partial Settlement Payment')
        ]
      );

      paymentId = payRes.insertId;

      await conn.query(
        `INSERT INTO payment_allocations (payment_id, principal_paid, interest_paid, manual_interest_paid)
         VALUES (?, ?, ?, ?)`,
        [paymentId, principalPaidThisTx, interestPaidThisTx, appliedManualInterest]
      );

      const txType = (newRemainingBalance <= 0) ? 'FULL_PAYMENT' : 'PARTIAL_PAYMENT';
      await logTransaction(
        conn,
        customerId,
        loanId,
        txType,
        paymentAmount,
        0,
        paymentReceiptNo,
        remarks || `Settlement payment received: Rs ${paymentAmount.toFixed(2)}. Remaining: Rs ${newRemainingBalance.toFixed(2)}`,
        'STAFF'
      );
    }

    const isClosed = (newRemainingBalance <= 0);
    const closedDate = isClosed ? txDate : null;
    const loanStatus = isClosed ? 'CLOSED' : (newTotalPaid > 0 ? 'PARTIALLY_PAID' : loan.status);

    let receiptData = null;
    let receiptId = null;
    let receiptNo = paymentReceiptNo;
    let totalReleasedWeight = 0;
    let pledgedCollateral = [];

    if (isClosed) {
      const [cols] = await conn.query(`
        SELECT lgi.*, g.item_name, g.purity, g.weight
        FROM loan_gold_items lgi
        JOIN gold_items g ON lgi.gold_item_id = g.id
        WHERE lgi.loan_id = ? AND lgi.status = 'PLEDGED'
        FOR UPDATE
      `, [loanId]);
      pledgedCollateral = cols;

      for (const col of pledgedCollateral) {
        await conn.query("UPDATE loan_gold_items SET status = 'RELEASED', released_weight = pledged_weight, release_date = ? WHERE id = ?", [closedDate, col.id]);
        await conn.query("UPDATE gold_items SET status = 'RELEASED' WHERE id = ?", [col.gold_item_id]);
        totalReleasedWeight += parseFloat(col.pledged_weight || col.weight || 0);
      }

      const [existingRel] = await conn.query("SELECT id FROM partial_releases WHERE loan_id = ? AND release_type = 'FULL' LIMIT 1", [loanId]);
      let releaseId = existingRel.length > 0 ? existingRel[0].id : null;

      if (!releaseId) {
        const autoReleaseNo = 'REL-' + txDate.replace(/-/g,'') + '-' + Math.random().toString(36).substring(2,7).toUpperCase();
        const [relRes] = await conn.query(
          `INSERT INTO partial_releases (release_no, loan_id, customer_id, payment_id, release_type, total_weight_released, release_date, release_time, remarks, created_by)
           VALUES (?, ?, ?, ?, 'FULL', ?, ?, ?, 'Automatic full release upon loan settlement closure', 'STAFF')`,
          [autoReleaseNo, loanId, customerId, paymentId, totalReleasedWeight, closedDate, txTime]
        );
        releaseId = relRes.insertId;

        for (const col of pledgedCollateral) {
          await conn.query(
            `INSERT INTO release_items (release_id, gold_item_id, item_name, purity, weight)
             VALUES (?, ?, ?, ?, ?)`,
            [releaseId, col.gold_item_id, col.item_name, col.purity, col.weight]
          );
        }

        await logTransaction(conn, customerId, loanId, 'FULL_RELEASE', 0, totalReleasedWeight, loan.loan_no, `Full release of gold collateral (${totalReleasedWeight.toFixed(3)}g) upon closure`, 'STAFF');
      }

      await logTransaction(conn, customerId, loanId, 'LOAN_CLOSED', 0, 0, loan.loan_no, `Loan ${loan.loan_no} fully settled and closed`, 'STAFF');

      await conn.query(
        `INSERT INTO loan_status_history (loan_id, old_status, new_status, reason, changed_by)
         VALUES (?, ?, 'CLOSED', 'Full settlement completed', 'STAFF')`,
        [loanId, loan.status]
      );

      const closureReceiptNo = 'RCP-CLS-' + txDate.replace(/-/g,'') + '-' + String(loan.loan_no).replace(/[^a-zA-Z0-9]/g, '');
      receiptNo = closureReceiptNo;
      receiptData = {
        shop_name: 'GOLD & SILVER PAWN MANAGEMENT ERP',
        receipt_no: closureReceiptNo,
        receipt_type: 'CLOSURE',
        loan_no: loan.loan_no,
        loan_type: loan.loan_type,
        customer: {
          id: customer.id,
          customer_code: customer.customer_code,
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address
        },
        financial: {
          principal_amount: currentPrincipal,
          previous_interest: existingTotalInterest,
          manual_final_interest: newManualInterest,
          final_settlement_amount: finalSettlementAmount,
          total_paid: newTotalPaid,
          final_payment: paymentAmount,
          remaining_balance: 0.00,
          remaining_principal: 0.00,
          remaining_interest: 0.00,
          settlement_status: 'PAID IN FULL',
          loan_status: 'CLOSED'
        },
        collateral: pledgedCollateral,
        collateral_release_status: 'RELEASED',
        dates: {
          opened_date: loan.opened_date,
          closed_date: closedDate,
          generated_date: txDate
        }
      };

      const [rcpRes] = await conn.query(
        `INSERT INTO receipts (receipt_no, receipt_type, reference_id, customer_id, loan_id, receipt_data_json)
         VALUES (?, 'CLOSURE', ?, ?, ?, ?)`,
        [closureReceiptNo, loan.loan_no, customerId, loanId, JSON.stringify(receiptData)]
      );
      receiptId = rcpRes.insertId;
    } else if (paymentId > 0) {
      const [collateralRows] = await conn.query(`
        SELECT lgi.*, g.item_name, g.purity, g.weight
        FROM loan_gold_items lgi
        JOIN gold_items g ON lgi.gold_item_id = g.id
        WHERE lgi.loan_id = ?
      `, [loanId]);

      receiptData = {
        shop_name: 'GOLD & SILVER PAWN MANAGEMENT ERP',
        receipt_no: paymentReceiptNo,
        receipt_type: 'PAYMENT',
        loan_no: loan.loan_no,
        loan_type: loan.loan_type,
        customer: {
          id: customer.id,
          customer_code: customer.customer_code,
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address
        },
        financial: {
          principal_amount: currentPrincipal,
          total_interest: totalInterestCombined,
          manual_final_interest: newManualInterest,
          final_settlement_amount: finalSettlementAmount,
          payment_amount: paymentAmount,
          previous_paid: currentTotalPaid,
          total_paid: newTotalPaid,
          remaining_principal: remainingPrincipal,
          remaining_interest: remainingInterest,
          remaining_balance: newRemainingBalance,
          loan_status: loanStatus
        },
        collateral: collateralRows,
        collateral_release_status: 'PLEDGED',
        dates: {
          opened_date: loan.opened_date,
          payment_date: txDate
        }
      };

      const [rcpRes] = await conn.query(
        `INSERT INTO receipts (receipt_no, receipt_type, reference_id, customer_id, loan_id, receipt_data_json)
         VALUES (?, 'PAYMENT', ?, ?, ?, ?)`,
        [paymentReceiptNo, String(paymentId), customerId, loanId, JSON.stringify(receiptData)]
      );
      receiptId = rcpRes.insertId;
    }

    await conn.query(
      `UPDATE loans SET total_interest = ?, manual_final_interest = ?, total_due = ?, total_paid = ?, remaining_balance = ?, status = ?, closed_date = ? WHERE id = ?`,
      [newTotalInterest, newManualInterest, totalDue, newTotalPaid, newRemainingBalance, loanStatus, closedDate, loanId]
    );

    await conn.commit();
    conn.release();

    const [freshLoanRows] = await db.query('SELECT * FROM loans WHERE id = ?', [loanId]);
    const freshLoan = freshLoanRows[0] || {};
    freshLoan.remaining_principal = remainingPrincipal;
    freshLoan.remaining_interest = remainingInterest;

    return res.json({
      success: true,
      message: isClosed ? 'Loan settled and closed successfully' : 'Settlement payment recorded. Loan remains active.',
      data: {
        transaction_id: paymentId,
        receipt_id: receiptId,
        receipt_no: receiptNo,
        loan_id: loanId,
        loan_no: loan.loan_no,
        principal_amount: currentPrincipal,
        manual_final_interest: appliedManualInterest,
        total_manual_interest: newManualInterest,
        current_outstanding: currentOutstandingBefore,
        final_settlement_amount: finalSettlementAmount,
        payment_amount: paymentAmount,
        actual_payment_amount: paymentAmount,
        total_paid: newTotalPaid,
        remaining_principal: remainingPrincipal,
        remaining_interest: remainingInterest,
        total_remaining_balance: newRemainingBalance,
        remaining_balance: newRemainingBalance,
        loan_status: loanStatus,
        status: loanStatus,
        is_closed: isClosed,
        collateral_release_status: isClosed ? 'RELEASED' : 'PLEDGED',
        loan: freshLoan,
        receipt: receiptData
      }
    });

  } catch (err) {
    await conn.rollback();
    conn.release();
    return res.status(500).json({ success: false, message: 'Failed to process loan closure: ' + err.message, error: err.message });
  }
});

// ============================================================
// GET /loans/search_additional_customers (.php)
// ============================================================
router.get(['/search_additional_customers', '/search_additional_customers.php'], requirePermission('loan.view'), async (req, res) => {
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
          COUNT(DISTINCT l.id) AS existing_loans_count
      FROM customers c
      LEFT JOIN loans l ON l.customer_id = c.id
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
    return res.status(500).json({ success: false, message: 'Failed to search loan customers.', error: err.message });
  }
});

module.exports = router;
