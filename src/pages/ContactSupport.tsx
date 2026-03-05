import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LifeBuoy, Send, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';

export default function ContactSupport() {
  const { user, profile } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user!.id,
        subject,
        message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Ticket submitted', description: 'We will get back to you soon.' });
      setSubject('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const statusColors: Record<string, string> = {
    open: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    resolved: 'bg-green-500/10 text-green-600 border-green-500/20',
    closed: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Contact Support" description="Need help? Submit a support ticket and our team will assist you." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Form */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" /> New Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={e => { e.preventDefault(); submitMutation.mutate(); }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Your Email</Label>
                <Input value={profile?.email || ''} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  required
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  required
                  maxLength={2000}
                  rows={5}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Past Tickets */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> My Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}</div>
            ) : tickets && tickets.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {tickets.map(t => (
                  <div key={t.id} className="p-3 rounded-lg border border-border/50 bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm text-foreground truncate">{t.subject}</h4>
                      <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${statusColors[t.status] || ''}`}>
                        {t.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {format(new Date(t.created_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No tickets submitted yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
