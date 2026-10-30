const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let pool = null;
let schemaInitialized = false;

async function getPool() {
  if (pool && schemaInitialized) return pool;

  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASS !== undefined ? process.env.DB_PASS : '';
  const dbName = process.env.DB_NAME || 'backend_api';

  // Determine SSL requirement for cloud databases like Aiven MySQL
  const isRemote = dbHost && !['127.0.0.1', 'localhost', '0.0.0.0'].includes(dbHost);
  const sslEnv = (process.env.DB_SSL || '').toLowerCase();
  const useSsl = sslEnv === 'true' || sslEnv === '1' || (sslEnv !== 'false' && sslEnv !== '0' && isRemote);

  let sslOptions = undefined;
  if (useSsl) {
    let caCert = null;
    const possibleCaPaths = [
      process.env.DB_SSL_CA_PATH,
      path.join(__dirname, '../certs/ca.pem'),
      path.join(__dirname, '../../certs/ca.pem'),
      path.join(process.cwd(), 'certs/ca.pem'),
      path.join(process.cwd(), 'backend-node/certs/ca.pem')
    ];
    for (const p of possibleCaPaths) {
      if (p && fs.existsSync(p)) {
        try {
          caCert = fs.readFileSync(p);
          console.log(`[DATABASE SSL] Loaded CA certificate from: ${p}`);
          break;
        } catch (e) {
          // ignore
        }
      }
    }

    sslOptions = {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
      ...(caCert ? { ca: caCert } : {})
    };
  }

  // Step 1: Connect to MySQL Server without specifying DB to ensure DB exists (skip if cloud permissions prevent it)
  try {
    const tempConfig = {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPass,
      connectTimeout: 10000,
    };
    if (sslOptions) {
      tempConfig.ssl = sslOptions;
    }

    const tempConnection = await mysql.createConnection(tempConfig);
    await tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await tempConnection.end();
  } catch (err) {
    console.warn(`[DATABASE NOTICE] Database auto-creation check skipped: ${err.message}. Connecting directly to database '${dbName}'...`);
  }

  // Step 2: Create connection pool to target database
  if (!pool) {
    const poolConfig = {
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPass,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
    };
    if (sslOptions) {
      poolConfig.ssl = sslOptions;
    }

    pool = mysql.createPool(poolConfig);
  }

  // Step 3: Ensure Schema & Tables are initialized automatically
  if (!schemaInitialized) {
    await ensureSchema(pool);
    schemaInitialized = true;
  }

  return pool;
}

