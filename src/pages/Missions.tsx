import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';
import { Globe, Target, Users, DollarSign, Plus, Edit, UserPlus, FileText, MapPin, Calendar } from 'lucide-react';

const TEAM_ROLES = ['team_leader', 'prayer_lead', 'logistics', 'media_volunteer', 'volunteer'];
const MISSION_TYPES = ['campus', 'community', 'regional'];
const STATUSES = ['planning', 'active', 'completed', 'cancelled'];

export default function Missions() {
  const { user, hasRole, hasAnyAdminRole } = useAuthStore();
  const queryClient = useQueryClient();
  const canManage = hasRole('missions_leader') || hasAnyAdminRole();

  const [showForm, setShowForm] = useState(false);
  const [editingMission, setEditingMission] = useState<any>(null);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Form state
  const [form, setForm] = useState({ title: '', description: '', location: '', mission_type: 'campus', target_group: '', target_souls: 0, target_amount: 0, start_date: '', end_date: '', status: 'planning' });
  const [reportForm, setReportForm] = useState({ souls_reached: 0, salvations: 0, followups: '', challenges: '', testimonies: '' });
  const [assignRole, setAssignRole] = useState('volunteer');
  const [assignUserId, setAssignUserId] = useState('');

  const { data: missions, isLoading } = useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: teamMembers } = useQuery({
    queryKey: ['mission-team', selectedMission],
    enabled: !!selectedMission,
    queryFn: async () => {
      const { data, error } = await supabase.from('mission_team_members').select('*').eq('mission_id', selectedMission!);
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, full_name, email');
      if (error) throw error;
      return data;
    },
  });

  const { data: reports } = useQuery({
    queryKey: ['mission-reports', selectedMission],
    enabled: !!selectedMission,
    queryFn: async () => {
      const { data, error } = await supabase.from('mission_reports').select('*').eq('mission_id', selectedMission!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myTeams } = useQuery({
    queryKey: ['my-mission-teams', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('mission_team_members').select('mission_id').eq('user_id', user!.id);
      if (error) throw error;
      return data?.map(t => t.mission_id) || [];
    },
  });

  const saveMission = useMutation({
    mutationFn: async (values: typeof form) => {
      if (editingMission) {
        const { error } = await supabase.from('missions').update({ ...values, target_souls: values.target_souls, target_amount: values.target_amount }).eq('id', editingMission.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('missions').insert({ ...values, led_by: user?.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast({ title: editingMission ? 'Mission updated' : 'Mission created' });
      setShowForm(false);
      setEditingMission(null);
      resetForm();
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const volunteerSignUp = useMutation({
    mutationFn: async (missionId: string) => {
      const { error } = await supabase.from('mission_team_members').insert({ mission_id: missionId, user_id: user!.id, team_role: 'volunteer' } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-team'] });
      queryClient.invalidateQueries({ queryKey: ['my-mission-teams'] });
      toast({ title: 'Signed up as volunteer!' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const assignTeamMember = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('mission_team_members').upsert({ mission_id: selectedMission!, user_id: assignUserId, team_role: assignRole } as any, { onConflict: 'mission_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-team'] });
      toast({ title: 'Team member assigned' });
      setAssignUserId('');
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const removeTeamMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mission_team_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-team'] });
      queryClient.invalidateQueries({ queryKey: ['my-mission-teams'] });
      toast({ title: 'Member removed' });
    },
  });

  const submitReport = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('mission_reports').insert({ ...reportForm, mission_id: selectedMission!, submitted_by: user!.id } as any);
      if (error) throw error;
      // Update mission souls_reached
      const { error: e2 } = await supabase.from('missions').update({ souls_reached: reportForm.souls_reached, raised_amount: missions?.find(m => m.id === selectedMission)?.raised_amount } as any).eq('id', selectedMission!);
      if (e2) throw e2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-reports'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast({ title: 'Report submitted' });
      setShowReportDialog(false);
      setReportForm({ souls_reached: 0, salvations: 0, followups: '', challenges: '', testimonies: '' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const resetForm = () => setForm({ title: '', description: '', location: '', mission_type: 'campus', target_group: '', target_souls: 0, target_amount: 0, start_date: '', end_date: '', status: 'planning' });

  const openEdit = (m: any) => {
    setEditingMission(m);
    setForm({ title: m.title, description: m.description || '', location: m.location || '', mission_type: m.mission_type || 'campus', target_group: m.target_group || '', target_souls: m.target_souls || 0, target_amount: m.target_amount || 0, start_date: m.start_date || '', end_date: m.end_date || '', status: m.status });
    setShowForm(true);
  };

  const getProfileName = (userId: string) => profiles?.find(p => p.user_id === userId)?.full_name || 'Unknown';

  const statusColors: Record<string, string> = {
    planning: 'bg-warning/10 text-warning',
    active: 'bg-success/10 text-success',
    completed: 'bg-primary/10 text-primary',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Missions & Evangelism"
        description="Team roles, outreach logs & mission management"
        action={canManage ? (
          <Button onClick={() => { resetForm(); setEditingMission(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Mission
          </Button>
        ) : undefined}
      />

      <Tabs defaultValue="missions" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="drive">Mission Drive</TabsTrigger>
          {selectedMission && <TabsTrigger value="team">Team</TabsTrigger>}
          {selectedMission && <TabsTrigger value="reports">Reports</TabsTrigger>}
          <TabsTrigger value="roles">Roles Guide</TabsTrigger>
        </TabsList>

        {/* MISSIONS LIST / CRUD */}
        <TabsContent value="missions" className="space-y-6">
          {/* Create/Edit Form */}
          {showForm && canManage && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-display text-lg">{editingMission ? 'Edit Mission' : 'Create Mission'}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-muted-foreground">Title *</label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium text-muted-foreground">Location</label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium text-muted-foreground">Type</label>
                    <Select value={form.mission_type} onValueChange={v => setForm(f => ({ ...f, mission_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{MISSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-sm font-medium text-muted-foreground">Target Group</label><Input value={form.target_group} onChange={e => setForm(f => ({ ...f, target_group: e.target.value }))} placeholder="e.g. Students, Community" /></div>
                  <div><label className="text-sm font-medium text-muted-foreground">Target Souls</label><Input type="number" value={form.target_souls} onChange={e => setForm(f => ({ ...f, target_souls: Number(e.target.value) }))} /></div>
                  <div><label className="text-sm font-medium text-muted-foreground">Target Amount (KES)</label><Input type="number" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: Number(e.target.value) }))} /></div>
                  <div><label className="text-sm font-medium text-muted-foreground">Start Date</label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium text-muted-foreground">End Date</label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
                  <div><label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2"><label className="text-sm font-medium text-muted-foreground">Description</label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => saveMission.mutate(form)} disabled={!form.title || saveMission.isPending}>{editingMission ? 'Update' : 'Create'}</Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setEditingMission(null); }}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Missions Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2].map(i => <Card key={i} className="border-border/50"><CardContent className="p-6"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>)}</div>
          ) : missions && missions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {missions.map(m => {
                const fundProgress = m.target_amount ? (Number(m.raised_amount) / Number(m.target_amount)) * 100 : 0;
                const soulsProgress = m.target_souls ? ((m.souls_reached || 0) / m.target_souls) * 100 : 0;
                const isVolunteered = myTeams?.includes(m.id);
                return (
                  <Card key={m.id} className={`border-border/50 hover:shadow-md transition-shadow cursor-pointer ${selectedMission === m.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedMission(m.id)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="font-display text-lg">{m.title}</CardTitle>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">{(m as any).mission_type || 'campus'}</Badge>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[m.status] || ''}`}>{m.status}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {canManage && <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(m); }}><Edit className="w-4 h-4" /></Button>}
                        </div>
                      </div>
                      <CardDescription>{m.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2"><Target className="w-4 h-4 text-muted-foreground" /><span>Souls: {m.souls_reached}/{m.target_souls}</span></div>
                        <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /><span>KES {Number(m.raised_amount).toLocaleString()}/{Number(m.target_amount).toLocaleString()}</span></div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground"><span>Fundraising</span><span>{fundProgress.toFixed(0)}%</span></div>
                        <Progress value={fundProgress} className="h-2" />
                      </div>
                      {m.location && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {m.location}</p>}
                      {(m as any).target_group && <p className="text-sm text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {(m as any).target_group}</p>}
                      {m.start_date && <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.start_date}{m.end_date ? ` — ${m.end_date}` : ''}</p>}
                      {m.status === 'planning' || m.status === 'active' ? (
                        <Button size="sm" variant={isVolunteered ? 'secondary' : 'default'} disabled={isVolunteered || volunteerSignUp.isPending} onClick={e => { e.stopPropagation(); volunteerSignUp.mutate(m.id); }}>
                          <UserPlus className="w-4 h-4 mr-1" /> {isVolunteered ? 'Signed Up' : 'Volunteer'}
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-border/50"><CardContent className="p-12 text-center"><Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No missions found.</p></CardContent></Card>
          )}
        </TabsContent>

        {/* MISSION DRIVE — fundraising progress */}
        <TabsContent value="drive" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="font-display text-lg">Upcoming Mission Drives</CardTitle><CardDescription>Public fundraising progress for upcoming missions</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              {missions?.filter(m => m.status === 'planning' || m.status === 'active').map(m => {
                const pct = m.target_amount ? (Number(m.raised_amount) / Number(m.target_amount)) * 100 : 0;
                return (
                  <div key={m.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{m.title}</h4>
                        <p className="text-xs text-muted-foreground">{m.location}{m.start_date ? ` • ${m.start_date}` : ''}</p>
                      </div>
                      <span className="text-sm font-medium">KES {Number(m.raised_amount).toLocaleString()} / {Number(m.target_amount).toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-3" />
                    <p className="text-xs text-muted-foreground text-right">{pct.toFixed(1)}% raised</p>
                  </div>
                );
              })}
              {!missions?.some(m => m.status === 'planning' || m.status === 'active') && (
                <p className="text-center text-muted-foreground py-6">No active mission drives at the moment.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team" className="space-y-4">
          {selectedMission ? (
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Mission Team</CardTitle>
                  {canManage && (
                    <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Assign Member</Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Assign Team Member</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Member</label>
                            <Select value={assignUserId} onValueChange={setAssignUserId}>
                              <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                              <SelectContent>{profiles?.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Role</label>
                            <Select value={assignRole} onValueChange={setAssignRole}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{TEAM_ROLES.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <Button onClick={() => { assignTeamMember.mutate(); setShowTeamDialog(false); }} disabled={!assignUserId}>Assign</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {teamMembers && teamMembers.length > 0 ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead>{canManage && <TableHead>Actions</TableHead>}</TableRow></TableHeader>
                    <TableBody>
                      {teamMembers.map(tm => (
                        <TableRow key={tm.id}>
                          <TableCell className="font-medium">{getProfileName(tm.user_id)}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize text-xs">{tm.team_role.replace(/_/g, ' ')}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(tm.joined_at).toLocaleDateString()}</TableCell>
                          {canManage && <TableCell><Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => removeTeamMember.mutate(tm.id)}>Remove</Button></TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <p className="text-muted-foreground text-center py-6">No team members assigned yet.</p>}
              </CardContent>
            </Card>
          ) : <p className="text-muted-foreground text-center py-6">Select a mission first to view its team.</p>}
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4">
          {selectedMission ? (
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Post-Mission Reports</CardTitle>
                  {canManage && (
                    <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                      <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Submit Report</Button></DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>Post-Mission Report</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium text-muted-foreground">Souls Reached</label><Input type="number" value={reportForm.souls_reached} onChange={e => setReportForm(f => ({ ...f, souls_reached: Number(e.target.value) }))} /></div>
                            <div><label className="text-sm font-medium text-muted-foreground">Salvations</label><Input type="number" value={reportForm.salvations} onChange={e => setReportForm(f => ({ ...f, salvations: Number(e.target.value) }))} /></div>
                          </div>
                          <div><label className="text-sm font-medium text-muted-foreground">Follow-ups</label><Textarea value={reportForm.followups} onChange={e => setReportForm(f => ({ ...f, followups: e.target.value }))} /></div>
                          <div><label className="text-sm font-medium text-muted-foreground">Challenges</label><Textarea value={reportForm.challenges} onChange={e => setReportForm(f => ({ ...f, challenges: e.target.value }))} /></div>
                          <div><label className="text-sm font-medium text-muted-foreground">Testimonies</label><Textarea value={reportForm.testimonies} onChange={e => setReportForm(f => ({ ...f, testimonies: e.target.value }))} /></div>
                          <Button onClick={() => submitReport.mutate()} disabled={submitReport.isPending}>Submit Report</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {reports && reports.length > 0 ? reports.map(r => (
                  <Card key={r.id} className="border-border/30">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Submitted by {getProfileName(r.submitted_by)} on {new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><strong>Souls Reached:</strong> {r.souls_reached}</div>
                        <div><strong>Salvations:</strong> {r.salvations}</div>
                      </div>
                      {r.followups && <div className="text-sm"><strong>Follow-ups:</strong> {r.followups}</div>}
                      {r.challenges && <div className="text-sm"><strong>Challenges:</strong> {r.challenges}</div>}
                      {r.testimonies && <div className="text-sm"><strong>Testimonies:</strong> {r.testimonies}</div>}
                    </CardContent>
                  </Card>
                )) : <p className="text-muted-foreground text-center py-6">No reports submitted yet.</p>}
              </CardContent>
            </Card>
          ) : <p className="text-muted-foreground text-center py-6">Select a mission first to view reports.</p>}
        </TabsContent>

        {/* ROLES GUIDE */}
        <TabsContent value="roles">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Mission Team Roles & Responsibilities</CardTitle>
              <CardDescription>Each mission can have the following team roles assigned</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Role</TableHead><TableHead>Responsibilities</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[
                    ['Missions & Evangelism Leader (Chairperson)', 'Create missions, assign all team roles, publish reports, manage funds'],
                    ['Missions Docket Leader', 'CRUD on missions page, coordinate team logistics, upload media'],
                    ['Team Leader (per mission)', 'Lead the mission team, submit post-mission report'],
                    ['Prayer Lead (per mission)', 'Coordinate pre and during-mission intercession, submit prayer log'],
                    ['Logistics Coordinator (per mission)', 'Manage transport, materials; log costs for Finance Docket'],
                    ['Media Volunteer (per mission)', 'Capture photos/video, upload to mission media gallery'],
                    ['General Member Volunteer', 'Sign up, attend, appear in attendance log for the mission'],
                  ].map(([role, resp]) => (
                    <TableRow key={role}><TableCell className="font-medium">{role}</TableCell><TableCell className="text-muted-foreground">{resp}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
