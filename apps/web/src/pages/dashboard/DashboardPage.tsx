import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/auth'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    initialData: user ?? undefined,
  })

  const handleLogout = () => {
    clearAuth()
    navigate({ to: '/login' })
  }

  return (
    <div className="min-h-screen bg-sabc-gray-50">
      <header className="bg-white border-b border-sabc-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/logos/sabc-logo.png" alt="SABC" className="h-10 object-contain" />
          <span className="font-semibold text-sabc-gray-800">Évaluation 360°</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-sabc-gray-600">
            {me?.prenom} {me?.nom} — <span className="font-medium text-sabc-red-primary">{me?.role_nom ?? me?.role}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-sabc-gray-500 hover:text-sabc-red-primary transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-sabc-gray-200 p-6">
          <h2 className="text-xl font-semibold text-sabc-gray-800 mb-2">Tableau de bord</h2>
          <p className="text-sabc-gray-500 text-sm">
            Bienvenue, {me?.prenom ?? me?.email}. Votre rôle : <strong>{me?.role_nom ?? me?.role}</strong>
          </p>
          {/* Les widgets spécifiques au rôle arrivent en Phase 3 */}
        </div>
      </main>
    </div>
  )
}
