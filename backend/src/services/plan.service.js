const PlanRepository = require('../repositories/plan.repository');

const PlanService = {
  async getAllPlans() {
    return PlanRepository.findAll();
  },

  async createPlan(name, price, maxSedes, maxUsers, features) {
    if (!name || price === undefined) throw new Error('Nombre y precio son obligatorios');
    return PlanRepository.create(name, price, maxSedes || 1, maxUsers || 5, features);
  },

  async updatePlan(id, name, price, maxSedes, maxUsers, features) {
    return PlanRepository.update(id, name, price, maxSedes, maxUsers, features);
  }
};

module.exports = PlanService;
