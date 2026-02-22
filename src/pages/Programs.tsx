import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function Programs() {
  const { user } = useAuthStore();
  
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
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Number(enrollment.progress).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${enrollment.progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">Completion threshold: {Number(p.completion_threshold)}%</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Contact your Docket Leader to enroll.</p>
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
