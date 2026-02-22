import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Package, Plus, Pencil } from 'lucide-react';
import { useState } from 'react';

interface AssetForm {
  name: string;
  asset_type: string;
  description: string;
  status: string;
  condition: string;
  location: string;
  serial_number: string;
  purchase_price: string;
  purchase_date: string;
}

const emptyForm: AssetForm = {
  name: '', asset_type: '', description: '', status: 'available',
  condition: 'good', location: '', serial_number: '', purchase_price: '', purchase_date: '',
};

export default function Assets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AssetForm>(emptyForm);

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        asset_type: form.asset_type,
        description: form.description || null,
        status: form.status,
        condition: form.condition,
        location: form.location || null,
        serial_number: form.serial_number || null,
        purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
        purchase_date: form.purchase_date || null,
      };
      if (editId) {
        const { error } = await supabase.from('assets').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('assets').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editId ? 'Asset updated' : 'Asset created' });
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const openEdit = (asset: any) => {
    setEditId(asset.id);
    setForm({
      name: asset.name, asset_type: asset.asset_type, description: asset.description || '',
      status: asset.status, condition: asset.condition, location: asset.location || '',
      serial_number: asset.serial_number || '',
      purchase_price: asset.purchase_price ? String(asset.purchase_price) : '',
      purchase_date: asset.purchase_date || '',
    });
    setOpen(true);
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setOpen(true); };

  const statusColors: Record<string, string> = {
    available: 'bg-success/10 text-success',
    allocated: 'bg-primary/10 text-primary',
    maintenance: 'bg-warning/10 text-warning',
    disposed: 'bg-muted text-muted-foreground',
    lost: 'bg-destructive/10 text-destructive',
  };

  const set = (key: keyof AssetForm, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Assets" description="Asset registry and management" />
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Asset</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editId ? 'Edit Asset' : 'Register New Asset'}</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); upsertMutation.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div>
                <Label>Type *</Label>
                <Select value={form.asset_type} onValueChange={v => set('asset_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {['Electronics', 'Furniture', 'Musical Instrument', 'Sound Equipment', 'Vehicle', 'Books', 'Other'].map(t => (
                      <SelectItem key={t} value={t.toLowerCase().replace(/ /g, '_')}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['available', 'allocated', 'maintenance', 'disposed', 'lost'].map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={v => set('condition', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['new', 'good', 'fair', 'poor'].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Location</Label><Input value={form.location} onChange={e => set('location', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Serial No.</Label><Input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} /></div>
              <div><Label>Purchase Price (KES)</Label><Input type="number" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} min="0" step="0.01" /></div>
              <div><Label>Purchase Date</Label><Input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={upsertMutation.isPending || !form.name || !form.asset_type}>
              {upsertMutation.isPending ? 'Saving...' : editId ? 'Update Asset' : 'Register Asset'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : assets && assets.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  <th className="text-left p-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Type</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Condition</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Location</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Value</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                </tr></thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="p-4 font-medium">{a.name}</td>
                      <td className="p-4 capitalize">{a.asset_type?.replace(/_/g, ' ')}</td>
                      <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[a.status] || ''}`}>{a.status}</span></td>
                      <td className="p-4 capitalize">{a.condition}</td>
                      <td className="p-4 text-muted-foreground">{a.location || '—'}</td>
                      <td className="p-4 text-right">{a.purchase_price ? `KES ${Number(a.purchase_price).toLocaleString()}` : '—'}</td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(a)}><Pencil className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50"><CardContent className="p-12 text-center"><Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No assets registered.</p><Button onClick={openCreate} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" /> Register First Asset</Button></CardContent></Card>
      )}
    </div>
  );
}
