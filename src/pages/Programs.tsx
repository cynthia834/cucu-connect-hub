import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

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
    <div className="animate-fade-in">
      <PageHeader title="Programs" description="Spiritual growth programs — CBR, Bible Study, Faith Foundation, BEST-P" />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      ) : programs && programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map(p => {
            const isEnrolled = enrolledProgramIds.has(p.id);
            const enrollment = enrollments?.find(e => e.program_id === p.id);
            return (
              <Card key={p.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-display text-xl">{p.name}</CardTitle>
                    {isEnrolled && <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">Enrolled</span>}
                  </div>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEnrolled && enrollment ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" /> Progress
                        </span>
                        <Badge variant={Number(enrollment.progress) >= Number(p.completion_threshold) ? 'default' : 'secondary'}>
                          {Number(enrollment.progress).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-primary"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Threshold: {Number(p.completion_threshold)}%</span>
                        {Number(enrollment.progress) >= Number(p.completion_threshold) && (
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </span>
                        )}
                      </div>
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
        <Card className="border-border/50"><CardContent className="p-12 text-center"><BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No programs available.</p></CardContent></Card>
      )}
    </div>
  );
}
