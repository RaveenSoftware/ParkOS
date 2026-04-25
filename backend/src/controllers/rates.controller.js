// Tarifas por defecto del sistema (fallback si el tenant no tiene tarifas propias)
const DEFAULT_RATES = {
  CARRO:     { POR_HORA: 2000, POR_DIA: 15000, NOCTURNA: 3000, MINIMO: 1000 },
  MOTO:      { POR_HORA: 1200, POR_DIA: 8000,  NOCTURNA: 1800, MINIMO: 600  },
  BICICLETA: { POR_HORA: 600,  POR_DIA: 3000,  NOCTURNA: 800,  MINIMO: 300  },
  CAMION:    { POR_HORA: 4000, POR_DIA: 30000, NOCTURNA: 5000, MINIMO: 2000 },
};

const pool = require('../config/database');

const RatesController = {
  // GET /rates — obtener tarifas del tenant (con fallback al sistema)
  async get(req, res) {
    try {
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const result = await pool.query(
        'SELECT vehicle_type, rate_type, amount FROM parking_rates WHERE tenant_id = $1 ORDER BY vehicle_type, rate_type',
        [tenantId]
      );

      // Mapear lo existente
      const existing = result.rows.map(r => ({
        vehicle_type: r.vehicle_type,
        rate_type: r.rate_type,
        amount: parseFloat(r.amount)
      }));

      // Rellenar lo que falte con los valores por defecto
      const vehicles = ['CARRO', 'MOTO', 'BICICLETA', 'CAMION'];
      const rateTypes = ['POR_HORA', 'POR_DIA', 'NOCTURNA', 'MINIMO'];
      const flatRates = [];

      for (const v of vehicles) {
        for (const rt of rateTypes) {
          const found = existing.find(e => e.vehicle_type === v && e.rate_type === rt);
          if (found) {
            flatRates.push(found);
          } else {
            flatRates.push({
              vehicle_type: v,
              rate_type: rt,
              amount: DEFAULT_RATES[v]?.[rt] || 0
            });
          }
        }
      }

      res.json(flatRates);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // PUT /rates — guardar/actualizar tarifas en lote
  async save(req, res) {
    try {
      const tenantId = req.user.tenantId;
      if (!tenantId) return res.status(403).json({ error: 'Acceso denegado' });

      const { rates } = req.body;
      if (!Array.isArray(rates)) {
        return res.status(400).json({ error: 'Se esperaba un arreglo de tarifas en req.body.rates' });
      }

      for (const rate of rates) {
        const { vehicle_type, rate_type, amount } = rate;
        if (!vehicle_type || !rate_type || amount === undefined) continue;

        await pool.query(`
          INSERT INTO parking_rates (tenant_id, vehicle_type, rate_type, amount)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (tenant_id, vehicle_type, rate_type) DO UPDATE
            SET amount = EXCLUDED.amount
        `, [tenantId, vehicle_type.toUpperCase(), rate_type.toUpperCase(), amount]);
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // GET /rates/public/:sedeId — para el POS, obtener tarifas del tenant de una sede
  async getForSede(req, res) {
    try {
      const { sedeId } = req.params;
      const sedeRes = await pool.query('SELECT tenant_id FROM sedes WHERE id = $1', [sedeId]);
      if (!sedeRes.rows[0]) return res.status(404).json({ error: 'Sede no encontrada' });

      const tenantId = sedeRes.rows[0].tenant_id;
      const result = await pool.query(
        'SELECT vehicle_type, rate_type, amount, min_charge FROM parking_rates WHERE tenant_id = $1',
        [tenantId]
      );

      const ratesMap = {};
      for (const row of result.rows) {
        if (!ratesMap[row.vehicle_type]) ratesMap[row.vehicle_type] = {};
        ratesMap[row.vehicle_type][row.rate_type] = { amount: parseFloat(row.amount), min_charge: parseFloat(row.min_charge) };
      }

      // Rellenar con defaults
      const vehicles = ['CARRO', 'MOTO', 'BICICLETA', 'CAMION'];
      const rateTypes = ['POR_HORA', 'POR_DIA', 'NOCTURNA', 'MINIMO'];
      for (const v of vehicles) {
        if (!ratesMap[v]) ratesMap[v] = {};
        for (const rt of rateTypes) {
          if (!ratesMap[v][rt]) ratesMap[v][rt] = { amount: DEFAULT_RATES[v]?.[rt] || 0, min_charge: 0 };
        }
      }

      res.json(ratesMap);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = RatesController;
