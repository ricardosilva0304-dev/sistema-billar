import { supabase } from '@/lib/supabase'
import MesaCard from '@/components/MesaCard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const { data: mesas } = await supabase.from('mesas').select('*').order('numero')
    const { data: tarifas } = await supabase.from('tarifas').select('*')
    const { data: productos } = await supabase.from('productos').select('*').gt('stock', 0).order('nombre')

    return (
        <div>
            <div className="mb-8 border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    Control de Mesas
                </h1>
                <p className="text-gray-500 mt-2">Selecciona una opción rápida para activar la mesa.</p>
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