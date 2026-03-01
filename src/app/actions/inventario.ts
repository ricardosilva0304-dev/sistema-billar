'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// 1. Agregar Producto
export async function crearProducto(formData: FormData) {
    const nombre = formData.get('nombre')?.toString()
    const precio = parseInt(formData.get('precio')?.toString() || '0')
    const stock = parseInt(formData.get('stock')?.toString() || '0')

    if (nombre) {
        await supabase.from('productos').insert([{ nombre, precio, stock }])
        revalidatePath('/dashboard/inventario')
    }
}

// 2. Editar Producto
export async function editarProducto(formData: FormData) {
    const id = formData.get('id')?.toString()
    const nombre = formData.get('nombre')?.toString()
    const precio = parseInt(formData.get('precio')?.toString() || '0')
    const stock = parseInt(formData.get('stock')?.toString() || '0')

    if (id && nombre) {
        await supabase.from('productos').update({ nombre, precio, stock }).eq('id', id)
        revalidatePath('/dashboard/inventario')
    }
}

// 3. Eliminar Producto
export async function eliminarProducto(formData: FormData) {
    const id = formData.get('id')?.toString()
    if (id) {
        await supabase.from('productos').delete().eq('id', id)
        revalidatePath('/dashboard/inventario')
    }
}

// 4. Procesar Venta (Descontar del Stock y Guardar en Historial)
export async function procesarVenta(carrito: any[], metodoPago: string, total: number) {
    // 1. Descontamos el stock
    for (const item of carrito) {
        const { data: prod } = await supabase.from('productos').select('stock').eq('id', item.id).single()
        if (prod) {
            await supabase.from('productos').update({ stock: prod.stock - item.cantidad }).eq('id', item.id)
        }
    }

    // 2. Guardamos la venta en el Historial/Caja
    const descripcion = `POS: ${carrito.map(c => `${c.cantidad}x ${c.nombre}`).join(', ')}`
    await supabase.from('historial_ventas').insert([{
        tipo: 'inventario',
        descripcion,
        total,
        metodo_pago: metodoPago
    }])

    revalidatePath('/dashboard/inventario')
    revalidatePath('/dashboard/historial')
}

// -----------------------------------------------------
// FUNCIONES PARA CUENTAS ABIERTAS (FIADOS)
// -----------------------------------------------------

// 1. Guardar el carrito como una nueva "Cuenta Abierta"
export async function crearCuentaAbierta(nombreCliente: string, carrito: any[], total: number) {
    // Descontamos del stock inmediatamente porque el producto ya se lo llevó
    for (const item of carrito) {
        const { data: prod } = await supabase.from('productos').select('stock').eq('id', item.id).single()
        if (prod) {
            await supabase.from('productos').update({ stock: prod.stock - item.cantidad }).eq('id', item.id)
        }
    }

    // Creamos la cuenta a su nombre
    await supabase.from('cuentas_abiertas').insert([{
        nombre_cliente: nombreCliente,
        consumos: carrito,
        total: total
    }])

    revalidatePath('/dashboard/inventario')
}

// 2. Cobrar una Cuenta Abierta
export async function cobrarCuentaAbierta(cuentaId: string, descripcion: string, total: number, metodoPago: string) {
    // Guardamos el ingreso en la Caja Diaria
    await supabase.from('historial_ventas').insert([{
        tipo: 'inventario',
        descripcion: `Cobro Cuenta: ${descripcion}`,
        total: total,
        metodo_pago: metodoPago
    }])

    // Marcamos la cuenta como pagada
    await supabase.from('cuentas_abiertas').update({
        estado: 'pagada'
    }).eq('id', cuentaId)

    revalidatePath('/dashboard/inventario')
    revalidatePath('/dashboard/historial')
}