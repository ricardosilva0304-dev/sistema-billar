import { supabase } from '@/lib/supabase'
import MesaCard from '@/components/MesaCard'
import RealtimeRefresher from '@/components/RealtimeRefresher' // Para actualizar precios/productos si cambian
import { Monitor, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    // 1. Traemos datos iniciales
    const { data: mesas } = await supabase.from('mesas').select('*').order('numero')
    const { data: tarifas } = await supabase.from('tarifas').select('*')
    const { data: productos } = await supabase.from('productos').select('*').gt('stock', 0).order('nombre')

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">

            {/* Componente invisible para recargar si cambian configuraciones en otra pantalla */}
            <RealtimeRefresher />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 border-b border-gray-100 pb-8 text-center md:text-left gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center justify-center md:justify-start gap-3">
                        Control de Mesas <span className="text-emerald-500">🎱</span>
                    </h1>
                    <p className="text-gray-500 mt-2 flex items-center justify-center md:justify-start gap-2 font-medium">
                        <Monitor size={18} className="text-emerald-400" />
                        Panel de gestión en tiempo real
                    </p>
                </div>
                <div className="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                    {mesas?.length || 0} Mesas Habilitadas
                </div>
            </div>

            {/* GRID DE MESAS */}
            {(!mesas || mesas.length === 0) ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <Info size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-400 font-bold">No hay mesas configuradas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {mesas.map((mesa) => (
                        <MesaCard
                            key={mesa.id}
                            mesa={mesa}
                            tarifas={tarifas || []}
                            productos={productos || []}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}