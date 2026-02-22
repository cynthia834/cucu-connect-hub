import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Package } from 'lucide-react';

export default function Assets() {
  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const statusColors: Record<string, string> = {
    available: 'bg-success/10 text-success',
    allocated: 'bg-primary/10 text-primary',
    maintenance: 'bg-warning/10 text-warning',
    disposed: 'bg-muted text-muted-foreground',
    lost: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Assets" description="Asset registry and management" />
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : assets && assets.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Type</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Condition</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Location</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Value</th>
                </tr></thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-4 font-medium">{a.name}</td>
                      <td className="p-4">{a.asset_type}</td>
                      <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[a.status] || ''}`}>{a.status}</span></td>
                      <td className="p-4 capitalize">{a.condition}</td>
                      <td className="p-4 text-muted-foreground">{a.location || '—'}</td>
                      <td className="p-4 text-right">{a.purchase_price ? `KES ${Number(a.purchase_price).toLocaleString()}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No assets registered.</p></CardContent></Card>
      )}
    </div>
  );
}
