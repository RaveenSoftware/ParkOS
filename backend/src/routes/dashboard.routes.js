const router = require('express').Router();
const DashboardController = require('../controllers/dashboard.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

// POS: estadísticas de la sede del cajero
router.get('/stats', auth, DashboardController.getStats);

// ADMIN_TENANT: métricas corporativas de todas sus sedes
router.get('/tenant', auth, requireRole(['ADMIN_TENANT', 'SUPERADMIN']), DashboardController.getTenantStats);

// ADMIN_TENANT: reporte de tickets cerrados filtrable
router.get('/reportes', auth, requireRole(['ADMIN_TENANT', 'SUPERADMIN']), DashboardController.getReportes);

// ADMIN_TENANT: finanzas avanzadas
router.get('/finances', auth, requireRole(['ADMIN_TENANT', 'SUPERADMIN']), DashboardController.getFinances);

module.exports = router;


