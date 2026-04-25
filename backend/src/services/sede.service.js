const SedeRepository = require('../repositories/sede.repository');
const TenantRepository = require('../repositories/tenant.repository');

const SedeService = {
  async getSedesByTenant(tenantId) {
    if (!tenantId) throw new Error('Tenant ID requerido');
    return SedeRepository.findByTenant(tenantId);
  },

  async createSede(tenantId, name, address, capacity) {
    if (!tenantId || !name) throw new Error('Nombre y Tenant requeridos');

    // Validación de límites del Plan
    const tenant = await TenantRepository.findByIdWithPlan(tenantId);
    if (!tenant) throw new Error('Empresa no encontrada');

    const sedes = await SedeRepository.findByTenant(tenantId);
    if (sedes.length >= tenant.max_sedes) {
      throw new Error(`Has alcanzado el límite de sedes de tu plan (${tenant.max_sedes}). Contacta a soporte para hacer un upgrade.`);
    }

    return SedeRepository.create(tenantId, name, address, capacity || 50);
  },

  async toggleStatus(id, tenantId, currentStatus) {
    return SedeRepository.updateStatus(id, tenantId, !currentStatus);
  },

  async updateSede(id, tenantId, name, address, capacity) {
    if (!name) throw new Error('El nombre es obligatorio');
    return SedeRepository.update(id, tenantId, name, address, capacity);
  }
};

module.exports = SedeService;
