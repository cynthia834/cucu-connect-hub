import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Globe, GraduationCap, Settings, BookOpen, CheckCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const devotionals = [
  {
    reference: 'Psalm 100:2',
    text: '"Worship the Lord with gladness; come before him with joyful songs."',
    reflection: 'Reflect: How can your melody today bring glory to His name?',
  },
];

export default function Dashboard() {
  const { user, profile, roles } = useAuthStore();
  const devotional = devotionals[0];
  const yearLabel = profile?.year_of_study ? `${profile.year_of_study}${['st','nd','rd'][((profile.year_of_study % 100) - 20) % 10] || ['st','nd','rd'][(profile.year_of_study % 100) - 1] || 'th'} Year Student` : 'Student';

  const { data: myMinistries } = useQuery({
    queryKey: ['dashboard-ministries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ministry_members')
        .select('ministry_id, ministries(name)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ['dashboard-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_enrollments')
        .select('id, progress, status, programs(name, description, completion_threshold)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search resources, events..." className="pl-10" />
      </div>

      {/* Profile + Devotional row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Profile Card */}
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center text-3xl font-display font-bold text-muted-foreground border-4 border-border">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    profile?.full_name?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                {/* Role badges */}
                <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {roles.slice(0, 2).map(role => (
                    <span
                      key={role}
                      className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-primary/20 bg-primary/5 text-primary"
                    >
                      {role.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {profile?.full_name || 'Member'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {yearLabel} • Christian Union
                    </p>
                  </div>
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                      <Settings className="w-4 h-4" />
                      Edit Bio
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {profile?.bio || 'Passionate about worship and youth mentorship. Committed to spiritual growth through music.'}
                </p>

                {/* Joined Ministries */}
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">My Ministries</p>
                  {myMinistries && myMinistries.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {myMinistries.map((m) => (
                        <Badge key={m.ministry_id} variant="secondary">
                          {(m.ministries as any)?.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Not enrolled in any ministry.{' '}
                      <Link to="/ministries" className="text-primary hover:underline">Join one →</Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Devotional */}
        <Card className="bg-gold text-primary border-0 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gold-light/30 -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-display">
              📖 Daily Devotional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold italic">{devotional.reference}</p>
            <p className="font-display text-lg leading-snug">{devotional.text}</p>
            <p className="text-sm italic opacity-80">{devotional.reflection}</p>
            <Button variant="secondary" className="w-full mt-2 gap-2">
              <CheckCircle className="w-4 h-4" /> Mark as Read
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Programs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gold" /> Enrolled Programs
          </h2>
          {myEnrollments && myEnrollments.length > 0 && (
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              {myEnrollments.length} Program{myEnrollments.length !== 1 ? 's' : ''} Active
            </span>
          )}
        </div>
        {myEnrollments && myEnrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myEnrollments.map((e) => {
              const program = e.programs as any;
              return (
                <Card key={e.id} className="border-border/50">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground">{program?.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{program?.description}</p>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Number(e.progress)}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{Number(e.progress).toFixed(0)}% complete</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No enrolled programs.</p>
        )}
      </div>

      {/* Announcements */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-xl">Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No recent announcements.</p>
          <Link to="/service-updates" className="text-sm text-primary hover:underline inline-block mt-2">
            View All →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
