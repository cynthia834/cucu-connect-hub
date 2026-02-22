import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function ServiceUpdates() {
  const { data: updates, isLoading } = useQuery({
    queryKey: ['service-updates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_updates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Service Updates" description="Announcements, sermons, and devotionals" />
      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
      ) : updates && updates.length > 0 ? (
        <div className="space-y-4">
          {updates.map(u => (
            <Card key={u.id} className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg">{u.title}</CardTitle>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">{u.update_type}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{u.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{format(new Date(u.created_at), 'MMM d, yyyy')}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No service updates.</p></CardContent></Card>
      )}
    </div>
  );
}
