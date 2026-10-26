const { getPool } = require('./config/database');

async function testUserActions() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3OTI2NDkzNDMsImV4cCI6MTc5MjczNTc0M30.Hg_TUjz4QIt7hPRWiV6DkV2PxytLS_671gXdJsdJDhk';
  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  console.log('Testing User Management Actions...');

  // 1. Get User Details
  const getRes = await fetch('http://localhost/gold_pawn_erp/backend/users/get.php?user_id=3', { headers }).then(r => r.json());
  console.log('1. GET User Details (ID 3 - Rajesh Sharma):', getRes.success ? '✓ SUCCESS' : '✗ FAILED');

  // 2. Edit User
  const updateRes = await fetch('http://localhost/gold_pawn_erp/backend/users/update.php', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: 3,
      full_name: 'Rajesh Sharma',
      mobile: '9800000002',
      email: 'rajesh@goldpawn.com'
    })
  }).then(r => r.json());
  console.log('2. EDIT User:', updateRes.message);

  // 3. Reset Password
  const resetRes = await fetch('http://localhost/gold_pawn_erp/backend/users/reset_password.php', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: 3,
      new_password: 'Password@123'
    })
  }).then(r => r.json());
  console.log('3. RESET Password:', resetRes.message);

  // 4. Manage Permissions
  const permRes = await fetch('http://localhost/gold_pawn_erp/backend/users/update_permissions.php', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: 3,
      permissions: ['loan_view', 'loan_create', 'payment_view', 'payment_create']
    })
  }).then(r => r.json());
  console.log('4. UPDATE Permissions:', permRes.message);

  // 5. Toggle Status
  const statusRes = await fetch('http://localhost/gold_pawn_erp/backend/users/toggle_status.php', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: 3,
      status: 'ACTIVE'
    })
  }).then(r => r.json());
  console.log('5. TOGGLE Status:', statusRes.message);

  console.log('All User Management Action Tests Completed Successfully!');
  process.exit(0);
}

testUserActions().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
