const TenantService = require('../services/tenant.service');

const TenantController = {
  async getAll(req, res) {
    try {
      const tenants = await TenantService.getAllTenants();
      res.json(tenants);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name, planId, documentId, contactEmail, phone } = req.body;
      const tenant = await TenantService.createTenant(name, planId, documentId, contactEmail, phone);
      res.status(201).json(tenant);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, planId, documentId, contactEmail, phone, 
        subscriptionStatus, subscriptionStart, subscriptionEnd, planTemplate 
      } = req.body;
      const tenant = await TenantService.updateTenant(
        id, name, planId, documentId, contactEmail, phone, 
        subscriptionStatus, subscriptionStart, subscriptionEnd, planTemplate
      );
      res.json(tenant);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const tenant = await TenantService.toggleStatus(id, isActive);
      res.json(tenant);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = TenantController;
