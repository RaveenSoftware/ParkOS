/**
 * init_db.js — Crea todas las tablas si no existen y siembra el superadmin inicial.
 * Se ejecuta cada vez que el backend arranca (idempotente).
 */
const pool = require('./config/database');
const bcrypt = require('bcrypt');

async function initDb() {
  console.log('🔧 Verificando esquema de base de datos...');

  // ── TABLAS BASE ──
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plans (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      price         NUMERIC(10,2) NOT NULL DEFAULT 0,
      max_sedes     INT NOT NULL DEFAULT 1,
      max_users     INT NOT NULL DEFAULT 5,
      max_spots     INT NOT NULL DEFAULT 50,
      created_at    TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id                  SERIAL PRIMARY KEY,
      name                VARCHAR(255) NOT NULL,
      plan_id             INT REFERENCES plans(id),
      subscription_status VARCHAR(30) DEFAULT 'TRIAL',
      subscription_start  DATE,
      subscription_end    DATE,
      plan_template       VARCHAR(50),
      created_at          TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      tenant_id     INT REFERENCES tenants(id) ON DELETE CASCADE,
      name          VARCHAR(255) NOT NULL,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL DEFAULT '',
      role          VARCHAR(30) NOT NULL DEFAULT 'CAJERO',
      sede_id       INT,
      is_active     BOOLEAN DEFAULT TRUE,
      created_at    TIMESTAMP DEFAULT NOW()
    );
  `);

  // Migrate: rename 'password' to 'password_hash' if old schema exists
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
        ALTER TABLE users RENAME COLUMN password TO password_hash;
      END IF;
      -- Add password_hash if missing entirely
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';
      END IF;
      -- Add sede_id if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sede_id') THEN
        ALTER TABLE users ADD COLUMN sede_id INT;
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sedes (
      id          SERIAL PRIMARY KEY,
      tenant_id   INT REFERENCES tenants(id) ON DELETE CASCADE,
      name        VARCHAR(255) NOT NULL,
      address     VARCHAR(255),
      capacity    INT NOT NULL DEFAULT 50,
      is_active   BOOLEAN DEFAULT TRUE,
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS spots (
      id          SERIAL PRIMARY KEY,
      sede_id     INT REFERENCES sedes(id) ON DELETE CASCADE,
      label       VARCHAR(20) NOT NULL,
      type        VARCHAR(30) DEFAULT 'CARRO',
      x           INT DEFAULT 0,
      y           INT DEFAULT 0,
      status      VARCHAR(20) DEFAULT 'DISPONIBLE',
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id            SERIAL PRIMARY KEY,
      sede_id       INT REFERENCES sedes(id),
      spot_id       INT REFERENCES spots(id),
      user_id       INT REFERENCES users(id),
      plate         VARCHAR(20) NOT NULL,
      vehicle_type  VARCHAR(30) DEFAULT 'CARRO',
      entry_at      TIMESTAMP DEFAULT NOW(),
      exit_at       TIMESTAMP,
      amount        NUMERIC(10,2),
      status        VARCHAR(20) DEFAULT 'ABIERTO',
      client_name   VARCHAR(255),
      client_doc    VARCHAR(50),
      invoice_num   VARCHAR(80),
      rate_snapshot JSONB,
      created_at    TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS tickets_plate_sede_open_unique
    ON tickets (plate, sede_id) WHERE status = 'ABIERTO';
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS tickets_invoice_num_unique
    ON tickets (invoice_num) WHERE invoice_num IS NOT NULL;
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS tickets_exit_at_idx ON tickets (exit_at);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cash_expenses (
      id          SERIAL PRIMARY KEY,
      tenant_id   INT REFERENCES tenants(id),
      sede_id     INT REFERENCES sedes(id),
      user_id     INT REFERENCES users(id),
      description TEXT,
      amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shifts (
      id           SERIAL PRIMARY KEY,
      sede_id      INT REFERENCES sedes(id),
      user_id      INT REFERENCES users(id),
      opened_at    TIMESTAMP DEFAULT NOW(),
      closed_at    TIMESTAMP,
      opening_cash NUMERIC(10,2) DEFAULT 0,
      closing_cash NUMERIC(10,2),
      status       VARCHAR(20) DEFAULT 'OPEN'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS parking_rates (
      id           SERIAL PRIMARY KEY,
      tenant_id    INT REFERENCES tenants(id) ON DELETE CASCADE,
      vehicle_type VARCHAR(30) NOT NULL,
      rate_type    VARCHAR(30) NOT NULL,
      amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
      min_charge   NUMERIC(10,2) NOT NULL DEFAULT 0,
      created_at   TIMESTAMP DEFAULT NOW(),
      UNIQUE (tenant_id, vehicle_type, rate_type)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_config (
      tenant_id    INT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
      company_name VARCHAR(255),
      logo_url     TEXT,
      logo_base64  TEXT,
      commercial_name VARCHAR(255),
      updated_at   TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id           SERIAL PRIMARY KEY,
      tenant_id    INT REFERENCES tenants(id),
      email        VARCHAR(255),
      full_name    VARCHAR(255),
      plate        VARCHAR(30),
      vehicle_type VARCHAR(30),
      plan_name    VARCHAR(100),
      start_date   DATE,
      end_date     DATE,
      is_active    BOOLEAN DEFAULT TRUE,
      created_at   TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✅ Esquema de base de datos verificado.');

  // ── SEED: Plan y SuperAdmin por defecto ──
  const planCheck = await pool.query(`SELECT id FROM plans WHERE name = 'Enterprise' LIMIT 1`);
  let planId;
  if (planCheck.rows.length === 0) {
    const planResult = await pool.query(`
      INSERT INTO plans (name, price, max_sedes, max_users, max_spots)
      VALUES ('Enterprise', 0, 999, 9999, 99999)
      RETURNING id
    `);
    planId = planResult.rows[0].id;
    console.log('✅ Plan Enterprise creado.');
  } else {
    planId = planCheck.rows[0].id;
  }

  const superCheck = await pool.query(`SELECT id FROM users WHERE email = 'super@parkos.io' LIMIT 1`);
  if (superCheck.rows.length === 0) {
    // Crear tenant raíz
    const tenantResult = await pool.query(`
      INSERT INTO tenants (name, plan_id, subscription_status)
      VALUES ('ParkOS Global', $1, 'ACTIVE')
      RETURNING id
    `, [planId]);
    const tenantId = tenantResult.rows[0].id;

    const hash = await bcrypt.hash('SuperAdmin123!', 10);
    await pool.query(`
      INSERT INTO users (tenant_id, name, email, password_hash, role)
      VALUES ($1, 'Super Administrador', 'super@parkos.io', $2, 'SUPERADMIN')
    `, [tenantId, hash]);

    console.log('✅ SuperAdmin inicial creado: super@parkos.io / SuperAdmin123!');
  }
}

module.exports = initDb;
