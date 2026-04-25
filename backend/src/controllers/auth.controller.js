const AuthService = require('../services/auth.service');

const AuthController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  },

  async me(req, res) {
    res.json(req.user);
  },

  async impersonate(req, res) {
    try {
      const { tenantId } = req.params;
      const data = await AuthService.impersonate(tenantId);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = AuthController;
