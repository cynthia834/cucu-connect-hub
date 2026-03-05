import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, BookOpen, Users, Heart, HandCoins,
  DollarSign, Package, Globe, Wifi, MessageSquare, FileText,
  LogOut, Shield, Church, Megaphone, Settings, Award, LifeBuoy, BookMarked
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import cucuLogo from '@/assets/cucu-logo.png';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Ministry', path: '/ministries', icon: Church },
  { label: 'Events', path: '/events', icon: Calendar },
  { label: 'Programs', path: '/programs', icon: BookOpen },
  { label: 'Giving', path: '/giving', icon: HandCoins },
  { label: 'Testimonies', path: '/testimonies', icon: MessageSquare },
  { label: 'Prayer Requests', path: '/prayer-requests', icon: Heart },
  { label: 'Welfare', path: '/welfare', icon: Users },
  { label: 'Missions', path: '/missions', icon: Globe },
  { label: 'Service Updates', path: '/service-updates', icon: Megaphone },
  { label: 'CBR Reading', path: '/cbr-reading', icon: BookMarked },
  { label: 'Certificates', path: '/certificates', icon: Award },
  { label: 'Finance', path: '/finance', icon: DollarSign, roles: ['super_admin', 'cu_chairperson', 'finance_leader', 'finance_subcommittee'] },
  { label: 'Assets', path: '/assets', icon: Package, roles: ['super_admin', 'cu_chairperson', 'assets_leader', 'assets_subcommittee'] },
  { label: 'ICT & Media', path: '/ict', icon: Wifi, roles: ['super_admin', 'cu_chairperson', 'ict_leader'] },
  { label: 'Reports', path: '/reports', icon: FileText, roles: ['super_admin', 'cu_chairperson'] },
  { label: 'Admin', path: '/admin', icon: Shield, roles: ['super_admin', 'cu_chairperson'] },
];

export default function AppSidebar() {
  const { profile, roles, signOut } = useAuthStore();
  const location = useLocation();

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(r => roles.includes(r as any));
  });

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={cucuLogo} alt="CUCU Logo" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          <h1 className="font-display font-bold text-base text-sidebar-foreground leading-tight">
            CUCU Portal
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
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
                  ? "bg-sidebar-accent text-sidebar-primary border-l-[3px] border-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="px-3 pb-2 space-y-0.5">
        <Link
          to="/contact-support"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LifeBuoy className="w-5 h-5" />
          <span>Support</span>
        </Link>
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </div>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary-foreground text-xs font-bold">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || 'Member'}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{roles[0]?.replace(/_/g, ' ') || 'member'}</p>
          </div>
          <button onClick={async () => { await signOut(); window.location.href = '/auth'; }} className="p-1.5 rounded hover:bg-sidebar-accent" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
