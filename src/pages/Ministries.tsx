import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Church, Users } from 'lucide-react';

const ministryIcons: Record<string, string> = {
  'Praise & Worship': '🎵', 'Ushering': '🤝', 'Intercessory': '🙏',
  'Evangelism & Missions': '🌍', 'Media & Publicity': '📢', 'Hospitality': '☕',
  'Creative Arts & Drama': '🎭', 'Bible Study': '📖', 'Choir': '🎶',
  'Technical & Sound': '🔊', 'Welfare': '❤️', 'Discipleship': '📚',
  'Children\'s Ministry': '👶',
};

export default function Ministries() {
  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ministries').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

  const getIcon = (name: string) => {
    for (const [key, icon] of Object.entries(ministryIcons)) {
      if (name.toLowerCase().includes(key.toLowerCase().split(' ')[0].toLowerCase())) return icon;
    }
    return '⛪';
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Ministries" description="Our ministry departments serving the body of Christ" />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="border-border/50">
              <CardContent className="p-6"><div className="h-28 bg-muted animate-pulse rounded-lg" /></CardContent>
            </Card>
          ))}
        </div>
      ) : ministries && ministries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ministries.map((m, i) => (
            <Card
              key={m.id}
              className="border-border/50 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {getIcon(m.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-foreground text-base leading-tight mb-1">
                      {m.name}
                    </h3>
                    {m.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                        {m.description}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Church className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No ministries found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
