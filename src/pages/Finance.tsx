import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function Finance() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['finance-entries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('finance_entries').select('*').order('transaction_date', { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const totalIncome = entries?.filter(e => e.entry_type === 'income').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalExpenditure = entries?.filter(e => e.entry_type === 'expenditure').reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Finance" description="Financial ledger and reporting" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Total Income</p><p className="text-2xl font-bold">KES {totalIncome.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><TrendingDown className="w-6 h-6 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Total Expenditure</p><p className="text-2xl font-bold">KES {totalExpenditure.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Balance</p><p className="text-2xl font-bold">KES {(totalIncome - totalExpenditure).toLocaleString()}</p></div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : entries && entries.length > 0 ? (
        <Card className="border-border/50">
          <CardHeader><CardTitle className="font-display text-lg">Ledger Entries</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left py-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Category</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Description</th>
                  <th className="text-right py-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id} className="border-b border-border/50">
                      <td className="py-3">{format(new Date(e.transaction_date), 'MMM d, yyyy')}</td>
                      <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${e.entry_type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{e.entry_type}</span></td>
                      <td className="py-3">{e.category}</td>
                      <td className="py-3 text-muted-foreground">{e.description}</td>
                      <td className="py-3 text-right font-medium">KES {Number(e.amount).toLocaleString()}</td>
                      <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${e.status === 'flagged' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No finance entries.</p></CardContent></Card>
      )}
    </div>
  );
}
