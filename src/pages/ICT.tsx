import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Wifi, Plus, Edit, Video, Radio } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const PLATFORMS = ['youtube', 'facebook', 'zoom', 'other'];
const STATUSES = ['scheduled', 'live', 'completed', 'cancelled'];

interface BroadcastForm {
  title: string;
  platform: string;
  livestream_url: string;
  broadcast_date: string;
  status: string;
  notes: string;
}

const emptyForm: BroadcastForm = { title: '', platform: 'youtube', livestream_url: '', broadcast_date: '', status: 'scheduled', notes: '' };

export default function ICT() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BroadcastForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['broadcast-logs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('broadcast_logs').select('*').order('broadcast_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        broadcast_date: new Date(form.broadcast_date).toISOString(),
        created_by: user?.id,
      };
      if (editId) {
        const { error } = await supabase.from('broadcast_logs').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('broadcast_logs').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-logs'] });
      toast({ title: editId ? 'Broadcast updated' : 'Broadcast logged' });
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const openEdit = (log: any) => {
    setForm({
      title: log.title,
      platform: log.platform,
      livestream_url: log.livestream_url || '',
      broadcast_date: log.broadcast_date?.slice(0, 16) || '',
      status: log.status,
      notes: log.notes || '',
    });
    setEditId(log.id);
    setOpen(true);
  };

  const statusColor: Record<string, string> = {
    scheduled: 'bg-warning/10 text-warning',
    live: 'bg-destructive/10 text-destructive',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="ICT & Media" description="Livestream management and broadcast logs" />
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Log Broadcast</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editId ? 'Edit Broadcast' : 'New Broadcast'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Platform</Label>
                  <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Broadcast Date</Label><Input type="datetime-local" value={form.broadcast_date} onChange={e => setForm(f => ({ ...f, broadcast_date: e.target.value }))} /></div>
              <div><Label>Livestream URL</Label><Input value={form.livestream_url} onChange={e => setForm(f => ({ ...f, livestream_url: e.target.value }))} placeholder="https://..." /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={() => upsert.mutate()} disabled={!form.title || !form.broadcast_date || upsert.isPending} className="w-full">
                {editId ? 'Update' : 'Log Broadcast'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Radio className="w-6 h-6 text-primary" /></div>
            <div><p className="text-2xl font-bold">{logs?.filter(l => l.status === 'live').length || 0}</p><p className="text-sm text-muted-foreground">Live Now</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center"><Video className="w-6 h-6 text-warning" /></div>
            <div><p className="text-2xl font-bold">{logs?.filter(l => l.status === 'scheduled').length || 0}</p><p className="text-sm text-muted-foreground">Scheduled</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center"><Wifi className="w-6 h-6 text-success" /></div>
            <div><p className="text-2xl font-bold">{logs?.length || 0}</p><p className="text-sm text-muted-foreground">Total Broadcasts</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Broadcast Log Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg">Broadcast Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
          ) : logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.title}</TableCell>
                      <TableCell className="capitalize">{log.platform}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(log.broadcast_date), 'MMM d, yyyy h:mm a')}</TableCell>
                      <TableCell><Badge className={statusColor[log.status] || ''} variant="secondary">{log.status}</Badge></TableCell>
                      <TableCell>
                        {log.livestream_url ? <a href={log.livestream_url} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline">Watch</a> : '—'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(log)}><Edit className="w-3.5 h-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8"><Wifi className="w-10 h-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No broadcasts logged yet.</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
