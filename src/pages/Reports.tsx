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
import { FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';

export default function Reports() {
  const { user, hasAnyAdminRole } = useAuthStore();
  const isAdmin = hasAnyAdminRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['secretary-reports', user?.id, isAdmin],
    queryFn: async () => {
      if (!user) return [];
      // Admin sees all, regular user sees own
      const query = supabase.from('secretary_reports').select('*').order('created_at', { ascending: false });
      if (!isAdmin) {
        query.eq('user_id', user.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('secretary_reports').insert({
        user_id: user.id,
        title,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(''); setContent('');
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['secretary-reports'] });
      toast({ title: 'Report submitted to Secretary' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const statusColors: Record<string, string> = {
    submitted: 'bg-primary/10 text-primary',
    reviewed: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Reports" description="Submit reports to the Secretary" />

      {submitted && (
        <Card className="border-success/30 bg-success/5 mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            <p className="text-sm text-foreground">Your report has been submitted to the Secretary successfully.</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50 mb-8">
        <CardHeader><CardTitle className="font-display text-lg">Submit Report</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); submitMutation.mutate(); }} className="space-y-4">
            <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Report title" required maxLength={200} /></div>
            <div><Label>Content</Label><Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your report..." required maxLength={5000} rows={6} /></div>
            <Button type="submit" disabled={submitMutation.isPending}>{submitMutation.isPending ? 'Submitting...' : 'Submit Report'}</Button>
          </form>
        </CardContent>
      </Card>

      <h3 className="font-display text-lg font-semibold mb-3">{isAdmin ? 'All Submitted Reports' : 'My Reports'}</h3>
      {isLoading ? (
        <div className="space-y-4">{[1,2].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-12 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
      ) : reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((r: any) => (
            <Card key={r.id} className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base">{r.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.status] || 'bg-muted text-muted-foreground'}`}>{r.status}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{r.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No reports submitted yet.</p></CardContent></Card>
      )}
    </div>
  );
}
