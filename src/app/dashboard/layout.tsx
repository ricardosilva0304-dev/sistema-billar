import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('billar_session')

    if (!sessionCookie) {
        redirect('/')
    }

    const usuario = JSON.parse(sessionCookie.value)

    return (
        // 1. Cambiamos 'flex' por 'flex flex-col md:flex-row'
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans text-slate-900">

            {/* El Sidebar ya tiene su lógica de fixed/hidden por dentro */}
            <Sidebar usuario={usuario} />

            {/* 2. Añadimos pt-16 solo en móvil para no quedar debajo de la barra superior */}
            <main className="flex-1 pt-16 md:pt-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}