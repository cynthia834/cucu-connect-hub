import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Upload, User } from 'lucide-react';
import cucuLogo from '@/assets/cucu-logo.png';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [yearJoinedCU, setYearJoinedCU] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 2MB', variant: 'destructive' });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return;
    const ext = avatarFile.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', userId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const fullName = [firstName, secondName, lastName].filter(Boolean).join(' ');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              student_id: regNumber,
              year_of_study: yearOfStudy ? parseInt(yearOfStudy) : null,
              year_joined_cu: yearJoinedCU ? parseInt(yearJoinedCU) : null,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.user && avatarFile) {
          try { await uploadAvatar(data.user.id); } catch {}
        }
        toast({
          title: 'Account created',
          description: 'Please check your email to verify your account.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[420px] bg-hero-gradient items-center justify-center p-12 flex-shrink-0">
        <div className="max-w-xs text-center">
          <img src={cucuLogo} alt="CUCU Logo" className="w-20 h-20 rounded-2xl mx-auto mb-8 object-cover" />
          <h1 className="font-display text-3xl font-bold text-primary-foreground mb-4">
            CUCU Portal
          </h1>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Digital Governance Platform — Empowering faith, leadership, and community through structured institutional management.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        {isLogin ? (
          /* Login form - compact */
          <Card className="w-full max-w-md border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <img src={cucuLogo} alt="CUCU Logo" className="lg:hidden w-14 h-14 rounded-xl mx-auto mb-4 object-cover" />
              <CardTitle className="font-display text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your CUCU portal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Please wait...' : 'Sign In'}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={async () => {
                    if (!email) {
                      toast({ title: 'Enter your email first', description: 'Type your email address above, then click Forgot Password.', variant: 'destructive' });
                      return;
                    }
                    setLoading(true);
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) throw error;
                      toast({ title: 'Reset link sent', description: 'Check your email for a password reset link.' });
                    } catch (err: any) {
                      toast({ title: 'Error', description: err.message, variant: 'destructive' });
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="mt-2 text-center">
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Don't have an account? Sign up
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Registration form - Figma style */
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <img src={cucuLogo} alt="CUCU Logo" className="lg:hidden w-14 h-14 rounded-xl mx-auto mb-4 object-cover" />
              <h1 className="font-display text-3xl font-bold text-foreground">Registration</h1>
              <p className="text-muted-foreground mt-2">
                Join the CUCU community. Complete the form below to get started.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Photo */}
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center py-8">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-3 overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-sm">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">Optional - Upload a clear photo of yourself</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs text-gold flex items-center gap-1 hover:underline">
                    <Upload className="w-3 h-3" /> Click to upload
                  </button>
                </CardContent>
              </Card>

              {/* Personal Details */}
              <div>
                <h2 className="text-xs font-bold tracking-widest uppercase text-gold mb-4">Personal Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondName">Second Name</Label>
                    <Input
                      id="secondName"
                      value={secondName}
                      onChange={e => setSecondName(e.target.value)}
                      placeholder="Quincy"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h2 className="text-xs font-bold tracking-widest uppercase text-gold mb-4">Academic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">Registration Number</Label>
                    <Input
                      id="regNumber"
                      value={regNumber}
                      onChange={e => setRegNumber(e.target.value)}
                      placeholder="CUCU/2024/00001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearOfStudy">Year of Study</Label>
                    <Select value={yearOfStudy} onValueChange={setYearOfStudy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1st Year</SelectItem>
                        <SelectItem value="2">2nd Year</SelectItem>
                        <SelectItem value="3">3rd Year</SelectItem>
                        <SelectItem value="4">4th Year</SelectItem>
                        <SelectItem value="5">5th Year</SelectItem>
                        <SelectItem value="6">6th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* CU Information */}
              <div>
                <h2 className="text-xs font-bold tracking-widest uppercase text-gold mb-4">CU Information</h2>
                <div className="space-y-2">
                  <Label htmlFor="yearJoinedCU">Year Joined CU *</Label>
                  <Select value={yearJoinedCU} onValueChange={setYearJoinedCU}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Account Credentials */}
              <div>
                <h2 className="text-xs font-bold tracking-widest uppercase text-gold mb-4">Account Credentials</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="regEmail">Email</Label>
                    <Input
                      id="regEmail"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password</Label>
                    <div className="relative">
                      <Input
                        id="regPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading || !yearJoinedCU}>
                {loading ? 'Please wait...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
