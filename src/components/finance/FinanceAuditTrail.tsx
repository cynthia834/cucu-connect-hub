import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { History } from 'lucide-react';

export default function FinanceAuditTrail() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['finance-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_audit_log')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>;

  if (!logs?.length) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-12 text-center">
          <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No audit records yet.</p>
        </CardContent>
      </Card>
    );
  }

  const getChangeSummary = (log: any) => {
    if (log.action === 'INSERT') return 'Entry created';
    if (log.action === 'DELETE') return 'Entry deleted';
    if (!log.old_values || !log.new_values) return 'Entry updated';

    const old = log.old_values as Record<string, any>;
    const nw = log.new_values as Record<string, any>;
    const changes: string[] = [];
    const fields = ['status', 'amount', 'category', 'description', 'entry_type'];
    for (const f of fields) {
      if (old[f] !== nw[f]) changes.push(`${f}: "${old[f]}" → "${nw[f]}"`);
    }
    return changes.length ? changes.join(', ') : 'Entry updated';
  };

  return (
    <Card className="border-border/50">
      <CardHeader><CardTitle className="font-display text-lg flex items-center gap-2"><History className="w-5 h-5" /> Audit Trail</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left py-3 text-muted-foreground font-medium">Timestamp</th>
              <th className="text-left py-3 text-muted-foreground font-medium">Action</th>
              <th className="text-left py-3 text-muted-foreground font-medium">Changes</th>
            </tr></thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border/50">
                  <td className="py-3 text-xs whitespace-nowrap">{format(new Date(log.performed_at), 'MMM d, yyyy HH:mm')}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      log.action === 'INSERT' ? 'bg-success/10 text-success' :
                      log.action === 'UPDATE' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>{log.action}</span>
                  </td>
                  <td className="py-3 text-muted-foreground text-xs max-w-[400px] truncate">{getChangeSummary(log)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
