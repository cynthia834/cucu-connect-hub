import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Church, UserPlus, LogOut } from 'lucide-react';
import SubcomSection from '@/components/ministry/SubcomSection';
import { toast } from '@/hooks/use-toast';

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
};

function getMinistryRoles(name: string): { role: string; description: string }[] {
  const lower = name.toLowerCase();
  if (lower.includes('financ') || lower.includes('treas')) return ministryRoleGuide.finance;
  if (lower.includes('asset') || lower.includes('propert')) return ministryRoleGuide.assets;
  if (lower.includes('ict') || lower.includes('tech') || lower.includes('media') || lower.includes('sound')) return ministryRoleGuide.ict;
  if (lower.includes('mission') || lower.includes('evangel')) return ministryRoleGuide.missions;
  if (lower.includes('welfare') || lower.includes('hospital')) return ministryRoleGuide.welfare;
  if (lower.includes('disciple') || lower.includes('bible')) return ministryRoleGuide.leadership.slice(2);
  return ministryRoleGuide.leadership;
}

export default function Ministries() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: ministries, isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ministries').select('*').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's ministry memberships
  const { data: myMemberships } = useQuery({
    queryKey: ['ministry-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from('ministry_members').select('ministry_id').eq('user_id', user.id);
      if (error) throw error;
      return data.map(m => m.ministry_id);
    },
    enabled: !!user?.id,
  });

  const joinMinistry = useMutation({
    mutationFn: async (ministryId: string) => {
      const { error } = await supabase.from('ministry_members').insert({ ministry_id: ministryId, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministry-memberships'] });
      toast({ title: 'Joined ministry successfully!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const leaveMinistry = useMutation({
    mutationFn: async (ministryId: string) => {
      const { error } = await supabase.from('ministry_members').delete().eq('ministry_id', ministryId).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ministry-memberships'] });
      toast({ title: 'Left ministry' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const getIcon = (name: string) => {
    for (const [key, icon] of Object.entries(ministryIcons)) {
      if (name.toLowerCase().includes(key.toLowerCase().split(' ')[0].toLowerCase())) return icon;
    }
    return '⛪';
  };

  const isMember = (ministryId: string) => myMemberships?.includes(ministryId);

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
            const joined = isMember(m.id);
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

                  {/* Join / Leave Button */}
                  {user && (
                    <div className="mb-3">
                      {joined ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-muted-foreground"
                          onClick={() => leaveMinistry.mutate(m.id)}
                          disabled={leaveMinistry.isPending}
                        >
                          <LogOut className="w-3.5 h-3.5" /> Leave Ministry
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full gap-1.5"
                          onClick={() => joinMinistry.mutate(m.id)}
                          disabled={joinMinistry.isPending}
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Join Ministry
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Subcommittees */}
                  <div className="border-t border-border/50 pt-3 mt-2">
                    <SubcomSection ministryId={m.id} ministryName={m.name} />
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
