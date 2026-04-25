const router = require('express').Router();
const ConfigController = require('../controllers/config.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

router.use(auth, requireRole(['ADMIN_TENANT', 'SUPERADMIN']));

router.get('/',  ConfigController.get);
router.put('/',  ConfigController.save);

module.exports = router;


