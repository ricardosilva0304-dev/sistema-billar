'use client'

import { useState, useEffect } from 'react'
import { Clock, Coffee, Skull, Receipt, CheckCircle2, AlertCircle, Play, Zap, Search, Plus, Minus, Info, ChevronUp, ChevronDown, X } from 'lucide-react'
import { abrirMesa, agregarConsumoMesa, procesarCierreMesa, terminarChico } from '@/app/actions/mesas'

export default function MesaCard({ mesa, tarifas, productos }: { mesa: any, tarifas: any[], productos: any[] }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const [minutosChicoActual, setMinutosChicoActual] = useState(0)
    const [modalAbierto, setModalAbierto] = useState<string | null>(null)
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo')
    const [billete, setBillete] = useState<number | ''>('')
    const [carritoPedido, setCarritoPedido] = useState<any[]>([])
    const [busquedaProd, setBusquedaProd] = useState('')
    const [estadoPagoP, setEstadoPagoP] = useState<'pendiente' | 'pagado'>('pendiente')
    const [metodoPagoP, setMetodoPagoP] = useState('efectivo')
    const [billeteP, setBilleteP] = useState<number | ''>('')
    const [perdedor, setPerdedor] = useState('')
    const [pagoChico, setPagoChico] = useState<'pendiente' | 'pagado'>('pendiente')
    const [metodoPagoChico, setMetodoPagoChico] = useState('efectivo')
    const [chicoSeleccionado, setChicoSeleccionado] = useState<any>(null)

    const tarifa = tarifas.find(t => t.tipo_mesa === mesa.tipo_mesa)
    const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()))
    const totalPedidoActual = carritoPedido.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)

    useEffect(() => {
        if (mesa.estado === 'ocupada' && mesa.hora_ultimo_chico) {
            const calcularTiempo = () => {
                const diff = new Date().getTime() - new Date(mesa.hora_ultimo_chico).getTime()
                setMinutosChicoActual(Math.floor(diff / 60000))
            }
            calcularTiempo()
            const int = setInterval(calcularTiempo, 60000)
            return () => clearInterval(int)
        }
    }, [mesa])

    const calcularCostoTiempo = (minutos: number) => {
        if (!tarifa) return 0
        if (mesa.modalidad === 'chicos') return 0
        const horas = Math.floor(minutos / 60)
        const resto = minutos % 60
        let cobro = horas * tarifa.precio_hora
        if (resto >= 15 && resto <= 29) cobro += tarifa.precio_15_29
        else if (resto >= 30 && resto <= 44) cobro += tarifa.precio_30_44
        else if (resto >= 45) cobro += tarifa.precio_45_59
        return Number(cobro)
    }

    const costoTiempoActual = calcularCostoTiempo(minutosChicoActual)
    const consumosActuales = mesa.consumos || []
    const costoConsumosActuales = consumosActuales.reduce((acc: number, c: any) => acc + c.total, 0)
    const totalChicoActual = costoTiempoActual + costoConsumosActuales
    const chicosPendientes = mesa.chicos?.filter((c: any) => c.estadoPago === 'pendiente') || []
    const totalChicosPendientes = chicosPendientes.reduce((acc: number, c: any) => acc + c.total, 0)
    const GRAN_TOTAL_CIERRE = totalChicosPendientes + totalChicoActual

    const agregarAlCarrito = (producto: any) => {
        setCarritoPedido(prev => {
            const existe = prev.find(p => p.id === producto.id)
            if (existe) {
                if (existe.cantidad >= producto.stock) return prev
                return prev.map(p => p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p)
            }
            return [...prev, { ...producto, cantidad: 1 }]
        })
    }

    const quitarDelCarrito = (productoId: string) => {
        setCarritoPedido(prev => {
            const existe = prev.find(p => p.id === productoId)
            if (existe?.cantidad === 1) return prev.filter(p => p.id !== productoId)
            return prev.map(p => p.id === productoId ? { ...p, cantidad: p.cantidad - 1 } : p)
        })
    }

    const handleIniciarMesa = async (modalidad: string, minutos: number = 0) => {
        const formData = new FormData()
        formData.append('id', mesa.id); formData.append('modalidad', modalidad)
        if (minutos > 0) formData.append('minutos_prepago', minutos.toString())
        await abrirMesa(formData)
    }

    const handleEnviarPedidoCompleto = async (e: React.FormEvent) => {
        e.preventDefault()
        if (carritoPedido.length === 0) return
        for (const item of carritoPedido) {
            await agregarConsumoMesa(mesa.id, item.id, item.nombre, item.cantidad, item.precio, estadoPagoP, metodoPagoP, mesa.consumos || [])
        }
        setModalAbierto(null); setCarritoPedido([]); setBusquedaProd(''); setEstadoPagoP('pendiente'); setBilleteP('')
    }

    const handleTerminarChico = async () => {
        if (!perdedor.trim()) return alert('Escribe el nombre del perdedor')
        await terminarChico(mesa.id, perdedor, pagoChico, pagoChico === 'pagado' ? metodoPagoChico : null, costoTiempoActual, costoConsumosActuales, consumosActuales)
        setModalAbierto(null); setPerdedor(''); setPagoChico('pendiente')
    }

    const handleCerrarMesa = async () => {
        const descripcion = `Cierre Mesa ${mesa.numero} | Chicos Pendientes: ${chicosPendientes.length} | Chico Final: $${totalChicoActual}`
        await procesarCierreMesa(mesa.id, descripcion, GRAN_TOTAL_CIERRE, metodoPago)
        setModalAbierto(null)
    }

    if (!mounted) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-64 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (mesa.estado === 'disponible') {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                <div className="p-4 md:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-gray-800">Mesa {mesa.numero}</h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{mesa.tipo_mesa}</span>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                </div>
                <div className="p-4 md:p-5 flex-1 flex flex-col gap-3">
                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Zap size={12} /> INICIO RÁPIDO</p>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {[15, 30, 45, 60].map(min => (
                            <button key={min} onClick={() => handleIniciarMesa('prepago', min)} className="py-3 px-2 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-bold text-xs md:text-sm transition-all shadow-sm active:scale-95">
                                {min === 60 ? '1 Hora' : `${min} min`}
                            </button>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={() => handleIniciarMesa('tiempo_libre')} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95">
                        <Play size={18} fill="currentColor" /> Tiempo Libre
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 relative overflow-hidden flex flex-col h-full ring-1 ring-orange-500/20">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div className="h-full bg-orange-500 animate-[progress_2s_ease-in-out_infinite] w-full origin-left"></div>
            </div>

            <div className="p-4 flex justify-between items-start bg-orange-50/30">
                <div>
                    <h3 className="text-lg md:text-xl font-black text-gray-800">Mesa {mesa.numero}</h3>
                    <div className="flex items-center gap-1 text-orange-600 font-mono text-base md:text-lg font-bold">
                        <Clock size={16} className="animate-pulse" />
                        {Math.floor(minutosChicoActual / 60)}:{String(minutosChicoActual % 60).padStart(2, '0')}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</p>
                    <p className="text-lg md:text-xl font-black text-gray-900">${GRAN_TOTAL_CIERRE.toLocaleString()}</p>
                </div>
            </div>

            {chicosPendientes.length > 0 && (
                <div className="px-4 py-2 bg-red-50 border-y border-red-100">
                    <p className="text-[9px] font-bold text-red-400 uppercase mb-1">Por Cobrar ({chicosPendientes.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                        {chicosPendientes.map((c: any) => (
                            <button key={c.id} onClick={() => setChicoSeleccionado(c)} className="flex items-center gap-1 pl-2 pr-1.5 py-1 bg-white border border-red-200 rounded-full text-[10px] md:text-xs text-red-700 font-bold hover:bg-red-100 transition-colors shadow-sm">
                                {c.perdedor}: ${c.total.toLocaleString()} <Info size={12} className="text-red-300" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 px-4 py-3 overflow-y-auto max-h-48 md:max-h-60 scrollbar-thin scrollbar-thumb-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">En curso</p>
                {consumosActuales.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 rounded-xl border border-dashed border-gray-200 text-gray-400 text-xs justify-center italic font-medium">
                        <Coffee size={14} /> Sin consumos
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {consumosActuales.map((c: any, i: number) => (
                            <div key={`co-${i}`} className="flex justify-between items-center text-xs md:text-sm bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-blue-600">{c.cantidad}x</span>
                                    <span className="text-gray-700 font-medium">{c.nombre}</span>
                                </div>
                                <span className="font-bold text-gray-900">${c.total.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-white border-t border-gray-100 grid grid-cols-2 gap-2">
                <button onClick={() => { setModalAbierto('consumo'); setCarritoPedido([]); setBusquedaProd(''); setBilleteP('') }} className="flex flex-col items-center justify-center py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group active:scale-95">
                    <Coffee size={18} className="text-gray-400 group-hover:text-blue-500 mb-1" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-tight">Pedido</span>
                </button>
                <button onClick={() => setModalAbierto('terminar_chico')} className="flex flex-col items-center justify-center py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-red-500 hover:text-red-600 transition-all group active:scale-95">
                    <Skull size={18} className="text-gray-400 group-hover:text-red-500 mb-1" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-tight">Cerrar Chico</span>
                </button>
                <div className="col-span-2">
                    <button onClick={() => setModalAbierto('cierre')} className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 text-xs md:text-sm shadow-md transition-all active:scale-[0.98]">
                        <Receipt size={16} /> Cobrar Mesa Completa
                    </button>
                </div>
            </div>

            {/* MODAL: NUEVO PEDIDO (RESPONSIVE) */}
            {modalAbierto === 'consumo' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleEnviarPedidoCompleto} className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col md:flex-row overflow-hidden h-[92vh] md:h-[85vh]">
                        {/* Lado Productos */}
                        <div className="w-full md:w-3/5 p-4 md:p-6 bg-gray-50 flex flex-col h-1/2 md:h-auto border-b md:border-b-0 md:border-r border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Search size={20} className="text-blue-500" /> Productos</h3>
                                <button type="button" onClick={() => setModalAbierto(null)} className="md:hidden p-2 text-gray-400"><X /></button>
                            </div>
                            <input type="text" placeholder="Buscar producto..." autoFocus value={busquedaProd} onChange={(e) => setBusquedaProd(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-4 shadow-sm" />
                            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 content-start pb-4">
                                {productosFiltrados.map((prod) => (
                                    <button key={prod.id} type="button" onClick={() => agregarAlCarrito(prod)} disabled={prod.stock === 0} className={`p-3 rounded-xl border text-left transition-all relative bg-white border-gray-100 hover:border-blue-400 hover:shadow-md active:scale-95 ${prod.stock === 0 ? 'opacity-40 grayscale' : ''}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${prod.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Stock: {prod.stock}</span>
                                        </div>
                                        <p className="font-bold text-gray-800 text-xs md:text-sm leading-tight mb-1 line-clamp-2">{prod.nombre}</p>
                                        <p className="text-sm font-black text-blue-600">${prod.precio.toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Lado Carrito */}
                        <div className="w-full md:w-2/5 p-4 md:p-6 bg-white flex flex-col h-1/2 md:h-auto">
                            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><Coffee size={20} className="text-orange-500" /> Detalle del Pedido</h3>
                            <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1">
                                {carritoPedido.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300 py-8">
                                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                            <Plus size={24} className="text-gray-200" />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest">Carrito vacío</p>
                                    </div>
                                ) : (
                                    carritoPedido.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 animate-in slide-in-from-right-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-800 text-xs truncate">{item.nombre}</p>
                                                <p className="text-[10px] font-black text-blue-500">${item.precio.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 ml-3">
                                                <button type="button" onClick={() => quitarDelCarrito(item.id)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500"><Minus size={14} /></button>
                                                <span className="text-sm font-black w-4 text-center text-gray-800">{item.cantidad}</span>
                                                <button type="button" onClick={() => agregarAlCarrito(item)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-500"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="space-y-4 bg-gray-50 md:bg-transparent -mx-4 -mb-4 p-4 md:p-0 border-t md:border-t-0">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Subtotal</span>
                                    <span className="text-2xl font-black text-gray-900">${totalPedidoActual.toLocaleString()}</span>
                                </div>

                                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Estado del pago</p>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setEstadoPagoP('pendiente')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border ${estadoPagoP === 'pendiente' ? 'bg-white border-blue-500 text-blue-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>A la Cuenta</button>
                                        <button type="button" onClick={() => setEstadoPagoP('pagado')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border ${estadoPagoP === 'pagado' ? 'bg-white border-green-500 text-green-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>Pagado</button>
                                    </div>

                                    {estadoPagoP === 'pagado' && (
                                        <div className="mt-3 space-y-2 animate-in fade-in zoom-in-95">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setMetodoPagoP('efectivo')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border ${metodoPagoP === 'efectivo' ? 'bg-white border-green-500 text-green-700' : 'bg-transparent border-transparent text-gray-400'}`}>Efectivo</button>
                                                <button type="button" onClick={() => setMetodoPagoP('transferencia')} className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border ${metodoPagoP === 'transferencia' ? 'bg-white border-purple-500 text-purple-700' : 'bg-transparent border-transparent text-gray-400'}`}>Transf.</button>
                                            </div>
                                            {metodoPagoP === 'efectivo' && (
                                                <input type="number" placeholder="¿Con cuánto pagan?" value={billeteP} onChange={(e) => setBilleteP(e.target.value ? Number(e.target.value) : '')} className="w-full bg-white border border-green-200 rounded-lg p-2 text-xs font-bold outline-none" />
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setModalAbierto(null)} className="hidden md:block flex-1 py-3 text-gray-400 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cerrar</button>
                                    <button type="submit" disabled={carritoPedido.length === 0} className="flex-1 py-4 bg-blue-600 disabled:bg-gray-200 text-white font-black rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 text-sm uppercase tracking-wider">Confirmar Pedido</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* OTROS MODALES (SIMPLIFICADOS PARA RESPONSIVE) */}
            {modalAbierto === 'terminar_chico' && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2"><Skull className="text-red-500" /> Finalizar Juego</h3>
                        <div className="bg-gray-50 p-4 rounded-2xl mb-5 border border-gray-100 text-sm space-y-3 font-medium">
                            <div className="flex justify-between text-gray-500"><span>Tiempo ({minutosChicoActual}m)</span><span className="font-black text-gray-800">${costoTiempoActual.toLocaleString()}</span></div>
                            <div className="flex justify-between text-gray-500"><span>Consumos</span><span className="font-black text-gray-800">${costoConsumosActuales.toLocaleString()}</span></div>
                            <div className="border-t border-gray-200 pt-3 flex justify-between text-xl font-black text-red-600"><span>TOTAL</span><span>${totalChicoActual.toLocaleString()}</span></div>
                        </div>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase ml-1">¿Quién perdió?</label><input autoFocus type="text" placeholder="Nombre del jugador" value={perdedor} onChange={(e) => setPerdedor(e.target.value)} className="w-full bg-gray-50 border-0 p-4 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-red-500 outline-none" /></div>
                            <div className="bg-gray-50 p-2 rounded-2xl border border-gray-100">
                                <div className="flex gap-1">
                                    <button onClick={() => setPagoChico('pendiente')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${pagoChico === 'pendiente' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}>Pendiente</button>
                                    <button onClick={() => setPagoChico('pagado')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${pagoChico === 'pagado' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-400'}`}>Pagó Ya</button>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setModalAbierto(null)} className="flex-1 py-4 text-gray-400 font-bold">Volver</button>
                                <button onClick={handleTerminarChico} className="flex-[2] bg-red-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-100 active:scale-95">TERMINAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {modalAbierto === 'cierre' && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gray-900 p-6 text-white text-center">
                            <h3 className="text-xl font-black flex items-center justify-center gap-2"><Receipt className="text-emerald-400" /> RESUMEN DE CUENTA</h3>
                            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-bold">Mesa {mesa.numero} • {mesa.tipo_mesa}</p>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4 mb-6 pb-6 border-b border-dashed border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Chicos pendientes ({chicosPendientes.length})</span>
                                    <span className="font-bold text-gray-900">${totalChicosPendientes.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Último juego</span>
                                    <span className="font-bold text-gray-900">${totalChicoActual.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-base font-black text-gray-900 uppercase">Total a Cobrar</span>
                                    <span className="text-3xl font-black text-emerald-600">${GRAN_TOTAL_CIERRE.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                                <label className="text-[10px] font-black text-gray-400 uppercase mb-3 block text-center">Método de Pago</label>
                                <div className="flex gap-2 mb-4">
                                    <button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all border ${metodoPago === 'efectivo' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>💵 Efectivo</button>
                                    <button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all border ${metodoPago === 'transferencia' ? 'bg-white border-purple-500 text-purple-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>📱 Transf.</button>
                                </div>
                                {metodoPago === 'efectivo' && (
                                    <div className="bg-white border border-gray-100 rounded-xl p-3 flex justify-between items-center">
                                        <input type="number" placeholder="¿Recibido?" value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="w-1/2 outline-none text-xl font-black text-gray-900" />
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400">VUELTO</p>
                                            <p className={`text-lg font-black ${(Number(billete) - GRAN_TOTAL_CIERRE) >= 0 ? 'text-green-600' : 'text-red-400'}`}>
                                                ${billete ? (Number(billete) - GRAN_TOTAL_CIERRE).toLocaleString() : '0'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setModalAbierto(null)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors">Volver</button>
                                <button onClick={handleCerrarMesa} disabled={metodoPago === 'efectivo' && Number(billete) < GRAN_TOTAL_CIERRE} className="flex-[2] bg-emerald-600 disabled:bg-gray-200 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 active:scale-95 text-base">COBRAR TODO</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: VER DETALLE CHICO (RESPONSIVE) */}
            {chicoSeleccionado && (
                <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setChicoSeleccionado(null)} className="absolute top-4 right-4 text-gray-400"><X size={20} /></button>
                        <h3 className="text-lg font-black text-gray-900 mb-1">Detalle del Juego</h3>
                        <p className="text-xs text-red-500 font-bold uppercase mb-4">Deuda de {chicoSeleccionado.perdedor}</p>

                        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 max-h-60 overflow-y-auto">
                            <div className="flex justify-between text-xs mb-3 pb-2 border-b border-gray-200">
                                <span className="text-gray-500 uppercase font-bold">Tiempo</span>
                                <span className="font-black text-gray-800">${chicoSeleccionado.costoTiempo?.toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                                {chicoSeleccionado.productos?.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-gray-600 font-medium">{p.cantidad}x {p.nombre}</span>
                                        <span className="font-bold text-gray-800">${p.total.toLocaleString()}</span>
                                    </div>
                                ))}
                                {(!chicoSeleccionado.productos || chicoSeleccionado.productos.length === 0) && (
                                    <p className="text-[10px] text-gray-400 italic text-center py-2">Sin productos adicionales</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-6 pt-2">
                            <span className="font-black text-gray-400 uppercase text-xs">Total del Chico</span>
                            <span className="text-3xl font-black text-gray-900">${chicoSeleccionado.total.toLocaleString()}</span>
                        </div>

                        <button onClick={() => setChicoSeleccionado(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black active:scale-95 shadow-lg">ENTENDIDO</button>
                    </div>
                </div>
            )}
        </div>
    )
}