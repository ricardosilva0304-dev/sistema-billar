'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Monitor, Package, Clock, LogOut, Settings, UserCircle, ChevronRight } from 'lucide-react'
import { logout } from '@/app/actions/auth'

const menuItems = [
    { nombre: 'Mesas', icono: Monitor, ruta: '/dashboard' },
    { nombre: 'Inventario', icono: Package, ruta: '/dashboard/inventario' },
    { nombre: 'Historial', icono: Clock, ruta: '/dashboard/historial' },
    { nombre: 'Configuración', icono: Settings, ruta: '/dashboard/configuracion' },
]

export default function Sidebar({ usuario }: { usuario: any }) {
    const [menuAbierto, setMenuAbierto] = useState(false)
    const pathname = usePathname()

    const itemsVisibles = menuItems.filter(item => {
        if (item.nombre === 'Configuración' && usuario?.rol !== 'administrador') return false
        return true
    })

    return (
        <>
            {/* BARRA SUPERIOR MÓVIL (Ocupa todo el ancho arriba) */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b border-white/10 z-50 flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg shadow-emerald-900/40">8</div>
                    <span className="text-white font-bold text-sm tracking-tight">BILLAR PRO</span>
                </div>
                <button 
                    onClick={() => setMenuAbierto(true)} 
                    className="p-2 text-zinc-400 active:bg-zinc-900 rounded-lg"
                >
                    <Menu size={24} />
                </button>
            </header>

            {/* FONDO OSCURO CUANDO EL MENÚ ESTÁ ABIERTO */}
            {menuAbierto && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] md:hidden"
                    onClick={() => setMenuAbierto(false)}
                />
            )}

            {/* SIDEBAR (MENÚ LATERAL) */}
            <aside className={`
                fixed top-0 left-0 h-full w-72 bg-black z-[70] 
                transform transition-transform duration-300 ease-in-out
                ${menuAbierto ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 border-r border-white/5 flex flex-col
            `}>
                <div className="p-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-900/40">8</div>
                        <h1 className="text-white font-bold text-xl">BILLAR PRO</h1>
                    </div>
                    <button onClick={() => setMenuAbierto(false)} className="md:hidden text-zinc-500"><X size={24} /></button>
                </div>

                <div className="px-6 mb-8 flex items-center gap-3 p-4 bg-zinc-900/30 rounded-2xl mx-4 border border-white/5">
                    <UserCircle className="text-zinc-500" size={32} />
                    <div className="min-w-0">
                        <p className="text-white text-sm font-bold truncate">{usuario?.nombre}</p>
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{usuario?.rol}</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {itemsVisibles.map((item) => {
                        const activo = pathname === item.ruta
                        return (
                            <Link
                                key={item.nombre}
                                href={item.ruta}
                                onClick={() => setMenuAbierto(false)}
                                className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${activo ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icono size={20} />
                                    <span className="font-bold text-sm">{item.nombre}</span>
                                </div>
                                {activo && <ChevronRight size={16} />}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-4 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition-all font-bold text-sm">
                        <LogOut size={20} /> Cerrar Sesión
                    </button>
                </div>
            </aside>
            
            {/* Espacio para que el contenido no quede debajo en Desktop */}
            <div className="hidden md:block w-72 shrink-0"></div>
        </>
    )
}