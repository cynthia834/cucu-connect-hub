import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const adminSections = [
    { title: 'User Management', description: 'Manage users and assign roles', icon: Users, path: '/admin/users' },
    { title: 'System Settings', description: 'Configure platform settings', icon: Settings, path: '/admin/settings' },
    { title: 'Role Management', description: 'Manage roles and permissions', icon: Shield, path: '/admin/roles' },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Administration" description="Platform administration and management" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminSections.map(section => {
          const Icon = section.icon;
          return (
            <Card key={section.path} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="font-display text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{section.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
