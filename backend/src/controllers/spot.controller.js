const pool = require('../config/database');

const SpotController = {
  // GET /api/spots/:sedeId - Layout con estado en tiempo real
  async getLayout(req, res) {
    try {
      const { tenantId } = req.user;
      const { sedeId } = req.params;

      // Verificar que la sede pertenece al tenant
      const sedeCheck = await pool.query('SELECT id FROM sedes WHERE id=$1 AND tenant_id=$2', [sedeId, tenantId]);
      if (!sedeCheck.rows[0]) return res.status(403).json({ error: 'Sede no autorizada' });

      const spotsRes = await pool.query(`
        SELECT 
          ps.*,
          t.plate            AS occupied_plate,
          t.type             AS occupied_type,
          t.entry_at         AS occupied_since,
          EXTRACT(EPOCH FROM (NOW() - t.entry_at))/60 AS minutes_so_far,
          t.id               AS ticket_id,
          sub.id             AS subscriber_id,
          sub.client_name    AS subscriber_name,
          sub.plate          AS subscriber_plate
        FROM parking_spots ps
        LEFT JOIN tickets t 
          ON t.spot_id = ps.id AND t.status = 'ABIERTO'
        LEFT JOIN subscribers sub 
          ON sub.sede_id = ps.sede_id 
          AND sub.is_active = true
          AND sub.end_date >= NOW()
          AND t.id IS NULL
        WHERE ps.sede_id = $1
        ORDER BY ps.row_pos, ps.col_pos
      `, [sedeId]);

      const spots = spotsRes.rows.map(s => ({
        ...s,
        status: s.ticket_id     ? 'OCUPADA'
              : s.subscriber_id ? 'ABONADO'
              : s.is_active === false ? 'INACTIVA'
              : 'LIBRE'
      }));

      const maxRow = spots.length ? Math.max(...spots.map(s => s.row_pos)) : 0;
      const maxCol = spots.length ? Math.max(...spots.map(s => s.col_pos)) : 0;

      res.json({ spots, maxRow, maxCol });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // POST /api/spots - Crear o actualizar una plaza
  async upsertSpot(req, res) {
    try {
      const { tenantId } = req.user;
      const { sede_id, spot_code, row_pos, col_pos, spot_type, is_active } = req.body;

      const sedeCheck = await pool.query('SELECT id FROM sedes WHERE id=$1 AND tenant_id=$2', [sede_id, tenantId]);
      if (!sedeCheck.rows[0]) return res.status(403).json({ error: 'Sede no autorizada' });

      const result = await pool.query(`
        INSERT INTO parking_spots (sede_id, tenant_id, spot_code, row_pos, col_pos, spot_type, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (sede_id, row_pos, col_pos) DO UPDATE
          SET spot_code = EXCLUDED.spot_code,
              spot_type = EXCLUDED.spot_type,
              is_active  = EXCLUDED.is_active
        RETURNING *
      `, [sede_id, tenantId, spot_code || `${row_pos}-${col_pos}`, row_pos, col_pos, spot_type || 'CARRO', is_active !== false]);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /api/spots/layout - Guardar layout completo (batch)
  async saveLayout(req, res) {
    try {
      const { tenantId } = req.user;
      const { sede_id, spots } = req.body;

      const sedeCheck = await pool.query('SELECT id FROM sedes WHERE id=$1 AND tenant_id=$2', [sede_id, tenantId]);
      if (!sedeCheck.rows[0]) return res.status(403).json({ error: 'Sede no autorizada' });

      if (!Array.isArray(spots)) return res.status(400).json({ error: 'spots debe ser un arreglo' });

      // Eliminar spots existentes de la sede y reemplazar con los nuevos
      await pool.query('DELETE FROM parking_spots WHERE sede_id = $1 AND tenant_id = $2', [sede_id, tenantId]);

      if (spots.length > 0) {
        const values = spots.map((s, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`).join(', ');
        const params = spots.flatMap(s => [sede_id, tenantId, s.spot_code, s.row_pos, s.col_pos, s.spot_type || 'CARRO']);
        await pool.query(`
          INSERT INTO parking_spots (sede_id, tenant_id, spot_code, row_pos, col_pos, spot_type)
          VALUES ${values}
        `, params);
      }

      res.json({ success: true, count: spots.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // DELETE /api/spots/:id
  async deleteSpot(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      await pool.query('DELETE FROM parking_spots WHERE id=$1 AND tenant_id=$2', [id, tenantId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = SpotController;
