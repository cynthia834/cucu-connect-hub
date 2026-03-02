import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { Upload, User } from 'lucide-react';

export default function Profile() {
  const { profile, fetchProfile, user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch joined ministries
  const { data: myMinistries } = useQuery({
    queryKey: ['my-ministries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('ministry_members')
        .select('ministry_id, ministries(name)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
  const [form, setForm] = useState({
    full_name: '', phone: '', bio: '', student_id: '', department: '', year_of_study: '', year_joined_cu: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        student_id: profile.student_id || '',
        department: profile.department || '',
        year_of_study: profile.year_of_study?.toString() || '',
        year_joined_cu: (profile as any).year_joined_cu?.toString() || '',
      });
    }
  }, [profile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.user_id) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB', variant: 'destructive' });
      return;
    }
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.user_id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', profile.user_id);
      if (error) throw error;
      await fetchProfile();
      toast({ title: 'Avatar updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone || null,
          bio: form.bio || null,
          student_id: form.student_id || null,
          department: form.department || null,
          year_of_study: form.year_of_study ? parseInt(form.year_of_study) : null,
          year_joined_cu: form.year_joined_cu ? parseInt(form.year_joined_cu) : null,
        } as any)
        .eq('user_id', profile?.user_id);
      if (error) throw error;
      await fetchProfile();
      toast({ title: 'Profile updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Profile" description="Manage your personal information" />
      <Card className="border-border/50 max-w-2xl">
        <CardHeader><CardTitle className="font-display text-lg">Personal Information</CardTitle></CardHeader>
        <CardContent>
          {/* Avatar upload */}
          <div className="flex flex-col items-center mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-border">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="mt-2 text-xs text-gold flex items-center gap-1 hover:underline disabled:opacity-50"
            >
              <Upload className="w-3 h-3" /> {avatarUploading ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required maxLength={100} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} maxLength={20} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Student ID</Label><Input value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} maxLength={20} /></div>
              <div><Label>Year of Study</Label><Input type="number" value={form.year_of_study} onChange={e => setForm({...form, year_of_study: e.target.value})} min={1} max={6} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({...form, department: e.target.value})} maxLength={100} /></div>
              <div><Label>Year Joined CU</Label><Input type="number" value={form.year_joined_cu} onChange={e => setForm({...form, year_joined_cu: e.target.value})} min={2000} max={new Date().getFullYear()} /></div>
            </div>
            <div><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} maxLength={500} rows={3} /></div>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Joined Ministries */}
      {myMinistries && myMinistries.length > 0 && (
        <Card className="border-border/50 max-w-2xl mt-6">
          <CardHeader><CardTitle className="font-display text-lg">My Ministries</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {myMinistries.map((m: any) => (
                <Badge key={m.ministry_id} variant="secondary" className="text-sm px-3 py-1">
                  {m.ministries?.name || 'Ministry'}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
