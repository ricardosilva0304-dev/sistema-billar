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
        if (item.nombre === 'Configuración' && usuario?.rol !== 'administrador') {
            return false
        }
        return true
    })

    return (
        <>
            {/* --- BARRA SUPERIOR MÓVIL --- */}
            <div className="md:hidden bg-black/95 border-b border-white/10 p-4 flex justify-between items-center sticky top-0 z-[40] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-900/40">
                        8
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white font-black text-sm tracking-tighter leading-none">BILLAR PRO</span>
                        <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Manager</span>
                    </div>
                </div>
                <button
                    onClick={() => setMenuAbierto(true)}
                    className="p-2 bg-zinc-900 rounded-lg text-zinc-400 active:scale-95 transition-all"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* --- OVERLAY MÓVIL --- */}
            {menuAbierto && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] md:hidden animate-in fade-in duration-300"
                    onClick={() => setMenuAbierto(false)}
                />
            )}

            {/* --- SIDEBAR PRINCIPAL --- */}
            <aside className={`
                fixed top-0 left-0 h-full w-72 bg-black border-r border-white/5 z-[60] 
                transform transition-transform duration-300 ease-out flex flex-col justify-between
                ${menuAbierto ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo Header */}
                    <div className="p-8 hidden md:flex items-center justify-between">
                        <div className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-emerald-900/20 transition-transform group-hover:rotate-6">
                                8
                            </div>
                            <div>
                                <h1 className="text-white font-black text-xl tracking-tight leading-none">BILLAR PRO</h1>
                                <p className="text-[10px] text-emerald-500 font-bold tracking-[0.2em] uppercase mt-1">SISTEMA POS</p>
                            </div>
                        </div>
                    </div>

                    {/* Botón cerrar para móvil */}
                    <div className="md:hidden p-6 flex justify-end">
                        <button onClick={() => setMenuAbierto(false)} className="p-2 bg-zinc-900 text-zinc-500 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Perfil del Usuario */}
                    <div className="mx-6 mb-8 p-4 rounded-2xl bg-zinc-900/30 border border-white/5 flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 border border-white/10">
                                <UserCircle size={28} />
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${usuario?.rol === 'administrador' ? 'bg-purple-500' : 'bg-emerald-500'}`}></div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-white font-bold text-sm truncate">{usuario?.nombre || 'Usuario'}</p>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{usuario?.rol}</p>
                        </div>
                    </div>

                    {/* Navegación */}
                    <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                        <p className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Menú de Control</p>
                        {itemsVisibles.map((item) => {
                            const activo = pathname === item.ruta
                            return (
                                <Link
                                    key={item.nombre}
                                    href={item.ruta}
                                    onClick={() => setMenuAbierto(false)}
                                    className={`
                                        group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300
                                        ${activo
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-white border border-transparent'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icono size={20} className={`transition-colors duration-300 ${activo ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-white'}`} />
                                        <span className="font-bold text-sm tracking-tight">{item.nombre}</span>
                                    </div>
                                    {activo && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"></div>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer / Logout */}
                    <div className="p-6 mt-auto">
                        <button
                            onClick={() => {
                                if (confirm('¿Seguro que quieres cerrar sesión?')) logout()
                            }}
                            className="group flex items-center gap-4 px-4 py-4 w-full bg-zinc-900/20 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 rounded-2xl border border-white/5 transition-all duration-300 active:scale-95"
                        >
                            <div className="p-2 bg-zinc-900 rounded-xl group-hover:bg-red-500/10 transition-colors">
                                <LogOut size={20} />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-sm">Salir</span>
                                <span className="text-[10px] text-zinc-700 group-hover:text-red-500/50">Cerrar Sesión</span>
                            </div>
                            <ChevronRight size={16} className="ml-auto opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                        <p className="text-center text-[9px] text-zinc-800 mt-6 font-black uppercase tracking-[0.3em]">BillarApp v1.0</p>
                    </div>
                </div>
            </aside>

            {/* ESPACIADOR PARA PC (Para que el contenido no quede debajo del sidebar fijo) */}
            <div className="hidden md:block w-72 shrink-0"></div>
        </>
    )
}