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
import { Heart, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function PrayerRequests() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Only fetch user's OWN prayer requests
  const { data: prayers, isLoading } = useQuery({
    queryKey: ['prayer-requests', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('prayer_requests').insert({ title, description, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(''); setDescription('');
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['prayer-requests'] });
    },
    onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Prayer Requests" description="Share and intercede" />

      {submitted && (
        <Card className="border-success/30 bg-success/5 mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-sm text-foreground">Your prayer request has been submitted to the Intercessory team. They will be praying for you.</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 mb-8">
        <CardHeader><CardTitle className="font-display text-lg">Submit Prayer Request</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); submitMutation.mutate(); }} className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Prayer request title" required maxLength={200} /></div>
            <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your prayer need..." maxLength={1000} rows={3} /></div>
            <Button type="submit" disabled={submitMutation.isPending}>{submitMutation.isPending ? 'Submitting...' : 'Submit Request'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Only show user's own submissions */}
      <h3 className="font-display text-lg font-semibold mb-3">My Submissions</h3>
      {isLoading ? (
        <div className="space-y-4">{[1,2].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-12 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
      ) : prayers && prayers.length > 0 ? (
        <div className="space-y-4">
          {prayers.map(p => (
            <Card key={p.id} className="border-border/50">
              <CardHeader><CardTitle className="font-display text-base">{p.title}</CardTitle></CardHeader>
              <CardContent>
                {p.description && <p className="text-muted-foreground text-sm">{p.description}</p>}
                <span className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full ${p.status === 'answered' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>{p.status}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No prayer requests yet.</p></CardContent></Card>
      )}
    </div>
  );
}
