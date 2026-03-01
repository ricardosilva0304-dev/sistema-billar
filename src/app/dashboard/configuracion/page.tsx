import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { actualizarTarifa, crearUsuario, eliminarUsuario } from '@/app/actions/configuracion'
import { Settings, Save, Users, UserPlus, Shield, Trash2, CreditCard } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
    // 1. Verificación de Seguridad (Solo Administradores)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('billar_session')
    const usuarioSesion = JSON.parse(sessionCookie?.value || '{}')

    if (usuarioSesion.rol !== 'administrador') {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <Shield size={48} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Acceso Restringido</h2>
                <p className="text-gray-500 mt-2">Esta sección es exclusiva para administradores.</p>
                <a href="/dashboard" className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-bold">Volver al Inicio</a>
            </div>
        )
    }

    // 2. Traer datos
    const { data: tarifas } = await supabase.from('tarifas').select('*').order('tipo_mesa')
    const { data: usuarios } = await supabase.from('usuarios').select('*').order('creado_en')

    return (
        <div className="font-sans pb-20">

            {/* HEADER */}
            <div className="mb-10 border-b border-gray-200 pb-6">
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    Configuración ⚙️
                </h1>
                <p className="text-gray-500 mt-2">Gestiona las tarifas de cobro y el acceso de tu personal.</p>
            </div>

            {/* SECCIÓN 1: TARIFAS DE MESAS */}
            <section className="mb-16">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                        <CreditCard size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Tarifas por Tiempo</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {tarifas?.map((tarifa) => (
                        <form action={actualizarTarifa} key={tarifa.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                            <input type="hidden" name="id" value={tarifa.id} />

                            {/* Header de la Tarjeta */}
                            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <span className="font-black text-lg text-gray-800 uppercase tracking-wide">{tarifa.tipo_mesa}</span>
                                <Settings size={18} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                            </div>

                            {/* Inputs de Precios */}
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-500 uppercase">15 - 29 min</label>
                                    <div className="relative w-24">
                                        <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                        <input type="number" name="precio_15_29" defaultValue={tarifa.precio_15_29} className="w-full pl-6 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-right font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-500 uppercase">30 - 44 min</label>
                                    <div className="relative w-24">
                                        <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                        <input type="number" name="precio_30_44" defaultValue={tarifa.precio_30_44} className="w-full pl-6 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-right font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-500 uppercase">45 - 59 min</label>
                                    <div className="relative w-24">
                                        <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
                                        <input type="number" name="precio_45_59" defaultValue={tarifa.precio_45_59} className="w-full pl-6 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-right font-bold text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                                    </div>
                                </div>

                                <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between bg-emerald-50/50 -mx-5 px-5 py-3">
                                    <label className="text-xs font-black text-emerald-700 uppercase">Hora Completa</label>
                                    <div className="relative w-24">
                                        <span className="absolute left-3 top-2 text-emerald-500 text-sm">$</span>
                                        <input type="number" name="precio_hora" defaultValue={tarifa.precio_hora} className="w-full pl-6 pr-3 py-1.5 bg-white border border-emerald-200 rounded-lg text-right font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100">
                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl transition-all text-sm font-bold shadow-lg">
                                    <Save size={16} /> Guardar Cambios
                                </button>
                            </div>
                        </form>
                    ))}
                </div>
            </section>


            {/* SECCIÓN 2: GESTIÓN DE USUARIOS */}
            <section>
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                        <Users size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Equipo de Trabajo</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Formulario Crear Usuario */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><UserPlus size={18} className="text-blue-500" /> Nuevo Usuario</h3>
                        <form action={crearUsuario} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cédula (Login)</label>
                                <input type="number" name="cedula" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" placeholder="Ej: 12345678" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                                <input type="text" name="nombre" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" placeholder="Ej: Juan Pérez" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Rol de Acceso</label>
                                <select name="rol" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 appearance-none">
                                    <option value="empleado">Empleado (Ventas y Mesas)</option>
                                    <option value="administrador">Administrador (Acceso Total)</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex justify-center items-center gap-2">
                                Crear Usuario
                            </button>
                        </form>
                    </div>

                    {/* Lista de Usuarios */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Usuario</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Cédula</th>
                                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Rol</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-400 uppercase">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {usuarios?.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${user.rol === 'administrador' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                    {user.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-gray-800">{user.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600 font-mono text-sm">{user.cedula}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide border ${user.rol === 'administrador' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                {user.rol}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {user.id !== usuarioSesion.id && (
                                                <form action={eliminarUsuario}>
                                                    <input type="hidden" name="id" value={user.id} />
                                                    <button type="submit" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar usuario">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </form>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </section>

        </div>
    )
}