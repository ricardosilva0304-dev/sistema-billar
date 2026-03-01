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

    // Filtramos el menú según el rol
    const itemsVisibles = menuItems.filter(item => {
        // Si el ítem es Configuración y el usuario NO es admin, lo ocultamos
        if (item.nombre === 'Configuración' && usuario?.rol !== 'administrador') {
            return false
        }
        return true
    })

    return (
        <>
            {/* --- BARRA SUPERIOR MÓVIL (Solo visible en celular) --- */}
            <div className="md:hidden bg-zinc-950 border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/50">
                        8
                    </div>
                    <span className="text-white font-bold text-lg tracking-wide">BILLAR PRO</span>
                </div>
                <button onClick={() => setMenuAbierto(true)} className="text-zinc-400 hover:text-white transition-colors">
                    <Menu size={28} />
                </button>
            </div>

            {/* --- FONDO OSCURO (Overlay móvil) --- */}
            {menuAbierto && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
                    onClick={() => setMenuAbierto(false)}
                />
            )}

            {/* --- SIDEBAR LATERAL --- */}
            <aside className={`
                fixed top-0 left-0 h-screen w-72 bg-black border-r border-white/10 z-40 
                transform transition-transform duration-300 ease-in-out flex flex-col justify-between
                shadow-2xl shadow-black
                ${menuAbierto ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 md:static md:z-auto
            `}>
                <div>
                    {/* Logo Header */}
                    <div className="p-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-800 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-900/40 rotate-3 group-hover:rotate-0 transition-transform">
                                8
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-xl tracking-wider leading-none">BILLAR</h1>
                                <span className="text-xs text-emerald-500 font-medium tracking-[0.2em] uppercase">Manager</span>
                            </div>
                        </div>
                        <button onClick={() => setMenuAbierto(false)} className="md:hidden text-zinc-500 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Perfil del Usuario */}
                    <div className="mx-4 mb-6 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <UserCircle size={24} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-white font-medium text-sm truncate">{usuario?.nombre}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${usuario?.rol === 'administrador' ? 'bg-purple-500' : 'bg-emerald-500'}`}></div>
                                <p className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">{usuario?.rol}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navegación */}
                    <nav className="px-4 space-y-1">
                        <p className="px-4 text-xs font-bold text-zinc-600 uppercase tracking-widest mb-2 mt-6">Menú Principal</p>
                        {itemsVisibles.map((item) => {
                            const activo = pathname === item.ruta
                            return (
                                <Link
                                    key={item.nombre}
                                    href={item.ruta}
                                    onClick={() => setMenuAbierto(false)}
                                    className={`
                                        group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200
                                        ${activo
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-900/20'
                                            : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icono size={20} className={activo ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-white transition-colors'} />
                                        <span className="font-medium text-sm">{item.nombre}</span>
                                    </div>
                                    {activo && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={() => logout()}
                        className="group flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:bg-red-950/20 hover:text-red-400 rounded-xl transition-all duration-200"
                    >
                        <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-red-900/20 transition-colors">
                            <LogOut size={18} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="font-medium text-sm">Cerrar Sesión</span>
                            <span className="text-[10px] text-zinc-600 group-hover:text-red-500/70">Salir del sistema</span>
                        </div>
                        <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                    </button>
                    <p className="text-center text-[10px] text-zinc-700 mt-4 font-mono">v1.0.0 • BillarApp</p>
                </div>
            </aside>
        </>
    )
}