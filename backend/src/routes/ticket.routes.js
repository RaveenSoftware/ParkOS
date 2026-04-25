const router = require('express').Router();
const TicketController = require('../controllers/ticket.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);
router.post('/entry', TicketController.registerEntry);
router.get('/open', TicketController.getOpen);
router.get('/history', TicketController.getHistory);
router.post('/:id/checkout', TicketController.checkout);
router.get('/recent', TicketController.getRecentActivity);

module.exports = router;


