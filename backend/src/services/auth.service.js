const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/user.repository');

const AuthService = {
  async login(email, password) {
    if (!email || !password) throw new Error('Email y contraseña son requeridos');

    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error('Credenciales inválidas');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Credenciales inválidas');

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        name: user.name,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name || null,
        sedeId: user.sede_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name || null,
        sedeId: user.sede_id
      },
    };
  },

  async impersonate(tenantId) {
    // Buscar el nombre del tenant para mostrarlo en el sidebar
    const pool = require('../config/database');
    const tenantRes = await pool.query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
    const tenantName = tenantRes.rows[0]?.name || 'Empresa';

    const token = jwt.sign(
      { 
        id: -1,
        email: 'superadmin_impersonating@parkos.io', 
        role: 'ADMIN_TENANT', 
        name: 'Soporte ParkOS',
        tenantId: parseInt(tenantId),
        tenantName,
        sedeId: null
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      token,
      user: { 
        id: -1, 
        name: 'Soporte ParkOS', 
        email: 'superadmin_impersonating@parkos.io', 
        role: 'ADMIN_TENANT',
        tenantId: parseInt(tenantId),
        tenantName,
        sedeId: null
      },
    };
  }
};

module.exports = AuthService;
