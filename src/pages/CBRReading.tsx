import { useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { BookOpen, CalendarDays, Pencil, Save, Sparkles, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CBRReading() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [readingDate, setReadingDate] = useState(today);
  const [bibleBook, setBibleBook] = useState('');
  const [passage, setPassage] = useState('');
  const [reflection, setReflection] = useState('');
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const { data: cbrProgram } = useQuery({
    queryKey: ['cbr-program'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, completion_threshold, slug')
        .eq('slug', 'cbr')
        .eq('is_active', true)
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ['cbr-enrollment', user?.id, cbrProgram?.id],
    queryFn: async () => {
      if (!user || !cbrProgram?.id) return null;
      const { data, error } = await supabase
        .from('program_enrollments')
        .select('id, program_id, progress, status, completed_at')
        .eq('user_id', user.id)
        .eq('program_id', cbrProgram.id)
        .in('status', ['active', 'completed'])
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!user && !!cbrProgram?.id,
  });

  const { data: daysCount } = useQuery({
    queryKey: ['cbr-daily-days-count', user?.id, cbrProgram?.id],
    queryFn: async () => {
      if (!user || !cbrProgram?.id) return 0;
      const { count, error } = await supabase
        .from('cbr_daily_reading_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('program_id', cbrProgram.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user && !!cbrProgram?.id && !!enrollment,
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['cbr-daily-recent-logs', user?.id, cbrProgram?.id],
    queryFn: async () => {
      if (!user || !cbrProgram?.id) return [];
      const { data, error } = await supabase
        .from('cbr_daily_reading_logs')
        .select('id, reading_date, bible_book, passage, reflection, created_at')
        .eq('user_id', user.id)
        .eq('program_id', cbrProgram.id)
        .order('reading_date', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!cbrProgram?.id && !!enrollment,
  });

  const { data: readingHistory } = useQuery({
    queryKey: ['cbr-daily-reading-history', user?.id, cbrProgram?.id],
    queryFn: async () => {
      if (!user || !cbrProgram?.id) return [];
      const { data, error } = await supabase
        .from('cbr_daily_reading_logs')
        .select('id, reading_date, bible_book, passage, reflection, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('program_id', cbrProgram.id)
        .order('reading_date', { ascending: false })
        .limit(365);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!cbrProgram?.id && !!enrollment,
  });

  const saveLogMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!cbrProgram?.id) throw new Error('CBR program not found');
      if (!enrollment) throw new Error('You must be enrolled in CBR to log readings');
      if (!readingDate) throw new Error('Please select a reading date');
      if (!bibleBook.trim()) throw new Error('Please enter the Bible book');
      if (!passage.trim()) throw new Error('Please enter the chapter/verses read');

      const selected = new Date(readingDate);
      const now = new Date();
      selected.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      if (selected.getTime() > now.getTime()) throw new Error('Reading date cannot be in the future');

      if (editingLogId) {
        const { error } = await supabase
          .from('cbr_daily_reading_logs')
          .update({
            reading_date: readingDate,
            bible_book: bibleBook.trim(),
            passage: passage.trim(),
            reflection: reflection.trim() ? reflection.trim() : null,
          })
          .eq('id', editingLogId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cbr_daily_reading_logs')
          .upsert({
            user_id: user.id,
            program_id: cbrProgram.id,
            reading_date: readingDate,
            bible_book: bibleBook.trim(),
            passage: passage.trim(),
            reflection: reflection.trim() ? reflection.trim() : null,
          }, { onConflict: 'user_id,program_id,reading_date' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: editingLogId ? 'Your entry was updated.' : 'Your daily reading was recorded.' });
      setBibleBook('');
      setPassage('');
      setReflection('');
      setReadingDate(today);
      setEditingLogId(null);
      queryClient.invalidateQueries({ queryKey: ['cbr-daily-days-count'] });
      queryClient.invalidateQueries({ queryKey: ['cbr-daily-recent-logs'] });
      queryClient.invalidateQueries({ queryKey: ['cbr-daily-reading-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['cert-enrollments'] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('cbr_daily_reading_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Entry removed from your history.' });
      if (editingLogId) {
        setEditingLogId(null);
        setBibleBook('');
        setPassage('');
        setReflection('');
        setReadingDate(today);
      }
      queryClient.invalidateQueries({ queryKey: ['cbr-daily-days-count'] });
      queryClient.invalidateQueries({ queryKey: ['cbr-daily-recent-logs'] });
      queryClient.invalidateQueries({ queryKey: ['cbr-daily-reading-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['cert-enrollments'] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const days = Math.min(daysCount || 0, 365);
  const remaining = Math.max(0, 365 - days);
  const progressPct = Math.min(100, (days / 365) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="CBR – Daily Reading Log"
        description="Log what you read each day and build a 365‑day streak toward completion."
      />

      {!cbrProgram ? (
        <Card className="border-border/50">
          <CardContent className="py-10 text-center text-muted-foreground">CBR program is not available right now.</CardContent>
        </Card>
      ) : !user ? (
        <Card className="border-border/50">
          <CardContent className="py-10 text-center text-muted-foreground">Please sign in to continue.</CardContent>
        </Card>
      ) : !enrollment ? (
        <Card className="border-border/50">
          <CardContent className="py-10 text-center text-muted-foreground">
            You are not enrolled in <span className="font-medium text-foreground">{cbrProgram.name}</span>. Enroll in the program to start logging daily readings.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
          {/* Log form */}
          <Card className="border-border/60 bg-card/70 supports-[backdrop-filter]:bg-card/45 backdrop-blur-xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Log today’s reading
                </CardTitle>
                <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'} className="uppercase tracking-wider text-[10px]">
                  {enrollment.status === 'completed' ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingLogId && (
                <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Editing entry</p>
                    <p className="text-xs text-muted-foreground">Update the fields then save to apply changes.</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingLogId(null);
                      setBibleBook('');
                      setPassage('');
                      setReflection('');
                      setReadingDate(today);
                    }}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="readingDate">Date of reading</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="readingDate"
                      type="date"
                      className="pl-10"
                      value={readingDate}
                      onChange={(e) => setReadingDate(e.target.value)}
                      max={today}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bibleBook">Bible book</Label>
                  <Input
                    id="bibleBook"
                    placeholder="e.g., Romans"
                    value={bibleBook}
                    onChange={(e) => setBibleBook(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passage">Chapter or verses read</Label>
                <Input
                  id="passage"
                  placeholder="e.g., Romans 8:1–17"
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reflection">Short reflection / note</Label>
                <Textarea
                  id="reflection"
                  placeholder="What did you learn today?"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-end">
                <Button
                  onClick={() => saveLogMutation.mutate()}
                  disabled={saveLogMutation.isPending}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saveLogMutation.isPending ? 'Saving...' : (editingLogId ? 'Update entry' : 'Save entry')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress + recent */}
          <Card className="border-border/60 bg-card/70 supports-[backdrop-filter]:bg-card/45 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> 365‑day progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-display font-bold text-foreground">{progressPct.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Based on recorded reading days</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{days} / 365 days</p>
                  <p className="text-xs text-muted-foreground">{remaining} remaining</p>
                </div>
              </div>

              <Progress value={progressPct} className="h-3" />

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold text-foreground">{days}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-lg font-bold text-foreground">{remaining}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">Goal</p>
                  <p className="text-lg font-bold text-foreground">365</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recent entries</p>
                {recentLogs && recentLogs.length > 0 ? (
                  <div className="space-y-2">
                    {recentLogs.map((r: any) => (
                      <div key={r.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{r.bible_book} • {r.passage}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{r.reading_date}</span>
                        </div>
                        {r.reflection && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.reflection}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No entries yet. Save your first one today.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reading history */}
      {user && cbrProgram?.id && enrollment && (
        <Card className="border-border/60 bg-card/70 supports-[backdrop-filter]:bg-card/45 backdrop-blur-xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="font-display text-lg">Reading history</CardTitle>
              <Badge variant="outline" className="text-xs">
                {(readingHistory?.length || 0)} entries
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {readingHistory && readingHistory.length > 0 ? (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {readingHistory.map((r: any) => (
                  <div key={r.id} className="rounded-xl border border-border/60 bg-muted/15 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {r.bible_book} <span className="text-muted-foreground font-normal">•</span> {r.passage}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Date: <span className="font-medium text-foreground/80">{r.reading_date}</span>
                        </p>
                        {r.reflection && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
                            {r.reflection}
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col gap-2 sm:items-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            setEditingLogId(r.id);
                            setReadingDate(r.reading_date);
                            setBibleBook(r.bible_book || '');
                            setPassage(r.passage || '');
                            setReflection(r.reflection || '');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => {
                            const ok = window.confirm('Delete this reading entry? This will update your progress.');
                            if (!ok) return;
                            deleteLogMutation.mutate(r.id);
                          }}
                          disabled={deleteLogMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No history yet. Your saved entries will appear here.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
