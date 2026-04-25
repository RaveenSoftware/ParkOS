const pool = require('../config/database');
const TicketService = require('../services/ticket.service');

const DashboardController = {
  // POS: stats de UNA sede para el cajero
  async getStats(req, res) {
    try {
      if (!req.user.sedeId) return res.json({});
      const stats = await TicketService.getDailyStats(req.user.sedeId);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ADMIN_TENANT: métricas corporativas de TODAS sus sedes
  async getTenantStats(req, res) {
    try {
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      // 1. KPIs globales del tenant
      const sedesAgRes = await pool.query(`
        SELECT
          COUNT(id) FILTER (WHERE is_active = TRUE) AS active_sedes,
          COUNT(id) AS total_sedes
        FROM sedes WHERE tenant_id = $1
      `, [tenantId]);
      const usersAgRes = await pool.query(`
        SELECT COUNT(id) AS active_users
        FROM users WHERE tenant_id = $1 AND role != 'SUPERADMIN' AND is_active = TRUE
      `, [tenantId]);
      const ticketsAgRes = await pool.query(`
        SELECT
          COUNT(id) FILTER (WHERE status = 'ABIERTO') AS vehicles_inside,
          COALESCE(SUM(amount) FILTER (WHERE DATE(exit_at) = CURRENT_DATE), 0) AS revenue_today,
          COUNT(id) FILTER (WHERE DATE(entry_at) = CURRENT_DATE) AS entries_today
        FROM tickets 
        WHERE sede_id IN (SELECT id FROM sedes WHERE tenant_id = $1)
      `, [tenantId]);
      
      const kpis = {
        ...sedesAgRes.rows[0],
        ...usersAgRes.rows[0],
        ...ticketsAgRes.rows[0]
      };

      // 2. Ingresos de los últimos 7 días
      const trendRes = await pool.query(`
        SELECT
          TO_CHAR(exit_at, 'YYYY-MM-DD') AS day,
          TO_CHAR(exit_at, 'DD/MM')      AS label,
          COALESCE(SUM(amount), 0)       AS revenue
        FROM tickets
        WHERE sede_id IN (SELECT id FROM sedes WHERE tenant_id = $1)
          AND status = 'CERRADO'
          AND exit_at >= NOW() - INTERVAL '7 days'
        GROUP BY TO_CHAR(exit_at, 'YYYY-MM-DD'), TO_CHAR(exit_at, 'DD/MM')
        ORDER BY day ASC
      `, [tenantId]);

      // 3. Resumen por sede (para tabla del dashboard)
      const sedesRes = await pool.query(`
        SELECT
          s.id, s.name, s.capacity, s.is_active,
          COUNT(tk.id) FILTER (WHERE tk.status = 'ABIERTO')                          AS vehicles_inside,
          COALESCE(SUM(tk.amount) FILTER (WHERE DATE(tk.exit_at) = CURRENT_DATE), 0) AS revenue_today,
          COUNT(tk.id) FILTER (WHERE DATE(tk.entry_at) = CURRENT_DATE)               AS entries_today
        FROM sedes s
        LEFT JOIN tickets tk ON tk.sede_id = s.id
        WHERE s.tenant_id = $1
        GROUP BY s.id, s.name, s.capacity, s.is_active
        ORDER BY revenue_today DESC
      `, [tenantId]);

      // 3.5. Breakdown por tipo de vehículo hoy
      const breakdownRes = await pool.query(`
        SELECT type, COUNT(*) as count, COALESCE(SUM(amount), 0) as revenue
        FROM tickets
        WHERE sede_id IN (SELECT id FROM sedes WHERE tenant_id = $1)
          AND DATE(entry_at) = CURRENT_DATE
        GROUP BY type
      `, [tenantId]);

      // 4. Info del plan del tenant
      const planRes = await pool.query(`
        SELECT t.subscription_status, p.name as plan_name, p.price as plan_price,
               p.max_sedes, p.max_users,
               (SELECT COUNT(*) FROM sedes WHERE tenant_id = t.id) AS used_sedes,
               (SELECT COUNT(*) FROM users WHERE tenant_id = t.id AND role != 'SUPERADMIN') AS used_users
        FROM tenants t LEFT JOIN saas_plans p ON t.plan_id = p.id
        WHERE t.id = $1
      `, [tenantId]);

      res.json({
        kpis: {
          activeSedes: parseInt(kpis.active_sedes),
          totalSedes: parseInt(kpis.total_sedes),
          activeUsers: parseInt(kpis.active_users),
          vehiclesInside: parseInt(kpis.vehicles_inside),
          revenueToday: parseFloat(kpis.revenue_today),
          entriesToday: parseInt(kpis.entries_today),
        },
        trend: trendRes.rows.map(r => ({ label: r.label, revenue: parseFloat(r.revenue) })),
        todayBreakdown: breakdownRes.rows.map(r => ({
          type: r.type,
          count: parseInt(r.count),
          revenue: parseFloat(r.revenue)
        })),
        sedes: sedesRes.rows,
        plan: planRes.rows[0] || null,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ADMIN_TENANT: reporte de tickets filtrable por sede y rango de fechas
  async getReportes(req, res) {
    try {
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const { sedeId, from, to } = req.query;

      let query = `
        SELECT
          tk.id, tk.plate, tk.type, tk.status,
          tk.entry_at, tk.exit_at, tk.minutes_parked, tk.amount,
          s.name AS sede_name,
          u.name AS created_by_name
        FROM tickets tk
        JOIN sedes s ON tk.sede_id = s.id
        LEFT JOIN users u ON tk.created_by = u.id
        WHERE s.tenant_id = $1
          AND tk.status = 'CERRADO'
      `;
      const params = [tenantId];
      let idx = 2;

      if (sedeId) { query += ` AND s.id = $${idx++}`; params.push(sedeId); }
      if (from)   { query += ` AND DATE(tk.exit_at) >= $${idx++}`; params.push(from); }
      if (to)     { query += ` AND DATE(tk.exit_at) <= $${idx++}`; params.push(to); }

      query += ' ORDER BY tk.exit_at DESC LIMIT 500';

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ADMIN_TENANT: Finanzas y egresos
  async getFinances(req, res) {
    try {
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      // 1. Total Ingresos histórico
      const incomeRes = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total_income
        FROM tickets
        WHERE sede_id IN (SELECT id FROM sedes WHERE tenant_id = $1)
          AND status = 'CERRADO'
      `, [tenantId]);

      // 2. Total Egresos histórico
      const expenseRes = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total_expense
        FROM cash_expenses
        WHERE tenant_id = $1
      `, [tenantId]);

      // 3. Egresos recientes
      const recentExpensesRes = await pool.query(`
        SELECT e.id, e.description, e.amount, e.created_at, u.name AS user_name, s.name AS sede_name
        FROM cash_expenses e
        JOIN users u ON e.user_id = u.id
        JOIN sedes s ON e.sede_id = s.id
        WHERE e.tenant_id = $1
        ORDER BY e.created_at DESC
        LIMIT 50
      `, [tenantId]);

      // 4. Trend (Últimos 30 días)
      const trendRes = await pool.query(`
        WITH days AS (
          SELECT generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day')::date AS day
        ),
        income AS (
          SELECT DATE(exit_at) AS day, COALESCE(SUM(amount), 0) AS amount
          FROM tickets
          WHERE sede_id IN (SELECT id FROM sedes WHERE tenant_id = $1) AND status = 'CERRADO'
            AND exit_at >= CURRENT_DATE - INTERVAL '29 days'
          GROUP BY DATE(exit_at)
        ),
        expenses AS (
          SELECT DATE(created_at) AS day, COALESCE(SUM(amount), 0) AS amount
          FROM cash_expenses
          WHERE tenant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '29 days'
          GROUP BY DATE(created_at)
        )
        SELECT 
          TO_CHAR(d.day, 'DD/MM') AS label,
          COALESCE(i.amount, 0) AS income,
          COALESCE(e.amount, 0) AS expense
        FROM days d
        LEFT JOIN income i ON d.day = i.day
        LEFT JOIN expenses e ON d.day = e.day
        ORDER BY d.day ASC
      `, [tenantId]);

      const totalIncome = parseFloat(incomeRes.rows[0].total_income);
      const totalExpense = parseFloat(expenseRes.rows[0].total_expense);

      res.json({
        kpis: {
          income: totalIncome,
          expense: totalExpense,
          profit: totalIncome - totalExpense
        },
        expenses: recentExpensesRes.rows.map(r => ({ ...r, amount: parseFloat(r.amount) })),
        trend: trendRes.rows.map(r => ({
          label: r.label,
          income: parseFloat(r.income),
          expense: parseFloat(r.expense)
        }))
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = DashboardController;
