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
        <div className="flex min-h-screen bg-slate-900">
            {/* Pasamos el usuario al Sidebar para mostrar su nombre y rol */}
            <Sidebar usuario={usuario} />

            {/* El contenido de la página irá aquí */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}