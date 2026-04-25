const UserRepository = require('../repositories/user.repository');

const UserService = {
  // Crea el usuario ADMIN_TENANT de una empresa (ejecutado por SuperAdmin)
  async createAdminTenant(tenantId, name, email, password) {
    if (!tenantId || !name || !email || !password) throw new Error('Todos los campos son obligatorios');
    const existing = await UserRepository.findByEmail(email);
    if (existing) throw new Error('Ese correo electrónico ya está en uso');
    return UserRepository.createAdminTenant(tenantId, name, email, password);
  },

  async getUsersByTenant(tenantId) {
    if (!tenantId) throw new Error('Tenant ID requerido');
    return UserRepository.findByTenant(tenantId);
  },

  async createCajero(tenantId, sedeId, name, email, password) {
    if (!tenantId || !sedeId || !name || !email || !password) {
      throw new Error('Todos los campos son requeridos');
    }
    const existing = await UserRepository.findByEmail(email);
    if (existing) throw new Error('El correo ya está en uso');

    return UserRepository.createCajero(tenantId, sedeId, name, email, password);
  },

  async toggleStatus(id, tenantId, currentStatus) {
    return UserRepository.updateStatus(id, tenantId, !currentStatus);
  },

  async updateUser(id, tenantId, name, sedeId) {
    if (!name) throw new Error('El nombre es obligatorio');
    return UserRepository.update(id, tenantId, name, sedeId);
  },

  async removeUser(id, tenantId) {
    // Verificar que el usuario existe y es del tenant
    const user = await UserRepository.findById(id);
    if (!user || user.tenant_id !== tenantId) throw new Error('Usuario no encontrado');
    if (user.role === 'ADMIN_TENANT' || user.role === 'SUPERADMIN') {
      throw new Error('No puedes eliminar un usuario administrador');
    }
    return UserRepository.delete(id, tenantId);
  },

  async resetPassword(id, tenantId, newPassword) {
    // Verificar que el usuario existe y es del tenant
    const user = await UserRepository.findById(id);
    if (!user || user.tenant_id !== tenantId) throw new Error('Usuario no encontrado');
    return UserRepository.updatePassword(id, tenantId, newPassword);
  }
};

module.exports = UserService;
