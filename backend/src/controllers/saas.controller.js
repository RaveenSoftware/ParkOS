const pool = require('../config/database');

const SaasController = {
  /**
   * GET /saas/metrics
   * Dashboard ejecutivo: KPIs + tendencia MRR + distribución por plan + alertas
   */
  async getMetrics(req, res) {
    try {
      // 1. MRR (Ingreso Mensual Recurrente) de clientes activos vs trial
      const mrrRes = await pool.query(`
        SELECT 
          COALESCE(SUM(p.price) FILTER (WHERE t.subscription_status = 'ACTIVE'), 0) as mrr_active,
          COALESCE(SUM(p.price) FILTER (WHERE t.subscription_status = 'TRIAL'), 0) as mrr_trial
        FROM tenants t
        JOIN saas_plans p ON t.plan_id = p.id
        WHERE t.is_active = TRUE
      `);

      // 2. Conteo de tenants por estado
      const tenantsRes = await pool.query(`
        SELECT 
          COUNT(*) as total_tenants,
          COUNT(*) FILTER (WHERE is_active = TRUE) as active_tenants,
          COUNT(*) FILTER (WHERE subscription_status = 'TRIAL') as trial_tenants,
          COUNT(*) FILTER (WHERE subscription_status = 'PAST_DUE') as pastdue_tenants,
          COUNT(*) FILTER (WHERE subscription_status = 'SUSPENDED' OR is_active = FALSE) as suspended_tenants
        FROM tenants
      `);

      // 3. Conteo de sedes activas globales
      const sedesRes = await pool.query(`
        SELECT COUNT(*) as active_sedes, SUM(capacity) as total_capacity
        FROM sedes
        WHERE is_active = TRUE
      `);

      // 4. Conteo de usuarios operativos globales
      const usersRes = await pool.query(`
        SELECT COUNT(*) as total_users
        FROM users
        WHERE is_active = TRUE AND role != 'SUPERADMIN'
      `);

      // 5. Tendencia MRR: últimos 6 meses (simulada con tenants creados por mes)
      const mrrTrendRes = await pool.query(`
        SELECT 
          TO_CHAR(t.created_at, 'YYYY-MM') as month,
          TO_CHAR(t.created_at, 'Mon') as month_label,
          COALESCE(SUM(p.price), 0) as mrr
        FROM tenants t
        JOIN saas_plans p ON t.plan_id = p.id
        WHERE t.created_at >= NOW() - INTERVAL '6 months'
          AND t.subscription_status IN ('ACTIVE', 'TRIAL')
        GROUP BY TO_CHAR(t.created_at, 'YYYY-MM'), TO_CHAR(t.created_at, 'Mon')
        ORDER BY month ASC
      `);

      // 6. Distribución por plan
      const planDistRes = await pool.query(`
        SELECT p.name as plan_name, COUNT(t.id) as count
        FROM saas_plans p
        LEFT JOIN tenants t ON t.plan_id = p.id AND t.is_active = TRUE
        GROUP BY p.id, p.name
        ORDER BY p.id ASC
      `);

      // 7. Últimas 5 altas de tenants
      const recentTenantsRes = await pool.query(`
        SELECT t.id, t.name, t.contact_email, t.subscription_status, t.created_at, p.name as plan_name
        FROM tenants t
        LEFT JOIN saas_plans p ON t.plan_id = p.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `);

      // 8. Tickets recaudados hoy en toda la plataforma
      const revenueRes = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as revenue_today, COUNT(*) FILTER (WHERE status = 'CERRADO') as exits_today
        FROM tickets
        WHERE DATE(exit_at) = CURRENT_DATE
      `);

      const mrrActive = parseFloat(mrrRes.rows[0].mrr_active);
      const mrrTrial = parseFloat(mrrRes.rows[0].mrr_trial);

      res.json({
        mrr: mrrActive,
        mrrTrial,
        arr: mrrActive * 12,
        tenants: {
          total: parseInt(tenantsRes.rows[0].total_tenants),
          active: parseInt(tenantsRes.rows[0].active_tenants),
          trial: parseInt(tenantsRes.rows[0].trial_tenants),
          pastDue: parseInt(tenantsRes.rows[0].pastdue_tenants),
          suspended: parseInt(tenantsRes.rows[0].suspended_tenants),
        },
        sedes: {
          active: parseInt(sedesRes.rows[0].active_sedes),
          totalCapacity: parseInt(sedesRes.rows[0].total_capacity || 0),
        },
        activeUsers: parseInt(usersRes.rows[0].total_users),
        mrrTrend: mrrTrendRes.rows.map(r => ({
          month: r.month_label,
          mrr: parseFloat(r.mrr)
        })),
        planDistribution: planDistRes.rows.map(r => ({
          plan: r.plan_name,
          count: parseInt(r.count)
        })),
        recentTenants: recentTenantsRes.rows,
        today: {
          revenueToday: parseFloat(revenueRes.rows[0].revenue_today),
          exitsToday: parseInt(revenueRes.rows[0].exits_today),
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * GET /saas/users
   * Lista global de todos los usuarios del sistema (sin SuperAdmin)
   */
  async getAllUsers(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          u.id, u.name, u.email, u.role, u.is_active, u.created_at,
          t.name as tenant_name,
          s.name as sede_name
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        LEFT JOIN sedes s ON u.sede_id = s.id
        WHERE u.role != 'SUPERADMIN'
        ORDER BY u.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * PATCH /saas/users/:id/status
   * Activar/desactivar un usuario desde el panel SuperAdmin
   */
  async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `UPDATE users SET is_active = NOT is_active WHERE id = $1 AND role != 'SUPERADMIN' RETURNING id, is_active`,
        [id]
      );
      if (!result.rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * GET /saas/sedes
   * Lista global de todas las sedes con métricas de ocupación
   */
  async getAllSedes(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          s.id, s.name, s.address, s.capacity, s.is_active,
          t.name as tenant_name,
          COUNT(tk.id) FILTER (WHERE tk.status = 'ABIERTO') as tickets_open,
          COALESCE(SUM(tk.amount) FILTER (WHERE DATE(tk.exit_at) = CURRENT_DATE), 0) as revenue_today,
          COUNT(tk.id) FILTER (WHERE DATE(tk.entry_at) = CURRENT_DATE) as entries_today
        FROM sedes s
        LEFT JOIN tenants t ON s.tenant_id = t.id
        LEFT JOIN tickets tk ON tk.sede_id = s.id
        GROUP BY s.id, s.name, s.address, s.capacity, s.is_active, t.name
        ORDER BY s.id ASC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /**
   * GET /saas/audit-log
   * Log global de tickets de todo el sistema (con paginación simple)
   */
  async getAuditLog(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const offset = (page - 1) * limit;

      const result = await pool.query(`
        SELECT 
          tk.id, tk.plate, tk.vehicle_type as type, tk.status,
          tk.entry_at, tk.exit_at, 
          EXTRACT(EPOCH FROM (COALESCE(tk.exit_at, NOW()) - tk.entry_at))/60 AS minutes_parked, 
          tk.amount,
          s.name as sede_name,
          t.name as tenant_name,
          u.name as created_by_name
        FROM tickets tk
        LEFT JOIN sedes s ON tk.sede_id = s.id
        LEFT JOIN tenants t ON s.tenant_id = t.id
        LEFT JOIN users u ON tk.created_by = u.id
        ORDER BY tk.entry_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = SaasController;
