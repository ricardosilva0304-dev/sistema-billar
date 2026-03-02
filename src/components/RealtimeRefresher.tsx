'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase' // <-- Usamos la conexión global

export default function RealtimeRefresher() {
    const router = useRouter()

    useEffect(() => {
        const channel = supabase
            .channel('config-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tarifas' }, () => router.refresh())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => router.refresh())
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router])

    return null
}