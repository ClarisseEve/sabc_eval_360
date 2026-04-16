import React, { useState, useEffect } from 'react';
import { useForm } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button/Button';
import { Card } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EvolutionChartProps {
  users: Array<{
    id: number;
    name: string;
    role: string;
    region: string;
    departement?: string;
  }>;
  regions: string[];
  departements: string[];
  annees: number[];
}

interface EvolutionData {
  userId: number;
  userName: string;
  data: Array<{
    code: string;
    periode: string;
    annee: number;
    score_moyen: number;
    date_validation: string;
  }>;
}

const EvolutionChart: React.FC<EvolutionChartProps> = ({ users, regions, departements, annees }) => {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedDepartement, setSelectedDepartement] = useState<string>('');
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null);
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState(users);

  const { data, setData, post, processing, errors } = useForm({
    user_id: '',
    region: '',
    departement: '',
    annee: '',
  });

  // Filtrer les utilisateurs en fonction des filtres sélectionnés
  useEffect(() => {
    let filtered = [...users];
    
    if (selectedRegion) {
      filtered = filtered.filter(user => user.region === selectedRegion);
    }
    
    if (selectedDepartement) {
      filtered = filtered.filter(user => user.departement === selectedDepartement);
    }
    
    setFilteredUsers(filtered);
  }, [selectedRegion, selectedDepartement, users]);

  // Mettre à jour les données du formulaire lorsque les sélections changent
  useEffect(() => {
    if (selectedUser) {
      setData('user_id', selectedUser.toString());
    }
    if (selectedRegion) {
      setData('region', selectedRegion);
    }
    if (selectedDepartement) {
      setData('departement', selectedDepartement);
    }
    if (selectedAnnee) {
      setData('annee', selectedAnnee.toString());
    }
  }, [selectedUser, selectedRegion, selectedDepartement, selectedAnnee]);

  // Fonction pour récupérer l'évolution des évaluations
  const fetchEvolution = () => {
    post('/admin/evaluation/evolution', {
      preserveScroll: true,
      onSuccess: (response: any) => {
        setEvolutionData(response.props.evolution as EvolutionData);
        prepareChartData(response.props.evolution as EvolutionData);
      },
    });
  };

  // Préparer les données pour le graphique
  const prepareChartData = (evolution: EvolutionData) => {
    if (!evolution || !evolution.data) return;

    const chartData = evolution.data.map((item) => ({
      periode: `${item.periode} ${item.annee}`,
      score: item.score_moyen,
      code: item.code,
    }));

    setChartData(chartData);
  };

  // Formater la période pour l'affichage
  const formatPeriode = (periode: string, annee: number) => {
    return `${periode} ${annee}`;
  };

  // Déterminer la couleur en fonction du score
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'success';
    if (score >= 3) return 'warning';
    return 'error';
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-base font-semibold mb-3 text-sabc-gray-900">Évolution des évaluations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
              Région
            </label>
            <select
              value={data.region as string}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedDepartement(''); // Réinitialiser le département
                setSelectedUser(null); // Réinitialiser l'utilisateur
                setData('departement', '');
                setData('user_id', '');
              }}
              className="w-full rounded-xl border border-sabc-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Toutes les régions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
              Département
            </label>
            <select
              value={data.departement as string}
              onChange={(e) => {
                setSelectedDepartement(e.target.value);
                setSelectedUser(null); // Réinitialiser l'utilisateur
                setData('user_id', '');
              }}
              className="w-full rounded-xl border border-sabc-gray-200 bg-white px-3 py-2 text-sm"
              disabled={!selectedRegion}
            >
              <option value="">Tous les départements</option>
              {departements
                .filter(dept => !selectedRegion || users.some(u => u.region === selectedRegion && u.departement === dept))
                .map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
              Utilisateur
            </label>
            <select
              value={data.user_id as string}
              onChange={(e) => setSelectedUser(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-sabc-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un utilisateur</option>
              {filteredUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            {errors.user_id && (
              <p className="text-sabc-error text-sm mt-1">{errors.user_id}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
              Année
            </label>
            <select
              value={data.annee as string}
              onChange={(e) => setSelectedAnnee(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full rounded-xl border border-sabc-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Toutes les années</option>
              {annees.map((annee) => (
                <option key={annee} value={annee}>
                  {annee}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={fetchEvolution}
            disabled={!data.user_id || processing}
          >
            Afficher l'évolution
          </Button>
        </div>
      </Card>

      {evolutionData && (
        <Card className="p-6">
          <h2 className="text-base font-semibold mb-3 text-sabc-gray-900">
            Évolution des évaluations de {evolutionData.userName}
          </h2>
          
          {chartData.length > 0 ? (
            <>
              <div className="h-96 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 12, right: 24, left: 16, bottom: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="periode" tick={{ fill: '#616161', fontSize: 11 }} axisLine={{ stroke: '#E0E0E0' }} />
                    <YAxis domain={[0, 5]} tick={{ fill: '#616161', fontSize: 11 }} axisLine={{ stroke: '#E0E0E0' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score moyen"
                      stroke="#E53E3E"
                      activeDot={{ r: 6 }}
                      dot={{ r: 3 }}
                      strokeWidth={2}
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sabc-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-sabc-gray-100 text-left text-xs font-medium text-sabc-gray-800 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-3 bg-sabc-gray-100 text-left text-xs font-medium text-sabc-gray-800 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-4 py-3 bg-sabc-gray-100 text-center text-xs font-medium text-sabc-gray-800 uppercase tracking-wider">
                        Score moyen
                      </th>
                      <th className="px-4 py-3 bg-sabc-gray-100 text-left text-xs font-medium text-sabc-gray-800 uppercase tracking-wider">
                        Date de validation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sabc-gray-200">
                    {evolutionData.data.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-sabc-gray-800">
                          {item.code}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-sabc-gray-800">
                          {formatPeriode(item.periode, item.annee)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          <Badge variant={getScoreColor(item.score_moyen)}>
                            {item.score_moyen.toFixed(2)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-sabc-gray-800">
                          {new Date(item.date_validation).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sabc-gray-800 italic">Aucune donnée d'évolution disponible pour cet utilisateur.</p>
          )}
        </Card>
      )}
    </div>
  );
};

export default EvolutionChart;
