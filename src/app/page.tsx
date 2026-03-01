'use client'

import { useActionState } from 'react'
import { login } from './actions/auth'
import { Loader2, User, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex bg-slate-950 font-sans selection:bg-emerald-500 selection:text-white">

      {/* ==================================================================
          LADO IZQUIERDO: IMAGEN ARTÍSTICA (Solo visible en PC/Tablet) 
         ================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        {/* Imagen de fondo de alta calidad (Unsplash) */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574577465609-847e0921a9a8?q=80&w=2670&auto=format&fit=crop')" }}
        />
        {/* Degradado para oscurecer y dar elegancia */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end p-16 text-white">
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Gestión Inteligente <br />
            <span className="text-emerald-500">para tu Billar.</span>
          </h2>
          <p className="text-lg text-slate-300 max-w-md border-l-4 border-emerald-500 pl-4">
            Control total de mesas, inventario y caja en tiempo real.
          </p>
        </div>
      </div>

      {/* ==================================================================
          LADO DERECHO: FORMULARIO (Visible en todos los dispositivos)
         ================================================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">

        {/* Fondo móvil (Solo se ve en celular) */}
        <div
          className="absolute inset-0 bg-cover bg-center lg:hidden opacity-20 z-0"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1574577465609-847e0921a9a8?q=80&w=2670&auto=format&fit=crop')" }}
        />

        {/* Tarjeta del Formulario */}
        <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4">

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-900 to-slate-900 border border-emerald-500/30 shadow-2xl shadow-emerald-900/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-5xl">🎱</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Bienvenido</h1>
            <p className="text-slate-400">Ingresa tu identificación para acceder al sistema.</p>
          </div>

          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="cedula" className="text-sm font-medium text-emerald-500 uppercase tracking-wider ml-1">
                Número de Cédula
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                </div>
                <input
                  type="number"
                  id="cedula"
                  name="cedula"
                  required
                  className="block w-full pl-12 pr-4 py-4 bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-lg shadow-inner"
                  placeholder="Ej: 1098765432"
                  autoComplete="off"
                />
              </div>
            </div>

            {state?.error && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full group relative flex justify-center items-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:-translate-y-0.5"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-5 w-5" />
                  Verificando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Ingresar al Sistema
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Sistema Billar Pro. <br />Solo personal autorizado.
          </p>
        </div>
      </div>
    </div>
  )
}