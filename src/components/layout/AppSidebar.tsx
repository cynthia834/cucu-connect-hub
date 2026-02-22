import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, BookOpen, Users, Heart, HandCoins,
  DollarSign, Package, Globe, Wifi, MessageSquare, FileText,
  ChevronDown, LogOut, Shield, Settings, Church, Megaphone
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Events', path: '/events', icon: Calendar },
  { label: 'Ministries', path: '/ministries', icon: Church },
  { label: 'Programs', path: '/programs', icon: BookOpen },
  { label: 'Service Updates', path: '/service-updates', icon: Megaphone },
  { label: 'Testimonies', path: '/testimonies', icon: MessageSquare },
  { label: 'Prayer Requests', path: '/prayer-requests', icon: Heart },
  { label: 'Giving', path: '/giving', icon: HandCoins },
  { label: 'Welfare', path: '/welfare', icon: Users },
  { label: 'Missions', path: '/missions', icon: Globe },
  { label: 'Finance', path: '/finance', icon: DollarSign, roles: ['super_admin', 'cu_chairperson', 'finance_leader', 'finance_subcommittee'] },
  { label: 'Assets', path: '/assets', icon: Package, roles: ['super_admin', 'cu_chairperson', 'assets_leader', 'assets_subcommittee'] },
  { label: 'ICT & Media', path: '/ict', icon: Wifi, roles: ['super_admin', 'cu_chairperson', 'ict_leader'] },
  { label: 'Reports', path: '/reports', icon: FileText, roles: ['super_admin', 'cu_chairperson'] },
  { label: 'Admin', path: '/admin', icon: Shield, roles: ['super_admin', 'cu_chairperson'] },
];

export default function AppSidebar() {
  const { profile, roles, signOut } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(r => roles.includes(r as any));
  });

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground flex flex-col z-50 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary-foreground font-display font-bold text-lg">CU</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-display font-bold text-sm text-sidebar-foreground leading-tight">Chuka University</h1>
              <p className="text-xs text-sidebar-primary">Christian Union</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary-foreground text-xs font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'Member'}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{roles[0]?.replace(/_/g, ' ') || 'member'}</p>
            </div>
          )}
          <button onClick={signOut} className="p-1.5 rounded hover:bg-sidebar-accent" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
