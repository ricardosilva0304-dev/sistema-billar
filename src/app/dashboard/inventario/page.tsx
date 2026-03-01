import { supabase } from '@/lib/supabase'
import InventarioClient from './InventarioClient'

export const dynamic = 'force-dynamic'

export default async function InventarioPage() {
    const { data: productos } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true })

    const { data: cuentas } = await supabase
        .from('cuentas_abiertas')
        .select('*')
        .eq('estado', 'pendiente')
        .order('creado_en', { ascending: false })

    return (
        <div>
            <div className="mb-8 border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    Punto de Venta 📦
                </h1>
                <p className="text-gray-500 mt-2">Ventas rápidas, control de stock y gestión de fiados.</p>
            </div>

            <InventarioClient
                productosIniciales={productos || []}
                cuentasIniciales={cuentas || []}
            />
        </div>
    )
}