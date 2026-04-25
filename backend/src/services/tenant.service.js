const TenantRepository = require('../repositories/tenant.repository');

const TenantService = {
  async getAllTenants() {
    return TenantRepository.findAll();
  },

  async createTenant(name, planId, documentId, contactEmail, phone) {
    if (!name || !planId) throw new Error('El nombre de la empresa y el Plan son obligatorios');
    return TenantRepository.create(name, planId, documentId, contactEmail, phone);
  },

  async updateTenant(id, name, planId, documentId, contactEmail, phone, subscriptionStatus, subscriptionStart, subscriptionEnd, planTemplate) {
    if (!name || !planId) throw new Error('El nombre de la empresa y el Plan son obligatorios');
    return TenantRepository.update(
      id, name, planId, documentId, contactEmail, phone, 
      subscriptionStatus, subscriptionStart, subscriptionEnd, planTemplate
    );
  },

  async toggleStatus(id, currentStatus) {
    return TenantRepository.updateStatus(id, !currentStatus);
  }
};

module.exports = TenantService;
