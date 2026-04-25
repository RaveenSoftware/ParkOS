const pool = require('../config/database');

const PlanRepository = {
  async findAll() {
    const res = await pool.query('SELECT * FROM saas_plans ORDER BY price ASC');
    return res.rows;
  },

  async findById(id) {
    const res = await pool.query('SELECT * FROM saas_plans WHERE id = $1', [id]);
    return res.rows[0];
  },

  async create(name, price, maxSedes, maxUsers, features) {
    const res = await pool.query(
      'INSERT INTO saas_plans (name, price, max_sedes, max_users, features) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name.toUpperCase(), price, maxSedes, maxUsers, JSON.stringify(features || [])]
    );
    return res.rows[0];
  },

  async update(id, name, price, maxSedes, maxUsers, features) {
    const res = await pool.query(
      'UPDATE saas_plans SET name = $1, price = $2, max_sedes = $3, max_users = $4, features = $5 WHERE id = $6 RETURNING *',
      [name ? name.toUpperCase() : undefined, price, maxSedes, maxUsers, JSON.stringify(features || []), id]
    );
    return res.rows[0];
  }
};

module.exports = PlanRepository;
