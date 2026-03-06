import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Search, Users, Calendar, Church, GraduationCap, MapPin,
  BookOpen, CheckCircle, ArrowRight, LifeBuoy,
  FileText, Sun, Moon, Sunrise, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

export default function Dashboard() {
  const { user, profile, roles } = useAuthStore();
  const greeting = getGreeting();
  const GreetIcon = greeting.icon;

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

  const { data: todayReading } = useQuery({
    queryKey: ['today-cbr-reading', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cbr_plans')
        .select('id, title, scripture_reference, content')
        .order('week_number', { ascending: true })
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user,
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

  const statColors = [
    'bg-primary/10 text-primary ring-primary/20',
    'bg-secondary/20 text-secondary-foreground ring-secondary/30',
    'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] ring-[hsl(var(--success))]/20',
    'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] ring-[hsl(var(--warning))]/20',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search bar */}
      <div className="relative w-full" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search members, events, ministries..."
          className="pl-10 bg-card border-border"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim() && setShowResults(true)}
        />
        {showResults && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-xl max-h-72 overflow-y-auto">
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

      {/* Profile Card + Daily Devotional Row */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Profile Card */}
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0 flex sm:block justify-center">
                <Avatar className="w-24 h-24 ring-[3px] ring-secondary shadow-lg">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'Member'} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-3xl font-display font-bold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <GreetIcon className="w-4 h-4 text-secondary" />
                      <span className="text-secondary text-sm font-medium">{greeting.text}</span>
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                      {profile?.full_name || 'Member'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {profile?.department ? `${profile.department}` : 'Student'} • Christian Union
                    </p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
                    <Settings className="w-3.5 h-3.5" /> Edit Bio
                  </Link>
                </div>

                {profile?.bio && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-2">{profile.bio}</p>
                )}

                {/* Role badge */}
                {roles.length > 0 && (
                  <div className="mt-3">
                    <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider border-foreground/30 text-foreground px-3 py-1">
                      {roles[0].replace(/_/g, ' ')}
                    </Badge>
                  </div>
                )}

                {/* My Ministries */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">My Ministries</p>
                  {myMinistries && myMinistries.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {myMinistries.map((m: any) => (
                        <Badge key={m.ministry_id} variant="outline" className="bg-secondary/10 border-secondary/40 text-secondary-foreground text-xs px-3 py-1 font-medium">
                          {(m.ministries as any)?.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Not yet joined any ministry. <Link to="/ministries" className="text-primary hover:underline">Join one →</Link>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Devotional Card */}
        <Card className="border-0 overflow-hidden shadow-md" style={{ background: 'hsl(var(--secondary))' }}>
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-secondary-foreground" />
              <h3 className="font-display text-lg font-bold text-secondary-foreground">Daily Devotional</h3>
            </div>
            {todayReading ? (
              <div className="flex-1 flex flex-col">
                <p className="font-bold text-secondary-foreground text-sm mb-2">
                  {todayReading.scripture_reference || todayReading.title}
                </p>
                <blockquote className="text-secondary-foreground/90 text-sm leading-relaxed mb-3 flex-1">
                  "{todayReading.content || 'Worship the Lord with gladness; come before him with joyful songs.'}"
                </blockquote>
                <p className="text-secondary-foreground/70 text-sm italic mb-4">
                  Reflect: How can your melody today bring glory to His name?
                </p>
                <Link to="/cbr-reading">
                  <Button variant="outline" size="sm" className="bg-card/20 border-secondary-foreground/30 text-secondary-foreground hover:bg-card/30 w-full">
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Read
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center text-center">
                <p className="text-secondary-foreground/80 text-sm mb-3">
                  "The Lord is my shepherd; I shall not want." — Psalm 23:1
                </p>
                <p className="text-secondary-foreground/60 text-xs italic mb-4">
                  Reflect: Where is God leading you today?
                </p>
                <Link to="/cbr-reading">
                  <Button variant="outline" size="sm" className="bg-card/20 border-secondary-foreground/30 text-secondary-foreground hover:bg-card/30">
                    <BookOpen className="w-4 h-4 mr-2" /> View CBR Plan
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((s, i) => (
          <Link key={s.label} to={s.to}>
            <Card className="border-border/50 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ring-1 ${statColors[i]}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
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
                          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, hsl(220 60% 20%), hsl(45 80% 55%))' }}
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
