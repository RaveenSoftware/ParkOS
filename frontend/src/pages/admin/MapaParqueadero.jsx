import { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';

const SPOT_TYPES = [
  { key: 'CARRO',         label: 'Carro',         color: '#3B82F6', icon: '🚗' },
  { key: 'MOTO',          label: 'Moto',           color: '#8B5CF6', icon: '🏍️' },
  { key: 'BICICLETA',     label: 'Bicicleta',      color: '#10B981', icon: '🚲' },
  { key: 'CAMION',        label: 'Camión',          color: '#F59E0B', icon: '🚛' },
  { key: 'DISCAPACITADO', label: 'Discapacitado',  color: '#EC4899', icon: '♿' },
  { key: 'BLOQUE',        label: 'Bloque/Pared',   color: '#374151', icon: '🧱' },
];

const TOOLS = [
  { key: 'ADD',    label: 'Añadir Plaza', icon: '➕' },
  { key: 'DELETE', label: 'Eliminar',     icon: '🗑️' },
];

const GRID_ROWS = 20;
const GRID_COLS = 12;

function getTypeConfig(key) {
  return SPOT_TYPES.find(t => t.key === key) || SPOT_TYPES[0];
}

export default function MapaParqueadero() {
  const [sedes, setSedes] = useState([]);
  const [selectedSede, setSelectedSede] = useState(null);
  const [spots, setSpots] = useState({}); // key: "row_col"
  const [tool, setTool] = useState('ADD');
  const [selectedType, setSelectedType] = useState('CARRO');
  const [editingCell, setEditingCell] = useState(null);
  const [tempCode, setTempCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    api.get('/sedes').then(setSedes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSede) return;
    setLoading(true);
    api.get(`/spots/${selectedSede}`)
      .then(({ spots: dbSpots }) => {
        const map = {};
        dbSpots.forEach(s => { map[`${s.row_pos}_${s.col_pos}`] = s; });
        setSpots(map);
      })
      .catch(() => setMessage({ text: 'Error cargando mapa', type: 'error' }))
      .finally(() => setLoading(false));
  }, [selectedSede]);

  const handleCellAction = (row, col) => {
    const key = `${row}_${col}`;
    if (tool === 'DELETE') {
      setSpots(prev => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }
    if (tool === 'ADD') {
      if (spots[key]) {
        // Click en plaza existente → editar
        setEditingCell({ row, col, key });
        setTempCode(spots[key].spot_code || `${row+1}${String.fromCharCode(65+col)}`);
        return;
      }
      const autoCode = `${String.fromCharCode(65 + Math.floor(col / 1))}${row + 1}`;
      setSpots(prev => ({
        ...prev,
        [key]: { row_pos: row, col_pos: col, spot_code: autoCode, spot_type: selectedType }
      }));
    }
  };

  const handleMouseEnter = (row, col) => {
    if (!isDragging || tool !== 'ADD') return;
    const key = `${row}_${col}`;
    if (!spots[key]) {
      const autoCode = `${String.fromCharCode(65 + col)}${row + 1}`;
      setSpots(prev => ({
        ...prev,
        [key]: { row_pos: row, col_pos: col, spot_code: autoCode, spot_type: selectedType }
      }));
    }
  };

  const handleSaveLayout = async () => {
    if (!selectedSede) return;
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const spotsArray = Object.values(spots).map(s => ({
        spot_code: s.spot_code,
        row_pos: s.row_pos,
        col_pos: s.col_pos,
        spot_type: s.spot_type,
      }));
      await api.put('/spots/layout', { sede_id: selectedSede, spots: spotsArray });
      setMessage({ text: `✅ Mapa guardado con ${spotsArray.length} plazas.`, type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const confirmEditCode = () => {
    if (!editingCell) return;
    setSpots(prev => ({
      ...prev,
      [editingCell.key]: { ...prev[editingCell.key], spot_code: tempCode, spot_type: selectedType }
    }));
    setEditingCell(null);
  };

  const totalSpots = Object.values(spots).filter(s => s.spot_type !== 'BLOQUE').length;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-black text-white">Diseñador del Parqueadero</h1>
          <p className="text-white/30 text-xs mt-0.5">Diseña el mapa visual de tu parqueadero por sede.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedSede || ''}
            onChange={e => setSelectedSede(e.target.value ? Number(e.target.value) : null)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
          >
            <option value="">— Seleccionar Sede —</option>
            {sedes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {selectedSede && (
            <button
              onClick={handleSaveLayout}
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-white text-black font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : `Guardar Mapa (${totalSpots} plazas)`}
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`mx-6 mt-3 px-4 py-2 rounded-lg text-sm border shrink-0 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
          {message.text}
        </div>
      )}

      {!selectedSede ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🅿️</div>
            <p className="text-white/30 text-lg font-medium">Selecciona una sede para comenzar a diseñar</p>
            <p className="text-white/20 text-sm mt-2">Cada sede tiene su propio mapa independiente</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Toolbar */}
          <div className="w-56 border-r border-white/10 p-4 flex flex-col gap-6 overflow-y-auto shrink-0 bg-black">
            {/* Tools */}
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Herramienta</p>
              <div className="flex flex-col gap-1">
                {TOOLS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTool(t.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${tool === t.key ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                  >
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type selector */}
            {tool === 'ADD' && (
              <div>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Tipo de Plaza</p>
                <div className="flex flex-col gap-1">
                  {SPOT_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setSelectedType(t.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${selectedType === t.key ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2">Instrucciones</p>
              <div className="text-white/30 text-xs space-y-1.5">
                <p>• <strong className="text-white/50">Clic</strong>: añadir plaza</p>
                <p>• <strong className="text-white/50">Arrastrar</strong>: dibujar múltiples</p>
                <p>• <strong className="text-white/50">Clic derecho</strong>: eliminar</p>
                <p>• <strong className="text-white/50">Clic en plaza</strong>: editar código</p>
              </div>
            </div>
          </div>

          {/* Grid canvas */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin" />
              </div>
            ) : (
              <div
                className="inline-grid gap-1.5"
                style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
                onMouseLeave={() => setIsDragging(false)}
                onMouseUp={() => setIsDragging(false)}
              >
                {Array.from({ length: GRID_ROWS }, (_, row) =>
                  Array.from({ length: GRID_COLS }, (_, col) => {
                    const key = `${row}_${col}`;
                    const spot = spots[key];
                    const typeConfig = spot ? getTypeConfig(spot.spot_type) : null;
                    return (
                      <div
                        key={key}
                        className={`w-14 h-14 rounded-lg border flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-100 relative group ${
                          spot
                            ? 'border-transparent shadow-lg'
                            : 'border-white/5 hover:border-white/20 hover:bg-white/5'
                        }`}
                        style={spot ? { backgroundColor: typeConfig?.color + '22', borderColor: typeConfig?.color + '66' } : {}}
                        onMouseDown={() => { setIsDragging(true); handleCellAction(row, col); }}
                        onMouseEnter={() => handleMouseEnter(row, col)}
                        onContextMenu={(e) => { e.preventDefault(); const k = `${row}_${col}`; setSpots(prev => { const n = {...prev}; delete n[k]; return n; }); }}
                      >
                        {spot ? (
                          <>
                            <span className="text-lg leading-none">{typeConfig?.icon}</span>
                            <span className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: typeConfig?.color }}>{spot.spot_code}</span>
                            {/* Hover overlay */}
                            <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">Editar</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-white/10 text-xs">+</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit code modal */}
      {editingCell && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-80 space-y-4 shadow-2xl">
            <h3 className="text-white font-black text-lg">Editar Plaza</h3>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-widest block mb-1.5">Código de Plaza</label>
              <input
                autoFocus
                type="text"
                value={tempCode}
                onChange={e => setTempCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && confirmEditCode()}
                maxLength={8}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50"
                placeholder="Ej: A1, B3, VIP-1"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs uppercase tracking-widest block mb-1.5">Tipo</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SPOT_TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setSelectedType(t.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${selectedType === t.key ? 'bg-white text-black font-bold' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingCell(null)} className="flex-1 py-2 rounded-lg border border-white/10 text-white/50 hover:text-white text-sm transition-colors">Cancelar</button>
              <button onClick={confirmEditCode} className="flex-1 py-2 rounded-lg bg-white text-black font-bold text-sm hover:bg-white/90 transition-all">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
