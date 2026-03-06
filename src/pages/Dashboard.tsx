import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Search, Users, Calendar, Church, GraduationCap, MapPin,
  BookOpen, CheckCircle, ArrowRight, LifeBuoy,
  FileText, HandCoins, Sun, Moon, Sunrise
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface SearchResults {
  members: { id: string; full_name: string }[];
  events: { id: string; title: string }[];
  ministries: { id: string; name: string }[];
  programs: { id: string; name: string }[];
}

const emptyResults: SearchResults = { members: [], events: [], ministries: [], programs: [] };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: Sunrise };
  if (h < 17) return { text: 'Good Afternoon', icon: Sun };
  return { text: 'Good Evening', icon: Moon };
}

function getInitials(name?: string | null) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const statCardColors = [
  { bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/20' },
  { bg: 'bg-secondary/20', text: 'text-secondary-foreground', ring: 'ring-secondary/30' },
  { bg: 'bg-[hsl(var(--success))]/10', text: 'text-[hsl(var(--success))]', ring: 'ring-[hsl(var(--success))]/20' },
  { bg: 'bg-[hsl(var(--warning))]/10', text: 'text-[hsl(var(--warning))]', ring: 'ring-[hsl(var(--warning))]/20' },
];

export default function Dashboard() {
  const { user, profile, roles } = useAuthStore();
  const greeting = getGreeting();
  const GreetIcon = greeting.icon;

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults>(emptyResults);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(emptyResults); setShowResults(false); return; }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      const q = `%${searchQuery.trim()}%`;
      const [members, events, ministries, programs] = await Promise.all([
        supabase.from('profiles').select('id, full_name').ilike('full_name', q).limit(5),
        supabase.from('events').select('id, title').ilike('title', q).eq('is_published', true).limit(5),
        supabase.from('ministries').select('id, name').ilike('name', q).eq('is_active', true).limit(5),
        supabase.from('programs').select('id, name').ilike('name', q).eq('is_active', true).limit(5),
      ]);
      setSearchResults({
        members: members.data || [], events: events.data || [],
        ministries: ministries.data || [], programs: programs.data || [],
      });
      setShowResults(true);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const hasResults = searchResults.members.length + searchResults.events.length + searchResults.ministries.length + searchResults.programs.length > 0;

  const { data: myMinistries } = useQuery({
    queryKey: ['dashboard-ministries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('ministry_members').select('ministry_id, ministries(name)').eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myEnrollments } = useQuery({
    queryKey: ['dashboard-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('program_enrollments').select('id, progress, status, programs(name, description, completion_threshold)').eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, title, start_date, location').eq('is_published', true).gte('start_date', new Date().toISOString()).order('start_date', { ascending: true }).limit(3);
      if (error) throw error;
      return data;
    },
  });

  const quickActions = [
    { label: 'Join Ministry', icon: Church, to: '/ministries' },
    { label: 'Enroll Program', icon: GraduationCap, to: '/programs' },
    { label: 'Submit Report', icon: FileText, to: '/reports' },
    { label: 'Contact Support', icon: LifeBuoy, to: '/contact-support' },
  ];

  const statItems = [
    { icon: Church, label: 'My Ministries', value: myMinistries?.length || 0, to: '/ministries' },
    { icon: GraduationCap, label: 'Programs', value: myEnrollments?.length || 0, to: '/programs' },
    { icon: Calendar, label: 'Upcoming Events', value: upcomingEvents?.length || 0, to: '/events' },
    { icon: Users, label: 'Roles', value: roles.length, to: '/profile' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting Banner with Avatar */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50 p-6 sm:p-8"
        style={{ background: 'linear-gradient(135deg, hsl(220 60% 15%), hsl(220 60% 25%), hsl(220 50% 30%))' }}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="w-16 h-16 ring-[3px] ring-secondary shadow-lg">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Member'} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-bold">
                {getInitials(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GreetIcon className="w-5 h-5 text-secondary" />
              <span className="text-secondary font-medium text-sm">{greeting.text}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground truncate">
              {profile?.full_name || 'Member'}
            </h1>
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roles.slice(0, 3).map(r => (
                  <Badge key={r} variant="secondary" className="text-[10px] px-2 py-0.5 bg-secondary/20 text-secondary border-secondary/30">
                    {r.replace(/_/g, ' ')}
                  </Badge>
                ))}
                {roles.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-secondary/20 text-secondary border-secondary/30">
                    +{roles.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          {/* Search */}
          <div className="relative w-full sm:w-72" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members, events..."
              className="pl-10 bg-background/90 backdrop-blur-sm border-border/50"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
            />
            {showResults && (
              <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-xl max-h-72 overflow-y-auto border-border/50">
                <CardContent className="p-2">
                  {isSearching ? <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
                    : !hasResults ? <p className="text-sm text-muted-foreground text-center py-4">No results</p>
                    : <>
                      {searchResults.members.length > 0 && <SearchGroup icon={Users} label="Members" items={searchResults.members.map(m => ({ id: m.id, text: m.full_name, to: '/admin' }))} onClose={() => setShowResults(false)} />}
                      {searchResults.events.length > 0 && <SearchGroup icon={Calendar} label="Events" items={searchResults.events.map(e => ({ id: e.id, text: e.title, to: '/events' }))} onClose={() => setShowResults(false)} />}
                      {searchResults.ministries.length > 0 && <SearchGroup icon={Church} label="Ministries" items={searchResults.ministries.map(m => ({ id: m.id, text: m.name, to: '/ministries' }))} onClose={() => setShowResults(false)} />}
                      {searchResults.programs.length > 0 && <SearchGroup icon={GraduationCap} label="Programs" items={searchResults.programs.map(p => ({ id: p.id, text: p.name, to: '/programs' }))} onClose={() => setShowResults(false)} />}
                    </>}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((s, i) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} to={s.to} colorIdx={i} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(a => (
          <Link key={a.to} to={a.to}>
            <Card className="border-border/50 hover:border-primary/40 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer group overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3 relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-r opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <a.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground flex-1">{a.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Programs + Events row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Enrolled Programs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> My Programs
            </h2>
            <Link to="/programs" className="text-xs text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {myEnrollments && myEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myEnrollments.map(e => {
                const program = e.programs as any;
                const progress = Number(e.progress);
                const threshold = Number(program?.completion_threshold || 90);
                const isComplete = progress >= threshold;
                return (
                  <Card key={e.id} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-sm text-foreground">{program?.name}</h3>
                        {isComplete && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] border-0">
                            <CheckCircle className="w-3 h-3 mr-0.5" /> Done
                          </Badge>
                        )}
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, hsl(220 60% 20%), hsl(45 80% 55%))',
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">{progress.toFixed(0)}% complete</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-border/50"><CardContent className="py-8 text-center text-sm text-muted-foreground">
              No enrolled programs. <Link to="/programs" className="text-primary hover:underline font-medium">Browse programs →</Link>
            </CardContent></Card>
          )}
        </div>

        {/* Upcoming Events */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map(ev => {
                  const d = new Date(ev.start_date);
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted/80 transition-colors">
                      {/* Date badge */}
                      <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary flex flex-col items-center justify-center text-primary-foreground">
                        <span className="text-xs font-medium leading-none">{format(d, 'MMM').toUpperCase()}</span>
                        <span className="text-lg font-bold leading-none">{format(d, 'd')}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-foreground truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(d, 'EEE · h:mm a')}
                          {ev.location && <span className="inline-flex items-center gap-0.5 ml-2"><MapPin className="w-3 h-3" />{ev.location}</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No upcoming events.</p>
            )}
            <Link to="/events" className="text-sm text-primary hover:underline inline-block mt-3 font-medium">View All Events →</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to, colorIdx }: { icon: React.ElementType; label: string; value: number; to: string; colorIdx: number }) {
  const colors = statCardColors[colorIdx % statCardColors.length];
  return (
    <Link to={to}>
      <Card className="border-border/50 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center ring-1 ${colors.ring}`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SearchGroup({ icon: Icon, label, items, onClose }: { icon: React.ElementType; label: string; items: { id: string; text: string; to: string }[]; onClose: () => void }) {
  return (
    <div className="mb-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</p>
      {items.map(item => (
        <Link key={item.id} to={item.to} onClick={onClose} className="block px-2 py-1.5 text-sm rounded-lg hover:bg-accent/50 transition-colors">{item.text}</Link>
      ))}
    </div>
  );
}
