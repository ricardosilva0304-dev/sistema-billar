import { supabase } from '@/lib/supabase'
import MesaCard from '@/components/MesaCard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    // Traemos todo lo necesario en paralelo
    const { data: mesas } = await supabase.from('mesas').select('*').order('numero')
    const { data: tarifas } = await supabase.from('tarifas').select('*')
    const { data: productos } = await supabase.from('productos').select('*').gt('stock', 0).order('nombre')

    return (
        <div>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">Mesas Activas 🎱</h1>
                    <p className="text-slate-400 mt-2">Administra tiempo, cobra exacto y despacha inventario.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mesas?.map((mesa) => (
                    <MesaCard
                        key={mesa.id}
                        mesa={mesa}
                        tarifas={tarifas || []}
                        productos={productos || []}
                    />
                ))}
            </div>
        </div>
    )
}