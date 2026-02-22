import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Megaphone, Plus, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const UPDATE_TYPES = ['announcement', 'sermon', 'devotional', 'newsletter'];

interface UpdateForm {
  title: string;
  content: string;
  update_type: string;
  is_published: boolean;
}

const emptyForm: UpdateForm = { title: '', content: '', update_type: 'announcement', is_published: false };

export default function ServiceUpdates() {
  const { user, hasAnyAdminRole, hasRole } = useAuthStore();
  const canEdit = hasAnyAdminRole() || hasRole('content_moderator');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UpdateForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: updates, isLoading } = useQuery({
    queryKey: ['service-updates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('service_updates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        author_id: user?.id,
        published_at: form.is_published ? new Date().toISOString() : null,
      };
      if (editId) {
        const { error } = await supabase.from('service_updates').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('service_updates').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-updates'] });
      toast({ title: editId ? 'Update saved' : 'Update created' });
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const openEdit = (u: any) => {
    setForm({ title: u.title, content: u.content, update_type: u.update_type, is_published: u.is_published });
    setEditId(u.id);
    setOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Service Updates" description="Announcements, sermons, and devotionals" />
        {canEdit && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-1" /> New Update</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display">{editId ? 'Edit Update' : 'Create Update'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><Label>Content</Label><Textarea rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} /></div>
                <div><Label>Type</Label>
                  <Select value={form.update_type} onValueChange={v => setForm(f => ({ ...f, update_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UPDATE_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                  <Label>Publish immediately</Label>
                </div>
                <Button onClick={() => upsert.mutate()} disabled={!form.title || !form.content || upsert.isPending} className="w-full">
                  {editId ? 'Save Changes' : 'Create Update'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-16 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
      ) : updates && updates.length > 0 ? (
        <div className="space-y-4">
          {updates.map(u => (
            <Card key={u.id} className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg">{u.title}</CardTitle>
                  <div className="flex gap-1.5 items-center">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">{u.update_type}</span>
                    {!u.is_published && <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">Draft</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-line">{u.content}</p>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-muted-foreground">{format(new Date(u.created_at), 'MMM d, yyyy')}</p>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No service updates.</p></CardContent></Card>
      )}
    </div>
  );
}
