import { supabase } from '@/lib/supabase'
import { Wallet, ArrowRightLeft, TrendingUp, Calendar, Receipt, CircleDollarSign, Smartphone, Monitor, Store, Clock, CheckCircle2 } from 'lucide-react'
import RealtimeRefresher from '@/components/RealtimeRefresher'

export const dynamic = 'force-dynamic'

export default async function HistorialPage() {
    const hoy = new Date()
    const fechaFormateada = hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    hoy.setHours(0, 0, 0, 0)

    const { data: ventas } = await supabase
        .from('historial_ventas')
        .select('*')
        .gte('creado_en', hoy.toISOString())
        .order('creado_en', { ascending: false })

    // 1. Cálculos Generales
    const totalEfectivo = ventas?.filter(v => v.metodo_pago === 'efectivo').reduce((acc, v) => acc + v.total, 0) || 0
    const totalTransferencia = ventas?.filter(v => v.metodo_pago === 'transferencia').reduce((acc, v) => acc + v.total, 0) || 0
    const granTotal = totalEfectivo + totalTransferencia

    // 2. Cálculos por Mesa / Inventario
    const ingresosPorOrigen: Record<string, number> = {
        '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, 'Barra': 0
    }

    ventas?.forEach(v => {
        if (v.tipo === 'inventario') {
            ingresosPorOrigen['Barra'] += v.total
        } else {
            // Buscamos a qué mesa pertenece el texto
            const match = v.descripcion.match(/Mesa (\d+)/i)
            if (match && match[1] && ingresosPorOrigen[match[1]] !== undefined) {
                ingresosPorOrigen[match[1]] += v.total
            } else {
                // Si es un cobro de chico que no especificó mesa, por ahora va al total general (Barra/Otros)
                ingresosPorOrigen['Barra'] += v.total
            }
        }
    })

    // Función para "Maquillar" los textos feos de la base de datos
    const formatearDescripcion = (desc: string) => {
        let titulo = desc
        let subtitulo = ''
        let tiempo = ''

        // Extraer tiempo si existe en el texto (ej: 1h 30m)
        const matchTiempo = desc.match(/(\d+h \d+m|\d+m)/)
        if (matchTiempo) tiempo = matchTiempo[1]

        if (desc.startsWith('Cierre Mesa')) {
            const partes = desc.split('|')
            titulo = partes[0].trim() // "Cierre Mesa X"
            subtitulo = partes.slice(1).join(' • ').replace(/Chicos Pendientes/g, 'Deudas').replace(/Chico Final/g, 'Juego Final').trim()
        }
        else if (desc.startsWith('Chico Pagado')) {
            titulo = 'Pago de Juego (Chico)'
            subtitulo = desc.split(':')[1]?.trim() || ''
        }
        else if (desc.startsWith('Venta Mesa')) {
            titulo = 'Consumo a la Mesa'
            subtitulo = desc.split(':')[1]?.trim() || ''
        }
        else if (desc.startsWith('POS:')) {
            titulo = 'Venta Directa (Barra)'
            subtitulo = desc.replace('POS:', '').trim()
        }
        else if (desc.startsWith('Cobro Cuenta:')) {
            titulo = 'Pago de Fiado'
            subtitulo = desc.replace('Cobro Cuenta:', '').trim()
        }

        return (
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">{titulo}</span>
                    {tiempo && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-black uppercase tracking-wider border border-orange-100">
                            <Clock size={10} /> {tiempo}
                        </span>
                    )}
                </div>
                {subtitulo && <span className="text-[10px] text-gray-500 font-medium mt-0.5">{subtitulo}</span>}
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 font-sans">
            <RealtimeRefresher />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 border-b border-gray-100 pb-8 text-center md:text-left gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-3">
                        Caja Diaria <span className="text-blue-500">📊</span>
                    </h1>
                    <p className="text-gray-500 mt-2 flex items-center justify-center md:justify-start gap-2 font-medium">
                        <Calendar size={18} className="text-blue-400" />
                        {fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)}
                    </p>
                </div>
                <div className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                    {ventas?.length || 0} Movimientos hoy
                </div>
            </div>

            {/* TARJETAS PRINCIPALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-xl transition-all group ring-1 ring-gray-50">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-inner">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Efectivo en Caja</p>
                        <p className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">${totalEfectivo.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-xl transition-all group ring-1 ring-gray-50">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shadow-inner">
                        <ArrowRightLeft size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bancos / Nequi</p>
                        <p className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">${totalTransferencia.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-gray-900 p-6 rounded-3xl shadow-2xl flex items-center gap-5 relative overflow-hidden sm:col-span-2 lg:col-span-1 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full -translate-y-10 translate-x-10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white relative z-10 backdrop-blur-sm shadow-xl">
                        <TrendingUp size={28} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Venta Bruta Total</p>
                        <p className="text-3xl md:text-4xl font-black text-white tabular-nums">${granTotal.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* RENDIMIENTO POR MESA (NUEVO) */}
            <div className="mb-10">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ml-2">
                    <Monitor size={14} /> Rendimiento por Mesa Hoy
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                        <div key={num} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center hover:-translate-y-1 transition-transform">
                            <p className="text-[10px] font-bold text-gray-400 mb-1">MESA {num}</p>
                            <p className={`text-lg font-black ${ingresosPorOrigen[num.toString()] > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                                ${ingresosPorOrigen[num.toString()].toLocaleString()}
                            </p>
                        </div>
                    ))}
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 shadow-sm text-center hover:-translate-y-1 transition-transform">
                        <p className="text-[10px] font-bold text-orange-400 mb-1 flex items-center justify-center gap-1"><Store size={10} /> BARRA</p>
                        <p className={`text-lg font-black ${ingresosPorOrigen['Barra'] > 0 ? 'text-orange-600' : 'text-orange-300'}`}>
                            ${ingresosPorOrigen['Barra'].toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* TABLA DE MOVIMIENTOS */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center bg-white gap-4">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Receipt className="text-blue-500" size={24} />
                        Historial Detallado
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> En Vivo
                    </div>
                </div>

                {(!ventas || ventas.length === 0) ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-dashed border-gray-200">
                            <Receipt size={32} className="text-gray-200" />
                        </div>
                        <p className="font-black text-gray-800 uppercase tracking-widest text-sm">Sin ventas todavía</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-gray-100">
                                    <th className="p-6">Hora</th>
                                    <th className="p-6">Origen</th>
                                    <th className="p-6">Detalle / Descripción</th>
                                    <th className="p-6 text-center">Método</th>
                                    <th className="p-6 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {ventas.map((venta) => (
                                    <tr key={venta.id} className={`hover:bg-blue-50/30 transition-all group animate-in slide-in-from-bottom-2 duration-300 ${venta.total === 0 ? 'opacity-60 grayscale' : ''}`}>
                                        <td className="p-6 text-xs font-bold text-gray-400 tabular-nums">
                                            {new Date(venta.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${venta.tipo === 'mesa' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {venta.tipo === 'mesa' ? 'Mesa' : 'Barra'}
                                            </span>
                                        </td>

                                        {/* AQUI APLICAMOS EL "MAQUILLAJE" AL TEXTO */}
                                        <td className="p-6">
                                            {formatearDescripcion(venta.descripcion)}
                                        </td>

                                        <td className="p-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`p-2 rounded-lg ${venta.metodo_pago === 'efectivo' ? 'bg-emerald-50 text-emerald-500' : 'bg-purple-50 text-purple-500'}`}>
                                                    {venta.metodo_pago === 'efectivo' ? <CircleDollarSign size={16} /> : <Smartphone size={16} />}
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                    {venta.metodo_pago}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            {venta.total === 0 ? (
                                                <span className="flex items-center justify-end gap-1 text-xs font-bold text-gray-400"><CheckCircle2 size={14} /> Liberada</span>
                                            ) : (
                                                <span className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors tabular-nums">
                                                    ${venta.total.toLocaleString()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}