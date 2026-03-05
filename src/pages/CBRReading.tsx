import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/shared/PageHeader';

export default function CBRReading() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's CBR enrollments to get program_ids
  const { data: cbrEnrollments } = useQuery({
    queryKey: ['cbr-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_enrollments')
        .select('id, program_id, progress, programs(name, completion_threshold)')
        .eq('user_id', user!.id)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch all cbr_plans for enrolled programs
  const programIds = cbrEnrollments?.map(e => e.program_id) || [];
  const { data: cbrPlans } = useQuery({
    queryKey: ['cbr-plans', programIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cbr_plans')
        .select('*')
        .in('program_id', programIds)
        .order('week_number', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: programIds.length > 0,
  });

  // Fetch user's reading progress
  const { data: readingProgress } = useQuery({
    queryKey: ['cbr-reading-progress', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cbr_reading_progress')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ planId, completed }: { planId: string; completed: boolean }) => {
      if (completed) {
        const { error } = await supabase
          .from('cbr_reading_progress')
          .upsert({
            user_id: user!.id,
            cbr_plan_id: planId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id,cbr_plan_id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cbr_reading_progress')
          .update({ is_completed: false, completed_at: null })
          .eq('user_id', user!.id)
          .eq('cbr_plan_id', planId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cbr-reading-progress'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const completedSet = new Set(
    readingProgress?.filter(r => r.is_completed).map(r => r.cbr_plan_id) || []
  );

  // Group plans by program
  const plansByProgram = new Map<string, typeof cbrPlans>();
  cbrPlans?.forEach(plan => {
    const pid = plan.program_id!;
    if (!plansByProgram.has(pid)) plansByProgram.set(pid, []);
    plansByProgram.get(pid)!.push(plan);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="CBR Reading Tracker" description="Track your Consecutive Bible Reading progress across enrolled programs." />

      {!cbrEnrollments || cbrEnrollments.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">You are not enrolled in any programs with CBR plans. Enroll in a program to get started.</CardContent></Card>
      ) : (
        cbrEnrollments.map(enrollment => {
          const program = enrollment.programs as any;
          const plans = plansByProgram.get(enrollment.program_id) || [];
          const totalPlans = plans.length;
          const completedCount = plans.filter(p => completedSet.has(p.id)).length;
          const progressPct = totalPlans > 0 ? Math.round((completedCount / totalPlans) * 100) : 0;

          return (
            <Card key={enrollment.id} className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" /> {program?.name}
                  </CardTitle>
                  <Badge variant={progressPct >= (program?.completion_threshold || 90) ? 'default' : 'secondary'}>
                    {progressPct}% Complete
                  </Badge>
                </div>
                <Progress value={progressPct} className="h-3 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {completedCount} of {totalPlans} readings completed
                </p>
              </CardHeader>
              <CardContent>
                {plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reading plans available for this program yet.</p>
                ) : (
                  <div className="space-y-2">
                    {plans.map(plan => {
                      const done = completedSet.has(plan.id);
                      return (
                        <div
                          key={plan.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${done ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border/50'}`}
                        >
                          <Checkbox
                            checked={done}
                            onCheckedChange={(checked) => toggleMutation.mutate({ planId: plan.id, completed: !!checked })}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-muted-foreground">Week {plan.week_number}</span>
                              {done && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                            </div>
                            <p className={`font-medium text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {plan.title}
                            </p>
                            {plan.scripture_reference && (
                              <p className="text-xs text-muted-foreground mt-0.5">📖 {plan.scripture_reference}</p>
                            )}
                            {plan.content && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.content}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
