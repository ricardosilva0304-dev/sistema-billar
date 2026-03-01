import { supabase } from '@/lib/supabase'
import { Wallet, Landmark, Receipt, ArrowRightLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HistorialPage() {
    // Obtenemos la fecha de hoy a la medianoche para filtrar
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Traemos todas las ventas de hoy
    const { data: ventas } = await supabase
        .from('historial_ventas')
        .select('*')
        .gte('creado_en', hoy.toISOString())
        .order('creado_en', { ascending: false })

    // Calculamos los totales
    const totalEfectivo = ventas?.filter(v => v.metodo_pago === 'efectivo').reduce((acc, v) => acc + v.total, 0) || 0
    const totalTransferencia = ventas?.filter(v => v.metodo_pago === 'transferencia').reduce((acc, v) => acc + v.total, 0) || 0
    const granTotal = totalEfectivo + totalTransferencia

    return (
        <div className="text-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Caja Diaria 💰</h1>
                <p className="text-slate-400 mt-2">Resumen de ingresos del día de hoy.</p>
            </div>

            {/* TARJETAS DE RESUMEN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 bg-green-900/50 text-green-400 rounded-xl"><Wallet size={32} /></div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Efectivo</p>
                        <p className="text-2xl font-bold text-green-400">${totalEfectivo.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 bg-purple-900/50 text-purple-400 rounded-xl"><ArrowRightLeft size={32} /></div>
                    <div>
                        <p className="text-slate-400 text-sm">Total Transferencias</p>
                        <p className="text-2xl font-bold text-purple-400">${totalTransferencia.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-blue-600/20 border border-blue-500 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-4 bg-blue-600 text-white rounded-xl"><Landmark size={32} /></div>
                    <div>
                        <p className="text-blue-200 text-sm">Total Ingresos Hoy</p>
                        <p className="text-3xl font-bold text-white">${granTotal.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* TABLA DE DETALLE */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-2">
                    <Receipt className="text-slate-400" />
                    <h2 className="text-lg font-bold">Registro de Transacciones</h2>
                </div>

                {(!ventas || ventas.length === 0) ? (
                    <p className="p-8 text-center text-slate-500">No hay ventas registradas el día de hoy.</p>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700">
                                <th className="p-4">Hora</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Descripción</th>
                                <th className="p-4">Método</th>
                                <th className="p-4 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map((venta) => (
                                <tr key={venta.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                                    <td className="p-4 text-slate-400">
                                        {new Date(venta.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wider ${venta.tipo === 'mesa' ? 'bg-orange-900/50 text-orange-400' : 'bg-blue-900/50 text-blue-400'}`}>
                                            {venta.tipo}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300">{venta.descripcion}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-max ${venta.metodo_pago === 'efectivo' ? 'bg-green-900/30 text-green-400' : 'bg-purple-900/30 text-purple-400'}`}>
                                            {venta.metodo_pago === 'efectivo' ? '💵 Efectivo' : '📱 Transf.'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-white">
                                        ${venta.total.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}