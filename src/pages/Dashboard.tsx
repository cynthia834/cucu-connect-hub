import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BookOpen, Heart, HandCoins, Users, Globe, MessageSquare, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Upcoming Events', path: '/events', icon: Calendar, color: 'bg-primary' },
  { label: 'My Programs', path: '/programs', icon: BookOpen, color: 'bg-secondary' },
  { label: 'Give', path: '/giving', icon: HandCoins, color: 'bg-gold' },
  { label: 'Prayer Requests', path: '/prayer-requests', icon: Heart, color: 'bg-destructive' },
  { label: 'Testimonies', path: '/testimonies', icon: MessageSquare, color: 'bg-success' },
  { label: 'Missions', path: '/missions', icon: Globe, color: 'bg-warning' },
];

export default function Dashboard() {
  const { profile, roles } = useAuthStore();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Welcome, {profile?.full_name || 'Member'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Role badges */}
      <div className="flex flex-wrap gap-2">
        {roles.map(role => (
          <span
            key={role}
            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize"
          >
            {role.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map(link => {
          const Icon = link.icon;
          return (
            <Link key={link.path} to={link.path}>
              <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border-border/50">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`w-12 h-12 rounded-xl ${link.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{link.label}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-xl">My Profile</CardTitle>
            <CardDescription>Your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Email</span>
              <span className="text-sm font-medium">{profile?.email || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Student ID</span>
              <span className="text-sm font-medium">{profile?.student_id || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Department</span>
              <span className="text-sm font-medium">{profile?.department || '—'}</span>
            </div>
            <Link to="/profile" className="text-sm text-primary hover:underline inline-block mt-2">
              Edit Profile →
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-xl">Announcements</CardTitle>
            <CardDescription>Latest service updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No recent announcements.</p>
            <Link to="/service-updates" className="text-sm text-primary hover:underline inline-block mt-2">
              View All →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
