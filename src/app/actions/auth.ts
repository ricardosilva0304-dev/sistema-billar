'use server'

import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
    const cedula = formData.get('cedula')?.toString()

    if (!cedula) {
        return { error: 'Por favor ingresa una cédula' }
    }

    // Buscamos al usuario en Supabase
    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cedula', cedula)
        .single()

    if (error || !usuario) {
        return { error: 'Cédula no encontrada en el sistema' }
    }

    // Guardamos la sesión en una cookie (válida por 12 horas)
    const cookieStore = await cookies()
    cookieStore.set('billar_session', JSON.stringify({
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol
    }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 12, // 12 horas
        path: '/'
    })

    // Redirigimos al panel de control
    redirect('/dashboard')
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('billar_session')
    redirect('/')
}