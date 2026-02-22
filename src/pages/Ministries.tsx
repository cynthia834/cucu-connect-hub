import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Church } from 'lucide-react';

export default function Ministries() {
  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ministries').select('*').eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Ministries" description="Our ministry departments" />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-20 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      ) : ministries && ministries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ministries.map(m => (
            <Card key={m.id} className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader><CardTitle className="font-display text-lg">{m.name}</CardTitle></CardHeader>
              <CardContent>{m.description && <p className="text-muted-foreground text-sm">{m.description}</p>}</CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><Church className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No ministries found.</p></CardContent></Card>
      )}
    </div>
  );
}
