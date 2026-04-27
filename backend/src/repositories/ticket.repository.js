const pool = require('../config/database');

const TicketRepository = {
  async create(plate, type, userId, sedeId, spotId, clientName, clientDoc) {
    try {
      const res = await pool.query(
        `INSERT INTO tickets (plate, vehicle_type, created_by, sede_id, spot_id, client_name, client_doc)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [plate.toUpperCase(), type, userId, sedeId, spotId || null, clientName || null, clientDoc || null]
      );
      return res.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        throw new Error('Ese vehículo ya tiene un ticket abierto en esta sede');
      }
      throw err;
    }
  },

  async findOpenBySpot(spotId) {
    const res = await pool.query(
      `SELECT * FROM tickets WHERE spot_id = $1 AND status = 'ABIERTO'`,
      [spotId]
    );
    return res.rows[0] || null;
  },

  async findOpenByPlate(plate, sedeId) {
    const res = await pool.query(
      `SELECT * FROM tickets WHERE plate = $1 AND sede_id = $2 AND status = 'ABIERTO'`,
      [plate.toUpperCase(), sedeId]
    );
    return res.rows[0] || null;
  },

  async findOpen(sedeId) {
    const res = await pool.query(
      `SELECT t.*,
        EXTRACT(EPOCH FROM (NOW() - t.entry_at))/60 AS minutes_so_far,
        ps.spot_code
       FROM tickets t
       LEFT JOIN parking_spots ps ON ps.id = t.spot_id
       WHERE t.status = 'ABIERTO' AND t.sede_id = $1
       ORDER BY t.entry_at DESC`,
       [sedeId]
    );
    return res.rows;
  },

  async findClosed(sedeId) {
    const res = await pool.query(
      `SELECT * FROM tickets 
       WHERE status = 'CERRADO' AND sede_id = $1
       ORDER BY exit_at DESC LIMIT 100`,
       [sedeId]
    );
    return res.rows;
  },

  async findById(id, sedeId) {
    const res = await pool.query(
      `SELECT *, EXTRACT(EPOCH FROM (NOW() - entry_at))/60 AS minutes_so_far 
       FROM tickets WHERE id = $1 AND sede_id = $2`, [id, sedeId]);
    return res.rows[0] || null;
  },

  async closeTicket(id, minutes, amount, sedeId, clientName, clientDoc, invoiceNum, rateSnapshot) {
    const res = await pool.query(
      `UPDATE tickets 
       SET exit_at = NOW(), 
           minutes_parked = $1, 
           amount = $2, 
           status = 'CERRADO',
           client_name = $3,
           client_doc = $4,
           invoice_num = $5,
           rate_snapshot = $6
       WHERE id = $7 AND status = 'ABIERTO' AND sede_id = $8
       RETURNING *`,
      [minutes, amount, clientName || null, clientDoc || null, invoiceNum || null, rateSnapshot || null, id, sedeId]
    );
    return res.rows[0] || null;
  },

  async getDailyStats(sedeId) {
    const res = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'ABIERTO')                              AS vehicles_inside,
        COUNT(*) FILTER (WHERE DATE(entry_at) = CURRENT_DATE)                  AS entries_today,
        COALESCE(SUM(amount) FILTER (WHERE DATE(exit_at) = CURRENT_DATE), 0)   AS revenue_today,
        COUNT(*) FILTER (WHERE DATE(exit_at) = CURRENT_DATE AND status = 'CERRADO') AS exits_today
      FROM tickets
      WHERE sede_id = $1
    `, [sedeId]);
    return res.rows[0];
  },

  async getRecentActivity(limit = 10, sedeId) {
    const res = await pool.query(
      `SELECT * FROM tickets WHERE sede_id = $1 ORDER BY entry_at DESC LIMIT $2`, [sedeId, limit]
    );
    return res.rows;
  },
};

module.exports = TicketRepository;
