export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  region: string;
  department: string; // Commercial ou Marketing selon les règles SABC
  permissions: string[];
  last_login_at: string;
  created_at: string;
  updated_at: string;
}
