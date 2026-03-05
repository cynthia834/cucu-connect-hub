import { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Download, Lock, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/shared/PageHeader';

interface CertificateItem {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in_progress' | 'not_started';
  progress: number;
  threshold: number;
}

export default function Certificates() {
  const { user, profile } = useAuthStore();

  const { data: enrollments } = useQuery({
    queryKey: ['cert-enrollments', user?.id],
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

  // Build certificate list
  const certificates: CertificateItem[] = [];

  // CU Membership certificate - available to all
  certificates.push({
    id: 'cu-membership',
    name: 'CU Membership Certificate',
    description: 'Official certificate of membership in the Christian Union.',
    status: 'completed',
    progress: 100,
    threshold: 100,
  });

  // Program-specific certificates
  enrollments?.forEach(e => {
    const program = e.programs as any;
    const progress = Number(e.progress);
    const threshold = Number(program?.completion_threshold || 90);
    const status = progress >= threshold ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';
    certificates.push({
      id: e.id,
      name: `${program?.name} Certificate`,
      description: program?.description || 'Complete this program to earn your certificate.',
      status,
      progress,
      threshold,
    });
  });

  const [activeTab, setActiveTab] = useState('all');
  const filtered = activeTab === 'all' ? certificates : certificates.filter(c => c.status === activeTab);

  const handleDownload = (cert: CertificateItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>${cert.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500&display=swap');
        body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f8f9fa; }
        .cert { width: 800px; padding: 60px; border: 3px solid #b8860b; background: white; text-align: center; position: relative; }
        .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid #d4a843; pointer-events: none; }
        h1 { font-family: 'Playfair Display', serif; font-size: 36px; color: #1a1a2e; margin: 0 0 8px; }
        h2 { font-family: 'Playfair Display', serif; font-size: 22px; color: #b8860b; margin: 0 0 30px; }
        .name { font-family: 'Playfair Display', serif; font-size: 28px; color: #1a1a2e; border-bottom: 2px solid #b8860b; display: inline-block; padding: 0 40px 4px; margin: 20px 0; }
        p { font-family: 'Inter', sans-serif; color: #555; font-size: 14px; margin: 8px 0; }
        .date { margin-top: 30px; font-style: italic; }
      </style></head>
      <body>
        <div class="cert">
          <h2>CUCU Portal</h2>
          <h1>Certificate of Achievement</h1>
          <p>This is to certify that</p>
          <div class="name">${profile?.full_name || 'Member'}</div>
          <p>has successfully earned the</p>
          <p style="font-size:18px;font-weight:600;color:#1a1a2e;">${cert.name}</p>
          <p class="date">Issued on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const statusConfig = {
    completed: { label: 'Completed', variant: 'default' as const, icon: CheckCircle2 },
    in_progress: { label: 'In Progress', variant: 'secondary' as const, icon: Award },
    not_started: { label: 'Locked', variant: 'outline' as const, icon: Lock },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Member Certifications" description="View and download certificates for completed programs and activities." />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Certificates</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="not_started">Not Started</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filtered.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No certificates in this category.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(cert => {
                const config = statusConfig[cert.status];
                const Icon = config.icon;
                return (
                  <Card key={cert.id} className="border-border/50 overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm">{cert.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cert.description}</p>
                      {cert.status !== 'completed' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{cert.progress.toFixed(0)}% / {cert.threshold}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${cert.progress}%` }} />
                          </div>
                        </div>
                      )}
                      {cert.status === 'completed' && (
                        <Button size="sm" className="w-full mt-3 gap-1.5" onClick={() => handleDownload(cert)}>
                          <Download className="w-3.5 h-3.5" /> Download Certificate
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
