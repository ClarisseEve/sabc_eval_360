import React, { useState, useEffect } from 'react';
import { useForm } from '@/lib/inertia-shim';
import { Button } from '@/Components/UI/Button/Button';
import { Card } from '@/Components/UI/Card/Card';
import { Badge } from '@/Components/UI/Badge/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CompareEvaluationsProps {
  evaluations: Array<{
    id: number;
    code: string;
    periode: string;
    annee: number;
    evalue: {
      id: number;
      name: string;
    };
  }>;
}

interface ComparisonData {
  evaluation1: {
    code: string;
    periode: string;
    annee: number;
    score_moyen: number;
  };
  evaluation2: {
    code: string;
    periode: string;
    annee: number;
    score_moyen: number;
  };
  differences: Array<{
    competence_id: number;
    libelle: string;
    note_eval1: number;
    note_eval2: number;
    difference: number;
  }>;
}

const CompareEvaluations: React.FC<CompareEvaluationsProps> = ({ evaluations }) => {
  const [selectedEval1, setSelectedEval1] = useState<number | null>(null);
  const [selectedEval2, setSelectedEval2] = useState<number | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const { data, setData, post, processing, errors } = useForm({
    evaluation1_id: '',
    evaluation2_id: '',
  });

  // Filtrer les évaluations pour le deuxième sélecteur (éviter de comparer la même évaluation)
  const filteredEvaluations = evaluations.filter(
    (evaluation) => evaluation.id !== parseInt(data.evaluation1_id as string, 10)
  );

  // Mettre à jour les données du formulaire lorsque les sélections changent
  useEffect(() => {
    if (selectedEval1) {
      setData('evaluation1_id', selectedEval1.toString());
    }
    if (selectedEval2) {
      setData('evaluation2_id', selectedEval2.toString());
    }
  }, [selectedEval1, selectedEval2]);

  // Fonction pour comparer les évaluations
  const compareEvaluations = () => {
    post('/admin/evaluation/compare', {
      preserveScroll: true,
      onSuccess: (response: any) => {
        setComparisonData(response.props.comparison as ComparisonData);
        prepareChartData(response.props.comparison as ComparisonData);
      },
    });
  };

  // Préparer les données pour le graphique
  const prepareChartData = (comparison: ComparisonData) => {
    if (!comparison || !comparison.differences) return;

    const chartData = comparison.differences.map((diff) => ({
      competence: diff.libelle,
      evaluation1: diff.note_eval1,
      evaluation2: diff.note_eval2,
      difference: diff.difference,
    }));

    setChartData(chartData);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-sabc-gray-900">Comparer des évaluations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
              Première évaluation
            </label>
            <select
              value={data.evaluation1_id as string}
              onChange={(e) => setSelectedEval1(parseInt(e.target.value, 10))}
              className="w-full rounded-md border border-sabc-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une évaluation</option>
              {evaluations.map((evaluation) => (
                <option key={`eval1-${evaluation.id}`} value={evaluation.id}>
                  {evaluation.code} - {evaluation.evalue.name} ({evaluation.periode} {evaluation.annee})
                </option>
              ))}
            </select>
            {errors.evaluation1_id && (
              <p className="text-sabc-error text-sm mt-1">{errors.evaluation1_id}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
              Deuxième évaluation
            </label>
            <select
              value={data.evaluation2_id as string}
              onChange={(e) => setSelectedEval2(parseInt(e.target.value, 10))}
              className="w-full rounded-md border border-sabc-gray-200 bg-white px-3 py-2 text-sm"
              disabled={!data.evaluation1_id}
            >
              <option value="">Sélectionner une évaluation</option>
              {filteredEvaluations.map((evaluation) => (
                <option key={`eval2-${evaluation.id}`} value={evaluation.id}>
                  {evaluation.code} - {evaluation.evalue.name} ({evaluation.periode} {evaluation.annee})
                </option>
              ))}
            </select>
            {errors.evaluation2_id && (
              <p className="text-sabc-error text-sm mt-1">{errors.evaluation2_id}</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={compareEvaluations}
            disabled={!data.evaluation1_id || !data.evaluation2_id || processing}
          >
            Comparer
          </Button>
        </div>
      </Card>

      {comparisonData && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-sabc-gray-900">Résultats de la comparaison</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-sabc-gray-100 rounded-lg">
              <h3 className="font-medium mb-2">
                {comparisonData.evaluation1.code}
              </h3>
              <p className="text-sabc-gray-800">
                Période: {comparisonData.evaluation1.periode} {comparisonData.evaluation1.annee}
              </p>
              <p className="text-sabc-gray-800 mt-2">
                Score moyen: <span className="font-semibold">{comparisonData.evaluation1.score_moyen.toFixed(2)}</span>
              </p>
            </div>
            
            <div className="p-4 bg-sabc-gray-100 rounded-lg">
              <h3 className="font-medium mb-2">
                {comparisonData.evaluation2.code}
              </h3>
              <p className="text-sabc-gray-800">
                Période: {comparisonData.evaluation2.periode} {comparisonData.evaluation2.annee}
              </p>
              <p className="text-sabc-gray-800 mt-2">
                Score moyen: <span className="font-semibold">{comparisonData.evaluation2.score_moyen.toFixed(2)}</span>
              </p>
            </div>
          </div>
          
          <h3 className="font-semibold mb-4 text-sabc-gray-800">Différences par compétence</h3>
          
          {chartData.length > 0 ? (
            <>
              <div className="h-96 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="competence" 
                      angle={-45} 
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="evaluation1" 
                      name={`${comparisonData.evaluation1.periode} ${comparisonData.evaluation1.annee}`} 
                      fill="#E53E3E" 
                    />
                    <Bar 
                      dataKey="evaluation2" 
                      name={`${comparisonData.evaluation2.periode} ${comparisonData.evaluation2.annee}`} 
                      fill="#FF9800" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sabc-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-sabc-gray-100 text-left text-xs font-medium text-sabc-gray-800">
                        Compétence
                      </th>
                      <th className="px-4 py-3 bg-sabc-gray-100 text-center text-xs font-medium text-sabc-gray-800">
                        {comparisonData.evaluation1.periode} {comparisonData.evaluation1.annee}
                      </th>
                      <th className="px-4 py-3 bg-sabc-gray-100 text-center text-xs font-medium text-sabc-gray-800">
                        {comparisonData.evaluation2.periode} {comparisonData.evaluation2.annee}
                      </th>
                      <th className="px-4 py-3 bg-sabc-gray-100 text-center text-xs font-medium text-sabc-gray-800">
                        Évolution
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sabc-gray-200">
                    {comparisonData.differences.map((diff, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-sabc-gray-800">
                          {diff.libelle}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-sabc-gray-800">
                          {diff.note_eval1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-sabc-gray-800">
                          {diff.note_eval2}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                          {diff.difference > 0 ? (
                            <Badge variant="success">+{diff.difference}</Badge>
                          ) : (
                            <Badge variant="error">{diff.difference}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sabc-gray-800 italic">Aucune différence significative trouvée entre ces évaluations.</p>
          )}
        </Card>
      )}
    </div>
  );
};

export default CompareEvaluations;
