import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function FinanceLedger() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['finance-entries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_entries')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtered = entries?.filter(e => {
    if (typeFilter !== 'all' && e.entry_type !== typeFilter) return false;
    if (search && !e.description.toLowerCase().includes(search.toLowerCase()) && !e.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalIncome = entries?.filter(e => e.entry_type === 'income').reduce((s, e) => s + Number(e.amount), 0) || 0;
  const totalExpenditure = entries?.filter(e => e.entry_type === 'expenditure').reduce((s, e) => s + Number(e.amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Total Income</p><p className="text-2xl font-bold font-display">KES {totalIncome.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center"><TrendingDown className="w-6 h-6 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Total Expenditure</p><p className="text-2xl font-bold font-display">KES {totalExpenditure.toLocaleString()}</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="w-6 h-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Balance</p><p className="text-2xl font-bold font-display">KES {(totalIncome - totalExpenditure).toLocaleString()}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Search description or category..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expenditure">Expenditure</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : filtered && filtered.length > 0 ? (
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
                  <th className="text-left py-3 text-muted-foreground font-medium">Ref #</th>
                  <th className="text-right py-3 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3">{format(new Date(e.transaction_date), 'MMM d, yyyy')}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.entry_type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {e.entry_type}
                        </span>
                      </td>
                      <td className="py-3">{e.category}</td>
                      <td className="py-3 text-muted-foreground max-w-[200px] truncate">{e.description}</td>
                      <td className="py-3 text-muted-foreground text-xs">{e.reference_number || '—'}</td>
                      <td className="py-3 text-right font-medium">KES {Number(e.amount).toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          e.status === 'approved' ? 'bg-success/10 text-success' :
                          e.status === 'submitted' ? 'bg-warning/10 text-warning' :
                          e.status === 'flagged' ? 'bg-destructive/10 text-destructive' :
                          'bg-muted text-muted-foreground'
                        }`}>{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No finance entries found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
