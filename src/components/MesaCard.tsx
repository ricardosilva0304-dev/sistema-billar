'use client'

import { useState, useEffect } from 'react'
import { Clock, Coffee, Skull, Receipt, CheckCircle2, AlertCircle, Play, Zap, Search, Plus, Minus, Trash2, Info } from 'lucide-react'
import { abrirMesa, anotarChico, agregarConsumoMesa, procesarCierreMesa, terminarChico } from '@/app/actions/mesas'

export default function MesaCard({ mesa, tarifas, productos }: { mesa: any, tarifas: any[], productos: any[] }) {
    const [minutosChicoActual, setMinutosChicoActual] = useState(0)
    const [modalAbierto, setModalAbierto] = useState<string | null>(null)

    // --- ESTADOS GLOBALES MESA ---
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo')
    const [billete, setBillete] = useState<number | ''>('')

    // --- ESTADOS NUEVO PEDIDO (CARRITO MÚLTIPLE) ---
    const [carritoPedido, setCarritoPedido] = useState<any[]>([])
    const [busquedaProd, setBusquedaProd] = useState('')
    const [estadoPagoP, setEstadoPagoP] = useState<'pendiente' | 'pagado'>('pendiente')
    const [metodoPagoP, setMetodoPagoP] = useState('efectivo')
    const [billeteP, setBilleteP] = useState<number | ''>('') // Billete para el pedido instantáneo

    // --- ESTADOS TERMINAR CHICO ---
    const [perdedor, setPerdedor] = useState('')
    const [pagoChico, setPagoChico] = useState<'pendiente' | 'pagado'>('pendiente')
    const [metodoPagoChico, setMetodoPagoChico] = useState('efectivo')
    const [chicoSeleccionado, setChicoSeleccionado] = useState<any>(null)

    const tarifa = tarifas.find(t => t.tipo_mesa === mesa.tipo_mesa)
    const productosFiltrados = productos.filter(p => p.nombre.toLowerCase().includes(busquedaProd.toLowerCase()))

    // Calcular Total del Carrito del Pedido Actual
    const totalPedidoActual = carritoPedido.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)

    // --- CRONÓMETRO ---
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

    // --- LÓGICA DE TIEMPOS Y COSTOS ---
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

    // --- FUNCIONES CARRITO PEDIDO ---
    const agregarAlCarrito = (producto: any) => {
        setCarritoPedido(prev => {
            const existe = prev.find(p => p.id === producto.id)
            if (existe) {
                if (existe.cantidad >= producto.stock) return prev // Validación básica de stock visual
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

    // --- ACCIONES AL SERVIDOR ---
    const handleIniciarMesa = async (modalidad: string, minutos: number = 0) => {
        const formData = new FormData()
        formData.append('id', mesa.id); formData.append('modalidad', modalidad)
        if (minutos > 0) formData.append('minutos_prepago', minutos.toString())
        await abrirMesa(formData)
    }

    const handleEnviarPedidoCompleto = async (e: React.FormEvent) => {
        e.preventDefault()
        if (carritoPedido.length === 0) return

        // Enviamos cada ítem del carrito al servidor
        // Nota: Idealmente esto sería una sola llamada bulk, pero para mantener compatibilidad usamos un loop
        for (const item of carritoPedido) {
            await agregarConsumoMesa(
                mesa.id,
                item.id,
                item.nombre,
                item.cantidad,
                item.precio,
                estadoPagoP,
                metodoPagoP,
                mesa.consumos || []
            )
        }

        // Limpiar estados
        setModalAbierto(null)
        setCarritoPedido([])
        setBusquedaProd('')
        setEstadoPagoP('pendiente')
        setBilleteP('')
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
                    <div className="grid grid-cols-2 gap-3">{[15, 30, 45, 60].map(min => (<button key={min} onClick={() => handleIniciarMesa('prepago', min)} className="py-3 px-2 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-bold text-sm transition-all shadow-sm">{min === 60 ? '1 Hora' : `${min} min`}</button>))}</div>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={() => handleIniciarMesa('tiempo_libre')} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"><Play size={18} fill="currentColor" /> Tiempo Libre</button>
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

            <div className="p-4 flex justify-between items-start bg-orange-50/30">
                <div>
                    <h3 className="text-xl font-black text-gray-800">Mesa {mesa.numero}</h3>
                    <div className="flex items-center gap-1 text-orange-600 font-mono text-lg font-bold"><Clock size={16} className="animate-pulse" /> {Math.floor(minutosChicoActual / 60)}:{String(minutosChicoActual % 60).padStart(2, '0')}</div>
                </div>
                <div className="text-right"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Acumulado</p><p className="text-xl font-black text-gray-900">${GRAN_TOTAL_CIERRE.toLocaleString()}</p></div>
            </div>

            {chicosPendientes.length > 0 && (
                <div className="px-4 pt-2 pb-1 bg-red-50 border-y border-red-100">
                    <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Por Cobrar ({chicosPendientes.length})</p>
                    <div className="flex flex-wrap gap-2">
                        {chicosPendientes.map((c: any) => (
                            <button key={c.id} onClick={() => setChicoSeleccionado(c)} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-white border border-red-200 rounded-full text-xs text-red-700 font-bold hover:bg-red-100 shadow-sm">
                                {c.perdedor}: ${c.total.toLocaleString()} <Info size={14} className="ml-1 text-red-400" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 px-4 py-2 overflow-y-auto max-h-48">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 mt-1">Juego en Curso</p>
                {consumosActuales.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-200 text-gray-400 text-xs"><Coffee size={16} /> Sin consumos en este juego</div>
                ) : (
                    <div className="space-y-2">
                        {consumosActuales.map((c: any, i: number) => (
                            <div key={`co-${i}`} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2"><span className="font-bold text-gray-700">{c.cantidad}x</span><span className="text-gray-600">{c.nombre}</span></div>
                                <div className="flex items-center gap-2"><span className="font-bold text-gray-900">${c.total.toLocaleString()}</span></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2">
                <button onClick={() => { setModalAbierto('consumo'); setCarritoPedido([]); setBusquedaProd(''); setBilleteP('') }} className="flex flex-col items-center justify-center py-2 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-colors group"><Coffee size={18} className="text-gray-400 group-hover:text-blue-500 mb-1" /><span className="text-xs font-bold">Nuevo Pedido</span></button>
                <button onClick={() => setModalAbierto('terminar_chico')} className="flex flex-col items-center justify-center py-2 bg-white border border-gray-200 rounded-xl hover:border-red-500 hover:text-red-600 transition-colors group"><Skull size={18} className="text-gray-400 group-hover:text-red-500 mb-1" /><span className="text-xs font-bold">Terminar Chico</span></button>
                <div className="col-span-2"><button onClick={() => setModalAbierto('cierre')} className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md"><Receipt size={16} /> Cerrar Cuenta Mesa</button></div>
            </div>

            {/* ================= MODAL NUEVO PEDIDO (CARRITO MÚLTIPLE) ================= */}
            {modalAbierto === 'consumo' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <form onSubmit={handleEnviarPedidoCompleto} className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">

                        {/* LADO IZQUIERDO: SELECCIÓN DE PRODUCTOS */}
                        <div className="w-full md:w-3/5 p-6 bg-gray-50 flex flex-col h-[50vh] md:h-auto border-b md:border-b-0 md:border-r border-gray-200">
                            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><Search className="text-blue-500" /> Productos</h3>
                            <div className="relative mb-4">
                                <input type="text" placeholder="Buscar..." autoFocus value={busquedaProd} onChange={(e) => setBusquedaProd(e.target.value)} className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 shadow-sm" />
                            </div>
                            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-3 content-start">
                                {productosFiltrados.map((prod) => (
                                    <button key={prod.id} type="button" onClick={() => agregarAlCarrito(prod)} disabled={prod.stock === 0} className={`p-3 rounded-xl border text-left transition-all relative bg-white border-gray-200 hover:border-blue-400 hover:shadow-md ${prod.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        <div className="flex justify-between items-start mb-1"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prod.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{prod.stock}</span></div>
                                        <p className="font-bold text-gray-800 text-sm leading-tight mb-1">{prod.nombre}</p>
                                        <p className="text-sm font-black text-gray-900">${prod.precio.toLocaleString()}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* LADO DERECHO: RESUMEN Y PAGO */}
                        <div className="w-full md:w-2/5 p-6 bg-white flex flex-col">
                            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><Coffee className="text-orange-500" /> Pedido Actual</h3>

                            {/* Lista del Carrito */}
                            <div className="flex-1 overflow-y-auto mb-4 pr-2 space-y-2 border-b border-gray-100 pb-4 min-h-[150px]">
                                {carritoPedido.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300"><Coffee size={32} className="mb-2 opacity-20" /><p className="text-xs font-bold">Selecciona productos</p></div>
                                ) : (
                                    carritoPedido.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800 text-sm leading-tight">{item.nombre}</p>
                                                <p className="text-xs text-gray-500">${item.precio.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 ml-2">
                                                <button type="button" onClick={() => quitarDelCarrito(item.id)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"><Minus size={14} /></button>
                                                <span className="text-sm font-black w-4 text-center">{item.cantidad}</span>
                                                <button type="button" onClick={() => agregarAlCarrito(item)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Totales y Pago */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-end"><span className="text-xs font-bold text-gray-400 uppercase">Total Pedido</span><span className="text-2xl font-black text-gray-900">${totalPedidoActual.toLocaleString()}</span></div>

                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">¿Cómo lo pagan?</label>
                                    <div className="flex gap-2 mb-3">
                                        <button type="button" onClick={() => setEstadoPagoP('pendiente')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border ${estadoPagoP === 'pendiente' ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-gray-200 text-gray-400'}`}>A la Mesa</button>
                                        <button type="button" onClick={() => setEstadoPagoP('pagado')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border ${estadoPagoP === 'pagado' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-400'}`}>Paga Ya</button>
                                    </div>

                                    {estadoPagoP === 'pagado' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setMetodoPagoP('efectivo')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${metodoPagoP === 'efectivo' ? 'bg-white border-green-500 text-green-700' : 'bg-transparent border-transparent text-gray-400'}`}>💵 Efectivo</button>
                                                <button type="button" onClick={() => setMetodoPagoP('transferencia')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${metodoPagoP === 'transferencia' ? 'bg-white border-purple-500 text-purple-700' : 'bg-transparent border-transparent text-gray-400'}`}>📱 Transf.</button>
                                            </div>
                                            {metodoPagoP === 'efectivo' && (
                                                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-2">
                                                    <input type="number" placeholder="Recibido..." value={billeteP} onChange={(e) => setBilleteP(e.target.value ? Number(e.target.value) : '')} className="w-24 outline-none text-sm font-bold text-gray-900 bg-transparent" />
                                                    <span className={`text-xs font-bold ${(Number(billeteP) - totalPedidoActual) >= 0 ? 'text-green-600' : 'text-red-500'}`}>Cambio: ${billeteP ? (Number(billeteP) - totalPedidoActual).toLocaleString() : '0'}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setModalAbierto(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                                    <button
                                        type="submit"
                                        disabled={carritoPedido.length === 0 || (estadoPagoP === 'pagado' && metodoPagoP === 'efectivo' && Number(billeteP) < totalPedidoActual)}
                                        className="flex-1 py-3 bg-blue-600 disabled:bg-gray-300 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* ... Mantén los Modales de Terminar Chico y Cierre de Mesa (iguales a la versión anterior) ... */}
            {/* (Si se borraron al copiar, por favor copia y pega las secciones de "modalAbierto === 'terminar_chico'" y "'cierre'" de la respuesta anterior) */}

            {/* === MODAL: TERMINAR CHICO (CON CÁLCULO AUTOMÁTICO) === */}
            {modalAbierto === 'terminar_chico' && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2"><Skull className="text-red-500" /> Terminar Juego</h3>
                        <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100 text-sm space-y-2">
                            <div className="flex justify-between"><span>Tiempo ({Math.floor(minutosChicoActual / 60)}h {minutosChicoActual % 60}m)</span><span className="font-bold">${costoTiempoActual.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Consumos ({consumosActuales.length})</span><span className="font-bold">${costoConsumosActuales.toLocaleString()}</span></div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-black text-gray-900"><span>TOTAL</span><span>${totalChicoActual.toLocaleString()}</span></div>
                        </div>
                        <div className="mb-4"><label className="text-xs font-bold text-gray-400 uppercase block mb-1">¿Quién Perdió?</label><input autoFocus type="text" placeholder="Nombre del jugador" value={perdedor} onChange={(e) => setPerdedor(e.target.value)} className="w-full bg-white border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-900" /></div>
                        <div className="bg-gray-50 p-2 rounded-xl mb-6"><div className="flex gap-2 mb-2"><button onClick={() => setPagoChico('pendiente')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${pagoChico === 'pendiente' ? 'bg-white text-red-600 shadow-sm border border-red-200' : 'text-gray-400'}`}>Lo Debe (Anotar)</button><button onClick={() => setPagoChico('pagado')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${pagoChico === 'pagado' ? 'bg-white text-green-600 shadow-sm border border-green-200' : 'text-gray-400'}`}>Paga Ya</button></div>{pagoChico === 'pagado' && (<select value={metodoPagoChico} onChange={(e) => setMetodoPagoChico(e.target.value)} className="w-full bg-white border border-gray-200 p-2 rounded-lg text-xs"><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select>)}</div>
                        <div className="flex gap-3"><button onClick={() => setModalAbierto(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button><button onClick={handleTerminarChico} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg">Confirmar</button></div>
                    </div>
                </div>
            )}

            {/* === MODAL: CIERRE FINAL === */}
            {modalAbierto === 'cierre' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-0 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gray-900 p-6 text-white"><h3 className="text-xl font-bold flex items-center gap-2"><Receipt className="text-emerald-400" /> Ticket Final</h3><p className="text-gray-400 text-sm mt-1">Mesa {mesa.numero} - {mesa.tipo_mesa}</p></div>
                        <div className="p-6">
                            <div className="space-y-3 mb-6 border-b border-gray-100 pb-6 border-dashed">
                                <div className="flex justify-between text-gray-600"><span>Chicos por Cobrar ({chicosPendientes.length})</span><span className="font-bold text-gray-900">${totalChicosPendientes.toLocaleString()}</span></div>
                                <div className="flex justify-between text-gray-600"><span>Juego Actual (Tiempo+Consumo)</span><span className="font-bold text-gray-900">${totalChicoActual.toLocaleString()}</span></div>
                                <div className="flex justify-between text-2xl font-black pt-2"><span className="text-gray-900">TOTAL A PAGAR</span><span className="text-emerald-600">${GRAN_TOTAL_CIERRE.toLocaleString()}</span></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl mb-6">
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Método de Pago</label>
                                <div className="flex gap-2 mb-3"><button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${metodoPago === 'efectivo' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>💵 Efectivo</button><button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${metodoPago === 'transferencia' ? 'bg-white border-purple-500 text-purple-700 shadow-sm' : 'bg-transparent border-transparent text-gray-400'}`}>📱 Transferencia</button></div>
                                {metodoPago === 'efectivo' && (<div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"><input type="number" placeholder="Recibido..." value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="w-32 outline-none text-lg font-bold text-gray-900 placeholder-gray-300" /><div className="text-right"><span className="text-xs text-gray-400 block">Vueltas</span><span className={`font-bold ${(Number(billete) - GRAN_TOTAL_CIERRE) >= 0 ? 'text-green-600' : 'text-red-500'}`}>${billete ? (Number(billete) - GRAN_TOTAL_CIERRE).toLocaleString() : '0'}</span></div></div>)}
                            </div>
                            <div className="flex gap-3"><button onClick={() => setModalAbierto(null)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors">Volver</button><button onClick={handleCerrarMesa} disabled={metodoPago === 'efectivo' && Number(billete) < GRAN_TOTAL_CIERRE} className="flex-1 bg-gray-900 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">Cobrar Todo</button></div>
                        </div>
                    </div>
                </div>
            )}

            {/* === MODAL: VER DETALLE CHICO === */}
            {chicoSeleccionado && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-start mb-4"><h3 className="text-lg font-black text-gray-900">Detalle de Juego</h3><span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">Pendiente</span></div>
                        <div className="mb-4"><p className="text-gray-500 text-sm">Perdedor</p><p className="text-xl font-black text-gray-900">{chicoSeleccionado.perdedor}</p><p className="text-xs text-gray-400">Hora: {chicoSeleccionado.hora}</p></div>
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 max-h-40 overflow-y-auto"><div className="flex justify-between text-sm mb-2 pb-2 border-b border-gray-200"><span className="text-gray-600">Costo Tiempo</span><span className="font-bold">${chicoSeleccionado.costoTiempo?.toLocaleString()}</span></div>{chicoSeleccionado.productos?.map((p: any, i: number) => (<div key={i} className="flex justify-between text-sm mb-1"><span className="text-gray-600">{p.cantidad}x {p.nombre}</span><span className="font-bold">${p.total.toLocaleString()}</span></div>))}{(!chicoSeleccionado.productos || chicoSeleccionado.productos.length === 0) && <p className="text-xs text-gray-400 italic">Sin consumos en este juego</p>}</div>
                        <div className="flex justify-between items-center mb-6 pt-2 border-t border-gray-100"><span className="font-bold text-gray-500">Total</span><span className="text-2xl font-black text-red-600">${chicoSeleccionado.total.toLocaleString()}</span></div>
                        <button onClick={() => setChicoSeleccionado(null)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    )
}