require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./config/database');

async function seed() {
  console.log('🔄 Inicializando base de datos...');

  // Evitar DROP TABLE para no perder datos en producción
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saas_plans (
      id           SERIAL PRIMARY KEY,
      name         VARCHAR(50) UNIQUE NOT NULL,
      price        NUMERIC(10,2) NOT NULL DEFAULT 0,
      max_sedes    INT NOT NULL DEFAULT 1,
      max_users    INT NOT NULL DEFAULT 5,
      features     JSONB DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id                  SERIAL PRIMARY KEY,
      plan_id             INT REFERENCES saas_plans(id),
      name                VARCHAR(255) NOT NULL,
      document_id         VARCHAR(50),
      contact_email       VARCHAR(255),
      phone               VARCHAR(50),
      subscription_status VARCHAR(20) DEFAULT 'TRIAL',
      subscription_start  TIMESTAMP,
      subscription_end    TIMESTAMP,
      plan_template       VARCHAR(20),
      trial_ends_at       TIMESTAMP,
      is_active           BOOLEAN DEFAULT TRUE,
      created_at          TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sedes (
      id           SERIAL PRIMARY KEY,
      tenant_id    INT REFERENCES tenants(id) ON DELETE CASCADE,
      name         VARCHAR(255) NOT NULL,
      address      VARCHAR(255),
      capacity     INT DEFAULT 50,
      is_active    BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS users (
      id           SERIAL PRIMARY KEY,
      tenant_id    INT REFERENCES tenants(id) ON DELETE CASCADE,
      sede_id      INT REFERENCES sedes(id) ON DELETE SET NULL,
      email        VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name         VARCHAR(255) NOT NULL,
      role         VARCHAR(50) NOT NULL, -- SUPERADMIN, ADMIN_TENANT, CAJERO
      is_active    BOOLEAN DEFAULT TRUE,
      created_at   TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id             SERIAL PRIMARY KEY,
      sede_id        INT REFERENCES sedes(id) NOT NULL,
      plate          VARCHAR(20) NOT NULL,
      type           VARCHAR(30) NOT NULL,
      entry_at       TIMESTAMP NOT NULL DEFAULT NOW(),
      exit_at        TIMESTAMP,
      minutes_parked INT,
      amount         NUMERIC(12,2),
      status         VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
      created_by     INT REFERENCES users(id),
      client_name    VARCHAR(255),
      client_doc     VARCHAR(50),
      invoice_num    VARCHAR(50),
      rate_snapshot  JSONB
    );

    CREATE TABLE IF NOT EXISTS tenant_config (
      tenant_id      INT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
      commercial_name VARCHAR(255),
      logo_base64    TEXT
    );

    CREATE TABLE IF NOT EXISTS parking_rates (
      id             SERIAL PRIMARY KEY,
      tenant_id      INT REFERENCES tenants(id) ON DELETE CASCADE,
      vehicle_type   VARCHAR(30) NOT NULL,
      rate_type      VARCHAR(30) NOT NULL,
      amount         NUMERIC(10,2) NOT NULL,
      UNIQUE(tenant_id, vehicle_type, rate_type)
    );

    CREATE TABLE IF NOT EXISTS cash_shifts (
      id               SERIAL PRIMARY KEY,
      tenant_id        INT REFERENCES tenants(id) ON DELETE CASCADE,
      sede_id          INT REFERENCES sedes(id) ON DELETE CASCADE,
      user_id          INT REFERENCES users(id),
      start_time       TIMESTAMP NOT NULL DEFAULT NOW(),
      end_time         TIMESTAMP,
      starting_cash    NUMERIC(12,2) NOT NULL DEFAULT 0,
      expected_cash    NUMERIC(12,2),
      actual_cash      NUMERIC(12,2),
      difference       NUMERIC(12,2),
      status           VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id               SERIAL PRIMARY KEY,
      tenant_id        INT REFERENCES tenants(id) ON DELETE CASCADE,
      sede_id          INT REFERENCES sedes(id) ON DELETE CASCADE,
      client_name      VARCHAR(255) NOT NULL,
      document_id      VARCHAR(50),
      plate            VARCHAR(20) NOT NULL,
      vehicle_type     VARCHAR(30) NOT NULL,
      start_date       TIMESTAMP NOT NULL,
      end_date         TIMESTAMP NOT NULL,
      amount_paid      NUMERIC(10,2) NOT NULL DEFAULT 0,
      status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at       TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS cash_expenses (
      id               SERIAL PRIMARY KEY,
      tenant_id        INT REFERENCES tenants(id) ON DELETE CASCADE,
      sede_id          INT REFERENCES sedes(id) ON DELETE CASCADE,
      shift_id         INT REFERENCES cash_shifts(id) ON DELETE CASCADE,
      user_id          INT REFERENCES users(id),
      description      VARCHAR(255) NOT NULL,
      amount           NUMERIC(10,2) NOT NULL,
      created_at       TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS parking_spots (
      id           SERIAL PRIMARY KEY,
      sede_id      INT REFERENCES sedes(id) ON DELETE CASCADE,
      tenant_id    INT REFERENCES tenants(id) ON DELETE CASCADE,
      spot_code    VARCHAR(20) NOT NULL,
      row_pos      INT NOT NULL,
      col_pos      INT NOT NULL,
      spot_type    VARCHAR(30) NOT NULL DEFAULT 'CARRO',
      is_active    BOOLEAN DEFAULT TRUE,
      UNIQUE(sede_id, row_pos, col_pos)
    );
  `);

  // Asegurar que las columnas nuevas existan en tickets en caso de que la tabla ya existiera
  await pool.query(`
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS client_doc VARCHAR(50);
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS invoice_num VARCHAR(50);
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rate_snapshot JSONB;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP;
    ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan_template VARCHAR(20);
    ALTER TABLE tickets ADD COLUMN IF NOT EXISTS spot_id INT REFERENCES parking_spots(id) ON DELETE SET NULL;
  `, []);

  // --- 0. SaaS Plans ---
  await pool.query(
    "INSERT INTO saas_plans (name, price, max_sedes, max_users) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING",
    ['CORE', 29000, 1, 5]
  );
  await pool.query(
    "INSERT INTO saas_plans (name, price, max_sedes, max_users) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING",
    ['PRO', 79000, 3, 15]
  );
  const planRes = await pool.query(
    "INSERT INTO saas_plans (name, price, max_sedes, max_users) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price RETURNING id",
    ['ENTERPRISE', 199000, 10, 50]
  );
  const enterprisePlanId = planRes.rows[0].id;

  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. SuperAdmin (Dueño del software) - Sin tenant ni sede
  await pool.query(
    'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
    ['super@parkos.io', passwordHash, 'Master Admin', 'SUPERADMIN']
  );

  // 2. Tenant de prueba
  let tenantRes = await pool.query("SELECT id FROM tenants WHERE contact_email = $1", ['gerencia@premium.com']);
  if (tenantRes.rows.length === 0) {
    tenantRes = await pool.query(
      "INSERT INTO tenants (name, plan_id, document_id, contact_email, subscription_status) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      ['Parqueaderos Premium S.A.', enterprisePlanId, '900123456-7', 'gerencia@premium.com', 'ACTIVE']
    );
  }
  const tenantId = tenantRes.rows[0].id;

  // 3. Admin de la empresa
  await pool.query(
    'INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
    [tenantId, 'admin@premium.com', passwordHash, 'Carlos Gerente', 'ADMIN_TENANT']
  );

  // 4. Sede de la empresa
  let sedeRes = await pool.query("SELECT id FROM sedes WHERE name = $1 AND tenant_id = $2", ['Sede Norte', tenantId]);
  if (sedeRes.rows.length === 0) {
    sedeRes = await pool.query(
      "INSERT INTO sedes (tenant_id, name, address, capacity) VALUES ($1, 'Sede Norte', 'Av 0 # 1-2', 100) RETURNING id",
      [tenantId]
    );
  }
  const sedeId = sedeRes.rows[0].id;

  // 5. Cajero operativo en la Sede Norte
  await pool.query(
    'INSERT INTO users (tenant_id, sede_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (email) DO NOTHING',
    [tenantId, sedeId, 'cajero@premium.com', passwordHash, 'Juan Operario', 'CAJERO']
  );

  console.log('✅ Base de datos recreada (Multi-Tenant)');
  console.log('--- CREDENCIALES ---');
  console.log('👑 SuperAdmin : super@parkos.io / admin123');
  console.log('🏢 Admin Empresa: admin@premium.com / admin123');
  console.log('💵 Cajero     : cajero@premium.com / admin123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err.message);
  process.exit(1);
});
