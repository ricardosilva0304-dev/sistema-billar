'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// 1. Guardar Tarifas
export async function actualizarTarifa(formData: FormData) {
    const id = formData.get('id')

    await supabase.from('tarifas').update({
        precio_15_29: formData.get('precio_15_29'),
        precio_30_44: formData.get('precio_30_44'),
        precio_45_59: formData.get('precio_45_59'),
        precio_hora: formData.get('precio_hora')
    }).eq('id', id)

    revalidatePath('/dashboard/configuracion')
}

// 2. Crear Usuario
export async function crearUsuario(formData: FormData) {
    const cedula = formData.get('cedula')?.toString()
    const nombre = formData.get('nombre')?.toString()
    const rol = formData.get('rol')?.toString()

    if (!cedula || !nombre || !rol) return

    await supabase.from('usuarios').insert([{ cedula, nombre, rol }])
    revalidatePath('/dashboard/configuracion')
}

// 3. Eliminar Usuario
export async function eliminarUsuario(formData: FormData) {
    const id = formData.get('id')
    await supabase.from('usuarios').delete().eq('id', id)
    revalidatePath('/dashboard/configuracion')
}