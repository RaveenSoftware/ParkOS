/**
 * migrate.js — Migraciones ADITIVAS para ParkOS iteración 2
 * NO hace DROP. Solo añade columnas y tablas nuevas de forma segura.
 */
require('dotenv').config();
const pool = require('./config/database');

async function migrate() {
  console.log('🔄 Ejecutando migraciones aditivas...');

  // ── 1. Columnas de suscripción en tenants
  await pool.query(`
    ALTER TABLE tenants
      ADD COLUMN IF NOT EXISTS subscription_start DATE,
      ADD COLUMN IF NOT EXISTS subscription_end   DATE,
      ADD COLUMN IF NOT EXISTS plan_template      VARCHAR(50)
  `);
  console.log('✅ tenants: columnas de suscripción añadidas');

  // ── 2. tenant_config — logo y nombre personalizado
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_config (
      tenant_id    INT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
      company_name VARCHAR(255),
      logo_url     TEXT,
      updated_at   TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ tenant_config creada');

  // ── 3. parking_rates — tarifas personalizadas por tenant
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
    )
  `);
  console.log('✅ parking_rates creada');

  // ── 4a. Renombrar client_id → client_doc si aún existe el campo viejo y el nuevo no
  const colCheck = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='tickets' AND column_name IN ('client_id', 'client_doc')
  `);
  const cols = colCheck.rows.map(r => r.column_name);
  if (cols.includes('client_id') && !cols.includes('client_doc')) {
    await pool.query(`ALTER TABLE tickets RENAME COLUMN client_id TO client_doc`);
    console.log('✅ tickets: columna client_id renombrada a client_doc');
  }

  // ── 4b. Columnas de facturación en tickets
  await pool.query(`
    ALTER TABLE tickets
      ADD COLUMN IF NOT EXISTS client_name   VARCHAR(255),
      ADD COLUMN IF NOT EXISTS client_doc    VARCHAR(50),
      ADD COLUMN IF NOT EXISTS invoice_num   VARCHAR(80),
      ADD COLUMN IF NOT EXISTS rate_snapshot JSONB
  `);
  console.log('✅ tickets: columnas de facturación añadidas');

  // ── 5. Índice único para invoice_num (previene factura duplicada)
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS tickets_invoice_num_unique
    ON tickets (invoice_num) WHERE invoice_num IS NOT NULL
  `);
  console.log('✅ Índice único en invoice_num');

  // ── 6. Índice para prevenir placa duplicada abierta en misma sede
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS tickets_plate_sede_open_unique
    ON tickets (plate, sede_id) WHERE status = 'ABIERTO'
  `);
  console.log('✅ Índice único placa+sede (tickets abiertos)');

  // ── 7. Índice de performance en exit_at para reportes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS tickets_exit_at_idx ON tickets (exit_at)
  `);
  console.log('✅ Índice de performance en exit_at');

  console.log('\n🎉 Todas las migraciones completadas sin pérdida de datos.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Error en migración:', err.message);
  process.exit(1);
});
