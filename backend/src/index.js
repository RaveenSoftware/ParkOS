require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const saasRoutes = require('./routes/saas.routes');
const planRoutes = require('./routes/plan.routes');
const tenantRoutes = require('./routes/tenant.routes');
const sedeRoutes = require('./routes/sede.routes');
const userRoutes = require('./routes/user.routes');
const ticketRoutes = require('./routes/ticket.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const configRoutes = require('./routes/config.routes');
const ratesRoutes = require('./routes/rates.routes');
const shiftRoutes = require('./routes/shift.routes');
const subscriberRoutes = require('./routes/subscriber.routes');
const expenseRoutes = require('./routes/expense.routes');
const spotRoutes = require('./routes/spot.routes');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'] }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/saas', saasRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/sedes', sedeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/config', configRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/spots', spotRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', service: 'ParkOS API' }));

app.listen(PORT, () => {
  console.log(`🚗 ParkOS Backend corriendo en http://localhost:${PORT}`);
});
