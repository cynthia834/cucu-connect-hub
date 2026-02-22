import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { useState } from 'react';

export default function Welfare() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['welfare-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('welfare_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('welfare_requests').insert({ title, description, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Welfare request submitted' });
      setTitle(''); setDescription('');
      queryClient.invalidateQueries({ queryKey: ['welfare-requests'] });
    },
    onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning',
    under_review: 'bg-primary/10 text-primary',
    approved: 'bg-success/10 text-success',
    resolved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Welfare" description="Request and track welfare support" />
      <Card className="border-border/50 mb-8">
        <CardHeader><CardTitle className="font-display text-lg">Submit Welfare Request</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); submitMutation.mutate(); }} className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief title" required maxLength={200} /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your welfare need..." required maxLength={2000} rows={4} /></div>
            <Button type="submit" disabled={submitMutation.isPending}>{submitMutation.isPending ? 'Submitting...' : 'Submit Request'}</Button>
          </form>
        </CardContent>
      </Card>
      {isLoading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}</div>
      ) : requests && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map(r => (
            <Card key={r.id} className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base">{r.title}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.status] || ''}`}>{r.status.replace(/_/g, ' ')}</span>
                </div>
              </CardHeader>
              <CardContent><p className="text-muted-foreground text-sm">{r.description}</p></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No welfare requests.</p></CardContent></Card>
      )}
    </div>
  );
}
