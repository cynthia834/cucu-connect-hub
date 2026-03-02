import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, MapPin, Clock, Plus, Edit, Video } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

const EVENT_TYPES = [
  'general', 'fellowship', 'conference', 'outreach', 'prayer', 'workshop',
  'saturday_service', 'sunday_service',
];

const EVENT_TYPE_LABELS: Record<string, string> = {
  general: 'General',
  fellowship: 'Fellowship',
  conference: 'Conference',
  outreach: 'Outreach',
  prayer: 'Prayer',
  workshop: 'Workshop',
  saturday_service: 'Saturday Service',
  sunday_service: 'Sunday Service',
};

interface EventForm {
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string;
  is_livestreamed: boolean;
  livestream_url: string;
  is_published: boolean;
}

const emptyForm: EventForm = {
  title: '', description: '', event_type: 'general', start_date: '', end_date: '',
  location: '', is_livestreamed: false, livestream_url: '', is_published: false,
};

// Pre-fill defaults for Saturday/Sunday services
const getServiceDefaults = (type: string): Partial<EventForm> => {
  if (type === 'saturday_service') {
    return { title: 'Saturday Service', location: 'Main Hall' };
  }
  if (type === 'sunday_service') {
    return { title: 'Sunday Service', location: 'Main Hall' };
  }
  return {};
};

export default function Events() {
  const { user, hasAnyAdminRole } = useAuthStore();
  const isAdmin = hasAnyAdminRole();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').order('start_date', { ascending: true }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.start_date) throw new Error('Title and start date are required');
      const payload: any = {
        title: form.title,
        description: form.description || null,
        event_type: form.event_type,
        start_date: new Date(form.start_date).toISOString(),
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        location: form.location || null,
        is_livestreamed: form.is_livestreamed,
        livestream_url: form.livestream_url || null,
        is_published: form.is_published,
      };
      if (editId) {
        const { error } = await supabase.from('events').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        payload.created_by = user?.id;
        const { error } = await supabase.from('events').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: editId ? 'Event updated' : 'Event created successfully' });
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const handleTypeChange = (type: string) => {
    const defaults = getServiceDefaults(type);
    setForm(f => ({ ...f, event_type: type, ...defaults }));
  };

  const openEdit = (event: any) => {
    setForm({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      start_date: event.start_date?.slice(0, 16) || '',
      end_date: event.end_date?.slice(0, 16) || '',
      location: event.location || '',
      is_livestreamed: event.is_livestreamed || false,
      livestream_url: event.livestream_url || '',
      is_published: event.is_published,
    });
    setEditId(event.id);
    setOpen(true);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Events" description="Upcoming and past events" />
        {isAdmin && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-1" /> New Event</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">{editId ? 'Edit Event' : 'Create Event'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-4 mt-2">
                <div>
                  <Label>Event Type</Label>
                  <Select value={form.event_type} onValueChange={handleTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Date & Time</Label><Input type="datetime-local" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required /></div>
                  <div><Label>End Date & Time</Label><Input type="datetime-local" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_livestreamed} onCheckedChange={v => setForm(f => ({ ...f, is_livestreamed: v }))} />
                    <Label>Livestream</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                    <Label>Published</Label>
                  </div>
                </div>
                {form.is_livestreamed && (
                  <div><Label>Livestream URL</Label><Input value={form.livestream_url} onChange={e => setForm(f => ({ ...f, livestream_url: e.target.value }))} placeholder="https://youtube.com/..." /></div>
                )}
                <Button type="submit" disabled={!form.title || !form.start_date || upsert.isPending} className="w-full">
                  {upsert.isPending ? 'Saving...' : editId ? 'Update Event' : 'Create Event'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>)}
        </div>
      ) : events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(event => (
            <Card key={event.id} className="border-border/50 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="font-display text-lg">{event.title}</CardTitle>
                  <div className="flex gap-1 items-center">
                    {event.is_livestreamed && <Video className="w-4 h-4 text-primary" />}
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                    </span>
                    {!event.is_published && <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning">Draft</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {event.description && <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(event.start_date), 'MMM d, yyyy h:mm a')}</span>
                  {event.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location}</span>}
                </div>
                {event.livestream_url && (
                  <a href={event.livestream_url} target="_blank" rel="noreferrer" className="text-primary text-sm hover:underline flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> Watch Livestream
                  </a>
                )}
                {isAdmin && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => openEdit(event)}>
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No events found.</p>
            {isAdmin && (
              <Button onClick={() => setOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create Your First Event
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
