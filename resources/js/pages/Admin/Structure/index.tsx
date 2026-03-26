import React from 'react';
import { Head } from '@/lib/inertia-shim';
import AppLayout from '@/Components/Layout/app/AppLayout';
import { adaptUserForLayout } from '@/utils/userAdapter';
import HierarchyTree, { SABC_HIERARCHY_DATA } from '@/Components/UI/HierarchyTree/HierarchyTree';

interface Props {
  user: any;
}

const AdminStructureIndex: React.FC<Props> = ({ user }) => {
  const layoutUser = adaptUserForLayout(user);

  return (
    <AppLayout user={layoutUser} pageTitle="Structure organisationnelle" notifications={[]}>
      <Head title="Structure organisationnelle" />
      <div className="space-y-6 p-6">
        <div className="space-y-6">
          <HierarchyTree
            title="Régions Tanières (5 niveaux)"
            subtitle="Structure hiérarchique complète pour les régions à forte densité commerciale"
            nodes={SABC_HIERARCHY_DATA.roles_taniere}
            variant="taniere"
          />

          <HierarchyTree
            title="Régions Non-Tanières (3 niveaux)"
            subtitle="Structure simplifiée pour les régions moins denses"
            nodes={SABC_HIERARCHY_DATA.roles_non_taniere}
            variant="non-taniere"
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminStructureIndex;
