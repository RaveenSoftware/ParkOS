const pool = require('../config/database');

const ShiftController = {
  // Obtener estado del turno actual del usuario en la sede
  async getCurrentShift(req, res) {
    try {
      const { tenantId, id: userId, sedeId } = req.user;
      
      const result = await pool.query(`
        SELECT id, start_time, starting_cash, status 
        FROM cash_shifts 
        WHERE user_id IS NOT DISTINCT FROM $1 AND sede_id = $2 AND status = 'OPEN' 
        ORDER BY start_time DESC LIMIT 1
      `, [userId === -1 ? null : userId, sedeId]);

      if (result.rows.length === 0) {
        return res.json({ active: false });
      }

      res.json({ active: true, shift: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Abrir turno
  async openShift(req, res) {
    try {
      const { tenantId, id: userId, sedeId } = req.user;
      const { startingCash } = req.body;

      // Verificar si ya tiene uno abierto
      const check = await pool.query(`
        SELECT id FROM cash_shifts WHERE user_id IS NOT DISTINCT FROM $1 AND sede_id = $2 AND status = 'OPEN'
      `, [userId === -1 ? null : userId, sedeId]);

      if (check.rows.length > 0) {
        return res.status(400).json({ error: 'Ya tienes un turno abierto en esta sede.' });
      }

      const result = await pool.query(`
        INSERT INTO cash_shifts (tenant_id, sede_id, user_id, starting_cash, status)
        VALUES ($1, $2, $3, $4, 'OPEN') RETURNING *
      `, [tenantId, sedeId, userId === -1 ? null : userId, startingCash || 0]);

      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Cerrar turno
  async closeShift(req, res) {
    try {
      const { tenantId, id: userId, sedeId } = req.user;
      const { shiftId } = req.params;
      const { actualCash } = req.body;

      // Calcular expected_cash
      // Suma de starting_cash + (todos los tickets cerrados en este turno pagados en efectivo)
      // Asumiremos que todos los tickets de momento son en efectivo para este MVP.
      const shiftRes = await pool.query('SELECT starting_cash, start_time FROM cash_shifts WHERE id = $1 AND user_id IS NOT DISTINCT FROM $2', [shiftId, userId === -1 ? null : userId]);
      if (shiftRes.rows.length === 0) return res.status(404).json({ error: 'Turno no encontrado' });
      
      const { starting_cash, start_time } = shiftRes.rows[0];

      // Sumar tickets
      const ticketsRes = await pool.query(`
        SELECT SUM(amount) as total_tickets FROM tickets 
        WHERE created_by IS NOT DISTINCT FROM $1 AND sede_id = $2 AND status = 'CERRADO' AND exit_at > $3
      `, [userId === -1 ? null : userId, sedeId, start_time]);

      const totalTickets = parseFloat(ticketsRes.rows[0].total_tickets || 0);

      // Sumar egresos
      const expensesRes = await pool.query(`
        SELECT SUM(amount) as total_expenses FROM cash_expenses WHERE shift_id = $1
      `, [shiftId]);

      const totalExpenses = parseFloat(expensesRes.rows[0].total_expenses || 0);

      const expectedCash = parseFloat(starting_cash) + totalTickets - totalExpenses;
      const difference = parseFloat(actualCash) - expectedCash;

      const result = await pool.query(`
        UPDATE cash_shifts 
        SET end_time = NOW(), actual_cash = $1, expected_cash = $2, difference = $3, status = 'CLOSED'
        WHERE id = $4 RETURNING *
      `, [actualCash, expectedCash, difference, shiftId]);

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Historial de turnos (para administrador)
  async getShiftsHistory(req, res) {
    try {
      const { tenantId, sedeId } = req.user;
      const result = await pool.query(`
        SELECT s.*, u.name as user_name 
        FROM cash_shifts s
        JOIN users u ON s.user_id = u.id
        WHERE s.tenant_id = $1 AND s.sede_id = $2
        ORDER BY s.start_time DESC
      `, [tenantId, sedeId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = ShiftController;
