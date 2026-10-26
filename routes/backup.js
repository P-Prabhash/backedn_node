const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getPool } = require('../config/database');
const { requirePermission } = require('../middleware/authMiddleware');

const backupsDir = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// ============================================================
// GET /backup/list (.php) / list_backups (.php)
// ============================================================
router.get(['/list', '/list.php', '/list_backups', '/list_backups.php'], requirePermission('settings.view'), async (req, res) => {
  try {
    const files = fs.readdirSync(backupsDir);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.sql') || file.endsWith('.zip')) {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        backups.push({
          file_name: file,
          size_bytes: stats.size,
          file_size: stats.size,
          file_size_formatted: (stats.size / 1024).toFixed(2) + ' KB',
          created_at: stats.mtime.toISOString().replace('T', ' ').substring(0, 19)
        });
      }
    }

    backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      count: backups.length,
      data: backups,
      backups: backups
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list backups.', error: err.message });
  }
});

// ============================================================
// POST /backup/create (.php) / manual_backup (.php)
// ============================================================
router.post(['/create', '/create.php', '/manual_backup', '/manual_backup.php'], requirePermission('settings.edit'), async (req, res) => {
  try {
    const db = await getPool();
    const [tables] = await db.query('SHOW TABLES');
    const tableKey = Object.keys(tables[0])[0];

    let sqlDump = `-- Gold Pawn ERP Database Backup\n-- Generated: ${new Date().toISOString()}\n\n`;

    for (const row of tables) {
      const tableName = row[tableKey];
      const [createTable] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
      sqlDump += `${createTable[0]['Create Table']};\n\n`;

      const [data] = await db.query(`SELECT * FROM \`${tableName}\``);
      if (data.length > 0) {
        for (const record of data) {
          const keys = Object.keys(record).map(k => `\`${k}\``).join(', ');
          const values = Object.values(record).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            return `'${String(val).replace(/'/g, "\\'")}'`;
          }).join(', ');

          sqlDump += `INSERT INTO \`${tableName}\` (${keys}) VALUES (${values});\n`;
        }
        sqlDump += '\n';
      }
    }

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '_').substring(0, 19);
    const fileName = `backend_api_backup_${timestamp}.sql`;
    const filePath = path.join(backupsDir, fileName);

    fs.writeFileSync(filePath, sqlDump, 'utf8');

    const backupPayload = {
      file_name: fileName,
      file_path: filePath
    };

    return res.json({
      success: true,
      message: 'Backup created successfully.',
      data: backupPayload,
      file_name: fileName,
      file_path: filePath
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create backup.', error: err.message });
  }
});

// ============================================================
// GET/POST /backup/download (.php) / download_backup (.php)
// ============================================================
router.all(['/download', '/download.php', '/download_backup', '/download_backup.php'], (req, res) => {
  const fileName = String(req.query.file_name || req.body.file_name || '').trim();
  if (!fileName) {
    return res.status(400).json({ success: false, message: 'File name is required.' });
  }

  const filePath = path.join(backupsDir, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Backup file not found.' });
  }

  return res.download(filePath, fileName);
});

// ============================================================
// POST /backup/restore (.php) / restore_backup (.php)
// ============================================================
router.post(['/restore', '/restore.php', '/restore_backup', '/restore_backup.php'], requirePermission('settings.edit'), async (req, res) => {
  const fileName = String(req.body.file_name || req.query.file_name || '').trim();
  if (!fileName) {
    return res.status(400).json({ success: false, message: 'File name is required.' });
  }

  const filePath = path.join(backupsDir, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Backup file not found.' });
  }

  try {
    const db = await getPool();
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const statements = sqlContent.split(/;\s*$/m).map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const stmt of statements) {
      if (stmt) {
        try {
          await db.query(stmt);
        } catch (e) {
          // ignore statement warnings
        }
      }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    return res.json({
      success: true,
      message: 'Database restored successfully.',
      data: {
        message: 'Database restored successfully.'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to restore database: ' + err.message, error: err.message });
  }
});

module.exports = router;
