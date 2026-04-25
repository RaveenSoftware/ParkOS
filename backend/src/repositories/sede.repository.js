const pool = require('../config/database');

const SedeRepository = {
  async findByTenant(tenantId) {
    const res = await pool.query('SELECT * FROM sedes WHERE tenant_id = $1 ORDER BY name', [tenantId]);
    return res.rows;
  },

  async create(tenantId, name, address, capacity) {
    const res = await pool.query(
      'INSERT INTO sedes (tenant_id, name, address, capacity) VALUES ($1, $2, $3, $4) RETURNING *',
      [tenantId, name, address, capacity]
    );
    return res.rows[0];
  },

  async updateStatus(id, tenantId, isActive) {
    const res = await pool.query(
      'UPDATE sedes SET is_active = $1 WHERE id = $2 AND tenant_id = $3 RETURNING *',
      [isActive, id, tenantId]
    );
    return res.rows[0];
  },

  async update(id, tenantId, name, address, capacity) {
    const res = await pool.query(
      'UPDATE sedes SET name = $1, address = $2, capacity = $3 WHERE id = $4 AND tenant_id = $5 RETURNING *',
      [name, address || null, capacity || 50, id, tenantId]
    );
    return res.rows[0];
  }
};

module.exports = SedeRepository;
