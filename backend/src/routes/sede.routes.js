const router = require('express').Router();
const SedeController = require('../controllers/sede.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

// Solo ADMIN_TENANT puede gestionar sedes de su empresa
router.use(auth, requireRole(['ADMIN_TENANT', 'SUPERADMIN']));

router.get('/', SedeController.getByTenant);
router.post('/', SedeController.create);
router.put('/:id', SedeController.update);
router.put('/:id/status', SedeController.toggleStatus);

module.exports = router;


