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
      `, [tenantId, sedeId, shiftId, userId, description, amount]);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = ExpenseController;
