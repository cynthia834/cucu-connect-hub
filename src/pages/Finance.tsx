import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FinanceLedger from '@/components/finance/FinanceLedger';
import FinanceEntryForm from '@/components/finance/FinanceEntryForm';
import FinanceApprovals from '@/components/finance/FinanceApprovals';
import FinanceAuditTrail from '@/components/finance/FinanceAuditTrail';
import FinancePaymentInfo from '@/components/finance/FinancePaymentInfo';
import { useAuthStore } from '@/stores/authStore';

export default function Finance() {
  const { hasRole } = useAuthStore();
  const canApprove = hasRole('super_admin') || hasRole('cu_chairperson') || hasRole('finance_leader');

  return (
    <div className="animate-fade-in">
      <PageHeader title="Finance" description="Financial ledger, entries, approvals & audit trail" />

      <Tabs defaultValue="ledger" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="create">New Entry</TabsTrigger>
          {canApprove && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="payment">Payment Info</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger"><FinanceLedger /></TabsContent>
        <TabsContent value="create"><FinanceEntryForm /></TabsContent>
        {canApprove && <TabsContent value="approvals"><FinanceApprovals /></TabsContent>}
        <TabsContent value="audit"><FinanceAuditTrail /></TabsContent>
        <TabsContent value="payment"><FinancePaymentInfo /></TabsContent>
      </Tabs>
    </div>
  );
}
