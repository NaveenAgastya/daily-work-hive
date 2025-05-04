
export interface Job {
  id: string;
  title: string;
  description: string;
  client_id: string;
  labor_id: string;
  status: string;
  amount?: number;
  created_at?: string;
  updated_at?: string;
}
