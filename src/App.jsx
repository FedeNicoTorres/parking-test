import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  // --- ESTADOS GLOBALES ---
  const [vista, setVista] = useState('ingreso'); 
  const [totalPlazas, setTotalPlazas] = useState(50);
  const [patenteIngreso, setPatenteIngreso] = useState('');
  const [tipoVehiculoId, setTipoVehiculoId] = useState('');
  const [patenteSalida, setPatenteSalida] = useState('');
  const [liquidacion, setLiquidacion] = useState(null);
  const [ultimoIngresado, setUltimoIngresado] = useState(null);

  // --- ESTADOS DE AUTENTICACIÓN ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  const [tarifas, setTarifas] = useState([
    { id: '1', tipo_vehiculo: 'Automóvil', precio_hora: 1200 },
    { id: '2', tipo_vehiculo: 'Motocicleta', precio_hora: 600 },
    { id: '3', tipo_vehiculo: 'Camioneta / SUV', precio_hora: 1800 },
  ]);

  const [vehiculosActivos, setVehiculosActivos] = useState([
    { id: 1, patente: 'AA123BB', tipo_nombre: 'Automóvil', tipo_id: '1', hora_ingreso: new Date(Date.now() - 75 * 60000) },
    { id: 2, patente: 'POV987', tipo_nombre: 'Motocicleta', tipo_id: '2', hora_ingreso: new Date(Date.now() - 30 * 60000) }
  ]);

  const [historialPagos, setHistorialPagos] = useState([
    { id: 1, patente: 'WMK442', tipo_vehiculo: 'Automóvil', minutos_totales: 60, monto_pagado: 1200 }
  ]);

  // --- LÓGICA DE LOGIN ---
  const manejarLogin = (e) => {
    e.preventDefault();
    // Credenciales de prueba fijas
    if (usuario === 'admin' && password === 'admin123') {
      setIsAdmin(true);
      setErrorLogin('');
      setUsuario('');
      setPassword('');
    } else {
      setErrorLogin('Credenciales incorrectas. Intente de nuevo.');
    }
  };

  const cerrarSesion = () => {
    setIsAdmin(false);
    setVista('ingreso');
  };

  // --- LÓGICA DE INGRESO ---
  const registrarIngreso = (e) => {
    e.preventDefault();
    if (vehiculosActivos.length >= totalPlazas) return alert('¡Estacionamiento Lleno!');
    
    const patenteLimpia = patenteIngreso.toUpperCase().replace(/\s+/g, '');
    const yaExiste = vehiculosActivos.some(v => v.patente === patenteLimpia);
    if (yaExiste) {
      alert(`⚠️ Error de Ingreso:\nLa patente "${patenteLimpia}" ya se encuentra ingresada.`);
      return;
    }
    
    const tarifaSeleccionada = tarifas.find(t => t.id === tipoVehiculoId);
    
    const nuevo = {
      id: Date.now(),
      patente: patenteLimpia,
      tipo_nombre: tarifaSeleccionada ? tarifaSeleccionada.tipo_vehiculo : 'Vehículo',
      tipo_id: tipoVehiculoId,
      hora_ingreso: new Date()
    };
    
    setVehiculosActivos([nuevo, ...vehiculosActivos]);
    setUltimoIngresado(nuevo);
    setPatenteIngreso('');

    setTimeout(() => {
      window.print();
    }, 150);
  };

  // --- LÓGICA DE SALIDA ---
  const calcularSalida = (e) => {
    e.preventDefault();
    const patenteBuscar = patenteSalida.toUpperCase().replace(/\s+/g, '');
    const auto = vehiculosActivos.find(v => v.patente === patenteBuscar);
    if (!auto) return alert('La patente no se encuentra registrada.');

    const tarifa = tarifas.find(t => t.id === auto.tipo_id);
    const minutos = Math.ceil((new Date() - auto.hora_ingreso) / 60000);
    const horasACobrar = minutos <= 10 ? 0 : Math.ceil(minutos / 60);
    const total = horasACobrar * tarifa.precio_hora;

    setLiquidacion({
      id: auto.id,
      patente: auto.patente,
      tipo: tarifa.tipo_vehiculo,
      tiempo: `${minutos} min`,
      total: total,
      minutosRaw: minutos
    });
  };

  const confirmarCobro = () => {
    setHistorialPagos([
      {
        id: Date.now(),
        patente: liquidacion.patente,
        tipo_vehiculo: liquidacion.tipo,
        minutos_totales: liquidacion.minutosRaw, // Corregido el nombre para evitar NaN
        monto_pagado: liquidacion.total
      },
      ...historialPagos
    ]);
    setVehiculosActivos(vehiculosActivos.filter(v => v.id !== liquidacion.id));
    setLiquidacion(null);
    setPatenteSalida('');
  };

  // --- CIERRE DE CAJA ---
  const ejecutarCierreCaja = () => {
    if (window.confirm(`¿Está seguro de realizar el Cierre de Caja?\nSe totalizarán $${cajaDelDia} y se reiniciará el historial diario.`)) {
      alert(`📊 Cierre Exitoso\nTotal Recaudado: $${cajaDelDia}\nOperaciones totales: ${historialPagos.length}`);
      setHistorialPagos([]); // Limpia la caja del día
      setVista('ingreso');
    }
  };

  // --- CÁLCULOS METRICOS ---
  const cajaDelDia = historialPagos.reduce((acc, p) => acc + p.monto_pagado, 0);
  
  const estadiaPromedio = historialPagos.length 
    ? Math.round(historialPagos.reduce((acc, p) => acc + p.minutos_totales, 0) / historialPagos.length) 
    : 0;

  // Desglose detallado por tipo de vehículo
  const operacionesPorTipo = tarifas.map(t => {
    const filtrados = historialPagos.filter(p => p.tipo_vehiculo === t.tipo_vehiculo);
    return {
      tipo: t.tipo_vehiculo,
      cantidad: filtrados.length,
      total: filtrados.reduce((acc, cur) => acc + cur.monto_pagado, 0)
    };
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row antialiased">
      
      {/* 🧾 TICKET DE IMPRESIÓN (Oculto en pantalla digital) */}
      {ultimoIngresado && (
        <div id="ticket-impresion" className="hidden print:block bg-white text-black p-4 font-mono text-sm tracking-tight w-[58mm] mx-auto text-center">
          <p className="font-bold text-lg uppercase tracking-wide">Nombre empresa</p>
          <p className="text-xs">Tel: 11-67574710</p>
          <p className="my-2 border-b border-dashed border-black"></p>
          <p className="font-bold text-base mb-1">TICKET DE INGRESO</p>
          <div className="text-left space-y-1 my-3 text-xs">
            <p><strong>PATENTE:</strong> <span className="text-sm font-bold">{ultimoIngresado.patente}</span></p>
            <p><strong>TIPO:</strong> {ultimoIngresado.tipo_nombre}</p>
            <p><strong>INGRESO:</strong> {ultimoIngresado.hora_ingreso.toLocaleDateString()} - {ultimoIngresado.hora_ingreso.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
          <p className="my-2 border-b border-dashed border-black"></p>
          <p className="text-[11px] leading-tight italic font-medium mt-2">Gracias por confiar en nosotros</p>
        </div>
      )}

      {/* 💻 CONTENEDOR DIGITAL */}
      <div className="flex flex-col md:flex-row flex-1 print:hidden w-full">
        
        {/* MENÚ LATERAL */}
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-100 p-6 flex flex-col justify-between">
          <div>
            {/* LOGO INTERACTIVO "P" (Vuelve al inicio) */}
            <button onClick={() => { setVista('ingreso'); setLiquidacion(null); }} className="flex items-center space-x-3 mb-8 px-2 group text-left w-full focus:outline-none">
              <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm group-hover:bg-indigo-700 transition-colors">P</div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">ParkFlow</span>
            </button>
            
            <nav className="space-y-1">
              <button onClick={() => { setVista('ingreso'); setLiquidacion(null); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${vista === 'ingreso' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>📥 Registrar Entrada</button>
              <button onClick={() => setVista('salida')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${vista === 'salida' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>💸 Cobrar Salida</button>
              <button onClick={() => setVista('listado')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${vista === 'listado' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>🚗 Vehículos ingresados</button>
              <button onClick={() => setVista('caja')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${vista === 'caja' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>💰 Auditoría Caja</button>
              
              <div className="pt-4 my-2 border-t border-slate-100">
                <span className="px-4 text-[10px] font-bold text-slate-400 tracking-wider block mb-2 uppercase">Gestión Gerencial</span>
                <button onClick={() => setVista('admin')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${vista === 'admin' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>📊 Dashboard Admin</button>
                <button onClick={() => setVista('config')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${vista === 'config' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>⚙️ Ajustes Tarifas</button>
              </div>
            </nav>
          </div>

          {/* INDICADOR DE OCUPACIÓN Y LOGIN STATUS */}
          <div className="mt-8 pt-4 border-t border-slate-100 px-2 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                <span>OCUPACIÓN</span>
                <span>{vehiculosActivos.length} / {totalPlazas}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 rounded-full ${vehiculosActivos.length / totalPlazas > 0.85 ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${Math.min((vehiculosActivos.length / totalPlazas) * 100, 100)}%` }}></div>
              </div>
            </div>

            {isAdmin && (
              <button onClick={cerrarSesion} className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-medium hover:bg-rose-50 hover:text-rose-600 transition-colors">
                🔒 Cerrar Sesión Admin
              </button>
            )}
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-6 md:p-10 max-w-5xl">
          
          {/* CONTROL DE PROTECCIÓN LOGIN PARA RUTA ADMIN / CONFIG */}
          {(!isAdmin && (vista === 'admin' || vista === 'config')) ? (
            <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-12">
              <div className="text-center mb-6">
                <div className="h-12 w-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-3">🔐</div>
                <h2 className="text-lg font-bold text-slate-900">Acceso Restringido</h2>
                <p className="text-xs text-slate-400 mt-1">Se requieren credenciales de Administrador.</p>
              </div>
              <form onSubmit={manejarLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Usuario</label>
                  <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Ej: admin" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-indigo-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Contraseña</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-indigo-500" required />
                </div>
                {errorLogin && <p className="text-xs text-rose-500 font-medium">{errorLogin}</p>}
                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                  Verificar Identidad
                </button>
              </form>
              <p className="text-[11px] text-slate-400 text-center mt-4">Pista desarrollo: admin / admin123</p>
            </div>
          ) : (
            <>
              {/* VISTAS PÚBLICAS Y PROTEGIDAS YA VALIDADAS */}
              <header className="flex justify-between items-center mb-10 pb-4 border-b border-slate-100">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">
                    {vista === 'admin' ? 'Panel de Control' : vista === 'config' ? 'Configuración' : vista === 'listado' ? 'Cocheras Ocupadas' : vista === 'caja' ? 'Auditoría de Caja' : `Módulo de ${vista}`}
                  </h1>
                  <p className="text-sm text-slate-400 mt-0.5">Gestión inteligente de cocheras comerciales.</p>
                </div>
                <button onClick={() => setVista('caja')} className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right hover:border-indigo-200 transition-all">
                  <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Caja del Día</span>
                  <span className="text-lg font-bold text-emerald-600">${cajaDelDia}</span>
                </button>
              </header>

              {/* VISTA: INGRESO */}
              {vista === 'ingreso' && (
                <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Ingreso de Vehículo</h2>
                  <form onSubmit={registrarIngreso} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Patente / Placa</label>
                      <input type="text" value={patenteIngreso} onChange={e => setPatenteIngreso(e.target.value)} placeholder="Ej: AAA 777" className="w-full rounded-xl border border-slate-200 p-3 text-lg font-mono tracking-widest uppercase focus:outline-none focus:border-indigo-500 transition-all" required />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Categoría</label>
                      <select value={tipoVehiculoId} onChange={e => setTipoVehiculoId(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 text-slate-700 bg-white focus:outline-none focus:border-indigo-500 transition-all" required>
                        <option value="">Seleccionar tipo...</option>
                        {tarifas.map(t => <option key={t.id} value={t.id}>{t.tipo_vehiculo} (${t.precio_hora}/h)</option>)}
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition shadow-sm mt-2">
                      Registrar e Imprimir Ticket
                    </button>
                  </form>
                </div>
              )}

              {/* VISTA: SALIDA */}
              {vista === 'salida' && (
                <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Salida y Cobro</h2>
                  {!liquidacion ? (
                    <form onSubmit={calcularSalida} className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Buscar Patente Activa</label>
                        <input type="text" value={patenteSalida} onChange={e => setPatenteSalida(e.target.value)} placeholder="Ej: AA123BB" className="w-full rounded-xl border border-slate-200 p-3 text-lg font-mono tracking-widest uppercase focus:outline-none focus:border-indigo-500 transition-all" required />
                      </div>
                      <button type="submit" className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition shadow-sm mt-2">
                        Calcular cobro
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-3 text-sm text-slate-600">
                        <div className="flex justify-between"><span className="text-slate-400">Patente:</span> <span className="font-mono font-bold text-slate-900">{liquidacion.patente}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Tipo:</span> <span className="font-medium text-slate-900">{liquidacion.tipo}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Tiempo total:</span> <span className="font-medium text-slate-900">{liquidacion.tiempo}</span></div>
                        <div className="border-t border-slate-200/60 my-2 pt-3 flex justify-between items-baseline">
                          <span className="font-semibold text-slate-800">Monto Neto:</span> 
                          <span className="text-2xl font-black text-emerald-600">${liquidacion.total}</span>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button onClick={() => setLiquidacion(null)} className="w-1/3 bg-slate-100 text-slate-600 py-3 rounded-xl text-sm font-medium hover:bg-slate-200 transition">Atrás</button>
                        <button onClick={confirmarCobro} className="w-2/3 bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition shadow-sm">Confirmar Pago</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VISTA: VEHÍCULOS ADENTRO */}
              {vista === 'listado' && (
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Vehículos Estacionados Actualmente</h2>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-semibold">{vehiculosActivos.length} Ocupados</span>
                  </div>
                  {vehiculosActivos.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-10">No hay vehículos en este momento.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vehiculosActivos.map(v => (
                        <div key={v.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
                          <div>
                            <span className="font-mono text-base font-black text-slate-900 tracking-wider bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-xs block w-max mb-1">{v.patente}</span>
                            <p className="text-xs text-slate-500 font-medium">Categoría: {v.tipo_nombre}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Ingresó</span>
                            <span className="text-sm font-bold text-slate-700">{v.hora_ingreso.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VISTA NUEVA: AUDITORÍA DE CAJA Y CIERRE JORNADA */}
              {vista === 'caja' && (
                <div className="space-y-6">
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Desglose de Caja Diaria</h2>
                    <div className="divide-y divide-slate-100">
                      {operacionesPorTipo.map((item, index) => (
                        <div key={index} className="py-4 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{item.tipo}</p>
                            <p className="text-xs text-slate-400">{item.cantidad} transacciones concretadas</p>
                          </div>
                          <span className="text-base font-bold text-slate-900">${item.total}</span>
                        </div>
                      ))}
                      <div className="py-4 flex justify-between items-center border-t-2 border-slate-100 pt-5">
                        <div>
                          <p className="text-base font-black text-slate-900">RECAUDACIÓN TOTAL NETO</p>
                          <p className="text-xs text-slate-400">{historialPagos.length} operaciones totales del día</p>
                        </div>
                        <span className="text-2xl font-black text-emerald-600">${cajaDelDia}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Finalizar Jornada</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Esto reseteará la caja del día y guardará los totales del sistema.</p>
                    </div>
                    <button onClick={ejecutarCierreCaja} className="w-full sm:w-auto bg-rose-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-rose-700 transition shadow-sm shadow-rose-100">
                      Realizar Cierre de Caja
                    </button>
                  </div>
                </div>
              )}

              {/* VISTA: DASHBOARD PROTEGIDO */}
              {vista === 'admin' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Caja Acumulada</p>
                      <p className="text-3xl font-bold text-emerald-600 mt-2">${cajaDelDia}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estadía Promedio</p>
                      {/* Corregido el cálculo para que nunca dé NaN */}
                      <p className="text-3xl font-bold text-slate-800 mt-2">{estadiaPromedio} <span className="text-sm font-normal text-slate-400">minutos</span></p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ocupación Física</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-2">{vehiculosActivos.length} <span className="text-sm font-normal text-slate-400">autos adentro</span></p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Flujo de Demanda por Hora</h3>
                    <div className="h-44 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ hora: '08:00', v: 5 }, { hora: '12:00', v: 14 }, { hora: '18:00', v: 28 }, { hora: '20:00', v: 11 }]}>
                          <XAxis dataKey="hora" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip />
                          <Bar dataKey="v" name="Vehículos" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* VISTA: CONFIGURACIÓN PROTEGIDA */}
              {vista === 'config' && (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-xl mx-auto">
                  <h2 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3">Estructura de Costos</h2>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Precios por Hora Valor Neto</label>
                      {tarifas.map(t => (
                        <div key={t.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="text-sm font-medium text-slate-700">{t.tipo_vehiculo}</span>
                          <div className="relative rounded-lg shadow-sm w-32">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                            <input type="number" value={t.precio_hora} onChange={e => setTarifas(tarifas.map(item => item.id === t.id ? {...item, precio_hora: Number(e.target.value)} : item))} className="w-full text-right border border-slate-200 rounded-lg p-2 font-bold text-sm pr-3 focus:outline-none focus:border-indigo-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Plazas Máximas Habilitadas</label>
                      <input type="number" value={totalPlazas} onChange={e => setTotalPlazas(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-3 font-bold text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <button onClick={() => alert('Cambios guardados con éxito')} className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl text-sm hover:bg-indigo-700 transition mt-2">Aplicar Nueva Configuración</button>
                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
}
