import React from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Edit, Plus, Power } from 'lucide-react';
import { adminApi } from '@/Services/api';
import { AdminEvaluationsLayout } from '../shared';
import { Button } from '@/Components/UI/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { normalizePublishedRule } from '@/utils/rules';

export default function RulesIndexPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useSuspenseQuery({
    queryKey: ['admin', 'roles', 'regles'],
    queryFn: () => adminApi.roles.regles().then((response) => response.data),
  });

  const rules = Array.isArray(data) ? data.map((rule) => normalizePublishedRule(rule)) : [];

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.roles.toggleRegle(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'roles', 'regles'] });
    },
  });

  return (
    <AdminEvaluationsLayout title="Règles d’évaluation">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sabc-gray-900">Règles d’évaluation</h1>
          <p className="mt-1 text-sm text-sabc-gray-400">
            Source de vérité des formulaires, contraintes métier et politiques de visibilité.
          </p>
        </div>
        <Button className="bg-sabc-red-primary text-white hover:bg-sabc-red-dark" onClick={() => navigate('/admin/evaluations/regles/create')}>
          <Plus size={16} className="mr-2" />
          Nouvelle règle
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Total règles</div>
            <div className="text-2xl font-bold text-sabc-gray-900">{rules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Actives</div>
            <div className="text-2xl font-bold text-sabc-success">{rules.filter((rule) => rule.est_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Détail admin complet</div>
            <div className="text-2xl font-bold text-sabc-gray-900">{rules.filter((rule) => rule.visibility_policy.admin).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-sabc-gray-400">Critères moyens</div>
            <div className="text-2xl font-bold text-sabc-gray-900">
              {rules.length > 0 ? Math.round(rules.reduce((sum, rule) => sum + rule.criteres.length, 0) / rules.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue des règles</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="py-12 text-center text-sabc-gray-400">Aucune règle d’évaluation définie.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sabc-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">Contexte</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">Critères</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">Visibilité</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-sabc-gray-800">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-sabc-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sabc-gray-200">
                  {rules.map((rule) => (
                    <tr key={rule.id_regle} className="hover:bg-sabc-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-sabc-gray-900">{rule.nom_regle}</div>
                        <div className="mt-1 text-sm text-sabc-gray-400">{rule.description || 'Sans description'}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{rule.role_evaluateur || 'Tous'}</Badge>
                          <span>→</span>
                          <Badge variant="secondary">{rule.role_evalue || 'Tous'}</Badge>
                          <Badge variant="primary">{rule.type_evaluation || 'N/A'}</Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-sabc-gray-700">
                        <div>{rule.criteres.length} critères</div>
                        <div className="text-xs text-sabc-gray-400">
                          {rule.sections.map((section) => section.titre).slice(0, 3).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-sabc-gray-700">
                        <div>Détail: {rule.visibility_policy.detail}</div>
                        <div className="text-xs text-sabc-gray-400">
                          Évalué {rule.visibility_policy.evaluated ? 'oui' : 'non'} · N+1 {rule.visibility_policy.manager_n1 ? 'oui' : 'non'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={rule.est_active ? 'bg-sabc-success text-white' : 'bg-sabc-gray-400 text-white'}>
                          {rule.est_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/evaluations/regles/${rule.id_regle}/edit`)}>
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMutation.mutate(rule.id_regle)}
                            className={rule.est_active ? 'text-sabc-error hover:bg-red-50' : 'text-sabc-success hover:bg-green-50'}
                          >
                            <Power size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminEvaluationsLayout>
  );
}
