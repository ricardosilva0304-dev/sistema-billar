'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Edit2, PackageSearch, Store, BookUser, CheckCircle2 } from 'lucide-react'
import { crearProducto, editarProducto, eliminarProducto, procesarVenta, crearCuentaAbierta, cobrarCuentaAbierta } from '@/app/actions/inventario'

export default function InventarioClient({ productosIniciales, cuentasIniciales }: { productosIniciales: any[], cuentasIniciales: any[] }) {
    const [pestaña, setPestaña] = useState<'venta' | 'gestion' | 'cuentas'>('venta')
    const [carrito, setCarrito] = useState<any[]>([])
    const [productoEditando, setProductoEditando] = useState<any>(null)

    // Estados para el Carrito
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'fiado'>('efectivo')
    const [billete, setBillete] = useState<number | ''>('')
    const [nombreFiado, setNombreFiado] = useState('')

    // Estados para Cobrar Cuentas
    const [cuentaACobrar, setCuentaACobrar] = useState<any>(null)

    const agregarAlCarrito = (producto: any) => {
        if (producto.stock === 0) return alert('¡No hay stock!')
        setCarrito((prev) => {
            const existe = prev.find((item) => item.id === producto.id)
            if (existe) {
                if (existe.cantidad >= producto.stock) return prev
                return prev.map((item) => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item)
            }
            return [...prev, { ...producto, cantidad: 1 }]
        })
    }

    const quitarDelCarrito = (id: string) => {
        setCarrito((prev) => {
            const existe = prev.find((item) => item.id === id)
            if (existe?.cantidad === 1) return prev.filter((item) => item.id !== id)
            return prev.map((item) => item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item)
        })
    }

    const totalCarrito = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

    const handleProcesarCarrito = async () => {
        if (carrito.length === 0) return

        if (metodoPago === 'fiado') {
            if (!nombreFiado.trim()) return alert('Debes ingresar el nombre de quien debe la cuenta.')
            await crearCuentaAbierta(nombreFiado, carrito, totalCarrito)
            alert(`Cuenta creada para ${nombreFiado}`)
        } else {
            await procesarVenta(carrito, metodoPago, totalCarrito)
            alert('Venta pagada y descontada del stock.')
        }

        setCarrito([])
        setBillete('')
        setNombreFiado('')
        setMetodoPago('efectivo')
    }

    const handleCobrarCuenta = async () => {
        if (!cuentaACobrar) return
        const desc = `${cuentaACobrar.nombre_cliente} (${cuentaACobrar.consumos.length} items)`
        await cobrarCuentaAbierta(cuentaACobrar.id, desc, cuentaACobrar.total, metodoPago)
        setCuentaACobrar(null)
        setBillete('')
        alert('Cuenta cobrada y enviada a la Caja Diaria.')
    }

    return (
        <div className="text-white">
            {/* NAVEGACIÓN DE PESTAÑAS */}
            <div className="flex gap-4 mb-8 border-b border-slate-700 pb-4 overflow-x-auto">
                <button onClick={() => setPestaña('venta')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold whitespace-nowrap ${pestaña === 'venta' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <Store size={20} /> Punto de Venta
                </button>
                <button onClick={() => setPestaña('cuentas')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold whitespace-nowrap ${pestaña === 'cuentas' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <BookUser size={20} /> Cuentas Abiertas <span className="bg-orange-800 text-orange-200 px-2 py-0.5 rounded-full text-xs">{cuentasIniciales.length}</span>
                </button>
                <button onClick={() => setPestaña('gestion')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold whitespace-nowrap ${pestaña === 'gestion' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                    <PackageSearch size={20} /> Gestión Stock
                </button>
            </div>

            {/* ================= PESTAÑA 1: VENTA ================= */}
            {pestaña === 'venta' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">Productos</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {productosIniciales.map((prod) => (
                                <button key={prod.id} onClick={() => agregarAlCarrito(prod)} disabled={prod.stock === 0} className={`p-4 rounded-xl border text-left transition-all ${prod.stock > 0 ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-700' : 'bg-slate-900 border-red-900/50 opacity-50 cursor-not-allowed'}`}>
                                    <h3 className="font-bold text-lg leading-tight">{prod.nombre}</h3>
                                    <p className="text-blue-400 font-bold my-1">${prod.precio.toLocaleString()}</p>
                                    <p className={`text-xs ${prod.stock > 5 ? 'text-green-400' : 'text-red-400'}`}>Stock: {prod.stock}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 h-fit sticky top-24">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><ShoppingCart /> Cuenta Actual</h2>

                        {carrito.length === 0 ? <p className="text-slate-400 text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">Carrito vacío</p> : (
                            <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2">
                                {carrito.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-700">
                                        <div><p className="font-bold text-sm leading-tight">{item.nombre}</p><p className="text-xs text-slate-400">${item.precio.toLocaleString()}</p></div>
                                        <div className="flex items-center gap-3"><button onClick={() => quitarDelCarrito(item.id)} className="p-1 text-red-400 rounded hover:bg-red-900/50"><Minus size={16} /></button><span className="font-bold w-4 text-center">{item.cantidad}</span><button onClick={() => agregarAlCarrito(item)} className="p-1 text-blue-400 rounded hover:bg-blue-900/50"><Plus size={16} /></button></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-slate-700">
                            <div className="flex justify-between items-center mb-6"><span className="text-slate-300">Total:</span><span className="text-3xl font-bold text-green-400">${totalCarrito.toLocaleString()}</span></div>

                            {carrito.length > 0 && (
                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-4">
                                    <div className="flex gap-2 mb-4">
                                        <button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-colors ${metodoPago === 'efectivo' ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>💵 Efectivo</button>
                                        <button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-colors ${metodoPago === 'transferencia' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>📱 Transf.</button>
                                        <button onClick={() => setMetodoPago('fiado')} className={`flex-1 py-2 rounded-lg font-bold text-xs border transition-colors ${metodoPago === 'fiado' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>📝 Fiar</button>
                                    </div>

                                    {metodoPago === 'efectivo' && (
                                        <div className="space-y-3 mb-4 p-3 bg-slate-800 rounded-lg">
                                            <input type="number" placeholder="Billete Recibido ($)" value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-900 text-white p-2 rounded outline-none" />
                                            <div className="flex justify-between items-center pt-2"><span className="text-sm font-bold">Vueltas:</span><span className={`font-bold ${(Number(billete) - totalCarrito) >= 0 ? 'text-green-400' : 'text-red-400'}`}>${billete ? (Number(billete) - totalCarrito).toLocaleString() : '0'}</span></div>
                                        </div>
                                    )}

                                    {metodoPago === 'fiado' && (
                                        <div className="space-y-3 mb-4 p-3 bg-orange-900/20 border border-orange-900/50 rounded-lg">
                                            <label className="text-xs text-orange-400 font-bold">¿A nombre de quién?</label>
                                            <input type="text" placeholder="Nombre o Apodo" value={nombreFiado} onChange={(e) => setNombreFiado(e.target.value)} className="w-full bg-slate-900 text-white p-2 rounded outline-none border border-slate-700 focus:border-orange-500" />
                                        </div>
                                    )}
                                </div>
                            )}

                            <button onClick={handleProcesarCarrito} disabled={carrito.length === 0 || (metodoPago === 'efectivo' && Number(billete) < totalCarrito) || (metodoPago === 'fiado' && !nombreFiado.trim())} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg">
                                {metodoPago === 'fiado' ? 'Anotar Cuenta' : 'Procesar Pago'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= PESTAÑA 2: CUENTAS POR COBRAR ================= */}
            {pestaña === 'cuentas' && (
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-orange-400 flex items-center gap-2"><BookUser /> Cuentas Pendientes de Pago</h2>
                    {cuentasIniciales.length === 0 ? <p className="text-slate-400 p-8 text-center bg-slate-800/50 rounded-xl border border-slate-700">Nadie debe cuentas de inventario actualmente. 🎉</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cuentasIniciales.map((cuenta) => (
                                <div key={cuenta.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg flex flex-col">
                                    <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-3">
                                        <h3 className="text-xl font-bold text-white leading-tight capitalize">{cuenta.nombre_cliente}</h3>
                                        <p className="text-2xl font-bold text-orange-400">${cuenta.total.toLocaleString()}</p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto max-h-32 mb-4 space-y-1">
                                        {cuenta.consumos.map((item: any, i: number) => (
                                            <p key={i} className="text-sm text-slate-300 flex justify-between"><span>{item.cantidad}x {item.nombre}</span> <span className="text-slate-500">${(item.cantidad * item.precio).toLocaleString()}</span></p>
                                        ))}
                                    </div>

                                    <button onClick={() => { setCuentaACobrar(cuenta); setMetodoPago('efectivo'); }} className="w-full bg-green-900/40 hover:bg-green-600 border border-green-800 text-green-100 py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-colors">
                                        <CheckCircle2 size={18} /> Pagar Cuenta
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Modal de Cobro de Cuenta */}
                    {cuentaACobrar && (
                        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm border border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-2">Cobrar Cuenta</h3>
                                <p className="text-slate-400 mb-6">Cliente: <span className="text-white font-bold capitalize">{cuentaACobrar.nombre_cliente}</span></p>
                                <div className="bg-slate-900 p-4 rounded-xl text-center mb-6 border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-1">Total a cobrar</p>
                                    <p className="text-4xl font-bold text-green-400">${cuentaACobrar.total.toLocaleString()}</p>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${metodoPago === 'efectivo' ? 'bg-green-600 border-green-500 text-white' : 'bg-slate-900 text-slate-400'}`}>💵 Efectivo</button>
                                    <button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-2 rounded-lg font-bold text-sm border ${metodoPago === 'transferencia' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-900 text-slate-400'}`}>📱 Transf.</button>
                                </div>

                                {metodoPago === 'efectivo' && (
                                    <div className="mb-6">
                                        <input type="number" placeholder="Billete Recibido" value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="w-full bg-slate-900 text-white p-3 rounded-lg border border-slate-700 outline-none text-lg mb-2" />
                                        <p className="text-right text-sm font-bold text-slate-300">Vueltas: <span className={(Number(billete) - cuentaACobrar.total) >= 0 ? 'text-green-400' : 'text-red-400'}>${billete ? (Number(billete) - cuentaACobrar.total).toLocaleString() : '0'}</span></p>
                                    </div>
                                )}

                                <div className="flex gap-3"><button onClick={() => setCuentaACobrar(null)} className="flex-1 bg-slate-700 py-3 rounded-lg text-white font-medium">Cancelar</button><button onClick={handleCobrarCuenta} disabled={metodoPago === 'efectivo' && Number(billete) < cuentaACobrar.total} className="flex-1 bg-green-600 disabled:bg-slate-700 py-3 rounded-lg text-white font-bold">Confirmar Pago</button></div>
                            </div>
                        </div>
                    )}
                </div>
            )}


            {/* ================= PESTAÑA 3: GESTIÓN (Tu código intacto) ================= */}
            {pestaña === 'gestion' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
                        <h3 className="text-lg font-bold mb-4">{productoEditando ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <form action={productoEditando ? editarProducto : crearProducto} onSubmit={() => setTimeout(() => setProductoEditando(null), 100)} className="space-y-4">
                            {productoEditando && <input type="hidden" name="id" value={productoEditando.id} />}
                            <div><label className="block text-sm text-slate-400 mb-1">Nombre</label><input type="text" name="nombre" defaultValue={productoEditando?.nombre} required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg outline-none" /></div>
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="block text-sm text-slate-400 mb-1">Precio ($)</label><input type="number" name="precio" defaultValue={productoEditando?.precio} required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg outline-none" /></div>
                                <div className="flex-1"><label className="block text-sm text-slate-400 mb-1">Stock</label><input type="number" name="stock" defaultValue={productoEditando?.stock} required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg outline-none" /></div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                {productoEditando && <button type="button" onClick={() => setProductoEditando(null)} className="flex-1 bg-slate-700 py-2 rounded-lg font-medium">Cancelar</button>}
                                <button type="submit" className={`flex-1 py-2 rounded-lg font-bold text-white ${productoEditando ? 'bg-orange-600 hover:bg-orange-500' : 'bg-purple-600 hover:bg-purple-500'}`}>{productoEditando ? 'Guardar' : 'Crear Producto'}</button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700"><th className="p-4">Producto</th><th className="p-4">Precio</th><th className="p-4">Stock</th><th className="p-4 text-right">Acciones</th></tr></thead>
                            <tbody>
                                {productosIniciales.map((prod) => (
                                    <tr key={prod.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                                        <td className="p-4 font-medium">{prod.nombre}</td>
                                        <td className="p-4">${prod.precio.toLocaleString()}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${prod.stock > 5 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>{prod.stock} un.</span></td>
                                        <td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => setProductoEditando(prod)} className="p-2 bg-slate-700 text-slate-300 rounded hover:text-white"><Edit2 size={16} /></button><form action={eliminarProducto}><input type="hidden" name="id" value={prod.id} /><button type="submit" className="p-2 bg-red-900/30 text-red-400 rounded hover:bg-red-900/80"><Trash2 size={16} /></button></form></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}