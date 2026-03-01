import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { actualizarTarifa, crearUsuario, eliminarUsuario } from '@/app/actions/configuracion'

export default async function ConfiguracionPage() {
    // 1. Verificación de Seguridad (Solo Administradores)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('billar_session')
    const usuarioSesion = JSON.parse(sessionCookie?.value || '{}')

    if (usuarioSesion.rol !== 'administrador') {
        return (
            <div className="p-8 text-center text-red-400 bg-red-950/20 rounded-xl border border-red-900">
                <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
                <p>Solo los administradores pueden ver esta sección.</p>
            </div>
        )
    }

    // 2. Traer datos de Supabase
    const { data: tarifas } = await supabase.from('tarifas').select('*').order('tipo_mesa')
    const { data: usuarios } = await supabase.from('usuarios').select('*').order('creado_en')

    return (
        <div className="space-y-10 text-white pb-10">

            {/* SECCIÓN 1: TARIFAS DE MESAS */}
            <section>
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white">Configuración de Tarifas</h1>
                    <p className="text-slate-400 mt-1">Define el cobro por fracciones de tiempo. (0 a 14 min no se cobra).</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {tarifas?.map((tarifa) => (
                        <form action={actualizarTarifa} key={tarifa.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                            <input type="hidden" name="id" value={tarifa.id} />

                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
                                <span className="text-3xl">🎱</span>
                                <h3 className="text-xl font-bold">{tarifa.tipo_mesa}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm text-slate-300">15 a 29 min:</label>
                                    <input type="number" name="precio_15_29" defaultValue={tarifa.precio_15_29} className="w-24 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-right" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm text-slate-300">30 a 44 min:</label>
                                    <input type="number" name="precio_30_44" defaultValue={tarifa.precio_30_44} className="w-24 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-right" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm text-slate-300">45 a 59 min:</label>
                                    <input type="number" name="precio_45_59" defaultValue={tarifa.precio_45_59} className="w-24 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-right" />
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                    <label className="text-sm font-bold text-blue-400">Hora completa:</label>
                                    <input type="number" name="precio_hora" defaultValue={tarifa.precio_hora} className="w-24 px-2 py-1 bg-slate-900 border border-blue-600 rounded text-right text-blue-400 font-bold" />
                                </div>
                            </div>

                            <button type="submit" className="w-full mt-6 bg-slate-700 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors text-sm font-medium">
                                Guardar Precios
                            </button>
                        </form>
                    ))}
                </div>
            </section>


            {/* SECCIÓN 2: GESTIÓN DE USUARIOS */}
            <section className="pt-8 border-t border-slate-800">
                <h2 className="text-2xl font-bold mb-6">Gestión de Personal</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Formulario para Crear Usuario */}
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
                        <h3 className="text-lg font-bold mb-4">Agregar Nuevo</h3>
                        <form action={crearUsuario} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Cédula</label>
                                <input type="number" name="cedula" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: 11223344" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Nombre Completo</label>
                                <input type="text" name="nombre" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Carlos Pérez" />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Rol</label>
                                <select name="rol" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg outline-none">
                                    <option value="empleado">Empleado</option>
                                    <option value="administrador">Administrador</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium transition-colors">
                                Crear Usuario
                            </button>
                        </form>
                    </div>

                    {/* Lista de Usuarios */}
                    <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700">
                                    <th className="p-4">Cédula</th>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Rol</th>
                                    <th className="p-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios?.map((user) => (
                                    <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                        <td className="p-4 text-slate-300">{user.cedula}</td>
                                        <td className="p-4 font-medium">{user.nombre}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider ${user.rol === 'administrador' ? 'bg-purple-900/50 text-purple-400' : 'bg-green-900/50 text-green-400'}`}>
                                                {user.rol}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {/* No dejamos que el admin se borre a sí mismo para evitar errores */}
                                            {user.id !== usuarioSesion.id && (
                                                <form action={eliminarUsuario}>
                                                    <input type="hidden" name="id" value={user.id} />
                                                    <button type="submit" className="text-red-400 hover:text-red-300 text-sm font-medium hover:underline">
                                                        Eliminar
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