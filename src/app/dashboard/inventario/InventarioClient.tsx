'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Edit2, PackageSearch, Store, BookUser, Receipt, CheckCircle2, Search, AlertCircle } from 'lucide-react'
import { crearProducto, editarProducto, eliminarProducto, procesarVenta, crearCuentaAbierta, cobrarCuentaAbierta } from '@/app/actions/inventario'

export default function InventarioClient({ productosIniciales, cuentasIniciales }: { productosIniciales: any[], cuentasIniciales: any[] }) {
    const [pestaña, setPestaña] = useState<'venta' | 'gestion' | 'cuentas'>('venta')
    const [carrito, setCarrito] = useState<any[]>([])
    const [productoEditando, setProductoEditando] = useState<any>(null)
    const [busqueda, setBusqueda] = useState('')

    // Estados POS
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'fiado'>('efectivo')
    const [billete, setBillete] = useState<number | ''>('')
    const [nombreFiado, setNombreFiado] = useState('')
    const [cuentaACobrar, setCuentaACobrar] = useState<any>(null)

    // Filtrado de productos en tiempo real
    const productosFiltrados = productosIniciales.filter(p =>
        p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    )

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
            if (!nombreFiado.trim()) return alert('Nombre obligatorio')
            await crearCuentaAbierta(nombreFiado, carrito, totalCarrito)
        } else {
            await procesarVenta(carrito, metodoPago, totalCarrito)
        }
        setCarrito([]); setBillete(''); setNombreFiado(''); setMetodoPago('efectivo')
    }

    const handleCobrarCuenta = async () => {
        if (!cuentaACobrar) return
        const desc = `${cuentaACobrar.nombre_cliente} (${cuentaACobrar.consumos.length} items)`
        await cobrarCuentaAbierta(cuentaACobrar.id, desc, cuentaACobrar.total, metodoPago)
        setCuentaACobrar(null); setBillete('')
    }

    return (
        <div className="font-sans">
            {/* NAVEGACIÓN DE PESTAÑAS (Estilo iOS Segmented Control) */}
            <div className="flex p-1 bg-gray-200 rounded-xl mb-8 w-full max-w-2xl mx-auto">
                <button onClick={() => setPestaña('venta')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${pestaña === 'venta' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Store size={18} /> Vender
                </button>
                <button onClick={() => setPestaña('cuentas')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${pestaña === 'cuentas' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <BookUser size={18} /> Fiados <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full text-xs">{cuentasIniciales.length}</span>
                </button>
                <button onClick={() => setPestaña('gestion')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${pestaña === 'gestion' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <PackageSearch size={18} /> Stock
                </button>
            </div>

            {/* ================= PESTAÑA 1: VENTA (POS) ================= */}
            {pestaña === 'venta' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Columna Izquierda: Productos */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
                            {productosFiltrados.map((prod) => (
                                <button
                                    key={prod.id}
                                    onClick={() => agregarAlCarrito(prod)}
                                    disabled={prod.stock === 0}
                                    className={`
                    group relative p-5 rounded-2xl border text-left transition-all duration-200 shadow-sm hover:shadow-lg
                    ${prod.stock > 0
                                            ? 'bg-white border-gray-100 hover:border-blue-500 hover:-translate-y-1'
                                            : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                                        }
                  `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${prod.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            Stock: {prod.stock}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1 group-hover:text-blue-600">{prod.nombre}</h3>
                                    <p className="text-xl font-black text-gray-900">${prod.precio.toLocaleString()}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Columna Derecha: Ticket / Carrito */}
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl sticky top-6 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
                            <ShoppingCart className="text-blue-600" />
                            <span className="font-bold text-gray-900">Ticket de Venta</span>
                        </div>

                        {/* Lista Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
                            {carrito.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                    <Receipt size={48} className="mb-2 opacity-20" />
                                    <p className="text-sm font-medium">Carrito vacío</p>
                                </div>
                            ) : (
                                carrito.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{item.nombre}</p>
                                            <p className="text-xs text-gray-400">${item.precio.toLocaleString()} x {item.cantidad}</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                            <button onClick={() => quitarDelCarrito(item.id)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-red-500"><Minus size={14} /></button>
                                            <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                                            <button onClick={() => agregarAlCarrito(item)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-500"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer del Carrito (Pagos) */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-sm font-bold text-gray-400 uppercase">Total a Pagar</span>
                                <span className="text-3xl font-black text-gray-900">${totalCarrito.toLocaleString()}</span>
                            </div>

                            {carrito.length > 0 && (
                                <div className="bg-white p-3 rounded-xl border border-gray-200 mb-3 shadow-sm">
                                    <div className="flex gap-2 mb-3">
                                        <button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${metodoPago === 'efectivo' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-400'}`}>💵 Efectivo</button>
                                        <button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${metodoPago === 'transferencia' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-400'}`}>📱 Transf.</button>
                                        <button onClick={() => setMetodoPago('fiado')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${metodoPago === 'fiado' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-gray-200 text-gray-400'}`}>📝 Fiar</button>
                                    </div>

                                    {metodoPago === 'efectivo' && (
                                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <input type="number" placeholder="Recibido..." value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="bg-transparent outline-none w-24 font-bold text-gray-900" />
                                            <span className={`text-sm font-bold ${(Number(billete) - totalCarrito) >= 0 ? 'text-green-600' : 'text-red-400'}`}>Cambio: ${billete ? (Number(billete) - totalCarrito).toLocaleString() : '0'}</span>
                                        </div>
                                    )}
                                    {metodoPago === 'fiado' && (
                                        <input type="text" placeholder="Nombre del Cliente..." value={nombreFiado} onChange={(e) => setNombreFiado(e.target.value)} className="w-full bg-orange-50 border border-orange-200 p-2 rounded-lg outline-none text-sm font-bold text-orange-800 placeholder-orange-300" />
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleProcesarCarrito}
                                disabled={carrito.length === 0 || (metodoPago === 'efectivo' && Number(billete) < totalCarrito) || (metodoPago === 'fiado' && !nombreFiado.trim())}
                                className="w-full py-4 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white rounded-xl font-bold shadow-lg transition-all active:scale-[0.98]"
                            >
                                {metodoPago === 'fiado' ? 'Guardar Cuenta' : 'Cobrar Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= PESTAÑA 2: CUENTAS POR COBRAR ================= */}
            {pestaña === 'cuentas' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {cuentasIniciales.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
                            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No hay cuentas pendientes.</p>
                        </div>
                    ) : (
                        cuentasIniciales.map((cuenta) => (
                            <div key={cuenta.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-800 capitalize leading-none mb-1">{cuenta.nombre_cliente}</h3>
                                        <p className="text-xs text-gray-400">Creada: {new Date(cuenta.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <p className="text-2xl font-black text-orange-500">${cuenta.total.toLocaleString()}</p>
                                </div>

                                <div className="flex-1 bg-gray-50 rounded-xl p-3 mb-4 overflow-y-auto max-h-32 border border-gray-100">
                                    {cuenta.consumos.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-xs text-gray-600 mb-1 border-b border-gray-200 pb-1 last:border-0">
                                            <span>{item.cantidad}x {item.nombre}</span>
                                            <span className="font-bold">${(item.cantidad * item.precio).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => { setCuentaACobrar(cuenta); setMetodoPago('efectivo'); }} className="w-full py-3 bg-white border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white rounded-xl font-bold transition-all shadow-sm">
                                    Cobrar
                                </button>
                            </div>
                        ))
                    )}

                    {/* Modal de Cobro (Mismo estilo que POS) */}
                    {cuentaACobrar && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Cobrar Cuenta</h3>
                                <p className="text-gray-500 mb-6">Cliente: <span className="font-bold text-gray-900 capitalize">{cuentaACobrar.nombre_cliente}</span></p>

                                <div className="bg-gray-50 p-4 rounded-xl text-center mb-6 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Total Pendiente</p>
                                    <p className="text-4xl font-black text-green-600">${cuentaACobrar.total.toLocaleString()}</p>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    <button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${metodoPago === 'efectivo' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-400'}`}>💵 Efectivo</button>
                                    <button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${metodoPago === 'transferencia' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-400'}`}>📱 Transf.</button>
                                </div>

                                {metodoPago === 'efectivo' && (
                                    <div className="mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                        <input type="number" placeholder="Billete Recibido" value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="w-full bg-white border border-gray-200 p-3 rounded-lg outline-none text-lg font-bold mb-2 text-gray-900" />
                                        <p className="text-right text-sm font-bold text-gray-500">Cambio: <span className={(Number(billete) - cuentaACobrar.total) >= 0 ? 'text-green-600' : 'text-red-500'}>${billete ? (Number(billete) - cuentaACobrar.total).toLocaleString() : '0'}</span></p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button onClick={() => setCuentaACobrar(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancelar</button>
                                    <button onClick={handleCobrarCuenta} disabled={metodoPago === 'efectivo' && Number(billete) < cuentaACobrar.total} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold shadow-lg">Confirmar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ================= PESTAÑA 3: GESTIÓN DE STOCK ================= */}
            {pestaña === 'gestion' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{productoEditando ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                        <form action={productoEditando ? editarProducto : crearProducto} onSubmit={() => setTimeout(() => setProductoEditando(null), 100)} className="space-y-4">
                            {productoEditando && <input type="hidden" name="id" value={productoEditando.id} />}
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label><input type="text" name="nombre" defaultValue={productoEditando?.nombre} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio</label><input type="number" name="precio" defaultValue={productoEditando?.precio} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>
                                <div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock</label><input type="number" name="stock" defaultValue={productoEditando?.stock} required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" /></div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                {productoEditando && <button type="button" onClick={() => setProductoEditando(null)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Cancelar</button>}
                                <button type="submit" className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg ${productoEditando ? 'bg-orange-500 hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'}`}>{productoEditando ? 'Guardar' : 'Crear'}</button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr><th className="p-4 text-xs font-bold text-gray-500 uppercase">Producto</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Precio</th><th className="p-4 text-xs font-bold text-gray-500 uppercase">Stock</th><th className="p-4 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th></tr>
                            </thead>
                            <tbody>
                                {productosIniciales.map((prod) => (
                                    <tr key={prod.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-bold text-gray-800">{prod.nombre}</td>
                                        <td className="p-4 text-gray-600 font-medium">${prod.precio.toLocaleString()}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${prod.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{prod.stock} un.</span></td>
                                        <td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => setProductoEditando(prod)} className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:text-blue-600 hover:border-blue-500"><Edit2 size={16} /></button><form action={eliminarProducto}><input type="hidden" name="id" value={prod.id} /><button type="submit" className="p-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:text-red-600 hover:border-red-500"><Trash2 size={16} /></button></form></div></td>
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