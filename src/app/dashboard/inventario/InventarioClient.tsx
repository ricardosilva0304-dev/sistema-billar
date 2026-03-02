'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Edit2, PackageSearch, Store, BookUser, Receipt, CheckCircle2, Search, X } from 'lucide-react'
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-20">
            {/* NAVEGACIÓN (Sticky en móvil para fácil acceso) */}
            <div className="sticky top-2 z-30 flex p-1 bg-gray-200/80 backdrop-blur-md rounded-2xl mb-6 w-full max-w-md mx-auto shadow-sm">
                <button onClick={() => setPestaña('venta')} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${pestaña === 'venta' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>
                    <Store size={18} /> <span>Vender</span>
                </button>
                <button onClick={() => setPestaña('cuentas')} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${pestaña === 'cuentas' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>
                    <BookUser size={18} /> <span>Fiados</span>
                </button>
                <button onClick={() => setPestaña('gestion')} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 rounded-xl text-[10px] sm:text-sm font-bold transition-all ${pestaña === 'gestion' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}>
                    <PackageSearch size={18} /> <span>Stock</span>
                </button>
            </div>

            {/* ================= VENTA ================= */}
            {pestaña === 'venta' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* PRODUCTOS */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white border-0 ring-1 ring-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {productosFiltrados.map((prod) => (
                                <button
                                    key={prod.id}
                                    onClick={() => agregarAlCarrito(prod)}
                                    disabled={prod.stock === 0}
                                    className={`relative p-3 sm:p-5 rounded-2xl border text-left transition-all active:scale-95 shadow-sm ${prod.stock > 0 ? 'bg-white border-gray-100 hover:border-blue-500 hover:shadow-md' : 'bg-gray-50 opacity-50 cursor-not-allowed'}`}
                                >
                                    <span className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-black uppercase ${prod.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {prod.stock}
                                    </span>
                                    <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight mb-1 mt-2 line-clamp-2">{prod.nombre}</h3>
                                    <p className="text-base sm:text-xl font-black text-blue-600">${prod.precio.toLocaleString()}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TICKET (Sticky en desktop, flujo normal en móvil) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24">
                        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                            <div className="bg-gray-900 p-4 flex justify-between items-center text-white">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart size={20} className="text-blue-400" />
                                    <span className="font-bold text-sm">Ticket Actual</span>
                                </div>
                                <span className="bg-blue-500 text-[10px] px-2 py-0.5 rounded-full font-black">{carrito.length} ITEMS</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 min-h-[150px] space-y-3">
                                {carrito.length === 0 ? (
                                    <div className="h-40 flex flex-col items-center justify-center text-gray-300 italic">
                                        <Receipt size={40} className="mb-2 opacity-10" />
                                        <p className="text-xs font-bold uppercase tracking-widest">No hay consumos</p>
                                    </div>
                                ) : (
                                    carrito.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center animate-in slide-in-from-right-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">{item.nombre}</p>
                                                <p className="text-[10px] font-black text-blue-500">${item.precio.toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 ml-2">
                                                <button onClick={() => quitarDelCarrito(item.id)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-500 hover:text-red-500"><Minus size={14} /></button>
                                                <span className="text-xs font-black w-4 text-center">{item.cantidad}</span>
                                                <button onClick={() => agregarAlCarrito(item)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-500 hover:text-blue-500"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Total a pagar</span>
                                    <span className="text-3xl font-black text-gray-900">${totalCarrito.toLocaleString()}</span>
                                </div>

                                {carrito.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex gap-1.5 p-1 bg-gray-200 rounded-xl">
                                            {(['efectivo', 'transferencia', 'fiado'] as const).map((m) => (
                                                <button key={m} onClick={() => setMetodoPago(m)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${metodoPago === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                                                    {m === 'efectivo' ? 'Cash' : m === 'transferencia' ? 'Transf' : 'Fiar'}
                                                </button>
                                            ))}
                                        </div>

                                        {metodoPago === 'efectivo' && (
                                            <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-inner">
                                                <input type="number" placeholder="¿Con cuánto pagan?" value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="flex-1 bg-transparent outline-none font-black text-lg text-gray-900" />
                                                <div className="text-right">
                                                    <p className="text-[8px] font-bold text-gray-400">VUELTO</p>
                                                    <p className={`text-sm font-black ${(Number(billete) - totalCarrito) >= 0 ? 'text-green-600' : 'text-red-400'}`}>${billete ? (Number(billete) - totalCarrito).toLocaleString() : '0'}</p>
                                                </div>
                                            </div>
                                        )}
                                        {metodoPago === 'fiado' && (
                                            <input type="text" placeholder="Nombre del cliente..." value={nombreFiado} onChange={(e) => setNombreFiado(e.target.value)} className="w-full bg-white border-2 border-orange-200 p-3 rounded-xl outline-none font-bold text-orange-800" />
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={handleProcesarCarrito}
                                    disabled={carrito.length === 0 || (metodoPago === 'efectivo' && Number(billete) < totalCarrito) || (metodoPago === 'fiado' && !nombreFiado.trim())}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-2xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95"
                                >
                                    {metodoPago === 'fiado' ? 'GUARDAR DEUDA' : 'COBRAR AHORA'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= FIADOS ================= */}
            {pestaña === 'cuentas' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cuentasIniciales.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <CheckCircle2 size={48} className="mx-auto mb-4 text-gray-200" />
                            <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">Al día. No hay fiados.</p>
                        </div>
                    ) : (
                        cuentasIniciales.map((cuenta) => (
                            <div key={cuenta.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col border-l-4 border-l-orange-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="min-w-0">
                                        <h3 className="font-black text-gray-800 text-lg capitalize truncate">{cuenta.nombre_cliente}</h3>
                                        <p className="text-[10px] font-bold text-gray-400">{new Date(cuenta.creado_en).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-xl font-black text-orange-600">${cuenta.total.toLocaleString()}</span>
                                </div>

                                <div className="flex-1 space-y-2 mb-5">
                                    {cuenta.consumos.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                            <span>{item.cantidad}x {item.nombre}</span>
                                            <span className="font-bold text-gray-700">${(item.cantidad * item.precio).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => { setCuentaACobrar(cuenta); setMetodoPago('efectivo'); }} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black shadow-lg shadow-orange-100 transition-all active:scale-95">
                                    COBRAR DEUDA
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ================= GESTIÓN STOCK ================= */}
            {pestaña === 'gestion' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit sticky top-24">
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            {productoEditando ? <><Edit2 className="text-orange-500" /> Editar</> : <><Plus className="text-purple-500" /> Nuevo Producto</>}
                        </h3>
                        <form action={productoEditando ? editarProducto : crearProducto} onSubmit={() => setTimeout(() => setProductoEditando(null), 100)} className="space-y-4">
                            {productoEditando && <input type="hidden" name="id" value={productoEditando.id} />}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nombre del producto</label>
                                <input type="text" name="nombre" defaultValue={productoEditando?.nombre} required className="w-full px-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Precio</label>
                                    <input type="number" name="precio" defaultValue={productoEditando?.precio} required className="w-full px-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Stock inicial</label>
                                    <input type="number" name="stock" defaultValue={productoEditando?.stock} required className="w-full px-4 py-3 bg-gray-50 border-0 ring-1 ring-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold" />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                {productoEditando && (
                                    <button type="button" onClick={() => setProductoEditando(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-95">CANCELAR</button>
                                )}
                                <button type="submit" className={`flex-[2] py-4 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all ${productoEditando ? 'bg-orange-500 shadow-orange-100' : 'bg-purple-600 shadow-purple-100'}`}>
                                    {productoEditando ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase">Producto</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-center">Precio</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-center">Stock</th>
                                        <th className="p-4 text-[10px] font-black text-gray-400 uppercase text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {productosIniciales.map((prod) => (
                                        <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4">
                                                <p className="font-bold text-gray-800 text-sm sm:text-base">{prod.nombre}</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-black text-blue-600">${prod.precio.toLocaleString()}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${prod.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {prod.stock} UN.
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setProductoEditando(prod)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <form action={eliminarProducto}>
                                                        <input type="hidden" name="id" value={prod.id} />
                                                        <button type="submit" className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL COBRO FIADOS */}
            {cuentaACobrar && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-6 rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setCuentaACobrar(null)} className="absolute top-4 right-4 text-gray-400"><X /></button>
                        <h3 className="text-xl font-black text-gray-900 mb-1">Cobrar Fiado</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Cliente: {cuentaACobrar.nombre_cliente}</p>

                        <div className="bg-gray-900 p-6 rounded-3xl text-center mb-6 shadow-xl shadow-gray-200">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Total de la deuda</p>
                            <p className="text-4xl font-black text-emerald-400">${cuentaACobrar.total.toLocaleString()}</p>
                        </div>

                        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-4">
                            <button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${metodoPago === 'efectivo' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>EFECTIVO</button>
                            <button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${metodoPago === 'transferencia' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>TRANSF.</button>
                        </div>

                        {metodoPago === 'efectivo' && (
                            <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <input type="number" placeholder="¿Con cuánto pagan?" value={billete} onChange={(e) => setBillete(e.target.value ? Number(e.target.value) : '')} className="w-full bg-transparent p-0 outline-none text-2xl font-black text-gray-900 mb-2" />
                                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Vuelto</span>
                                    <span className={`text-lg font-black ${(Number(billete) - cuentaACobrar.total) >= 0 ? 'text-emerald-600' : 'text-red-400'}`}>${billete ? (Number(billete) - cuentaACobrar.total).toLocaleString() : '0'}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setCuentaACobrar(null)} className="flex-1 py-4 text-gray-400 font-bold">VOLVER</button>
                            <button onClick={handleCobrarCuenta} disabled={metodoPago === 'efectivo' && Number(billete) < cuentaACobrar.total} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-100 active:scale-95">CONFIRMAR PAGO</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}