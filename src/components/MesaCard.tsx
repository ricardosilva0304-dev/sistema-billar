'use client'

import { useState, useEffect } from 'react'
import { Clock, Coffee, Skull, Receipt, CheckCircle2, AlertCircle, Play, Zap, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { abrirMesa, anotarChico, agregarConsumoMesa, procesarCierreMesa } from '@/app/actions/mesas'

export default function MesaCard({ mesa, tarifas, productos }: { mesa: any, tarifas: any[], productos: any[] }) {
    const [minutosJugados, setMinutosJugados] = useState(0)
    const [modalAbierto, setModalAbierto] = useState<string | null>(null)

    // Estados de cobro y consumo
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo')
    const [billete, setBillete] = useState<number | ''>('')

    // Estados para el Nuevo Pedido (Mini POS)
    const [prodSeleccionado, setProdSeleccionado] = useState('')
    const [busquedaProd, setBusquedaProd] = useState('') // Nuevo estado para buscar
    const [cantidadP, setCantidadP] = useState(1)
    const [estadoPagoP, setEstadoPagoP] = useState<'pendiente' | 'pagado'>('pendiente')
    const [metodoPagoP, setMetodoPagoP] = useState('efectivo')

    const tarifa = tarifas.find(t => t.tipo_mesa === mesa.tipo_mesa)

    // Filtrar productos para el modal
    const productosFiltrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busquedaProd.toLowerCase())
    )

    useEffect(() => {
        if (mesa.estado === 'ocupada' && mesa.hora_inicio) {
            const calcularTiempo = () => {
                const diff = new Date().getTime() - new Date(mesa.hora_inicio).getTime()
                setMinutosJugados(Math.floor(diff / 60000))
            }
            calcularTiempo()
            const int = setInterval(calcularTiempo, 60000)
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
        if (mesa.modalidad === 'chicos') return 0

        const horas = Math.floor(minutosJugados / 60)
        const resto = minutosJugados % 60
        let cobro = horas * tarifa.precio_hora

        if (resto >= 1 && resto <= 14) cobro += 0
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
        setModalAbierto(null); setProdSeleccionado(''); setCantidadP(1); setEstadoPagoP('pendiente'); setBusquedaProd('')
    }

    // ==========================================================
    // VISTA: MESA DISPONIBLE
    // ==========================================================
    if (mesa.estado === 'disponible') {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div><h3 className="text-2xl font-black text-gray-800">Mesa {mesa.numero}</h3><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{mesa.tipo_mesa}</span></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                    <p className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><Zap size={12} /> INICIO RÁPIDO</p>
                    <div className="grid grid-cols-2 gap-3">
                        {[15, 30, 45, 60].map(min => (
                            <button key={min} onClick={() => iniciarMesa('prepago', min)} className="py-3 px-2 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-bold text-sm transition-all shadow-sm">{min === 60 ? '1 Hora' : `${min} min`}</button>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={() => iniciarMesa('tiempo_libre')} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"><Play size={18} fill="currentColor" /> Tiempo Libre</button>
                    <button onClick={() => iniciarMesa('chicos')} className="w-full py-3 bg-white border-2 border-orange-100 hover:border-orange-500 text-orange-600 rounded-xl font-bold text-sm transition-all">🎱 Cobro por Chicos</button>
                </div>
            </div>
        )
    }

    // ==========================================================
    // VISTA: MESA OCUPADA
    // ==========================================================
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 relative overflow-hidden flex flex-col h-full ring-1 ring-orange-500/20">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100"><div className="h-full bg-orange-500 animate-[progress_2s_ease-in-out_infinite] w-full origin-left"></div></div>

            <div className="p-5 flex justify-between items-start bg-orange-50/30">
                <div>
                    <div className="flex items-center gap-2"><h3 className="text-2xl font-black text-gray-800">Mesa {mesa.numero}</h3><span className="text-[10px] font-bold bg-gray-900 text-white px-2 py-1 rounded uppercase">{mesa.modalidad === 'chicos' ? 'Por Chicos' : 'Tiempo'}</span></div>
                    <div className="flex items-center gap-2 text-orange-600 mt-1 font-mono text-2xl font-bold tracking-tight"><Clock size={20} className="animate-pulse" /> {Math.floor(minutosJugados / 60)}:{String(minutosJugados % 60).padStart(2, '0')}</div>
                </div>
                <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Actual</p><p className="text-2xl font-black text-gray-900">${GRAN_TOTAL.toLocaleString()}</p></div>
            </div>

            <div className="flex-1 px-5 py-2 overflow-y-auto max-h-48">
                {(!mesa.consumos?.length && !mesa.chicos?.length) ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 py-6 border-2 border-dashed border-gray-100 rounded-xl"><Coffee size={24} className="mb-2 opacity-50" /><span className="text-xs font-medium">Sin consumos</span></div>
                ) : (
                    <div className="space-y-2">
                        {mesa.chicos?.map((c: any, i: number) => (
                            <div key={`ch-${i}`} className="flex justify-between items-center text-sm bg-red-50 p-2 rounded-lg border border-red-100"><span className="text-red-800 font-medium flex items-center gap-1"><Skull size={14} /> {c.perdedor}</span><span className="font-bold text-red-900">${c.valor.toLocaleString()}</span></div>
                        ))}
                        {mesa.consumos?.map((c: any, i: number) => (
                            <div key={`co-${i}`} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2"><span className="font-bold text-gray-700">{c.cantidad}x</span><span className="text-gray-600">{c.nombre}</span></div>
                                <div className="flex items-center gap-2"><span className="font-bold text-gray-900">${c.total.toLocaleString()}</span>{c.estadoPago === 'pagado' ? (<span title="Pagado"><CheckCircle2 size={16} className="text-green-500" /></span>) : (<span title="Pendiente"><AlertCircle size={16} className="text-orange-400" /></span>)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                <button onClick={() => setModalAbierto('chico')} className="flex flex-col items-center justify-center py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-red-500 hover:text-red-600 transition-colors group"><Skull size={20} className="text-gray-400 group-hover:text-red-500 mb-1" /><span className="text-xs font-bold">Chico</span></button>
                <button onClick={() => { setModalAbierto('consumo'); setProdSeleccionado(''); setBusquedaProd('') }} className="flex flex-col items-center justify-center py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-500 hover:text-blue-600 transition-colors group"><Coffee size={20} className="text-gray-400 group-hover:text-blue-500 mb-1" /><span className="text-xs font-bold">Pedido</span></button>
                <div className="col-span-2 mt-1"><button onClick={() => setModalAbierto('cierre')} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98]"><Receipt size={18} /> Cerrar Cuenta</button></div>
            </div>

            {/* ================= MODAL NUEVO PEDIDO (MINI POS) ================= */}
            {modalAbierto === 'consumo' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleAgregarConsumo} className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2 flex-shrink-0"><Coffee className="text-blue-500" /> Nuevo Pedido</h3>

                        {/* Buscador */}
                        <div className="relative mb-4 flex-shrink-0">
                            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input type="text" placeholder="Buscar producto..." autoFocus value={busquedaProd} onChange={(e) => setBusquedaProd(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
                        </div>

                        {/* Cuadrícula de Productos (Scrollable) */}
                        <div className="flex-1 overflow-y-auto min-h-[150px] mb-4 pr-1">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {productosFiltrados.map((prod) => (
                                    <button
                                        key={prod.id}
                                        type="button"
                                        onClick={() => setProdSeleccionado(prod.id)}
                                        disabled={prod.stock === 0}
                                        className={`p-3 rounded-xl border text-left transition-all relative ${prodSeleccionado === prod.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'} ${prod.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prod.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{prod.stock}</span>
                                        </div>
                                        <p className="font-bold text-gray-800 text-sm leading-tight mb-1">{prod.nombre}</p>
                                        <p className="text-sm font-black text-gray-900">${prod.precio.toLocaleString()}</p>
                                        {prodSeleccionado === prod.id && <div className="absolute top-2 right-2 text-blue-500"><CheckCircle2 size={16} fill="currentColor" className="text-white" /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Controles Inferiores (Fijos) */}
                        <div className="border-t border-gray-100 pt-4 flex-shrink-0 space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Cantidad</label>
                                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                        <button type="button" onClick={() => setCantidadP(Math.max(1, cantidadP - 1))} className="px-3 py-2 bg-gray-50 hover:bg-gray-200"><ChevronDown size={16} /></button>
                                        <input type="number" min={1} value={cantidadP} onChange={(e) => setCantidadP(Number(e.target.value))} className="w-full text-center font-bold text-gray-800 outline-none py-2" />
                                        <button type="button" onClick={() => setCantidadP(cantidadP + 1)} className="px-3 py-2 bg-gray-50 hover:bg-gray-200"><ChevronUp size={16} /></button>
                                    </div>
                                </div>
                                <div className="w-2/3">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Pago</label>
                                    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                        <button type="button" onClick={() => setEstadoPagoP('pendiente')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${estadoPagoP === 'pendiente' ? 'bg-white text-orange-600 shadow-sm border border-orange-100' : 'text-gray-400'}`}>Mesa</button>
                                        <button type="button" onClick={() => setEstadoPagoP('pagado')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${estadoPagoP === 'pagado' ? 'bg-white text-green-600 shadow-sm border border-green-100' : 'text-gray-400'}`}>Ya Pagó</button>
                                    </div>
                                </div>
                            </div>

                            {estadoPagoP === 'pagado' && (
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setMetodoPagoP('efectivo')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${metodoPagoP === 'efectivo' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}>💵 Efectivo</button>
                                    <button type="button" onClick={() => setMetodoPagoP('transferencia')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${metodoPagoP === 'transferencia' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}>📱 Transf.</button>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setModalAbierto(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                                <button type="submit" disabled={!prodSeleccionado} className="flex-1 py-3 bg-blue-600 disabled:bg-gray-300 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all">Agregar Pedido</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal Chico (Sin cambios, solo el diseño base) */}
            {modalAbierto === 'chico' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form action={(f) => { anotarChico(f); setModalAbierto(null); }} className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                        <input type="hidden" name="id" value={mesa.id} /><input type="hidden" name="chicos_actuales" value={JSON.stringify(mesa.chicos || [])} />
                        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><Skull className="text-red-500" /> Anotar Perdedor</h3>
                        <div className="space-y-3"><input type="text" name="perdedor" required placeholder="Nombre del jugador" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-red-500" /><input type="number" name="valor" required placeholder="Valor de la apuesta ($)" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-red-500" /></div>
                        <div className="flex gap-3 mt-6"><button type="button" onClick={() => setModalAbierto(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button><button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200">Anotar</button></div>
                    </form>
                </div>
            )}

            {/* Modal Cierre (Sin cambios de lógica, solo diseño) */}
            {modalAbierto === 'cierre' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-0 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gray-900 p-6 text-white"><h3 className="text-xl font-bold flex items-center gap-2"><Receipt className="text-emerald-400" /> Ticket Final</h3><p className="text-gray-400 text-sm mt-1">Mesa {mesa.numero} - {mesa.tipo_mesa}</p></div>
                        <div className="p-6">
                            <div className="space-y-3 mb-6 border-b border-gray-100 pb-6 border-dashed">
                                <div className="flex justify-between text-gray-600"><span>Tiempo ({Math.floor(minutosJugados / 60)}h {minutosJugados % 60}m)</span><span className="font-bold text-gray-900">${costoTiempo.toLocaleString()}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Consumos Pendientes</span><span className="font-bold text-gray-900">${totalConsumosPendientes.toLocaleString()}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Chicos</span><span className="font-bold text-gray-900">${totalChicos.toLocaleString()}</span></div>
                                <div className="flex justify-between text-2xl font-black pt-2"><span className="text-gray-900">TOTAL</span><span className="text-emerald-600">${GRAN_TOTAL.toLocaleString()}</span></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Método de Pago</label>
                                <div className="flex gap-2 mb-3"><button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${metodoPago === 'efectivo' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>💵 Efectivo</button><button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${metodoPago === 'transferencia' ? 'bg-white border-purple-500 text-purple-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>📱 Transferencia</button></div>
                                {metodoPago === 'efectivo' && (<div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"><input type="number" placeholder="Recibido..." value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="w-32 outline-none text-lg font-bold text-gray-900 placeholder-gray-300" /><div className="text-right"><span className="text-xs text-gray-400 block">Vueltas</span><span className={`font-bold ${(Number(billete) - GRAN_TOTAL) >= 0 ? 'text-green-600' : 'text-red-500'}`}>${billete ? (Number(billete) - GRAN_TOTAL).toLocaleString() : '0'}</span></div></div>)}
                            </div>
                            <div className="flex gap-3"><button onClick={() => setModalAbierto(null)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Volver</button><button onClick={handleCerrarMesa} disabled={metodoPago === 'efectivo' && Number(billete) < GRAN_TOTAL} className="flex-1 bg-gray-900 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Cobrar Ticket</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}