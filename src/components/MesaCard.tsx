'use client'

import { useState, useEffect } from 'react'
import { Clock, Coffee, Skull, StopCircle, Receipt, CheckCircle2, AlertCircle, Play, ChevronRight, Zap } from 'lucide-react'
import { abrirMesa, anotarChico, agregarConsumoMesa, procesarCierreMesa } from '@/app/actions/mesas'

export default function MesaCard({ mesa, tarifas, productos }: { mesa: any, tarifas: any[], productos: any[] }) {
    const [minutosJugados, setMinutosJugados] = useState(0)
    const [modalAbierto, setModalAbierto] = useState<string | null>(null)

    // Estados de cobro y consumo
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo')
    const [billete, setBillete] = useState<number | ''>('')
    const [prodSeleccionado, setProdSeleccionado] = useState('')
    const [cantidadP, setCantidadP] = useState(1)
    const [estadoPagoP, setEstadoPagoP] = useState<'pendiente' | 'pagado'>('pendiente')
    const [metodoPagoP, setMetodoPagoP] = useState('efectivo')

    const tarifa = tarifas.find(t => t.tipo_mesa === mesa.tipo_mesa)

    useEffect(() => {
        if (mesa.estado === 'ocupada' && mesa.hora_inicio) {
            const calcularTiempo = () => {
                const diff = new Date().getTime() - new Date(mesa.hora_inicio).getTime()
                setMinutosJugados(Math.floor(diff / 60000))
            }
            calcularTiempo()
            const int = setInterval(calcularTiempo, 60000) // Actualiza cada minuto
            return () => clearInterval(int)
        }
    }, [mesa])

    // --- LÓGICA DE APERTURA RÁPIDA ---
    const iniciarMesa = async (modalidad: string, minutos: number = 0) => {
        const formData = new FormData()
        formData.append('id', mesa.id)
        formData.append('modalidad', modalidad)
        if (minutos > 0) formData.append('minutos_prepago', minutos.toString())
        await abrirMesa(formData)
    }

    // --- LÓGICA DE COBROS ---
    const calcularCostoTiempo = () => {
        if (!tarifa) return 0
        if (mesa.modalidad === 'chicos') return 0 // Si es por chicos, el tiempo no cobra, solo cuenta

        // Lógica especial para prepago (si quieres cobrar fijo) o tiempo corrido
        const horas = Math.floor(minutosJugados / 60)
        const resto = minutosJugados % 60
        let cobro = horas * tarifa.precio_hora

        // Cobro por fracción exacta
        if (resto >= 1 && resto <= 14) cobro += 0 // Gratis primeros 14 min? (Ajustable)
        else if (resto >= 15 && resto <= 29) cobro += tarifa.precio_15_29
        else if (resto >= 30 && resto <= 44) cobro += tarifa.precio_30_44
        else if (resto >= 45) cobro += tarifa.precio_45_59

        return Number(cobro)
    }

    const costoTiempo = calcularCostoTiempo()
    const consumosPendientes = mesa.consumos?.filter((c: any) => c.estadoPago === 'pendiente') || []
    const totalConsumosPendientes = consumosPendientes.reduce((acc: number, c: any) => acc + c.total, 0)
    const totalChicos = mesa.chicos?.reduce((acc: number, c: any) => acc + c.valor, 0) || 0
    const GRAN_TOTAL = costoTiempo + totalConsumosPendientes + totalChicos

    const handleCerrarMesa = async () => {
        const descripcion = `Mesa ${mesa.numero} | Tiempo: ${Math.floor(minutosJugados / 60)}h ${minutosJugados % 60}m ($${costoTiempo})`
        await procesarCierreMesa(mesa.id, descripcion, GRAN_TOTAL, metodoPago)
        setModalAbierto(null)
    }

    const handleAgregarConsumo = async (e: React.FormEvent) => {
        e.preventDefault()
        const p = productos.find(x => x.id === prodSeleccionado)
        if (!p) return
        await agregarConsumoMesa(mesa.id, p.id, p.nombre, cantidadP, p.precio, estadoPagoP, metodoPagoP, mesa.consumos || [])
        setModalAbierto(null); setProdSeleccionado(''); setCantidadP(1); setEstadoPagoP('pendiente')
    }

    // ==========================================================
    // VISTA: MESA DISPONIBLE (Menú de Inicio Rápido)
    // ==========================================================
    if (mesa.estado === 'disponible') {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                {/* Header Tarjeta */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-2xl font-black text-gray-800">Mesa {mesa.numero}</h3>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{mesa.tipo_mesa}</span>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                </div>

                {/* Cuerpo con Botones de Acción Rápida */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                    <p className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><Zap size={12} /> INICIO RÁPIDO</p>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => iniciarMesa('prepago', 15)} className="py-3 px-2 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-bold text-sm transition-all shadow-sm">
                            15 min
                        </button>
                        <button onClick={() => iniciarMesa('prepago', 30)} className="py-3 px-2 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-bold text-sm transition-all shadow-sm">
                            30 min
                        </button>
                        <button onClick={() => iniciarMesa('prepago', 45)} className="py-3 px-2 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-bold text-sm transition-all shadow-sm">
                            45 min
                        </button>
                        <button onClick={() => iniciarMesa('prepago', 60)} className="py-3 px-2 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-bold text-sm transition-all shadow-sm">
                            1 Hora
                        </button>
                    </div>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button onClick={() => iniciarMesa('tiempo_libre')} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95">
                        <Play size={18} fill="currentColor" /> Tiempo Libre
                    </button>

                    <button onClick={() => iniciarMesa('chicos')} className="w-full py-3 bg-white border-2 border-orange-100 hover:border-orange-500 text-orange-600 rounded-xl font-bold text-sm transition-all">
                        🎱 Cobro por Chicos
                    </button>
                </div>
            </div>
        )
    }

    // ==========================================================
    // VISTA: MESA OCUPADA (Control Activo)
    // ==========================================================
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 relative overflow-hidden flex flex-col h-full ring-1 ring-orange-500/20">

            {/* Barra de Tiempo Animada */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div className="h-full bg-orange-500 animate-[progress_2s_ease-in-out_infinite] w-full origin-left"></div>
            </div>

            {/* Header Ocupado */}
            <div className="p-5 flex justify-between items-start bg-orange-50/30">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-gray-800">Mesa {mesa.numero}</h3>
                        <span className="text-[10px] font-bold bg-gray-900 text-white px-2 py-1 rounded uppercase">{mesa.modalidad === 'chicos' ? 'Por Chicos' : 'Tiempo'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 mt-1 font-mono text-2xl font-bold tracking-tight">
                        <Clock size={20} className="animate-pulse" /> {Math.floor(minutosJugados / 60)}:{String(minutosJugados % 60).padStart(2, '0')}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Actual</p>
                    <p className="text-2xl font-black text-gray-900">${GRAN_TOTAL.toLocaleString()}</p>
                </div>
            </div>

            {/* Lista de Consumos (Scrollable) */}
            <div className="flex-1 px-5 py-2 overflow-y-auto max-h-48">
                {(!mesa.consumos?.length && !mesa.chicos?.length) ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 py-6 border-2 border-dashed border-gray-100 rounded-xl">
                        <Coffee size={24} className="mb-2 opacity-50" />
                        <span className="text-xs font-medium">Sin consumos</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Chicos */}
                        {mesa.chicos?.map((c: any, i: number) => (
                            <div key={`ch-${i}`} className="flex justify-between items-center text-sm bg-red-50 p-2 rounded-lg border border-red-100">
                                <span className="text-red-800 font-medium flex items-center gap-1"><Skull size={14} /> {c.perdedor}</span>
                                <span className="font-bold text-red-900">${c.valor.toLocaleString()}</span>
                            </div>
                        ))}
                        {/* Consumos */}
                        {mesa.consumos?.map((c: any, i: number) => (
                            <div key={`co-${i}`} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-700">{c.cantidad}x</span>
                                    <span className="text-gray-600">{c.nombre}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">${c.total.toLocaleString()}</span>
                                    {c.estadoPago === 'pagado' ? (
                                        <span title="Pagado"><CheckCircle2 size={16} className="text-green-500" /></span>
                                    ) : (
                                        <span title="Pendiente"><AlertCircle size={16} className="text-orange-400" /></span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Botones de Acción */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                <button onClick={() => setModalAbierto('chico')} className="flex flex-col items-center justify-center py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-red-500 hover:text-red-600 transition-colors group">
                    <Skull size={20} className="text-gray-400 group-hover:text-red-500 mb-1" />
                    <span className="text-xs font-bold">Chico</span>
                </button>
                <button onClick={() => setModalAbierto('consumo')} className="flex flex-col items-center justify-center py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:text-blue-600 transition-colors group">
                    <Coffee size={20} className="text-gray-400 group-hover:text-blue-500 mb-1" />
                    <span className="text-xs font-bold">Pedido</span>
                </button>

                <div className="col-span-2 mt-1">
                    <button onClick={() => setModalAbierto('cierre')} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98]">
                        <Receipt size={18} /> Cerrar Cuenta
                    </button>
                </div>
            </div>

            {/* ================= MODALES (Fondo oscuro transparente) ================= */}

            {/* Modal Consumo */}
            {modalAbierto === 'consumo' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleAgregarConsumo} className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><Coffee className="text-blue-500" /> Nuevo Pedido</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Producto</label>
                                <select required value={prodSeleccionado} onChange={(e) => setProdSeleccionado(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Seleccionar...</option>
                                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (${p.precio})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Cantidad</label>
                                <input type="number" min={1} value={cantidadP} onChange={(e) => setCantidadP(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl mt-1 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Estado de Pago</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setEstadoPagoP('pendiente')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${estadoPagoP === 'pendiente' ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-gray-200 text-gray-500'}`}>A la Mesa</button>
                                    <button type="button" onClick={() => setEstadoPagoP('pagado')} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${estadoPagoP === 'pagado' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}>Pagado Ya</button>
                                </div>
                                {estadoPagoP === 'pagado' && (
                                    <select value={metodoPagoP} onChange={(e) => setMetodoPagoP(e.target.value)} className="w-full mt-2 bg-white border border-gray-200 p-2 rounded-lg text-sm">
                                        <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setModalAbierto(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200">Agregar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Chico */}
            {modalAbierto === 'chico' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form action={(f) => { anotarChico(f); setModalAbierto(null); }} className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                        <input type="hidden" name="id" value={mesa.id} /><input type="hidden" name="chicos_actuales" value={JSON.stringify(mesa.chicos || [])} />
                        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><Skull className="text-red-500" /> Anotar Perdedor</h3>
                        <div className="space-y-3">
                            <input type="text" name="perdedor" required placeholder="Nombre del jugador" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-red-500" />
                            <input type="number" name="valor" required placeholder="Valor de la apuesta ($)" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button type="button" onClick={() => setModalAbierto(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                            <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200">Anotar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Cierre (Ticket) */}
            {modalAbierto === 'cierre' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-0 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gray-900 p-6 text-white">
                            <h3 className="text-xl font-bold flex items-center gap-2"><Receipt className="text-emerald-400" /> Ticket Final</h3>
                            <p className="text-gray-400 text-sm mt-1">Mesa {mesa.numero} - {mesa.tipo_mesa}</p>
                        </div>

                        <div className="p-6">
                            <div className="space-y-3 mb-6 border-b border-gray-100 pb-6 border-dashed">
                                <div className="flex justify-between text-gray-600"><span>Tiempo ({Math.floor(minutosJugados / 60)}h {minutosJugados % 60}m)</span><span className="font-bold text-gray-900">${costoTiempo.toLocaleString()}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Consumos Pendientes</span><span className="font-bold text-gray-900">${totalConsumosPendientes.toLocaleString()}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Chicos</span><span className="font-bold text-gray-900">${totalChicos.toLocaleString()}</span></div>
                                <div className="flex justify-between text-2xl font-black pt-2"><span className="text-gray-900">TOTAL</span><span className="text-emerald-600">${GRAN_TOTAL.toLocaleString()}</span></div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Método de Pago</label>
                                <div className="flex gap-2 mb-3">
                                    <button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${metodoPago === 'efectivo' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>💵 Efectivo</button>
                                    <button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${metodoPago === 'transferencia' ? 'bg-white border-purple-500 text-purple-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>📱 Transferencia</button>
                                </div>
                                {metodoPago === 'efectivo' && (
                                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                                        <input type="number" placeholder="Recibido..." value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="w-32 outline-none text-lg font-bold text-gray-900 placeholder-gray-300" />
                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 block">Vueltas</span>
                                            <span className={`font-bold ${(Number(billete) - GRAN_TOTAL) >= 0 ? 'text-green-600' : 'text-red-500'}`}>${billete ? (Number(billete) - GRAN_TOTAL).toLocaleString() : '0'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setModalAbierto(null)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Volver</button>
                                <button onClick={handleCerrarMesa} disabled={metodoPago === 'efectivo' && Number(billete) < GRAN_TOTAL} className="flex-1 bg-gray-900 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Cobrar Ticket</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}