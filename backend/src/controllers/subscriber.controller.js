const pool = require('../config/database');

const SubscriberController = {
  // Obtener abonados de la sede
  async getSubscribers(req, res) {
    try {
      const { tenantId, sedeId } = req.user;
      const result = await pool.query(
        'SELECT * FROM subscribers WHERE tenant_id = $1 AND sede_id = $2 ORDER BY created_at DESC',
        [tenantId, sedeId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Crear o renovar abonado
  async createSubscriber(req, res) {
    try {
      const { tenantId, sedeId } = req.user;
      const { client_name, document_id, plate, vehicle_type, start_date, end_date, amount_paid } = req.body;

      if (!client_name || !plate || !vehicle_type || !start_date || !end_date) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const result = await pool.query(`
        INSERT INTO subscribers (tenant_id, sede_id, client_name, document_id, plate, vehicle_type, start_date, end_date, amount_paid)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [tenantId, sedeId, client_name, document_id, plate, vehicle_type, start_date, end_date, amount_paid || 0]);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Actualizar estado (Activar/Desactivar)
  async updateStatus(req, res) {
    try {
      const { tenantId, sedeId } = req.user;
      const { id } = req.params;
      const { is_active } = req.body;

      const result = await pool.query(
        'UPDATE subscribers SET is_active = $1 WHERE id = $2 AND tenant_id = $3 AND sede_id = $4 RETURNING *',
        [is_active, id, tenantId, sedeId]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Abonado no encontrado' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Verificar si una placa es de un abonado activo (Para el momento de registrar entrada)
  async checkPlate(req, res) {
    try {
      const { tenantId, sedeId } = req.user;
      const { plate } = req.params;

      const result = await pool.query(
        'SELECT * FROM subscribers WHERE tenant_id = $1 AND sede_id = $2 AND plate = $3 AND is_active = true AND start_date <= NOW() AND end_date >= NOW() LIMIT 1',
        [tenantId, sedeId, plate]
      );

      if (result.rows.length > 0) {
        return res.json({ isSubscriber: true, subscriber: result.rows[0] });
      }
      res.json({ isSubscriber: false });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = SubscriberController;
