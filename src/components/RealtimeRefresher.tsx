'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RealtimeRefresher() {
    const router = useRouter()

    useEffect(() => {
        // Escuchar cambios en tarifas o usuarios
        const channel = supabase
            .channel('config-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tarifas' }, () => router.refresh())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => router.refresh())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

    return null // No renderiza nada visualmente
}