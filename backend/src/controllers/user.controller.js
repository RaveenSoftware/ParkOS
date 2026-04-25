const UserService = require('../services/user.service');

const UserController = {
  // SUPERADMIN ONLY — crea el admin de un tenant con credenciales asignadas por el SuperAdmin
  async createAdminTenant(req, res) {
    try {
      const { tenantId, name, email, password } = req.body;
      if (!tenantId || !name || !email || !password) {
        return res.status(400).json({ error: 'tenantId, nombre, email y contraseña son obligatorios' });
      }
      const user = await UserService.createAdminTenant(tenantId, name, email, password);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getByTenant(req, res) {
    try {
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'No perteneces a una empresa' });
      const users = await UserService.getUsersByTenant(tenantId);
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createCajero(req, res) {
    try {
      const { name, email, password, sedeId } = req.body;
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'No perteneces a una empresa' });
      const user = await UserService.createCajero(tenantId, sedeId, name, email, password);
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const tenantId = req.user.tenantId;
      const user = await UserService.toggleStatus(id, tenantId, isActive);
      res.json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // NUEVO: Editar nombre y/o sede de un usuario (solo del tenant)
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, sedeId } = req.body;
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });
      const user = await UserService.updateUser(id, tenantId, name, sedeId);
      res.json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // NUEVO: Eliminar un usuario (solo cajeros del tenant, no admins)
  async remove(req, res) {
    try {
      const { id } = req.params;
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });
      await UserService.removeUser(id, tenantId);
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // NUEVO: Resetear contraseña de un usuario del tenant
  async resetPassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }
      await UserService.resetPassword(id, tenantId, newPassword);
      res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = UserController;
