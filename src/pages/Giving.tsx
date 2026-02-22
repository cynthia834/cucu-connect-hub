import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { HandCoins } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function Giving() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [givingType, setGivingType] = useState('tithe');

  const { data: records, isLoading } = useQuery({
    queryKey: ['giving-records'],
    queryFn: async () => {
      const { data, error } = await supabase.from('giving_records').select('*').order('giving_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('giving_records').insert({
        user_id: user.id, amount: parseFloat(amount),
        giving_type: givingType as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Giving recorded' });
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['giving-records'] });
    },
    onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Giving" description="Tithes, offerings, and donations" />
      <Card className="border-border/50 mb-8">
        <CardHeader><CardTitle className="font-display text-lg">Record Giving</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); submitMutation.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Amount (KES)</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required min="1" step="0.01" /></div>
              <div>
                <Label>Type</Label>
                <Select value={givingType} onValueChange={setGivingType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tithe">Tithe</SelectItem>
                    <SelectItem value="offering">Offering</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="fundraiser">Fundraiser</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={submitMutation.isPending}>{submitMutation.isPending ? 'Recording...' : 'Record Giving'}</Button>
          </form>
        </CardContent>
      </Card>
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : records && records.length > 0 ? (
        <Card className="border-border/50">
          <CardHeader><CardTitle className="font-display text-lg">Giving History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {records.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <span className="text-sm font-medium capitalize">{r.giving_type}</span>
                    <span className="text-xs text-muted-foreground ml-2">{format(new Date(r.giving_date), 'MMM d, yyyy')}</span>
                  </div>
                  <span className="font-semibold">KES {Number(r.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><HandCoins className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No giving records yet.</p></CardContent></Card>
      )}
    </div>
  );
}
