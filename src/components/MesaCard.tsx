'use client'

import { useState, useEffect } from 'react'
import { Clock, Coffee, Skull, StopCircle, Play, CheckCircle2, AlertCircle, Receipt } from 'lucide-react'
import { abrirMesa, anotarChico, agregarConsumoMesa, procesarCierreMesa } from '@/app/actions/mesas'

export default function MesaCard({ mesa, tarifas, productos }: { mesa: any, tarifas: any[], productos: any[] }) {
    const [minutosJugados, setMinutosJugados] = useState(0)
    const [modalAbierto, setModalAbierto] = useState<string | null>(null)

    // Estados para el Ticket de Cierre
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo')
    const [billete, setBillete] = useState<number | ''>('')

    // Estados para agregar Consumo
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
            const int = setInterval(calcularTiempo, 60000)
            return () => clearInterval(int)
        }
    }, [mesa])

    // --- LÓGICA DE COBROS ---
    const calcularCostoTiempo = () => {
        if (!tarifa) return 0
        const horas = Math.floor(minutosJugados / 60)
        const resto = minutosJugados % 60
        let cobro = horas * tarifa.precio_hora
        if (resto >= 15 && resto <= 29) cobro += tarifa.precio_15_29
        else if (resto >= 30 && resto <= 44) cobro += tarifa.precio_30_44
        else if (resto >= 45) cobro += tarifa.precio_45_59
        return Number(cobro)
    }

    const costoTiempo = calcularCostoTiempo()
    // Filtramos consumos: Solo sumamos a la cuenta los que están 'pendientes'
    const consumosPendientes = mesa.consumos?.filter((c: any) => c.estadoPago === 'pendiente') || []
    const totalConsumosPendientes = consumosPendientes.reduce((acc: number, c: any) => acc + c.total, 0)
    const totalChicos = mesa.chicos?.reduce((acc: number, c: any) => acc + c.valor, 0) || 0

    const GRAN_TOTAL = costoTiempo + totalConsumosPendientes + totalChicos

    const handleCerrarMesa = async () => {
        const descripcion = `Mesa ${mesa.numero} | Tiempo: ${Math.floor(minutosJugados / 60)}h ${minutosJugados % 60}m ($${costoTiempo}) | Consumos Pendientes: $${totalConsumosPendientes} | Chicos: $${totalChicos}`
        await procesarCierreMesa(mesa.id, descripcion, GRAN_TOTAL, metodoPago)
        setModalAbierto(null)
    }

    const handleAgregarConsumo = async (e: React.FormEvent) => {
        e.preventDefault()
        const p = productos.find(x => x.id === prodSeleccionado)
        if (!p) return
        if (cantidadP > p.stock) return alert('¡No hay suficiente stock!')

        await agregarConsumoMesa(mesa.id, p.id, p.nombre, cantidadP, p.precio, estadoPagoP, metodoPagoP, mesa.consumos || [])
        setModalAbierto(null); setProdSeleccionado(''); setCantidadP(1); setEstadoPagoP('pendiente')
    }

    if (mesa.estado === 'disponible') {
        return (
            <div className="bg-slate-800 border-2 border-green-500/50 rounded-2xl p-6 flex flex-col justify-between items-center text-center shadow-lg hover:border-green-400 transition-colors">
                <div><h3 className="text-4xl font-bold text-white mb-2">{mesa.numero}</h3><span className="bg-slate-900 px-3 py-1 rounded-full text-sm text-slate-300">{mesa.tipo_mesa}</span><p className="text-green-400 font-medium mt-4">Disponible</p></div>
                <button onClick={() => setModalAbierto('abrir')} className="mt-6 w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold flex justify-center gap-2"><Play size={20} /> Abrir Mesa</button>
                {/* Modal Abrir (Igual que antes) */}
                {modalAbierto === 'abrir' && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <form action={(f) => { abrirMesa(f); setModalAbierto(null); }} className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700 text-left">
                            <input type="hidden" name="id" value={mesa.id} /><h3 className="text-xl font-bold text-white mb-4">Abrir Mesa {mesa.numero}</h3>
                            <select name="modalidad" className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg text-white mb-6 outline-none"><option value="tiempo_libre">Tiempo Libre</option></select>
                            <div className="flex gap-3"><button type="button" onClick={() => setModalAbierto(null)} className="flex-1 bg-slate-700 py-3 rounded-lg text-white">Cancelar</button><button type="submit" className="flex-1 bg-green-600 py-3 rounded-lg text-white font-bold">Iniciar</button></div>
                        </form>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="bg-slate-800 border-2 border-orange-500/50 rounded-2xl p-5 flex flex-col justify-between shadow-lg h-full">
            {/* HEADER MESA */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2"><h3 className="text-2xl font-bold text-white">Mesa {mesa.numero}</h3><span className="text-xs bg-slate-700 px-2 py-1 rounded">{mesa.tipo_mesa}</span></div>
                    <div className="flex items-center gap-2 text-orange-400 mt-1 font-mono text-xl"><Clock size={18} /> {Math.floor(minutosJugados / 60)}h {minutosJugados % 60}m</div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400">Total a Pagar Aprox.</p>
                    <p className="text-xl font-bold text-blue-400">${GRAN_TOTAL.toLocaleString()}</p>
                </div>
            </div>

            {/* LISTA DE CONSUMOS EN LA MESA */}
            <div className="flex-1 bg-slate-900/50 rounded-xl p-3 mb-4 overflow-y-auto max-h-40 border border-slate-700/50">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Pedidos de esta mesa</h4>
                {(!mesa.consumos || mesa.consumos.length === 0) ? <p className="text-sm text-slate-600 italic">No hay pedidos</p> :
                    <div className="space-y-2">
                        {mesa.consumos.map((c: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-sm bg-slate-800/50 p-2 rounded">
                                <span className="text-slate-300">{c.cantidad}x {c.nombre}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">${c.total.toLocaleString()}</span>
                                    {c.estadoPago === 'pagado' ? (
                                        <span title="Pagado"><CheckCircle2 size={16} className="text-green-400" /></span>
                                    ) : (
                                        <span title="Pendiente (Se cobra al final)"><AlertCircle size={16} className="text-orange-400" /></span>
                                    )}                                </div>
                            </div>
                        ))}
                    </div>
                }
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => setModalAbierto('chico')} className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg flex justify-center gap-2 text-sm"><Skull size={16} className="text-red-400" /> Chico</button>
                <button onClick={() => setModalAbierto('consumo')} className="bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg flex justify-center gap-2 text-sm"><Coffee size={16} className="text-yellow-400" /> Pedido</button>
            </div>

            <button onClick={() => setModalAbierto('cierre')} className="w-full bg-red-900/50 hover:bg-red-600 text-red-100 py-3 rounded-xl font-bold flex justify-center gap-2 border border-red-800"><StopCircle size={20} /> Cerrar y Cobrar</button>

            {/* MODAL: AGREGAR PEDIDO / INVENTARIO */}
            {modalAbierto === 'consumo' && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleAgregarConsumo} className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
                        <h3 className="text-xl font-bold text-white mb-4 flex gap-2"><Coffee className="text-yellow-400" /> Agregar Pedido</h3>
                        <select required value={prodSeleccionado} onChange={(e) => setProdSeleccionado(e.target.value)} className="w-full bg-slate-900 border p-3 rounded-lg text-white mb-3 outline-none">
                            <option value="">Selecciona Producto...</option>
                            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} (${p.precio}) - Stock: {p.stock}</option>)}
                        </select>
                        <input type="number" min={1} value={cantidadP} onChange={(e) => setCantidadP(Number(e.target.value))} className="w-full bg-slate-900 border p-3 rounded-lg text-white mb-4 outline-none" placeholder="Cantidad" />

                        <div className="mb-6 p-3 bg-slate-900 rounded-lg border border-slate-700">
                            <label className="block text-sm text-slate-400 mb-2">¿Cómo lo van a pagar?</label>
                            <div className="flex gap-2 mb-2">
                                <button type="button" onClick={() => setEstadoPagoP('pendiente')} className={`flex-1 py-2 text-sm rounded ${estadoPagoP === 'pendiente' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Anotar a la Mesa</button>
                                <button type="button" onClick={() => setEstadoPagoP('pagado')} className={`flex-1 py-2 text-sm rounded ${estadoPagoP === 'pagado' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Pago Inmediato</button>
                            </div>
                            {estadoPagoP === 'pagado' && (
                                <select value={metodoPagoP} onChange={(e) => setMetodoPagoP(e.target.value)} className="w-full bg-slate-800 p-2 rounded text-white text-sm outline-none">
                                    <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option>
                                </select>
                            )}
                        </div>
                        <div className="flex gap-3"><button type="button" onClick={() => setModalAbierto(null)} className="flex-1 bg-slate-700 py-3 rounded-lg text-white">Cancelar</button><button type="submit" className="flex-1 bg-yellow-600 py-3 rounded-lg text-white font-bold">Agregar</button></div>
                    </form>
                </div>
            )}

            {/* MODAL: TICKET Y CIERRE DE MESA */}
            {modalAbierto === 'cierre' && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700">
                        <h3 className="text-2xl font-bold text-white mb-4 flex gap-2 items-center border-b border-slate-700 pb-4"><Receipt className="text-blue-400" /> Ticket de Cierre - Mesa {mesa.numero}</h3>

                        <div className="space-y-3 mb-6 bg-slate-900 p-4 rounded-xl border border-slate-700 text-slate-300">
                            <div className="flex justify-between text-lg"><span className="text-slate-400">Tiempo ({Math.floor(minutosJugados / 60)}h {minutosJugados % 60}m)</span><span className="font-bold text-white">${costoTiempo.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Consumos Pendientes</span><span className="font-bold text-white">${totalConsumosPendientes.toLocaleString()}</span></div>
                            <div className="flex justify-between border-b border-slate-700 pb-3"><span className="text-slate-400">Chicos Anotados</span><span className="font-bold text-white">${totalChicos.toLocaleString()}</span></div>
                            <div className="flex justify-between text-2xl font-bold pt-2"><span className="text-blue-400">GRAN TOTAL</span><span className="text-green-400">${GRAN_TOTAL.toLocaleString()}</span></div>
                        </div>

                        {/* Calculadora de Pago */}
                        <div className="mb-6">
                            <div className="flex gap-2 mb-4">
                                <button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${metodoPago === 'efectivo' ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-900 text-slate-400'}`}>💵 Efectivo</button>
                                <button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${metodoPago === 'transferencia' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 text-slate-400'}`}>📱 Transferencia</button>
                            </div>
                            {metodoPago === 'efectivo' && (
                                <div className="space-y-3 p-3 bg-slate-900 rounded-lg border border-slate-700">
                                    <input type="number" placeholder="Billete Recibido Ej: 50000" value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-800 text-white p-3 rounded-lg border outline-none text-lg" />
                                    <div className="flex justify-between items-center pt-2"><span className="text-sm text-slate-300 font-bold">Vueltas:</span><span className={`text-xl font-bold ${(Number(billete) - GRAN_TOTAL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>${billete ? (Number(billete) - GRAN_TOTAL).toLocaleString() : '0'}</span></div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3"><button onClick={() => setModalAbierto(null)} className="flex-1 bg-slate-700 py-4 rounded-xl text-white">Cancelar</button><button onClick={handleCerrarMesa} disabled={metodoPago === 'efectivo' && Number(billete) < GRAN_TOTAL} className="flex-1 bg-blue-600 disabled:bg-slate-700 py-4 rounded-xl text-white font-bold">Cobrar y Liberar</button></div>
                    </div>
                </div>
            )}

            {/* Modal Chico (Igual que antes pero oculto aquí por espacio, lo copias de tu archivo anterior si se borró, la lógica de chico no cambió) */}
            {modalAbierto === 'chico' && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <form action={(f) => { anotarChico(f); setModalAbierto(null); }} className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border">
                        <input type="hidden" name="id" value={mesa.id} /><input type="hidden" name="chicos_actuales" value={JSON.stringify(mesa.chicos || [])} />
                        <h3 className="text-xl font-bold text-white mb-4"><Skull className="inline text-red-400" /> Anotar Chico</h3>
                        <input type="text" name="perdedor" required placeholder="Nombre" className="w-full bg-slate-900 p-3 rounded-lg mb-3 text-white outline-none" /><input type="number" name="valor" required placeholder="Valor ($)" className="w-full bg-slate-900 p-3 rounded-lg mb-6 text-white outline-none" />
                        <div className="flex gap-3"><button type="button" onClick={() => setModalAbierto(null)} className="flex-1 bg-slate-700 py-3 rounded-lg text-white">Cancelar</button><button type="submit" className="flex-1 bg-red-600 py-3 rounded-lg text-white font-bold">Anotar</button></div>
                    </form>
                </div>
            )}
        </div>
    )
}