const router = require('express').Router();
const ConfigController = require('../controllers/config.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

router.get('/',  auth, requireRole(['ADMIN_TENANT', 'SUPERADMIN', 'CAJERO']), ConfigController.get);
router.put('/',  auth, requireRole(['ADMIN_TENANT', 'SUPERADMIN']), ConfigController.save);

module.exports = router;


