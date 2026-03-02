import { supabase } from '@/lib/supabase'
import { Wallet, ArrowRightLeft, TrendingUp, Calendar, Receipt, CircleDollarSign, Smartphone } from 'lucide-react'
import RealtimeRefresher from '@/components/RealtimeRefresher' // <-- IMPORTANTE: Importamos el escuchador

export const dynamic = 'force-dynamic'

export default async function HistorialPage() {
    // Fecha actual formateada
    const hoy = new Date()
    const fechaFormateada = hoy.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    hoy.setHours(0, 0, 0, 0)

    // Traer ventas de HOY
    const { data: ventas } = await supabase
        .from('historial_ventas')
        .select('*')
        .gte('creado_en', hoy.toISOString())
        .order('creado_en', { ascending: false })

    // Cálculos
    const totalEfectivo = ventas?.filter(v => v.metodo_pago === 'efectivo').reduce((acc, v) => acc + v.total, 0) || 0
    const totalTransferencia = ventas?.filter(v => v.metodo_pago === 'transferencia').reduce((acc, v) => acc + v.total, 0) || 0
    const granTotal = totalEfectivo + totalTransferencia

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 font-sans">

            {/* COMPONENTE INVISIBLE PARA ACTUALIZAR DATOS EN VIVO */}
            <RealtimeRefresher />

            {/* HEADER RESPONSIVO */}
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
                <div className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-blue-100 shadow-sm animate-in fade-in slide-in-from-right-4">
                    {ventas?.length || 0} Movimientos hoy
                </div>
            </div>

            {/* TARJETAS DE TOTALES (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">

                {/* Tarjeta Efectivo */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-xl transition-all group ring-1 ring-gray-50">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-inner">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Efectivo en Caja</p>
                        <p className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">
                            ${totalEfectivo.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Tarjeta Transferencia */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-xl transition-all group ring-1 ring-gray-50">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shadow-inner">
                        <ArrowRightLeft size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bancos / Nequi</p>
                        <p className="text-2xl md:text-3xl font-black text-gray-900 tabular-nums">
                            ${totalTransferencia.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Tarjeta Total (Destacada) */}
                <div className="bg-gray-900 p-6 rounded-3xl shadow-2xl flex items-center gap-5 relative overflow-hidden sm:col-span-2 lg:col-span-1 group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full -translate-y-10 translate-x-10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-white relative z-10 backdrop-blur-sm shadow-xl">
                        <TrendingUp size={28} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Venta Bruta Total</p>
                        <p className="text-3xl md:text-4xl font-black text-white tabular-nums">
                            ${granTotal.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* TABLA DE MOVIMIENTOS */}
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center bg-white gap-4">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Receipt className="text-blue-500" size={24} />
                        Movimientos Recientes
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        En Vivo
                    </div>
                </div>

                {(!ventas || ventas.length === 0) ? (
                    <div className="p-20 text-center flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-dashed border-gray-200">
                            <Receipt size={32} className="text-gray-200" />
                        </div>
                        <p className="font-black text-gray-800 uppercase tracking-widest text-sm">Sin ventas todavía</p>
                        <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto font-medium">
                            Los movimientos aparecerán aquí en cuanto realices el primer cobro del día.
                        </p>
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
                                    <tr key={venta.id} className="hover:bg-blue-50/30 transition-all group animate-in slide-in-from-bottom-2 duration-300">
                                        <td className="p-6 text-sm font-bold text-gray-400 tabular-nums">
                                            {new Date(venta.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${venta.tipo === 'mesa' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {venta.tipo === 'mesa' ? 'Mesa' : 'Inventario'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-sm font-bold text-gray-700 max-w-xs truncate">
                                            {venta.descripcion}
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`p-2 rounded-lg ${venta.metodo_pago === 'efectivo' ? 'bg-emerald-50 text-emerald-500' : 'bg-purple-50 text-purple-500'}`}>
                                                    {venta.metodo_pago === 'efectivo' ? (
                                                        <CircleDollarSign size={16} />
                                                    ) : (
                                                        <Smartphone size={16} />
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                                    {venta.metodo_pago}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <span className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors tabular-nums">
                                                ${venta.total.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {ventas && ventas.length > 0 && (
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Fin del reporte diario</p>
                    </div>
                )}
            </div>
        </div>
    )
}