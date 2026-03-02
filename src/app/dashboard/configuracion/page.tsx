import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { actualizarTarifa, crearUsuario, eliminarUsuario } from '@/app/actions/configuracion'
import { Settings, Save, Users, UserPlus, Shield, Trash2, CreditCard, ChevronRight, UserCircle, CheckCircle2 } from 'lucide-react'
import RealtimeRefresher from '@/components/RealtimeRefresher' // Importamos el componente que creamos arriba

export const dynamic = 'force-dynamic'

export default async function ConfiguracionPage() {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('billar_session')
    const usuarioSesion = JSON.parse(sessionCookie?.value || '{}')

    // Seguridad: Solo Admin
    if (usuarioSesion.rol !== 'administrador') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
                <div className="bg-red-50 p-8 rounded-full mb-6 animate-pulse">
                    <Shield size={64} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-black text-gray-900">Acceso Restringido</h2>
                <p className="text-gray-500 mt-3 max-w-md">Esta sección es exclusiva para administradores.</p>
                <a href="/dashboard" className="mt-8 px-8 py-4 bg-gray-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    Volver al Inicio
                </a>
            </div>
        )
    }

    const { data: tarifas } = await supabase.from('tarifas').select('*').order('tipo_mesa')
    const { data: usuarios } = await supabase.from('usuarios').select('*').order('creado_en')

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Activar Tiempo Real */}
            <RealtimeRefresher />

            {/* HEADER */}
            <div className="mb-10 border-b border-gray-200 pb-8">
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                    Configuración <span className="text-gray-300">|</span> <span className="text-emerald-500">⚙️</span>
                </h1>
                <p className="text-gray-500 mt-2 font-medium">Control maestro de precios y accesos del sistema.</p>
            </div>

            {/* SECCIÓN 1: TARIFAS */}
            <section className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Tarifas</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Precios automáticos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {tarifas?.map((tarifa) => (
                        <form action={actualizarTarifa} key={tarifa.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all group ring-1 ring-gray-50">
                            <input type="hidden" name="id" value={tarifa.id} />

                            <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <span className="font-black text-gray-800 uppercase tracking-tighter text-lg">{tarifa.tipo_mesa}</span>
                                <Settings size={18} className="text-gray-300 group-hover:text-emerald-500 group-hover:rotate-90 transition-all duration-500" />
                            </div>

                            <div className="p-6 space-y-5">
                                {[
                                    { label: '15 - 29 min', name: 'precio_15_29', value: tarifa.precio_15_29 },
                                    { label: '30 - 44 min', name: 'precio_30_44', value: tarifa.precio_30_44 },
                                    { label: '45 - 59 min', name: 'precio_45_59', value: tarifa.precio_45_59 }
                                ].map((item) => (
                                    <div key={item.name} className="flex items-center justify-between gap-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase">{item.label}</label>
                                        <div className="relative group/input">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold group-focus-within/input:text-emerald-500 transition-colors">$</span>
                                            <input type="number" name={item.name} defaultValue={item.value} className="w-28 pl-7 pr-3 py-2 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-xl text-right font-black text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-5 mt-2 border-t border-dashed border-gray-200">
                                    <div className="bg-emerald-50 p-4 rounded-2xl flex items-center justify-between border border-emerald-100">
                                        <label className="text-[10px] font-black text-emerald-700 uppercase">Hora Completa</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-300 font-bold">$</span>
                                            <input type="number" name="precio_hora" defaultValue={tarifa.precio_hora} className="w-24 pl-7 pr-3 py-2 bg-white border-0 ring-1 ring-emerald-200 rounded-xl text-right font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white border-t border-gray-50">
                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-4 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95">
                                    <Save size={16} /> Guardar
                                </button>
                            </div>
                        </form>
                    ))}
                </div>
            </section>

            {/* SECCIÓN 2: USUARIOS */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Personal</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gestión de accesos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* FORMULARIO */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 sticky top-6">
                            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                <UserPlus size={20} className="text-blue-500" /> Registrar
                            </h3>
                            <form action={crearUsuario} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Cédula (Login)</label>
                                    <input type="number" name="cedula" required className="w-full px-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold shadow-sm" placeholder="Ej: 1098765432" autoComplete="off" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nombre</label>
                                    <input type="text" name="nombre" required className="w-full px-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold shadow-sm" placeholder="Ej: Juan Pérez" autoComplete="off" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Rol</label>
                                    <div className="relative">
                                        <select name="rol" required className="w-full px-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 font-bold appearance-none shadow-sm cursor-pointer">
                                            <option value="empleado">Empleado</option>
                                            <option value="administrador">Administrador</option>
                                        </select>
                                        <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all active:scale-95 flex justify-center items-center gap-2 uppercase text-xs tracking-widest mt-2">
                                    Crear Usuario
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* LISTA */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Usuario</th>
                                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase">Cédula</th>
                                            <th className="p-5 text-[10px] font-black text-gray-400 uppercase text-center">Rol</th>
                                            <th className="p-5 text-right text-[10px] font-black text-gray-400 uppercase">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {usuarios?.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-md ${user.rol === 'administrador' ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-500 shadow-blue-200'}`}>
                                                            {user.nombre.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="font-bold text-gray-800 text-sm">{user.nombre}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-gray-500 font-mono text-xs font-medium">{user.cedula}</td>
                                                <td className="p-5 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wide border shadow-sm ${user.rol === 'administrador' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                                        {user.rol === 'administrador' ? <Shield size={10} /> : <UserCircle size={10} />}
                                                        {user.rol}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right">
                                                    {user.id !== usuarioSesion.id ? (
                                                        <form action={eliminarUsuario}>
                                                            <input type="hidden" name="id" value={user.id} />
                                                            <button type="submit" className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100" title="Eliminar">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </form>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-gray-300 uppercase px-3 py-1 bg-gray-50 rounded-lg">
                                                            <CheckCircle2 size={10} /> Tú
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}