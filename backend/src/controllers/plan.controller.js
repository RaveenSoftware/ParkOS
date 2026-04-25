const PlanService = require('../services/plan.service');

const PlanController = {
  async getAll(req, res) {
    try {
      const plans = await PlanService.getAllPlans();
      res.json(plans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name, price, maxSedes, maxUsers, features } = req.body;
      const plan = await PlanService.createPlan(name, price, maxSedes, maxUsers, features);
      res.status(201).json(plan);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, price, maxSedes, maxUsers, features } = req.body;
      const plan = await PlanService.updatePlan(id, name, price, maxSedes, maxUsers, features);
      res.json(plan);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = PlanController;
