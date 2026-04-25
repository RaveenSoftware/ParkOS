const router = require('express').Router();
const TenantController = require('../controllers/tenant.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

// Solo SUPERADMIN puede gestionar tenants
router.use(auth, requireRole(['SUPERADMIN']));

router.get('/', TenantController.getAll);
router.post('/', TenantController.create);
router.put('/:id', TenantController.update);
router.put('/:id/status', TenantController.toggleStatus);

module.exports = router;


