const pool = require('../config/database');

const TenantRepository = {
  async findAll() {
    const res = await pool.query(`
      SELECT t.*, p.name as plan_name, p.price as plan_price, p.max_sedes, p.max_users
      FROM tenants t
      LEFT JOIN saas_plans p ON t.plan_id = p.id
      ORDER BY t.created_at DESC
    `);
    return res.rows;
  },

  async findByIdWithPlan(id) {
    const res = await pool.query(`
      SELECT t.*, p.max_sedes, p.max_users
      FROM tenants t
      LEFT JOIN saas_plans p ON t.plan_id = p.id
      WHERE t.id = $1
    `, [id]);
    return res.rows[0];
  },

  async create(name, planId, documentId, contactEmail, phone) {
    const res = await pool.query(
      `INSERT INTO tenants (name, plan_id, document_id, contact_email, phone, subscription_status) 
       VALUES ($1, $2, $3, $4, $5, 'TRIAL') RETURNING *`,
      [name, planId, documentId, contactEmail, phone]
    );
    return res.rows[0];
  },

  async update(id, name, planId, documentId, contactEmail, phone, subscriptionStatus, subscriptionStart, subscriptionEnd, planTemplate) {
    const res = await pool.query(
      `UPDATE tenants 
       SET name = $1, 
           plan_id = $2, 
           document_id = $3, 
           contact_email = $4, 
           phone = $5, 
           subscription_status = $6,
           subscription_start = $7,
           subscription_end = $8,
           plan_template = $9
       WHERE id = $10 RETURNING *`,
      [name, planId, documentId, contactEmail, phone, subscriptionStatus, subscriptionStart || null, subscriptionEnd || null, planTemplate || null, id]
    );
    return res.rows[0];
  },

  async updateStatus(id, isActive) {
    const res = await pool.query(
      'UPDATE tenants SET is_active = $1 WHERE id = $2 RETURNING *',
      [isActive, id]
    );
    return res.rows[0];
  }
};

module.exports = TenantRepository;
