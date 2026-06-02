import { CreditCard, FolderPlus, Landmark, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useToast } from '../../components/ui/Toast';
import { useFinance } from '../../hooks/useFinance';
import { CreditCardsPage } from '../credit-cards/CreditCardsPage';
import { FinancialItemsPage } from '../financial-items/FinancialItemsPage';

type CreditTab = 'loans' | 'cards';

function TabButton({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-9 items-center gap-2 rounded-md border-b-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
        active
          ? 'border-accent bg-accent/10 text-textPrimary'
          : 'border-transparent text-textMuted hover:bg-white/5 hover:text-textPrimary'
      }`}
      onClick={onClick}
      role="tab"
      aria-selected={active}
    >
      {icon}
      {children}
    </button>
  );
}

export function CreditsPage() {
  const finance = useFinance();
  const toast = useToast();
  const [tab, setTab] = useState<CreditTab>('loans');
  const [loanCreateRequestId, setLoanCreateRequestId] = useState(0);
  const [cardCreateRequestId, setCardCreateRequestId] = useState(0);
  const hasCategories = finance.categories.length > 0;

  const createCategories = async () => {
    await finance.createDefaultCategories();
    toast.success('Categorías recomendadas creadas');
  };

  const requestCreate = () => {
    if (tab === 'loans') {
      setLoanCreateRequestId((value) => value + 1);
      return;
    }
    setCardCreateRequestId((value) => value + 1);
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Deudas y tarjetas"
        description="Registra préstamos, créditos personales, tarjetas y obligaciones financieras."
        action={
          hasCategories ? (
            <Button className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />} onClick={requestCreate}>
              {tab === 'loans' ? 'Agregar préstamo' : 'Agregar tarjeta'}
            </Button>
          ) : undefined
        }
      />

      <div className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-lg border border-border bg-surface/70 p-1" role="tablist" aria-label="Deudas y tarjetas">
        <TabButton active={tab === 'loans'} icon={<Landmark className="h-4 w-4" />} onClick={() => setTab('loans')}>
          Préstamos y créditos
        </TabButton>
        <TabButton active={tab === 'cards'} icon={<CreditCard className="h-4 w-4" />} onClick={() => setTab('cards')}>
          Tarjetas de crédito
        </TabButton>
      </div>

      {!hasCategories ? (
        <EmptyState
          icon={<FolderPlus className="h-5 w-5" />}
          title="Primero crea tus categorías"
          description="Corvo usará categorías para organizar tus deudas, tarjetas y reportes."
          action={<Button onClick={() => void createCategories()}>Crear categorías recomendadas</Button>}
        />
      ) : tab === 'loans' ? (
        <FinancialItemsPage
          showHeader={false}
          createRequestId={loanCreateRequestId}
          title="Préstamos y créditos"
          categoryName="Préstamos"
          description="Registra préstamos, créditos personales y obligaciones con entidades."
          primaryActionLabel="Agregar préstamo"
          emptyTitle="Aún no tienes préstamos registrados"
          emptyDescription="Agrega préstamos o créditos personales para controlar vencimientos y saldo pendiente."
          emptyActionLabel="Agregar primer préstamo"
          noCategoriesDescription="Corvo usará categorías para organizar tus deudas y reportes."
        />
      ) : (
        <CreditCardsPage showHeader={false} createRequestId={cardCreateRequestId} />
      )}
    </div>
  );
}
