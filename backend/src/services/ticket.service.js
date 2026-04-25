const pool = require('../config/database');
const TicketRepository = require('../repositories/ticket.repository');

// Tarifas por defecto del sistema (fallback)
const DEFAULT_RATES = {
  CARRO:     { POR_HORA: 2000, POR_DIA: 15000, NOCTURNA: 3000, MINIMO: 1000 },
  MOTO:      { POR_HORA: 1200, POR_DIA: 8000,  NOCTURNA: 1800, MINIMO: 600  },
  BICICLETA: { POR_HORA: 600,  POR_DIA: 3000,  NOCTURNA: 800,  MINIMO: 300  },
  CAMION:    { POR_HORA: 4000, POR_DIA: 30000, NOCTURNA: 5000, MINIMO: 2000 },
};

const TicketService = {
  async registerEntry(plate, type, userId, sedeId, spotId, clientName, clientDoc) {
    if (!plate || !type) throw new Error('Placa y tipo de vehículo son requeridos');
    if (!sedeId) throw new Error('Sede inválida');
    const validTypes = ['CARRO', 'MOTO', 'BICICLETA', 'CAMION'];
    if (!validTypes.includes(type)) throw new Error('Tipo inválido');

    // Validación anti-duplicidad: si ya hay un ticket abierto para esta placa en esta sede
    const existing = await TicketRepository.findOpenByPlate(plate, sedeId);
    if (existing) {
      throw new Error(`El vehículo ${plate.toUpperCase()} ya tiene un ticket abierto en esta sede.`);
    }

    // Validar que la plaza no esté ya ocupada
    if (spotId) {
      const spotOccupied = await TicketRepository.findOpenBySpot(spotId);
      if (spotOccupied) {
        throw new Error(`La plaza seleccionada ya está ocupada por el vehículo ${spotOccupied.plate}.`);
      }
    }

    return TicketRepository.create(plate.toUpperCase().trim(), type, userId, sedeId, spotId, clientName, clientDoc);
  },

  async getOpenTickets(sedeId) {
    return TicketRepository.findOpen(sedeId);
  },

  async getClosedTickets(sedeId) {
    return TicketRepository.findClosed(sedeId);
  },

  async checkout(ticketId, sedeId, clientName, clientDoc) {
    const ticket = await TicketRepository.findById(ticketId, sedeId);
    if (!ticket) throw new Error('Ticket no encontrado en esta sede');
    if (ticket.status === 'CERRADO') throw new Error('Este ticket ya fue cobrado');

    const minutes = Math.max(0, Math.ceil(Number(ticket.minutes_so_far) || 0));
    const hours = Math.ceil(minutes / 60);

    // Obtener tenant_id de la sede
    const sedeRes = await pool.query('SELECT tenant_id FROM sedes WHERE id = $1', [sedeId]);
    const tenantId = sedeRes.rows[0]?.tenant_id;

    // Obtener tarifas personalizadas
    const ratesRes = await pool.query(
      'SELECT rate_type, amount, min_charge FROM parking_rates WHERE tenant_id = $1 AND vehicle_type = $2',
      [tenantId, ticket.type]
    );

    let rateHora = DEFAULT_RATES[ticket.type]?.POR_HORA || 0;
    let rateMinimo = DEFAULT_RATES[ticket.type]?.MINIMO || 0;

    for (const r of ratesRes.rows) {
      if (r.rate_type === 'POR_HORA') rateHora = parseFloat(r.amount);
      if (r.rate_type === 'MINIMO') rateMinimo = parseFloat(r.amount);
    }

    // Cálculo básico (simplificado por ahora: cobra por hora o fracción + valida mínimo)
    const calculated = hours * rateHora;
    const amount = Math.max(calculated, rateMinimo);

    // Generar número de factura único: INV-SEDE-FECHA-RANDOM
    const invoiceNum = `INV-${sedeId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const rateSnapshot = JSON.stringify({ rateHora, rateMinimo, hoursBilled: hours });

    return TicketRepository.closeTicket(ticketId, minutes, amount, sedeId, clientName, clientDoc, invoiceNum, rateSnapshot);
  },

  async getDailyStats(sedeId) {
    return TicketRepository.getDailyStats(sedeId);
  },

  async getRecentActivity(sedeId) {
    return TicketRepository.getRecentActivity(10, sedeId);
  },
};

module.exports = TicketService;
