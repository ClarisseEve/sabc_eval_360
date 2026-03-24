import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

const TEST_ACCOUNTS = [
  { label: 'Admin',      matricule: 'US-01', email: 'admin@sabc.cm',      badge: 'Admin', color: 'bg-sabc-red-primary' },
  { label: 'DR Littoral', matricule: 'US-02', email: 'jean.mbarga@sabc.cm', badge: 'DR',    color: 'bg-sabc-red-dark' },
  { label: 'DR Centre',  matricule: 'US-03', email: 'marie.nkomo@sabc.cm', badge: 'DR',    color: 'bg-sabc-red-dark' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('admin123')
  const [showPwd, setShowPwd]       = useState(false)

  const { mutate: login, isPending, error } = useMutation({
    mutationFn: () => authApi.login({ email: identifier, password }),
    onSuccess: ({ access_token, user }) => {
      setAuth(access_token, user)
      navigate({ to: '/dashboard' })
    },
  })

  const errorMsg = error
    ? (error as any)?.response?.data?.message ?? 'Identifiants invalides'
    : null

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <img src="/images/logos/sabc-logo.png" alt="SABC" className="h-16 object-contain" />
      </div>

      <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
        {/* Header */}
        <div className="text-center border-b border-sabc-gray-200 px-6 py-5">
          <h1 className="text-2xl font-semibold text-sabc-gray-800">Connexion</h1>
          <p className="text-sabc-gray-500 text-sm mt-1">Connectez-vous pour accéder à votre tableau de bord</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Comptes test */}
          <div>
            <p className="text-sm font-medium text-sabc-gray-800 mb-2">Compte administrateur :</p>
            <div className="border border-sabc-gray-200 rounded-md p-2 space-y-1">
              {TEST_ACCOUNTS.map((a) => (
                <button
                  key={a.matricule}
                  type="button"
                  onClick={() => setIdentifier(a.matricule)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-sabc-gray-50 rounded-md transition-colors text-left"
                >
                  <span className="font-medium text-sabc-gray-800 text-sm">{a.label}</span>
                  <span className={`text-xs text-white px-2 py-0.5 rounded-full ${a.color}`}>{a.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); login() }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-sabc-gray-800">Matricule ou Email</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
                placeholder="US-XX ou email@sabc.cm"
                className="w-full h-11 px-3 rounded-lg border border-sabc-gray-200 outline-none focus:border-sabc-red-primary focus:ring-1 focus:ring-sabc-red-primary text-sm"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-sabc-gray-800">Mot de passe</label>
                <a href="/forgot-password" className="text-sm text-sabc-red-primary hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 px-3 pr-10 rounded-lg border border-sabc-gray-200 outline-none focus:border-sabc-red-primary focus:ring-1 focus:ring-sabc-red-primary text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-sabc-gray-500"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 bg-sabc-red-primary hover:bg-sabc-red-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-60 mt-2"
            >
              {isPending ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <div className="border-t border-sabc-gray-200 px-6 py-4 text-center text-sm text-sabc-gray-700">
          Pas encore de compte ?{' '}
          <a href="/register" className="text-sabc-red-primary hover:underline font-medium">
            Créer un compte
          </a>
        </div>
      </div>

      <p className="text-center text-xs text-sabc-gray-500 mt-6">
        © {new Date().getFullYear()} SABC - Tous droits réservés
      </p>
    </div>
  )
}
