'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function abrirMesa(formData: FormData) {
    const id = formData.get('id')
    const modalidad = formData.get('modalidad')
    await supabase.from('mesas').update({
        estado: 'ocupada', hora_inicio: new Date().toISOString(), modalidad, minutos_prepago: 0, chicos: [], consumos: []
    }).eq('id', id)
    revalidatePath('/dashboard')
}

export async function anotarChico(formData: FormData) {
    const id = formData.get('id')
    const perdedor = formData.get('perdedor')
    const valor = parseInt(formData.get('valor')?.toString() || '0')
    const chicosActuales = JSON.parse(formData.get('chicos_actuales')?.toString() || '[]')
    await supabase.from('mesas').update({
        chicos: [...chicosActuales, { perdedor, valor, hora: new Date().toLocaleTimeString() }]
    }).eq('id', id)
    revalidatePath('/dashboard')
}

// NUEVA VERSIÓN: Conecta con inventario y estado de pago
export async function agregarConsumoMesa(mesaId: string, productoId: string, nombre: string, cantidad: number, precio: number, estadoPago: 'pagado' | 'pendiente', metodoPago?: string, consumosActuales: any[] = []) {
    const total = cantidad * precio

    // 1. Descontar del inventario
    const { data: prod } = await supabase.from('productos').select('stock').eq('id', productoId).single()
    if (prod) {
        await supabase.from('productos').update({ stock: prod.stock - cantidad }).eq('id', productoId)
    }

    // 2. Si lo pagó de inmediato, lo guardamos en la Caja Diaria
    if (estadoPago === 'pagado' && metodoPago) {
        await supabase.from('historial_ventas').insert([{
            tipo: 'mesa',
            descripcion: `Pago Inmediato (Mesa): ${cantidad}x ${nombre}`,
            total: total,
            metodo_pago: metodoPago
        }])
    }

    // 3. Lo agregamos a la mesa (para que quede el registro)
    const nuevoConsumo = { productoId, nombre, cantidad, total, estadoPago, hora: new Date().toLocaleTimeString() }
    await supabase.from('mesas').update({ consumos: [...consumosActuales, nuevoConsumo] }).eq('id', mesaId)

    revalidatePath('/dashboard')
}

// NUEVA VERSIÓN: Cierre Total y Facturación
export async function procesarCierreMesa(mesaId: string, descripcionTicket: string, granTotal: number, metodoPago: string) {
    // 1. Guardar el Gran Total en la Caja Diaria
    await supabase.from('historial_ventas').insert([{
        tipo: 'mesa',
        descripcion: descripcionTicket,
        total: granTotal,
        metodo_pago: metodoPago
    }])

    // 2. Liberar la mesa
    await supabase.from('mesas').update({
        estado: 'disponible', hora_inicio: null, modalidad: null, minutos_prepago: 0, chicos: [], consumos: []
    }).eq('id', mesaId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/historial')
}