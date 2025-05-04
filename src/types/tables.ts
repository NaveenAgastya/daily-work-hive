
// Define Supabase table interfaces to match our database schema

import { LaborProfile } from "./laborProfile";
import { Job } from "./job";

export interface Profile {
  id: string;
  email: string;
  display_name?: string;
  full_name?: string;
  role: 'labor' | 'client';
  profile_completed?: boolean;
  address?: string;
  created_at?: string;
}
