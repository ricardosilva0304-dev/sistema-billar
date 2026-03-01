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
        <div className="flex min-h-screen bg-gray-50 font-sans text-slate-900"> {/* CAMBIO AQUÍ */}
            <Sidebar usuario={usuario} />
            <main className="flex-1 overflow-y-auto h-screen">
                <div className="p-4 md:p-8 max-w-7xl mx-auto"> {/* Agregué max-w para que no se estire infinito en pantallas gigantes */}
                    {children}
                </div>
            </main>
        </div>
    )
}