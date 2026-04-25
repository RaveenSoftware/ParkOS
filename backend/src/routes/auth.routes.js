const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

router.post('/login', AuthController.login);
router.get('/me', auth, AuthController.me);
router.post('/impersonate/:tenantId', auth, requireRole(['SUPERADMIN']), AuthController.impersonate);

module.exports = router;


