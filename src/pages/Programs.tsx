import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, TrendingUp, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export default function Programs() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*').eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('program_enrollments').select('*').eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async (programId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('program_enrollments').insert({
        user_id: user.id,
        program_id: programId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Enrolled successfully!' });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-enrollments'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const enrolledProgramIds = new Set(enrollments?.map(e => e.program_id) || []);

  return (
    <div className="relative animate-fade-in">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/15 blur-3xl opacity-60" />
        <div className="absolute -bottom-28 left-[-8rem] h-72 w-72 rounded-full bg-primary/10 blur-3xl opacity-50" />
        <div className="absolute -bottom-24 right-[-10rem] h-80 w-80 rounded-full bg-secondary/10 blur-3xl opacity-50" />
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4">
          <PageHeader title="Programs" description="Spiritual growth programs — CBR, Bible Study, Faith Foundation, BEST-P" />
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Enroll and track your progress</span>
          </div>
        </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-border/60 bg-card/60 supports-[backdrop-filter]:bg-card/40 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="h-28 bg-muted/70 animate-pulse rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : programs && programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map(p => {
            const isEnrolled = enrolledProgramIds.has(p.id);
            const enrollment = enrollments?.find(e => e.program_id === p.id);
            const progress = enrollment ? Number(enrollment.progress) : 0;
            const threshold = Number(p.completion_threshold);
            const isComplete = isEnrolled && progress >= threshold;
            return (
              <Card
                key={p.id}
                className={[
                  "group relative overflow-hidden border-border/60 bg-card/70 supports-[backdrop-filter]:bg-card/45 backdrop-blur-xl shadow-sm transition-all",
                  "hover:-translate-y-0.5 hover:shadow-lg",
                ].join(' ')}
              >
                {/* Accent stripe */}
                <div
                  aria-hidden
                  className={[
                    "absolute left-0 top-0 h-full w-1.5",
                    isComplete ? "bg-gradient-to-b from-[hsl(var(--success))] to-primary"
                      : isEnrolled ? "bg-gradient-to-b from-secondary to-primary"
                        : "bg-muted",
                  ].join(' ')}
                />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="font-display text-xl leading-tight">{p.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{p.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={isComplete ? 'default' : isEnrolled ? 'secondary' : 'outline'} className="text-[10px] uppercase tracking-wider">
                        {isComplete ? 'Completed' : isEnrolled ? 'Enrolled' : 'Available'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {p.slug?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {isEnrolled && enrollment ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" /> Progress
                        </span>
                        <Badge variant={isComplete ? 'default' : 'secondary'}>
                          {progress.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Threshold: {threshold}%</span>
                        {isComplete && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </span>
                        )}
                      </div>

                      {p.slug === 'cbr' && (
                        <Link to="/cbr-reading">
                          <Button variant="outline" className="w-full group-hover:border-primary/40">
                            Open Daily Reading Log <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => enrollMutation.mutate(p.id)}
                      disabled={enrollMutation.isPending}
                      className="w-full"
                    >
                      {enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Program'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/60 bg-card/60 supports-[backdrop-filter]:bg-card/40 backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No programs available.</p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
