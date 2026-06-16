'use client';

import { useRouter } from 'next/navigation';
import { FileText } from 'lucide-react';

import MoaForm from '../components/MoaForm';
import { Button } from '@/components/ui/button';
import PageHeader from '../../components/PageHeader';

export default function CreateExpenseMoaPage() {
  const router = useRouter();

  const goToList = () => {
    router.push('/expense-moas');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create MOA"
        subtitle="Set up an expense MOA and assigned locations."
        icon={FileText}
        actions={
          <Button variant="outline" onClick={goToList}>
            Back
          </Button>
        }
      />

      <MoaForm mode="create" onCancel={goToList} onSuccess={goToList} layout="page" />
    </div>
  );
}
