import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Target, Users, DollarSign } from 'lucide-react';

export default function Missions() {
  const { data: missions, isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const statusColors: Record<string, string> = {
    planning: 'bg-warning/10 text-warning',
    active: 'bg-success/10 text-success',
    completed: 'bg-primary/10 text-primary',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Missions" description="Outreach and mission activities" />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
      ) : missions && missions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {missions.map(m => (
            <Card key={m.id} className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="font-display text-lg">{m.title}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColors[m.status] || ''}`}>{m.status}</span>
                </div>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2"><Target className="w-4 h-4 text-muted-foreground" /><span>Souls: {m.souls_reached}/{m.target_souls}</span></div>
                  <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /><span>KES {Number(m.raised_amount).toLocaleString()}/{Number(m.target_amount).toLocaleString()}</span></div>
                </div>
                {m.location && <p className="text-sm text-muted-foreground">📍 {m.location}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No missions found.</p></CardContent></Card>
      )}
    </div>
  );
}
