import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'super_admin' | 'cu_chairperson' | 'ministry_chairperson' | 'docket_leader' |
  'finance_leader' | 'assets_leader' | 'ict_leader' | 'missions_leader' |
  'welfare_officer' | 'content_moderator' | 'cell_group_leader' |
  'finance_subcommittee' | 'assets_subcommittee' | 'general_member' | 'visitor';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  student_id: string | null;
  department: string | null;
  year_of_study: number | null;
  year_joined_cu: number | null;
  bio: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyAdminRole: () => boolean;
  hasFinanceRole: () => boolean;
  hasAssetsRole: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  roles: [],
  loading: true,
  initialized: false,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    if (data) set({ profile: data as Profile });
  },

  fetchRoles: async () => {
    const { user } = get();
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    if (data) set({ roles: data.map(r => r.role as AppRole) });
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });
    if (session?.user) {
      await Promise.all([get().fetchProfile(), get().fetchRoles()]);
    }
    set({ loading: false, initialized: true });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        await Promise.all([get().fetchProfile(), get().fetchRoles()]);
      } else {
        set({ profile: null, roles: [] });
      }
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, roles: [] });
  },

  hasRole: (role) => get().roles.includes(role),
  hasAnyAdminRole: () => {
    const roles = get().roles;
    return roles.some(r => ['super_admin', 'cu_chairperson', 'ministry_chairperson', 'docket_leader'].includes(r));
  },
  hasFinanceRole: () => {
    const roles = get().roles;
    return roles.some(r => ['super_admin', 'cu_chairperson', 'finance_leader', 'finance_subcommittee'].includes(r));
  },
  hasAssetsRole: () => {
    const roles = get().roles;
    return roles.some(r => ['super_admin', 'cu_chairperson', 'assets_leader', 'assets_subcommittee'].includes(r));
  },
}));
