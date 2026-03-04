export type UserProfile = {
  user_id: number;
  first_name: string;
  last_name: string;
  entity_type: 'company' | 'individual';
  company_name: string | null;
  updated_at: string | null;
};

export type User = {
  id: number;
  email: string;
  last_login: string | null;
  created_at: string;
  force_password_change: number;
  is_active: number;
  role_id: number;
  force_update_profile: number;
  role_name?: string;
  profile: UserProfile;
};
