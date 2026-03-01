'use client'

import { useActionState } from 'react'
import { login } from './actions/auth'

export default function LoginPage() {
  // Manejamos el estado del formulario usando useActionState (Next.js 14/15)
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">

        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎱</div>
          <h1 className="text-2xl font-bold text-white mb-2">Sistema Billar</h1>
          <p className="text-slate-400">Ingresa tu cédula para acceder</p>
        </div>

        {/* Formulario */}
        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="cedula" className="block text-sm font-medium text-slate-300 mb-2">
              Número de Cédula
            </label>
            <input
              type="number"
              id="cedula"
              name="cedula"
              required
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-lg"
              placeholder="Ej: 123456789"
              autoComplete="off"
            />
          </div>

          {/* Mensaje de Error si la cédula no existe */}
          {state?.error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Entrando...' : 'Ingresar al sistema'}
          </button>
        </form>

      </div>
    </div>
  )
}