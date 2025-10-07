import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/UI/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/UI/Tabs';
import { Button } from '@/Components/UI/Button';
import { Alert, AlertDescription, AlertTitle } from '@/Components/UI/Alert';
import { ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';
import EvaluationModal from '@/Components/Evaluation/EvaluationModal';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

interface EvaluationTemplate {
  id: string;
  nom: string;
  description: string;
  evaluated_role: string;
}

interface EvaluationTarget {
  matricule: string;
  name: string;
  role: string;
  region?: string;
  isAvailable: boolean;
}

const MinePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<{ self: EvaluationTarget[]; peers: EvaluationTarget[]; subordinates: EvaluationTarget[] }>({ self: [], peers: [], subordinates: [] });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/evaluations/templates/applicables');
        setTemplates(data as EvaluationTemplate[]);

        const role = (user as any)?.role_nom || (user as any)?.role || '';
        const fullName = user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : (user as any)?.name || 'Vous-même';
        const me = { matricule: (user as any)?.matricule || '', name: fullName, role: role || '', isAvailable: true } as EvaluationTarget;

        if (role === 'CDTT') {
          setTargets({ self: [], peers: [], subordinates: [
            { matricule: 'US-07', name: 'Sophie Atangana', role: 'CSC', isAvailable: true },
            { matricule: 'US-08', name: 'Bruno Ndi', role: 'CSC', isAvailable: true },
          ]});
        } else if (role === 'CSC') {
          setTargets({ self: [me], peers: [{ matricule: 'US-08', name: 'Bruno Ndi', role: 'CSC', isAvailable: true }], subordinates: [{ matricule: 'US-09', name: 'Martial Tchoua', role: 'CDV', isAvailable: true }] });
        } else {
          setTargets({ self: [me], peers: [], subordinates: [] });
        }
      } catch (e) {
        setError("Erreur lors du chargement des templates");
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading && user) load();
  }, [authLoading, user]);

  // Deep-link: si ?template=...&target=... présents, ouvrir le modal automatiquement
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const t = params.get('template');
    const trg = params.get('target');
    if (t && trg) {
      setSelectedTemplate(t);
      setModalTarget(trg);
      setModalOpen(true);
      params.delete('template');
      params.delete('target');
      const qs = params.toString();
      const newUrl = window.location.pathname + (qs ? `?${qs}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-sabc-red-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const start = (matricule: string) => {
    if (!selectedTemplate) return;
    setModalTarget(matricule);
    setModalOpen(true);
  };

  const renderList = (list: EvaluationTarget[]) => {
    if (!list.length) {
      return (
        <Alert className="mb-4 bg-sabc-gray-100">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucune personne disponible</AlertTitle>
          <AlertDescription>Rien à afficher pour ce type.</AlertDescription>
        </Alert>
      );
    }
    return list.map(p => (
      <Card key={p.matricule} className="mb-3">
        <CardContent className="p-4 flex justify-between items-center">
          <div>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-sabc-gray-500">{p.role}</div>
          </div>
          <Button disabled={!selectedTemplate || !p.isAvailable} onClick={() => start(p.matricule)} className="bg-sabc-red-primary text-white">Évaluer</Button>
        </CardContent>
      </Card>
    ));
  };

  const layoutUser = adaptUserForLayout(user);
  return (
    <AppLayout user={layoutUser} pageTitle="Mes évaluations" notifications={[]}> 
      <Head title="Mes évaluations" />
      <div className="container mx-auto py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><ClipboardList className="h-5 w-5 mr-2" />Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p>Chargement…</p> : (
                <>
                  {!templates.length ? (
                    <Alert className="bg-sabc-gray-100">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Aucun template</AlertTitle>
                      <AlertDescription>Aucun template publié n’est disponible.</AlertDescription>
                    </Alert>
                  ) : templates.map(t => (
                    <div key={t.id} onClick={() => setSelectedTemplate(t.id)} className={`p-3 mb-2 rounded border cursor-pointer ${selectedTemplate===t.id ? 'border-sabc-red-primary bg-sabc-red-light/20' : 'border-sabc-gray-200'}`}>
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{t.nom}</div>
                        {selectedTemplate===t.id && <CheckCircle2 className="h-4 w-4 text-sabc-red-primary" />}
                      </div>
                      <div className="text-xs text-sabc-gray-500">Cible: {t.evaluated_role}</div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle>Personnes à évaluer</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p>Chargement…</p> : (
                <Tabs defaultValue="self">
                  <TabsList className="mb-4">
                    <TabsTrigger value="self">Auto</TabsTrigger>
                    <TabsTrigger value="peers">Pairs</TabsTrigger>
                    <TabsTrigger value="subs">Subordonnés</TabsTrigger>
                  </TabsList>
                  <TabsContent value="self">{renderList(targets.self)}</TabsContent>
                  <TabsContent value="peers">{renderList(targets.peers)}</TabsContent>
                  <TabsContent value="subs">{renderList(targets.subordinates)}</TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <EvaluationModal open={modalOpen} onOpenChange={setModalOpen} templateId={selectedTemplate} targetMatricule={modalTarget} />
    </AppLayout>
  );
};

export default MinePage;
