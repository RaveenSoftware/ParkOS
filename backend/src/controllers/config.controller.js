const pool = require('../config/database');

const ConfigController = {
  async get(req, res) {
    try {
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });
      const result = await pool.query(
        'SELECT commercial_name, logo_base64 FROM tenant_config WHERE tenant_id = $1',
        [tenantId]
      );
      res.json(result.rows[0] || { commercial_name: null, logo_base64: null });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async save(req, res) {
    try {
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });
      const { commercialName, logoBase64 } = req.body;

      // Upsert: insert or update
      const result = await pool.query(`
        INSERT INTO tenant_config (tenant_id, commercial_name, logo_base64)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id) DO UPDATE
          SET commercial_name = EXCLUDED.commercial_name,
              logo_base64     = EXCLUDED.logo_base64
        RETURNING *
      `, [tenantId, commercialName || null, logoBase64 || null]);

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = ConfigController;
