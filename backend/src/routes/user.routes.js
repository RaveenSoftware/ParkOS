const router = require('express').Router();
const UserController = require('../controllers/user.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

// SUPERADMIN ONLY: crear admin de un tenant con credenciales asignadas
router.post(
  '/admin',
  auth,
  requireRole(['SUPERADMIN']),
  UserController.createAdminTenant
);

// ADMIN_TENANT + SUPERADMIN: gestión del personal de su empresa
router.use(auth, requireRole(['ADMIN_TENANT', 'SUPERADMIN']));

router.get('/', UserController.getByTenant);
router.post('/cajero', UserController.createCajero);
router.put('/:id', UserController.update);
router.delete('/:id', UserController.remove);
router.put('/:id/status', UserController.toggleStatus);
router.post('/:id/reset-password', UserController.resetPassword);

module.exports = router;


