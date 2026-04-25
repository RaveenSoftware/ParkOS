const router = require('express').Router();
const SaasController = require('../controllers/saas.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

// SUPERADMIN ONLY — todo este router requiere autenticación + rol SUPERADMIN
router.use(auth, requireRole(['SUPERADMIN']));

// Dashboard ejecutivo
router.get('/metrics', SaasController.getMetrics);

// Gestión global de usuarios
router.get('/users', SaasController.getAllUsers);
router.patch('/users/:id/status', SaasController.toggleUserStatus);

// Gestión global de sedes
router.get('/sedes', SaasController.getAllSedes);

// Log de auditoría
router.get('/audit-log', SaasController.getAuditLog);

module.exports = router;


