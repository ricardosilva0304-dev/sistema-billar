'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Actualizamos Abrir Mesa para iniciar el contador del primer chico
export async function abrirMesa(formData: FormData) {
    const id = formData.get('id')
    const modalidad = formData.get('modalidad')
    const ahora = new Date().toISOString()

    await supabase.from('mesas').update({
        estado: 'ocupada',
        hora_inicio: ahora,
        hora_ultimo_chico: ahora, // <-- NUEVO: Aquí inicia el cronómetro del chico
        modalidad,
        minutos_prepago: 0,
        chicos: [],
        consumos: []
    }).eq('id', id)
    revalidatePath('/dashboard')
}

// Nueva función potente para Cerrar un Chico
export async function terminarChico(
    mesaId: string,
    perdedor: string,
    estadoPago: 'pagado' | 'pendiente',
    metodoPago: string | null,
    costoTiempo: number,
    totalProductos: number,
    productosConsumidos: any[]
) {
    const totalChico = costoTiempo + totalProductos
    const ahora = new Date().toISOString()

    // 1. Si paga de una vez, a la Caja
    if (estadoPago === 'pagado' && metodoPago) {
        await supabase.from('historial_ventas').insert([{
            tipo: 'mesa',
            descripcion: `Chico Pagado (Mesa): ${perdedor} - Tiempo + Consumos`,
            total: totalChico,
            metodo_pago: metodoPago
        }])
    }

    // 2. Traer la mesa actual para no perder los chicos anteriores
    const { data: mesa } = await supabase.from('mesas').select('chicos').eq('id', mesaId).single()
    const historialChicos = mesa?.chicos || []

    // 3. Crear el objeto del Chico Terminado
    const nuevoChico = {
        id: crypto.randomUUID(), // ID único para poder verlo después
        perdedor,
        hora: new Date().toLocaleTimeString(),
        costoTiempo,
        totalProductos,
        total: totalChico,
        productos: productosConsumidos, // Guardamos qué se comieron en ESTE chico
        estadoPago
    }

    // 4. Actualizar Mesa: Guardamos el chico, BORRAMOS consumos actuales y REINICIAMOS el tiempo
    await supabase.from('mesas').update({
        chicos: [...historialChicos, nuevoChico],
        consumos: [], // Se limpia la mesa para el siguiente juego
        hora_ultimo_chico: ahora // El tiempo arranca de cero para el siguiente
    }).eq('id', mesaId)

    revalidatePath('/dashboard')
}

// ... Mantén las funciones agregarConsumoMesa y procesarCierreMesa (pero ojo, el cierre mesa ahora debe sumar los chicos pendientes)
export async function agregarConsumoMesa(mesaId: string, productoId: string, nombre: string, cantidad: number, precio: number, estadoPago: 'pagado' | 'pendiente', metodoPago?: string, consumosActuales: any[] = []) {
    const total = cantidad * precio

    // Descontar Stock
    const { data: prod } = await supabase.from('productos').select('stock').eq('id', productoId).single()
    if (prod) {
        await supabase.from('productos').update({ stock: prod.stock - cantidad }).eq('id', productoId)
    }

    // Si paga YA, a caja. Si no, se suma a la mesa (al chico actual)
    if (estadoPago === 'pagado' && metodoPago) {
        await supabase.from('historial_ventas').insert([{
            tipo: 'mesa',
            descripcion: `Venta Mesa (Directa): ${cantidad}x ${nombre}`,
            total: total,
            metodo_pago: metodoPago
        }])
    } else {
        // Solo si NO está pagado se agrega a la lista visual de la mesa para cobrarlo en el chico
        const nuevoConsumo = { productoId, nombre, cantidad, precio, total, estadoPago: 'pendiente', hora: new Date().toLocaleTimeString() }
        await supabase.from('mesas').update({ consumos: [...consumosActuales, nuevoConsumo] }).eq('id', mesaId)
    }

    revalidatePath('/dashboard')
}

export async function procesarCierreMesa(mesaId: string, descripcionTicket: string, granTotal: number, metodoPago: string) {
    // Guardar en caja
    await supabase.from('historial_ventas').insert([{
        tipo: 'mesa',
        descripcion: descripcionTicket,
        total: granTotal,
        metodo_pago: metodoPago
    }])

    // Limpiar mesa (Aquí cambié modality por modalidad)
    await supabase.from('mesas').update({
        estado: 'disponible',
        hora_inicio: null,
        hora_ultimo_chico: null,
        modalidad: null,
        minutos_prepago: 0,
        chicos: [],
        consumos: []
    }).eq('id', mesaId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/historial')
}

// NUEVA FUNCIÓN: Cancelar mesa por error (Reset total)
export async function cancelarMesa(id: string) {
    await supabase.from('mesas').update({
        estado: 'disponible',
        hora_inicio: null,
        hora_ultimo_chico: null,
        modalidad: null,
        minutos_prepago: 0,
        chicos: [],
        consumos: []
    }).eq('id', id)

    revalidatePath('/dashboard')
}