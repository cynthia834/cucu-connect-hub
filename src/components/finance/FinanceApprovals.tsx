import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Check, X, AlertTriangle, Loader2 } from 'lucide-react';

export default function FinanceApprovals() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: pending, isLoading } = useQuery({
    queryKey: ['finance-pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_entries')
        .select('*')
        .eq('status', 'submitted')
        .eq('is_submitted', true)
        .order('submitted_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approved' | 'flagged' }) => {
      const { error } = await supabase
        .from('finance_entries')
        .update({
          status: action,
          approved_by: user!.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['finance-pending'] });
      queryClient.invalidateQueries({ queryKey: ['finance-entries'] });
      toast({ title: action === 'approved' ? 'Entry Approved' : 'Entry Flagged' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded" />)}</div>;

  if (!pending?.length) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-12 text-center">
          <Check className="w-12 h-12 mx-auto text-success mb-4" />
          <p className="text-muted-foreground font-medium">No entries pending approval.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{pending.length} entries awaiting review</p>
      {pending.map(entry => (
        <Card key={entry.id} className="border-border/50">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.entry_type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {entry.entry_type}
                  </span>
                  <span className="text-xs text-muted-foreground">{entry.category}</span>
                </div>
                <p className="font-medium">{entry.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{format(new Date(entry.transaction_date), 'MMM d, yyyy')}</span>
                  {entry.reference_number && <span>Ref: {entry.reference_number}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xl font-bold font-display">KES {Number(entry.amount).toLocaleString()}</p>
                <Button size="sm" onClick={() => actionMutation.mutate({ id: entry.id, action: 'approved' })} disabled={actionMutation.isPending}>
                  {actionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => actionMutation.mutate({ id: entry.id, action: 'flagged' })} disabled={actionMutation.isPending}>
                  <AlertTriangle className="w-4 h-4 mr-1" /> Flag
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
