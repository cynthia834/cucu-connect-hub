import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Church } from 'lucide-react';

const ministryIcons: Record<string, string> = {
  'Praise & Worship': '🎵', 'Ushering': '🤝', 'Intercessory': '🙏',
  'Evangelism & Missions': '🌍', 'Media & Publicity': '📢', 'Hospitality': '☕',
  'Creative Arts & Drama': '🎭', 'Bible Study': '📖', 'Choir': '🎶',
  'Technical & Sound': '🔊', 'Welfare': '❤️', 'Discipleship': '📚',
  'Children\'s Ministry': '👶',
};

const ministryRoleGuide: Record<string, { role: string; description: string }[]> = {
  finance: [
    { role: 'Finance Leader', description: 'Oversees all financial operations and approvals' },
    { role: 'Finance Subcommittee', description: 'Assists with record-keeping and audits' },
  ],
  assets: [
    { role: 'Assets Leader', description: 'Manages CU property and equipment inventory' },
    { role: 'Assets Subcommittee', description: 'Assists with tracking and maintenance' },
  ],
  ict: [
    { role: 'ICT Leader', description: 'Manages tech, broadcasts, and digital platforms' },
  ],
  missions: [
    { role: 'Missions Leader', description: 'Plans and coordinates evangelism outreaches' },
  ],
  welfare: [
    { role: 'Welfare Officer', description: 'Handles member welfare requests and support' },
  ],
  content: [
    { role: 'Content Moderator', description: 'Reviews testimonies and service updates' },
  ],
  leadership: [
    { role: 'CU Chairperson', description: 'Overall CU leadership and administration' },
    { role: 'Ministry Chairperson', description: 'Leads a specific ministry department' },
    { role: 'Docket Leader', description: 'Manages programs and discipleship tracks' },
  ],
  general: [
    { role: 'Cell Group Leader', description: 'Leads a small fellowship group' },
    { role: 'General Member', description: 'Active member participating in CU activities' },
  ],
};

function getMinistryRoles(name: string): { role: string; description: string }[] {
  const lower = name.toLowerCase();
  if (lower.includes('financ') || lower.includes('treas')) return ministryRoleGuide.finance;
  if (lower.includes('asset') || lower.includes('propert')) return ministryRoleGuide.assets;
  if (lower.includes('ict') || lower.includes('tech') || lower.includes('media') || lower.includes('sound')) return ministryRoleGuide.ict;
  if (lower.includes('mission') || lower.includes('evangel')) return ministryRoleGuide.missions;
  if (lower.includes('welfare') || lower.includes('hospital')) return ministryRoleGuide.welfare;
  if (lower.includes('disciple') || lower.includes('bible')) return [...ministryRoleGuide.general, ...ministryRoleGuide.leadership.slice(2)];
  return ministryRoleGuide.general;
}

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
          {ministries.map((m) => {
            const roles = getMinistryRoles(m.name);
            return (
              <Card
                key={m.id}
                className="border-border/50 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
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
                  {/* Role Guide */}
                  <div className="border-t border-border/50 pt-3 mt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Role Guide</p>
                    <div className="space-y-1.5">
                      {roles.map((r) => (
                        <div key={r.role} className="flex items-start gap-2">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5">
                            {r.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground leading-tight">{r.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
