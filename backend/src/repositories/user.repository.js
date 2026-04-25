const pool = require('../config/database');
const bcrypt = require('bcrypt');

const UserRepository = {
  async findByEmail(email) {
    const res = await pool.query(
      `SELECT u.*, t.name AS tenant_name
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE u.email = $1 AND u.is_active = TRUE`,
      [email]
    );
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await pool.query('SELECT id, email, name, role, tenant_id, sede_id FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findByTenant(tenantId) {
    const res = await pool.query(
      `SELECT u.id, u.email, u.name, u.role, u.is_active, s.name as sede_name 
       FROM users u LEFT JOIN sedes s ON u.sede_id = s.id 
       WHERE u.tenant_id = $1 ORDER BY u.created_at DESC`, [tenantId]
    );
    return res.rows;
  },

  async createAdminTenant(tenantId, name, email, password) {
    const hash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      'INSERT INTO users (tenant_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, name, role',
      [tenantId, email, hash, name, 'ADMIN_TENANT']
    );
    return res.rows[0];
  },

  async createCajero(tenantId, sedeId, name, email, password) {
    const hash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      'INSERT INTO users (tenant_id, sede_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, role',
      [tenantId, sedeId, email, hash, name, 'CAJERO']
    );
    return res.rows[0];
  },

  async updateStatus(id, tenantId, isActive) {
    const res = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id, email, is_active',
      [isActive, id, tenantId]
    );
    return res.rows[0];
  },

  async update(id, tenantId, name, sedeId) {
    const res = await pool.query(
      'UPDATE users SET name = $1, sede_id = $2 WHERE id = $3 AND tenant_id = $4 RETURNING id, name, email, role, sede_id',
      [name, sedeId || null, id, tenantId]
    );
    return res.rows[0];
  },

  async delete(id, tenantId) {
    const res = await pool.query(
      'DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );
    return res.rows[0];
  },

  async updatePassword(id, tenantId, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    const res = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id',
      [hash, id, tenantId]
    );
    return res.rows[0];
  }
};

module.exports = UserRepository;
