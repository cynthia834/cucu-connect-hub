import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Eye, Settings, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface SubcomSectionProps {
  ministryId: string;
  ministryName: string;
}

interface SubcomForm {
  name: string;
  description: string;
}

export default function SubcomSection({ ministryId, ministryName }: SubcomSectionProps) {
  const { hasAnyAdminRole, hasRole } = useAuthStore();
  const canEdit = hasAnyAdminRole() || hasRole('ministry_chairperson') || hasRole('docket_leader');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SubcomForm>({ name: '', description: '' });

  const { data: subcoms, isLoading } = useQuery({
    queryKey: ['subcoms', ministryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcoms')
        .select('*')
        .eq('ministry_id', ministryId)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: memberCounts } = useQuery({
    queryKey: ['subcom-member-counts', ministryId],
    queryFn: async () => {
      if (!subcoms?.length) return {};
      const { data, error } = await supabase
        .from('subcom_members')
        .select('subcom_id')
        .in('subcom_id', subcoms.map(s => s.id));
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach(m => { counts[m.subcom_id] = (counts[m.subcom_id] || 0) + 1; });
      return counts;
    },
    enabled: !!subcoms?.length,
  });

  const createSubcom = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('subcoms').insert({
        ministry_id: ministryId,
        name: form.name,
        description: form.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcoms', ministryId] });
      toast({ title: 'Subcom created' });
      setOpen(false);
      setForm({ name: '', description: '' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Subcommittees
        </h4>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create Subcom — {ministryName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Intercessory Subcom"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of responsibilities"
                    maxLength={500}
                  />
                </div>
                <Button
                  onClick={() => createSubcom.mutate()}
                  disabled={!form.name.trim() || createSubcom.isPending}
                  className="w-full"
                >
                  Create Subcom
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {subcoms && subcoms.length > 0 ? (
        <div className="space-y-2">
          {subcoms.map(subcom => {
            const count = memberCounts?.[subcom.id] || 0;
            return (
              <Link
                key={subcom.id}
                to={`/subcoms/${subcom.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{subcom.name}</p>
                    {subcom.description && (
                      <p className="text-xs text-muted-foreground truncate">{subcom.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={count === 7 ? 'default' : 'secondary'} className="text-xs">
                    {count}/7
                  </Badge>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">No subcommittees yet.</p>
      )}
    </div>
  );
}
