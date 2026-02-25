import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Edit, Trash2, ArrowLeft, Shield, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface MemberForm {
  user_id: string;
  role_title: string;
  responsibilities: string;
  display_order: number;
  contact_visible: boolean;
}

const emptyMemberForm: MemberForm = {
  user_id: '',
  role_title: 'Member',
  responsibilities: '',
  display_order: 1,
  contact_visible: false,
};

export default function SubcomDetail() {
  const { id } = useParams<{ id: string }>();
  const { hasAnyAdminRole, hasRole } = useAuthStore();
  const canEdit = hasAnyAdminRole() || hasRole('ministry_chairperson') || hasRole('docket_leader');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemberForm>(emptyMemberForm);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: subcom } = useQuery({
    queryKey: ['subcom', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcoms')
        .select('*, ministries(name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['subcom-members', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcom_members')
        .select('*, profiles:user_id(full_name, email, phone)')
        .eq('subcom_id', id!)
        .order('display_order');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles-for-subcom'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('is_active', true)
        .order('full_name')
        .limit(500);
      if (error) throw error;
      return data;
    },
    enabled: canEdit && open,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['subcom-audit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcom_audit_log')
        .select('*')
        .eq('subcom_id', id!)
        .order('performed_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!id && canEdit,
  });

  const upsertMember = useMutation({
    mutationFn: async () => {
      const payload = {
        subcom_id: id!,
        user_id: form.user_id,
        role_title: form.role_title,
        responsibilities: form.responsibilities || null,
        display_order: form.display_order,
        contact_visible: form.contact_visible,
      };
      if (editId) {
        const { error } = await supabase.from('subcom_members').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subcom_members').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcom-members', id] });
      queryClient.invalidateQueries({ queryKey: ['subcom-audit', id] });
      toast({ title: editId ? 'Member updated' : 'Member added' });
      setOpen(false);
      setForm(emptyMemberForm);
      setEditId(null);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('subcom_members').delete().eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcom-members', id] });
      queryClient.invalidateQueries({ queryKey: ['subcom-audit', id] });
      toast({ title: 'Member removed' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const openEditMember = (member: any) => {
    setForm({
      user_id: member.user_id,
      role_title: member.role_title,
      responsibilities: member.responsibilities || '',
      display_order: member.display_order,
      contact_visible: member.contact_visible,
    });
    setEditId(member.id);
    setOpen(true);
  };

  const memberCount = members?.length || 0;
  const availableSlots = Array.from({ length: 7 }, (_, i) => i + 1).filter(
    slot => !members?.some(m => m.display_order === slot)
  );

  const ministryName = (subcom as any)?.ministries?.name || '';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/ministries">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Ministries
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          title={subcom?.name || 'Subcommittee'}
          description={`${ministryName} — ${subcom?.description || 'Subcommittee details'}`}
        />
        {canEdit && memberCount < 7 && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyMemberForm); setEditId(null); } }}>
            <DialogTrigger asChild>
              <Button><UserPlus className="w-4 h-4 mr-1" /> Add Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">{editId ? 'Edit Member' : 'Add Member'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Member</Label>
                  <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                    <SelectContent>
                      {allProfiles?.map(p => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.full_name || p.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Role Title</Label>
                  <Input
                    value={form.role_title}
                    onChange={e => setForm(f => ({ ...f, role_title: e.target.value }))}
                    placeholder="e.g. Secretary, Coordinator"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label>Responsibilities</Label>
                  <Textarea
                    value={form.responsibilities}
                    onChange={e => setForm(f => ({ ...f, responsibilities: e.target.value }))}
                    placeholder="Describe assigned responsibilities"
                    maxLength={500}
                  />
                </div>
                <div>
                  <Label>Position (1–7)</Label>
                  <Select
                    value={String(form.display_order)}
                    onValueChange={v => setForm(f => ({ ...f, display_order: Number(v) }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(editId ? [form.display_order, ...availableSlots] : availableSlots).map(s => (
                        <SelectItem key={s} value={String(s)}>Position {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.contact_visible}
                    onCheckedChange={v => setForm(f => ({ ...f, contact_visible: v }))}
                  />
                  <Label>Show contact info publicly</Label>
                </div>
                <Button
                  onClick={() => upsertMember.mutate()}
                  disabled={!form.user_id || !form.role_title.trim() || upsertMember.isPending}
                  className="w-full"
                >
                  {editId ? 'Update Member' : 'Add Member'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Members count badge */}
      <div className="flex items-center gap-2">
        <Badge variant={memberCount === 7 ? 'default' : 'secondary'}>
          {memberCount}/7 Members
        </Badge>
        {memberCount < 7 && (
          <span className="text-xs text-muted-foreground">{7 - memberCount} slot(s) remaining</span>
        )}
      </div>

      {/* Members Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
            </div>
          ) : members && members.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Responsibilities</TableHead>
                  {canEdit && <TableHead className="w-24">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-mono text-xs">{member.display_order}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{member.profiles?.full_name || 'Unknown'}</p>
                        {member.contact_visible && member.profiles?.email && (
                          <p className="text-xs text-muted-foreground">{member.profiles.email}</p>
                        )}
                        {member.contact_visible && member.profiles?.phone && (
                          <p className="text-xs text-muted-foreground">{member.profiles.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{member.role_title}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {member.responsibilities || '—'}
                    </TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditMember(member)}>
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember.mutate(member.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No members assigned yet.</p>
              {canEdit && <p className="text-xs text-muted-foreground mt-1">Click "Add Member" to assign up to 7 members.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log (admin only) */}
      {canEdit && auditLogs && auditLogs.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Shield className="w-4 h-4" /> Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 text-xs border-b border-border/30 pb-2">
                  <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {format(new Date(log.performed_at), 'MMM d, yyyy h:mm a')}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
