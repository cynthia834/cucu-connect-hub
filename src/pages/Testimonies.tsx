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
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function Testimonies() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: testimonies, isLoading } = useQuery({
    queryKey: ['testimonies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('testimonies').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('testimonies').insert({ title, content, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Testimony submitted', description: 'Your testimony is pending approval.' });
      setTitle(''); setContent('');
      queryClient.invalidateQueries({ queryKey: ['testimonies'] });
    },
    onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Testimonies" description="Share what God has done" />
      
      <Card className="border-border/50 mb-8">
        <CardHeader><CardTitle className="font-display text-lg">Share Your Testimony</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); submitMutation.mutate(); }} className="space-y-4">
            <div><Label htmlFor="title">Title</Label><Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Testimony title" required maxLength={200} /></div>
            <div><Label htmlFor="content">Your Testimony</Label><Textarea id="content" value={content} onChange={e => setContent(e.target.value)} placeholder="Share your testimony..." required maxLength={2000} rows={4} /></div>
            <Button type="submit" disabled={submitMutation.isPending}>{submitMutation.isPending ? 'Submitting...' : 'Submit Testimony'}</Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
      ) : testimonies && testimonies.length > 0 ? (
        <div className="space-y-4">
          {testimonies.map(t => (
            <Card key={t.id} className="border-border/50">
              <CardHeader><CardTitle className="font-display text-lg">{t.title}</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground text-sm">{t.content}</p></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No testimonies yet.</p></CardContent></Card>
      )}
    </div>
  );
}
