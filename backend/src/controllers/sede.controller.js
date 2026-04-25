const SedeService = require('../services/sede.service');

const SedeController = {
  async getByTenant(req, res) {
    try {
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'No perteneces a una empresa' });
      const sedes = await SedeService.getSedesByTenant(tenantId);
      res.json(sedes);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name, address, capacity } = req.body;
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'No perteneces a una empresa' });
      const sede = await SedeService.createSede(tenantId, name, address, capacity);
      res.status(201).json(sede);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const tenantId = req.user.tenantId;
      const sede = await SedeService.toggleStatus(id, tenantId, isActive);
      res.json(sede);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, address, capacity } = req.body;
      const tenantId = req.user.tenantId;
      const sede = await SedeService.updateSede(id, tenantId, name, address, capacity);
      res.json(sede);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = SedeController;
