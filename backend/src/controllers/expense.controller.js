const pool = require('../config/database');

const ExpenseController = {
  // Obtener egresos del turno actual
  async getExpenses(req, res) {
    try {
      const { tenantId, sedeId } = req.user;
      const { shiftId } = req.params;

      const result = await pool.query(`
        SELECT e.*, u.name as user_name 
        FROM cash_expenses e
        JOIN users u ON e.user_id = u.id
        WHERE e.tenant_id = $1 AND e.sede_id = $2 AND e.shift_id = $3
        ORDER BY e.created_at DESC
      `, [tenantId, sedeId, shiftId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Registrar egreso
  async createExpense(req, res) {
    try {
      const { tenantId, id: userId, sedeId } = req.user;
      const { shiftId, description, amount } = req.body;

      if (!shiftId || !description || !amount) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      // Verificar que el turno pertenece a la sede y está abierto
      const check = await pool.query('SELECT status FROM cash_shifts WHERE id = $1 AND sede_id = $2', [shiftId, sedeId]);
      if (check.rows.length === 0 || check.rows[0].status !== 'OPEN') {
        return res.status(400).json({ error: 'Turno inválido o ya cerrado' });
      }

      const result = await pool.query(`
        INSERT INTO cash_expenses (tenant_id, sede_id, shift_id, user_id, description, amount)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [tenantId, sedeId, shiftId, userId === -1 ? null : userId, description, amount]);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  // ADMIN: Registrar egreso directo sin necesidad de turno
  async createAdminExpense(req, res) {
    try {
      const { tenantId, id: userId } = req.user;
      const { sedeId, description, amount, category } = req.body;

      if (!description || !amount || !sedeId) {
        return res.status(400).json({ error: 'Faltan campos: sedeId, description, amount' });
      }

      // Verificar que la sede pertenece al tenant
      const check = await pool.query('SELECT id FROM sedes WHERE id = $1 AND tenant_id = $2', [sedeId, tenantId]);
      if (check.rows.length === 0) {
        return res.status(403).json({ error: 'Sede no pertenece a tu organización' });
      }

      const result = await pool.query(`
        INSERT INTO cash_expenses (tenant_id, sede_id, user_id, description, amount, category)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [tenantId, sedeId, userId, description, amount, category || 'OTRO']);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ADMIN: Obtener todos los egresos del tenant con filtros
  async getAllExpenses(req, res) {
    try {
      const { tenantId } = req.user;
      const { sedeId, from, to } = req.query;

      let query = `
        SELECT e.*, u.name AS user_name, s.name AS sede_name
        FROM cash_expenses e
        LEFT JOIN users u ON e.user_id = u.id
        JOIN sedes s ON e.sede_id = s.id
        WHERE e.tenant_id = $1
      `;
      const params = [tenantId];
      let idx = 2;

      if (sedeId) { query += ` AND e.sede_id = $${idx++}`; params.push(sedeId); }
      if (from)   { query += ` AND DATE(e.created_at) >= $${idx++}`; params.push(from); }
      if (to)     { query += ` AND DATE(e.created_at) <= $${idx++}`; params.push(to); }

      query += ' ORDER BY e.created_at DESC LIMIT 500';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ADMIN: Eliminar egreso
  async deleteExpense(req, res) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const check = await pool.query('SELECT id FROM cash_expenses WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Egreso no encontrado' });
      await pool.query('DELETE FROM cash_expenses WHERE id = $1', [id]);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = ExpenseController;
