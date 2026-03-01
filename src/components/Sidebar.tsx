'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Monitor, Package, Clock, LogOut, Settings } from 'lucide-react'
import { logout } from '@/app/actions/auth'


// Agrega la configuración al menú
const menuItems = [
    { nombre: 'Mesas', icono: Monitor, ruta: '/dashboard' },
    { nombre: 'Inventario', icono: Package, ruta: '/dashboard/inventario' },
    { nombre: 'Historial', icono: Clock, ruta: '/dashboard/historial' },
    { nombre: 'Configuración', icono: Settings, ruta: '/dashboard/configuracion' },
]
export default function Sidebar({ usuario }: { usuario: any }) {
    const [menuAbierto, setMenuAbierto] = useState(false)
    const pathname = usePathname() // Para saber en qué página estamos y pintarla de otro color

    return (
        <>
            {/* --- BARRA SUPERIOR MÓVIL (Solo se ve en celulares) --- */}
            <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-2 text-white font-bold text-xl">
                    <span className="text-2xl">🎱</span> Billar
                </div>
                <button onClick={() => setMenuAbierto(true)} className="text-white p-2">
                    <Menu size={28} />
                </button>
            </div>

            {/* --- FONDO OSCURO EN MÓVIL (Cuando el menú está abierto) --- */}
            {menuAbierto && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden"
                    onClick={() => setMenuAbierto(false)}
                />
            )}

            {/* --- SIDEBAR LATERAL --- */}
            <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-slate-800 border-r border-slate-700 z-40 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${menuAbierto ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:z-auto
      `}>
                {/* Logo y Título */}
                <div className="p-6 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-3 text-white font-bold text-2xl">
                        <span>🎱</span> Billar
                    </div>
                    {/* Botón para cerrar menú en móvil */}
                    <button onClick={() => setMenuAbierto(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Info del Usuario */}
                <div className="px-6 py-4 bg-slate-900/50">
                    <p className="text-white font-medium truncate">{usuario?.nombre}</p>
                    <p className="text-xs text-blue-400 uppercase tracking-wider mt-1">{usuario?.rol}</p>
                </div>

                {/* Links de Navegación */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const activo = pathname === item.ruta
                        return (
                            <Link
                                key={item.nombre}
                                href={item.ruta}
                                onClick={() => setMenuAbierto(false)} // Cierra el menú al dar clic en celular
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${activo
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                    }
                `}
                            >
                                <item.icono size={20} />
                                <span className="font-medium">{item.nombre}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Botón de Cerrar Sesión (Al fondo) */}
                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    )
}