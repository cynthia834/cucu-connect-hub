import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search, Users, Calendar, Church, GraduationCap, MapPin,
  BookOpen, CheckCircle, Settings, ArrowRight, LifeBuoy,
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting Banner + Search */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-border/50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <GreetIcon className="w-6 h-6 text-primary" />
              {greeting.text}, {profile?.full_name?.split(' ')[0] || 'Member'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome to your CUCU dashboard.</p>
          </div>
          <div className="relative w-full sm:w-80" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search members, events..."
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
            />
            {showResults && (
              <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg max-h-72 overflow-y-auto">
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
        <StatCard icon={Church} label="My Ministries" value={myMinistries?.length || 0} to="/ministries" />
        <StatCard icon={GraduationCap} label="Programs" value={myEnrollments?.length || 0} to="/programs" />
        <StatCard icon={Calendar} label="Upcoming Events" value={upcomingEvents?.length || 0} to="/events" />
        <StatCard icon={Users} label="Roles" value={roles.length} to="/profile" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map(a => (
          <Link key={a.to} to={a.to}>
            <Card className="border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <a.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{a.label}</span>
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
                  <Card key={e.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm text-foreground">{program?.name}</h3>
                        {isComplete && <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">{progress.toFixed(0)}% complete</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">
              No enrolled programs. <Link to="/programs" className="text-primary hover:underline">Browse programs →</Link>
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
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ev.start_date), 'EEE, MMM d · h:mm a')}
                        {ev.location && <span className="inline-flex items-center gap-0.5 ml-2"><MapPin className="w-3 h-3" />{ev.location}</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No upcoming events.</p>
            )}
            <Link to="/events" className="text-sm text-primary hover:underline inline-block mt-3">View All Events →</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to }: { icon: React.ElementType; label: string; value: number; to: string }) {
  return (
    <Link to={to}>
      <Card className="border-border/50 hover:border-primary/30 transition-colors">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
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
        <Link key={item.id} to={item.to} onClick={onClose} className="block px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors">{item.text}</Link>
      ))}
    </div>
  );
}
