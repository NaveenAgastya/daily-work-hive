
export interface LaborProfile {
  id?: string;
  user_id: string;
  phone: string;
  city?: string;
  skills: string[];
  hourly_rate: string | number;
  experience?: string;
  bio?: string;
  id_proof_url?: string;
  created_at?: string;
  updated_at?: string;
}
