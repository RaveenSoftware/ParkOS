/**
 * init_db.js — Crea todas las tablas si no existen y siembra el superadmin inicial.
 * Se ejecuta cada vez que el backend arranca (idempotente).
 */
const pool = require('./config/database');
const bcrypt = require('bcrypt');

async function initDb() {
  console.log('🔧 Verificando esquema de base de datos...');

  // Migrate: rename 'plans' table to 'saas_plans' if old schema exists
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='plans') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='saas_plans') THEN
          DROP TABLE saas_plans CASCADE;
        END IF;
        ALTER TABLE plans RENAME TO saas_plans;
      END IF;
    END $$;
  `);

  // ── TABLAS BASE ──
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saas_plans (
      id            SERIAL PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      price         NUMERIC(10,2) NOT NULL DEFAULT 0,
      max_sedes     INT NOT NULL DEFAULT 1,
      max_users     INT NOT NULL DEFAULT 5,
      max_spots     INT NOT NULL DEFAULT 50,
      features      JSONB DEFAULT '[]',
      created_at    TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id                  SERIAL PRIMARY KEY,
      name                VARCHAR(255) NOT NULL,
      plan_id             INT REFERENCES saas_plans(id),
      document_id         VARCHAR(50),
      contact_email       VARCHAR(255),
      phone               VARCHAR(50),
      subscription_status VARCHAR(30) DEFAULT 'TRIAL',
      subscription_start  DATE,
      subscription_end    DATE,
      plan_template       VARCHAR(50),
      is_active           BOOLEAN DEFAULT TRUE,
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

  // Migrate tickets: rename 'user_id' to 'created_by' if old schema exists
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='user_id') THEN
        ALTER TABLE tickets RENAME COLUMN user_id TO created_by;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='is_active') THEN
        ALTER TABLE tenants ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='document_id') THEN
        ALTER TABLE tenants ADD COLUMN document_id VARCHAR(50);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='contact_email') THEN
        ALTER TABLE tenants ADD COLUMN contact_email VARCHAR(255);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='phone') THEN
        ALTER TABLE tenants ADD COLUMN phone VARCHAR(50);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='minutes_parked') THEN
        ALTER TABLE tickets ADD COLUMN minutes_parked INT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saas_plans' AND column_name='features') THEN
        ALTER TABLE saas_plans ADD COLUMN features JSONB DEFAULT '[]';
      END IF;

      -- Migrate spots to parking_spots
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='spots') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='parking_spots') THEN
          DROP TABLE parking_spots CASCADE;
        END IF;
        ALTER TABLE spots RENAME TO parking_spots;
        
        ALTER TABLE parking_spots RENAME COLUMN label TO spot_code;
        ALTER TABLE parking_spots RENAME COLUMN type TO spot_type;
        ALTER TABLE parking_spots RENAME COLUMN x TO row_pos;
        ALTER TABLE parking_spots RENAME COLUMN y TO col_pos;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parking_spots' AND column_name='tenant_id') THEN
          ALTER TABLE parking_spots ADD COLUMN tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='parking_spots' AND column_name='is_active') THEN
          ALTER TABLE parking_spots ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
        END IF;
      END IF;

      -- Migrate subscribers
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='subscribers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscribers' AND column_name='sede_id') THEN
          ALTER TABLE subscribers ADD COLUMN sede_id INT REFERENCES sedes(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscribers' AND column_name='document_id') THEN
          ALTER TABLE subscribers ADD COLUMN document_id VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscribers' AND column_name='amount_paid') THEN
          ALTER TABLE subscribers ADD COLUMN amount_paid NUMERIC(10,2) DEFAULT 0;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscribers' AND column_name='full_name') THEN
          ALTER TABLE subscribers RENAME COLUMN full_name TO client_name;
        END IF;
      END IF;

      -- Ensure unique constraint on parking_spots (Required for ON CONFLICT)
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='parking_spots') THEN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint c 
          JOIN pg_class t ON c.conrelid = t.oid 
          WHERE t.relname = 'parking_spots' AND c.contype = 'u' 
          AND (SELECT array_agg(a.attname ORDER BY x) FROM unnest(c.conkey) WITH ORDINALITY AS x(cid, x) JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = cid) @> ARRAY['sede_id', 'row_pos', 'col_pos']
        ) THEN
          ALTER TABLE parking_spots ADD CONSTRAINT parking_spots_sede_id_row_pos_col_pos_key UNIQUE(sede_id, row_pos, col_pos);
        END IF;
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
    CREATE TABLE IF NOT EXISTS parking_spots (
      id           SERIAL PRIMARY KEY,
      sede_id      INT REFERENCES sedes(id) ON DELETE CASCADE,
      tenant_id    INT REFERENCES tenants(id) ON DELETE CASCADE,
      spot_code    VARCHAR(20) NOT NULL,
      row_pos      INT NOT NULL,
      col_pos      INT NOT NULL,
      spot_type    VARCHAR(30) DEFAULT 'CARRO',
      is_active    BOOLEAN DEFAULT TRUE,
      UNIQUE(sede_id, row_pos, col_pos)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id            SERIAL PRIMARY KEY,
      sede_id       INT REFERENCES sedes(id),
      spot_id       INT REFERENCES parking_spots(id),
      created_by    INT REFERENCES users(id),
      plate         VARCHAR(20) NOT NULL,
      vehicle_type  VARCHAR(30) DEFAULT 'CARRO',
      entry_at      TIMESTAMP DEFAULT NOW(),
      exit_at       TIMESTAMP,
      minutes_parked INT,
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
      tenant_id    INT REFERENCES tenants(id) ON DELETE CASCADE,
      sede_id      INT REFERENCES sedes(id) ON DELETE CASCADE,
      client_name  VARCHAR(255) NOT NULL,
      document_id  VARCHAR(50),
      email        VARCHAR(255),
      plate        VARCHAR(30) NOT NULL,
      vehicle_type VARCHAR(30) NOT NULL,
      plan_name    VARCHAR(100),
      start_date   TIMESTAMP NOT NULL,
      end_date     TIMESTAMP NOT NULL,
      amount_paid  NUMERIC(10,2) DEFAULT 0,
      is_active    BOOLEAN DEFAULT TRUE,
      created_at   TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log('✅ Esquema de base de datos verificado.');

  // ── SEED: Plan y SuperAdmin por defecto ──
  const planCheck = await pool.query(`SELECT id FROM saas_plans WHERE name = 'Enterprise' LIMIT 1`);
  let planId;
  if (planCheck.rows.length === 0) {
    const planResult = await pool.query(`
      INSERT INTO saas_plans (name, price, max_sedes, max_users, max_spots)
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
