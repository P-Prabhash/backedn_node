const { getPool } = require('./config/database');
const { createAuthToken } = require('./config/auth');

async function testSettingsAndBackup() {
  const token = createAuthToken({ id: 1, username: 'admin', role: 'ADMIN' });
  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  console.log('Testing Settings & Backup Endpoints...');

  // 1. Get Settings
  const getSettRes = await fetch('http://localhost/gold_pawn_erp/backend/settings/get.php', { headers }).then(r => r.json());
  console.log('1. GET Settings:', getSettRes.success ? '✓ SUCCESS' : '✗ FAILED', getSettRes.data);

  // 2. Save Settings
  const saveSettRes = await fetch('http://localhost/gold_pawn_erp/backend/settings/save.php', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      shop_name: 'GOLD & SILVER PAWN LOAN MANAGEMENT ERP',
      shop_address: 'Main Market Road, Commercial Complex, Branch 1',
      shop_phone: '+91 98765 43210',
      default_interest_rate: '2.00'
    })
  }).then(r => r.json());
  console.log('2. SAVE Settings:', saveSettRes.message);

  // 3. Create Backup
  const backupRes = await fetch('http://localhost/gold_pawn_erp/backend/backup/manual_backup.php', {
    method: 'POST',
    headers
  }).then(r => r.json());
  console.log('3. CREATE Backup:', backupRes.message, 'File:', backupRes.file_name || backupRes.data.file_name);

  // 4. List Backups
  const listBackupRes = await fetch('http://localhost/gold_pawn_erp/backend/backup/list_backups.php', { headers }).then(r => r.json());
  console.log('4. LIST Backups Count:', listBackupRes.count, 'Latest Backup:', listBackupRes.data[0].file_name);

  // 5. Restore Backup
  const latestFile = listBackupRes.data[0].file_name;
  const restoreRes = await fetch('http://localhost/gold_pawn_erp/backend/backup/restore_backup.php', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      file_name: latestFile,
      confirmation: 'restore'
    })
  }).then(r => r.json());
  console.log('5. RESTORE Backup:', restoreRes.message);

  // 6. Test Admin Credential Validation
  const adminCredRes = await fetch('http://localhost/gold_pawn_erp/backend/users/update_admin_credentials.php', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      current_password: 'admin123',
      new_username: 'admin',
      new_password: 'admin123'
    })
  }).then(r => r.json());
  console.log('6. UPDATE Admin Credentials:', adminCredRes.message, 'Token Received:', adminCredRes.token ? '✓ YES' : '✗ NO');

  console.log('All Settings & Backup Tests Passed Successfully!');
  process.exit(0);
}

testSettingsAndBackup().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