async function ensureSchema(dbPool) {
  try {
    console.log('[DATABASE] Checking and initializing database tables schema...');

    const ddlQueries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        mobile VARCHAR(30) NULL,
        email VARCHAR(255) NULL,
        employee_id VARCHAR(50) NULL,
        department VARCHAR(100) NULL,
        designation VARCHAR(100) NULL,
        role ENUM('ADMIN', 'STAFF') DEFAULT 'STAFF',
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        failed_login_attempts INT NOT NULL DEFAULT 0,
        locked_until DATETIME NULL,
        last_login_at DATETIME NULL,
        last_login_ip VARCHAR(45) NULL,
        last_login_device VARCHAR(255) NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_username (username),
        INDEX idx_users_mobile (mobile),
        INDEX idx_users_email (email),
        INDEX idx_users_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_code VARCHAR(30) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        aadhaar_number VARCHAR(20) NULL,
        pan_number VARCHAR(20) NULL,
        photo_url VARCHAR(255) NULL,
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_mobile (mobile),
        INDEX idx_customer_code (customer_code),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS gold_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        item_name VARCHAR(150) NOT NULL,
        purity VARCHAR(20) NOT NULL DEFAULT '22K',
        weight DECIMAL(8,3) NOT NULL,
        remarks TEXT NULL,
        locker_no VARCHAR(50) DEFAULT NULL,
        photo_url VARCHAR(255) NULL,
        status ENUM('AVAILABLE', 'PLEDGED', 'RELEASED', 'PARTIALLY_RELEASED') DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        INDEX idx_status (status),
        INDEX idx_customer (customer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS loans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_no VARCHAR(30) NOT NULL UNIQUE,
        manual_loan_no VARCHAR(50) NULL,
        customer_id INT NOT NULL,
        loan_type ENUM('NEW_LOAN', 'EXISTING_LOAN', 'ADDITIONAL_LOAN') DEFAULT 'NEW_LOAN',
        opened_date DATE NOT NULL,
        manual_opened_date DATE NULL,
        closed_date DATE NULL,
        manual_closed_date DATE NULL,
        principal_amount DECIMAL(12,2) NOT NULL,
        monthly_interest_rate DECIMAL(5,2) NOT NULL DEFAULT 2.00,
        interest_type VARCHAR(50) DEFAULT 'MONTHLY_SIMPLE',
        total_interest DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        manual_final_interest DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_due DECIMAL(12,2) NOT NULL,
        total_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        remaining_balance DECIMAL(12,2) NOT NULL,
        status ENUM('ACTIVE', 'CLOSED', 'PARTIALLY_PAID', 'PARTIALLY_RELEASED') DEFAULT 'ACTIVE',
        remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        INDEX idx_status (status),
        INDEX idx_opened_date (opened_date),
        INDEX idx_customer (customer_id),
        INDEX idx_loan_no (loan_no),
        INDEX idx_manual_loan_no (manual_loan_no)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS loan_gold_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_id INT NOT NULL,
        gold_item_id INT NOT NULL,
        pledged_weight DECIMAL(8,3) NOT NULL,
        released_weight DECIMAL(8,3) NOT NULL DEFAULT 0.000,
        status ENUM('PLEDGED', 'RELEASED') DEFAULT 'PLEDGED',
        pledge_date DATE NOT NULL,
        release_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
        FOREIGN KEY (gold_item_id) REFERENCES gold_items(id) ON DELETE RESTRICT,
        INDEX idx_loan (loan_id),
        INDEX idx_gold (gold_item_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS interest_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_id INT NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        monthly_rate DECIMAL(5,2) NOT NULL,
        interest_amount DECIMAL(12,2) NOT NULL,
        is_manual TINYINT(1) DEFAULT 0,
        remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
        INDEX idx_loan (loan_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        receipt_no VARCHAR(50) NOT NULL UNIQUE,
        loan_id INT NOT NULL,
        customer_id INT NOT NULL,
        payment_type ENUM('NORMAL', 'PARTIAL', 'FINAL_SETTLEMENT', 'RELEASE_PAYMENT') DEFAULT 'PARTIAL',
        amount DECIMAL(12,2) NOT NULL,
        manual_interest DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        total_received DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        payment_date DATE NOT NULL,
        payment_time TIME NOT NULL,
        payment_mode ENUM('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE') DEFAULT 'CASH',
        previous_paid DECIMAL(12,2) NOT NULL,
        new_total_paid DECIMAL(12,2) NOT NULL,
        remaining_balance DECIMAL(12,2) NOT NULL,
        remarks TEXT NULL,
        created_by VARCHAR(50) DEFAULT 'STAFF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        INDEX idx_loan (loan_id),
        INDEX idx_customer (customer_id),
        INDEX idx_date (payment_date),
        INDEX idx_type (payment_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS payment_allocations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        payment_id INT NOT NULL,
        principal_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        interest_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        manual_interest_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS partial_releases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        release_no VARCHAR(50) NOT NULL UNIQUE,
        loan_id INT NOT NULL,
        customer_id INT NOT NULL,
        payment_id INT NULL,
        release_type VARCHAR(50) NOT NULL DEFAULT 'PARTIAL',
        total_weight_released DECIMAL(8,3) NOT NULL,
        release_date DATE NOT NULL,
        release_time TIME NOT NULL,
        remarks TEXT NULL,
        created_by VARCHAR(50) DEFAULT 'STAFF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
        INDEX idx_loan (loan_id),
        INDEX idx_customer (customer_id),
        INDEX idx_date (release_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS release_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        release_id INT NOT NULL,
        gold_item_id INT NOT NULL,
        item_name VARCHAR(150) NOT NULL,
        purity VARCHAR(20) NOT NULL,
        weight DECIMAL(8,3) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (release_id) REFERENCES partial_releases(id) ON DELETE CASCADE,
        FOREIGN KEY (gold_item_id) REFERENCES gold_items(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS loan_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_code VARCHAR(50) NOT NULL UNIQUE,
        customer_id INT NOT NULL,
        loan_id INT NOT NULL,
        transaction_type ENUM(
            'LOAN_CREATED', 'EXISTING_LOAN_CREATED', 'ADDITIONAL_LOAN',
            'PAYMENT', 'PARTIAL_PAYMENT', 'FULL_PAYMENT',
            'INTEREST_CALCULATION', 'FINAL_MANUAL_INTEREST', 'FINAL_SETTLEMENT',
            'PARTIAL_RELEASE', 'FULL_RELEASE', 'LOAN_CLOSED',
            'PAYMENT_REVERSAL', 'RELEASE_REVERSAL'
        ) NOT NULL,
        amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        weight DECIMAL(8,3) NOT NULL DEFAULT 0.000,
        reference_id VARCHAR(50) NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        created_by VARCHAR(50) DEFAULT 'STAFF',
        remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
        INDEX idx_tx_type (transaction_type),
        INDEX idx_tx_date (date),
        INDEX idx_customer (customer_id),
        INDEX idx_loan (loan_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS loan_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loan_id INT NOT NULL,
        old_status VARCHAR(50) NOT NULL,
        new_status VARCHAR(50) NOT NULL,
        reason TEXT NULL,
        changed_by VARCHAR(50) DEFAULT 'STAFF',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS receipts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        receipt_no VARCHAR(50) NOT NULL UNIQUE,
        receipt_type ENUM('LOAN', 'PAYMENT', 'PARTIAL_RELEASE', 'FULL_RELEASE', 'CLOSURE') NOT NULL,
        reference_id VARCHAR(50) NOT NULL,
        customer_id INT NOT NULL,
        loan_id INT NOT NULL,
        receipt_data_json JSON NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
        FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
        INDEX idx_receipt_no (receipt_no),
        INDEX idx_type (receipt_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_code VARCHAR(50) NOT NULL UNIQUE,
        role_name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL,
        is_system_role TINYINT(1) NOT NULL DEFAULT 0,
        status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        permission_code VARCHAR(100) NOT NULL UNIQUE,
        permission_name VARCHAR(150) NOT NULL,
        module_name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_role_permission (role_id, permission_id),
        CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS user_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        assigned_by INT NULL,
        assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_role (user_id, role_id),
        CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        permission_id INT NOT NULL,
        assigned_by INT NULL,
        assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_permission (user_id, permission_id),
        CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_permissions_admin FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS login_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(100) NOT NULL,
        login_status ENUM('SUCCESS', 'FAILED', 'LOCKED', 'LOGOUT') NOT NULL,
        ip_address VARCHAR(45) NULL,
        device_info VARCHAR(255) NULL,
        user_agent TEXT NULL,
        failure_reason VARCHAR(255) NULL,
        login_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        logout_at DATETIME NULL,
        session_id VARCHAR(128) NULL,
        INDEX idx_login_user (user_id),
        INDEX idx_login_username (username),
        INDEX idx_login_status (login_status),
        INDEX idx_login_date (login_at),
        CONSTRAINT fk_login_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS user_sessions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        device_info VARCHAR(255) NULL,
        ip_address VARCHAR(45) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        status ENUM('ACTIVE', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
        INDEX idx_session_user (user_id),
        INDEX idx_session_status (status),
        CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS audit_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(100) NULL,
        action VARCHAR(100) NOT NULL,
        module_name VARCHAR(100) NOT NULL,
        reference_type VARCHAR(100) NULL,
        reference_id VARCHAR(100) NULL,
        old_data JSON NULL,
        new_data JSON NULL,
        description TEXT NULL,
        ip_address VARCHAR(45) NULL,
        device_info VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_user (user_id),
        INDEX idx_audit_module (module_name),
        INDEX idx_audit_action (action),
        INDEX idx_audit_reference (reference_type, reference_id),
        INDEX idx_audit_date (created_at),
        CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS admin_registration_otps (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        verified TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_admin_otp_email (email),
        INDEX idx_admin_otp_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `INSERT INTO settings (setting_key, setting_value) VALUES
      ('shop_name', 'GOLD & SILVER PAWN LOAN MANAGEMENT'),
      ('shop_address', 'Main Market Road, Commercial Complex'),
      ('shop_phone', '+91 98765 43210'),
      ('default_interest_rate', '2.00')
      ON DUPLICATE KEY UPDATE setting_key = VALUES(setting_key)`,

      `INSERT INTO roles (role_code, role_name, description, is_system_role, status) VALUES
      ('SUPER_ADMIN', 'Super Administrator', 'Complete ERP access including security and system administration.', 1, 'ACTIVE'),
      ('ADMIN', 'Administrator', 'Full operational ERP access and user management.', 1, 'ACTIVE'),
      ('MANAGER', 'Manager', 'Branch management and approval access.', 1, 'ACTIVE'),
      ('LOAN_OFFICER', 'Loan Officer', 'Customer, gold and loan operations.', 1, 'ACTIVE'),
      ('CASHIER', 'Cashier', 'Payment and receipt operations.', 1, 'ACTIVE'),
      ('GOLD_APPRAISER', 'Gold Appraiser', 'Gold collateral assessment and inventory operations.', 1, 'ACTIVE'),
      ('STAFF', 'Staff', 'Basic operational access.', 1, 'ACTIVE'),
      ('VIEWER', 'Viewer', 'Read-only ERP access.', 1, 'ACTIVE')
      ON DUPLICATE KEY UPDATE role_name = VALUES(role_name), description = VALUES(description)`,

      `INSERT INTO permissions (permission_code, permission_name, module_name, description) VALUES
      ('dashboard.view', 'View Dashboard', 'Dashboard', 'View ERP dashboard and KPIs.'),
      ('customer.view', 'View Customers', 'Customers', 'View customer records.'),
      ('customer.create', 'Create Customer', 'Customers', 'Create new customer.'),
      ('customer.edit', 'Edit Customer', 'Customers', 'Edit customer information.'),
      ('customer.delete', 'Delete Customer', 'Customers', 'Delete/deactivate customer.'),
      ('gold.view', 'View Gold Items', 'Gold', 'View gold collateral.'),
      ('gold.create', 'Create Gold Item', 'Gold', 'Add gold collateral.'),
      ('gold.edit', 'Edit Gold Item', 'Gold', 'Edit gold collateral.'),
      ('gold.delete', 'Delete Gold Item', 'Gold', 'Delete gold item.'),
      ('loan.view', 'View Loans', 'Loans', 'View pawn loans.'),
      ('loan.create', 'Create Loan', 'Loans', 'Create new pawn loan.'),
      ('loan.edit', 'Edit Loan', 'Loans', 'Edit loan information.'),
      ('loan.additional', 'Create Additional Loan', 'Loans', 'Create additional loan.'),
      ('loan.existing', 'Create Existing Loan', 'Loans', 'Register historical existing loan.'),
      ('loan.close', 'Close Loan', 'Loans', 'Close and settle loan.'),
      ('loan.approve', 'Approve Loan', 'Loans', 'Approve loan operation.'),
      ('payment.view', 'View Payments', 'Payments', 'View payments.'),
      ('payment.create', 'Create Payment', 'Payments', 'Record payment.'),
      ('payment.edit', 'Edit Payment', 'Payments', 'Edit payment.'),
      ('payment.approve', 'Approve Payment', 'Payments', 'Approve payment.'),
      ('release.view', 'View Releases', 'Releases', 'View gold releases.'),
      ('release.create', 'Create Partial Release', 'Releases', 'Create partial gold release.'),
      ('release.approve', 'Approve Release', 'Releases', 'Approve gold release.'),
      ('receipt.view', 'View Receipts', 'Receipts', 'View receipts.'),
      ('receipt.print', 'Print Receipts', 'Receipts', 'Print official A4 receipts.'),
      ('report.view', 'View Reports', 'Reports', 'View financial reports.'),
      ('report.export', 'Export Reports', 'Reports', 'Export reports.'),
      ('settings.view', 'View Settings', 'Settings', 'View ERP settings.'),
      ('settings.edit', 'Edit Settings', 'Settings', 'Modify ERP settings.'),
      ('user.view', 'View Users', 'User Management', 'View system users.'),
      ('user.create', 'Create User', 'User Management', 'Create system user.'),
      ('user.edit', 'Edit User', 'User Management', 'Edit system user.'),
      ('user.delete', 'Delete User', 'User Management', 'Deactivate system user.'),
      ('user.reset_password', 'Reset Password', 'User Management', 'Reset another users password.'),
      ('user.manage_roles', 'Manage Roles', 'User Management', 'Assign roles to users.'),
      ('user.manage_permissions', 'Manage Permissions', 'User Management', 'Manage role permissions.'),
      ('security.login_logs', 'View Login Logs', 'Security', 'View login activity.'),
      ('security.audit_logs', 'View Audit Logs', 'Security', 'View audit trail.'),
      ('security.sessions', 'Manage Sessions', 'Security', 'View and revoke user sessions.')
      ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name), module_name = VALUES(module_name)`
    ];

    for (const sql of ddlQueries) {
      try {
        await dbPool.query(sql);
      } catch (sqlErr) {
        console.warn(`[DATABASE DDL WARNING] ${sqlErr.message}`);
      }
    }

    await ensureUserColumns(dbPool);

    // Auto-seed/ensure Admin user exists with default credentials (admin / admin123)
    try {
      const bcrypt = require('bcryptjs');
      const defaultHash = bcrypt.hashSync('admin123', 10);

      const [existingAdmins] = await dbPool.query("SELECT id, username, password_hash, role, status FROM users WHERE LOWER(username) = 'admin' OR role = 'ADMIN' LIMIT 1");

      if (existingAdmins.length === 0) {
        const [adminInsert] = await dbPool.query(
          `INSERT INTO users (username, password_hash, full_name, role, status, created_at, updated_at)
           VALUES ('admin', ?, 'System Administrator', 'ADMIN', 'ACTIVE', NOW(), NOW())`,
          [defaultHash]
        );

        const adminId = adminInsert.insertId;
        const [roles] = await dbPool.query("SELECT id FROM roles WHERE role_code = 'ADMIN'");
        if (roles.length > 0) {
          await dbPool.query("INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by) VALUES (?, ?, ?)", [adminId, roles[0].id, adminId]);
        }
        console.log('[DATABASE] Seeded default Admin user (Username: admin | Password: admin123)');
      } else {
        const adminUser = existingAdmins[0];
        // Ensure admin user is ACTIVE, has role ADMIN, and password hash is set to admin123
        if (!adminUser.password_hash || bcrypt.compareSync('admin', adminUser.password_hash) || adminUser.password_hash === 'admin') {
          await dbPool.query(
            "UPDATE users SET password_hash = ?, role = 'ADMIN', status = 'ACTIVE' WHERE id = ?",
            [defaultHash, adminUser.id]
          );
          console.log(`[DATABASE] Reset Admin account password strictly to admin123: '${adminUser.username}'`);
        } else {
          await dbPool.query(
            "UPDATE users SET role = 'ADMIN', status = 'ACTIVE' WHERE id = ?",
            [adminUser.id]
          );
          console.log(`[DATABASE] Verified Admin account: '${adminUser.username}' (Status: ACTIVE)`);
        }
      }
    } catch (adminErr) {
      console.warn(`[DATABASE SEED WARNING] Admin user check/seed: ${adminErr.message}`);
    }

    console.log('[DATABASE] All tables and schemas verified and initialized successfully.');
  } catch (err) {
    console.error("[DATABASE] Schema initialization error:", err.message);
  }
}

async function ensureUserColumns(dbPool) {
  try {
    const [cols] = await dbPool.query("SHOW COLUMNS FROM users");
    const existing = cols.map(c => c.Field.toLowerCase());

    const missingCols = {
      mobile: "ALTER TABLE users ADD COLUMN mobile VARCHAR(30) NULL AFTER full_name",
      email: "ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER mobile",
      employee_id: "ALTER TABLE users ADD COLUMN employee_id VARCHAR(50) NULL AFTER email",
      department: "ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL AFTER employee_id",
      designation: "ALTER TABLE users ADD COLUMN designation VARCHAR(100) NULL AFTER department",
      failed_login_attempts: "ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0 AFTER status",
      locked_until: "ALTER TABLE users ADD COLUMN locked_until DATETIME NULL AFTER failed_login_attempts",
      last_login_at: "ALTER TABLE users ADD COLUMN last_login_at DATETIME NULL AFTER locked_until",
      last_login_ip: "ALTER TABLE users ADD COLUMN last_login_ip VARCHAR(45) NULL AFTER last_login_at",
      last_login_device: "ALTER TABLE users ADD COLUMN last_login_device VARCHAR(255) NULL AFTER last_login_ip",
      created_by: "ALTER TABLE users ADD COLUMN created_by INT NULL AFTER last_login_device"
    };

    for (const [col, alterSql] of Object.entries(missingCols)) {
      if (!existing.includes(col.toLowerCase())) {
        try {
          await dbPool.query(alterSql);
        } catch (e) {
          // ignore
        }
      }
    }

    // Ensure Payments Columns
    try {
      const [pmtCols] = await dbPool.query("SHOW COLUMNS FROM payments");
      const existingPmtCols = pmtCols.map(c => c.Field.toLowerCase());
      if (!existingPmtCols.includes('manual_interest')) {
        await dbPool.query("ALTER TABLE payments ADD COLUMN manual_interest DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER amount");
      }
      if (!existingPmtCols.includes('total_received')) {
        await dbPool.query("ALTER TABLE payments ADD COLUMN total_received DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER manual_interest");
      }
    } catch (e) {
      // ignore
    }

    // Ensure Partial Releases Columns
    try {
      const [relCols] = await dbPool.query("SHOW COLUMNS FROM partial_releases");
      const existingRelCols = relCols.map(c => c.Field.toLowerCase());
      if (!existingRelCols.includes('release_type')) {
        await dbPool.query("ALTER TABLE partial_releases ADD COLUMN release_type VARCHAR(50) NOT NULL DEFAULT 'PARTIAL' AFTER payment_id");
      }
    } catch (e) {
      // ignore
    }

    // Ensure Gold Items Columns
    try {
      const [goldCols] = await dbPool.query("SHOW COLUMNS FROM gold_items");
      const existingGoldCols = goldCols.map(c => c.Field.toLowerCase());
      if (!existingGoldCols.includes('locker_no')) {
        await dbPool.query("ALTER TABLE gold_items ADD COLUMN locker_no VARCHAR(50) DEFAULT NULL AFTER remarks");
      }
    } catch (e) {
      // ignore
    }

    // Ensure Loans Columns
    try {
      const [loanCols] = await dbPool.query("SHOW COLUMNS FROM loans");
      const existingLoanCols = loanCols.map(c => c.Field.toLowerCase());
      if (!existingLoanCols.includes('manual_final_interest')) {
        await dbPool.query("ALTER TABLE loans ADD COLUMN manual_final_interest DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER total_interest");
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}

module.exports = {
  getPool
};
