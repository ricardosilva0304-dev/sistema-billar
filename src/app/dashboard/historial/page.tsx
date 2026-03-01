import { supabase } from '@/lib/supabase'
import { Wallet, ArrowRightLeft, TrendingUp, Calendar, Receipt, CircleDollarSign, Smartphone } from 'lucide-react'

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
        <div className="font-sans">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        Caja Diaria 📊
                    </h1>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <Calendar size={16} /> {fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)}
                    </p>
                </div>
                <div className="mt-4 md:mt-0 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
                    {ventas?.length || 0} Transacciones hoy
                </div>
            </div>

            {/* TARJETAS DE TOTALES (KPIS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

                {/* Tarjeta Efectivo */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Efectivo en Caja</p>
                        <p className="text-3xl font-black text-gray-900">${totalEfectivo.toLocaleString()}</p>
                    </div>
                </div>

                {/* Tarjeta Transferencia */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-lg transition-all duration-300 group">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                        <ArrowRightLeft size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bancos / Nequi</p>
                        <p className="text-3xl font-black text-gray-900">${totalTransferencia.toLocaleString()}</p>
                    </div>
                </div>

                {/* Tarjeta Total */}
                <div className="bg-gray-900 p-6 rounded-2xl shadow-xl flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-10 translate-x-10 blur-2xl"></div>
                    <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center text-white relative z-10">
                        <TrendingUp size={28} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Venta Total Hoy</p>
                        <p className="text-3xl font-black text-white">${granTotal.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* TABLA DE TRANSACCIONES */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Receipt className="text-gray-400" size={20} /> Movimientos Recientes
                    </h2>
                </div>

                {(!ventas || ventas.length === 0) ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Receipt size={24} className="opacity-50" />
                        </div>
                        <p className="font-medium">Aún no has realizado ventas hoy.</p>
                        <p className="text-sm mt-1">¡Abre una mesa o vende algo del inventario!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                                    <th className="p-5 font-bold">Hora</th>
                                    <th className="p-5 font-bold">Origen</th>
                                    <th className="p-5 font-bold">Descripción</th>
                                    <th className="p-5 font-bold">Método</th>
                                    <th className="p-5 font-bold text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {ventas.map((venta) => (
                                    <tr key={venta.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="p-5 text-sm font-medium text-gray-500 tabular-nums">
                                            {new Date(venta.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${venta.tipo === 'mesa' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {venta.tipo === 'mesa' ? '🎱 Mesa' : '📦 Caja'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm font-medium text-gray-700">
                                            {venta.descripcion}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                {venta.metodo_pago === 'efectivo' ? (
                                                    <CircleDollarSign size={16} className="text-emerald-500" />
                                                ) : (
                                                    <Smartphone size={16} className="text-purple-500" />
                                                )}
                                                <span className={`text-xs font-bold capitalize ${venta.metodo_pago === 'efectivo' ? 'text-gray-600' : 'text-gray-600'}`}>
                                                    {venta.metodo_pago}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <span className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                                                ${venta.total.toLocaleString()}
                                            </span>
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