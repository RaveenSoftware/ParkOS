const TicketService = require('../services/ticket.service');

const TicketController = {
  async registerEntry(req, res) {
    try {
      const { plate, type, spotId, clientName, clientDoc } = req.body;
      if (!req.user.sedeId) return res.status(403).json({ error: 'Usuario no asignado a una sede' });
      const ticket = await TicketService.registerEntry(plate, type, req.user.id, req.user.sedeId, spotId || null, clientName || null, clientDoc || null);
      res.status(201).json(ticket);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getOpen(req, res) {
    try {
      if (!req.user.sedeId) return res.json([]);
      const tickets = await TicketService.getOpenTickets(req.user.sedeId);
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async checkout(req, res) {
    try {
      if (!req.user.sedeId) return res.status(403).json({ error: 'Usuario no asignado a una sede' });
      const { clientName, clientDoc } = req.body || {};
      const ticket = await TicketService.checkout(req.params.id, req.user.sedeId, clientName, clientDoc);
      res.json(ticket);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getRecentActivity(req, res) {
    try {
      if (!req.user.sedeId) return res.json([]);
      const tickets = await TicketService.getRecentActivity(req.user.sedeId);
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getHistory(req, res) {
    try {
      if (!req.user.sedeId) return res.json([]);
      const tickets = await TicketService.getClosedTickets(req.user.sedeId);
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = TicketController;
