import { supabase } from '@/lib/supabase'
import InventarioClient from './InventarioClient'

export const dynamic = 'force-dynamic'

export default async function InventarioPage() {
    // 1. Traemos los productos
    const { data: productos } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true })

    // 2. Traemos las cuentas que AÚN NO han pagado
    const { data: cuentas } = await supabase
        .from('cuentas_abiertas')
        .select('*')
        .eq('estado', 'pendiente')
        .order('creado_en', { ascending: false })

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Inventario y Ventas 📦</h1>
                <p className="text-slate-400 mt-2">Punto de venta, control de stock y cuentas por cobrar.</p>
            </div>

            <InventarioClient
                productosIniciales={productos || []}
                cuentasIniciales={cuentas || []}
            />
        </div>
    )
}