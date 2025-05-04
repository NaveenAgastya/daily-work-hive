import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Navigation from '@/components/Navigation';
import { supabase } from '../../integrations/supabase/client';

interface Job {
  id: string;
  title: string;
  description: string;
  client_id: string;
  labor_id: string;
  status: string;
  amount: number;
  created_at: string;
  completed_at: string | null;
  client_name: string;
}

const LaborEarnings = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  
  useEffect(() => {
    fetchEarnings();
  }, [currentUser]);
  
  const fetchEarnings = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('labor_id', currentUser.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setJobs(data);
        
        // Calculate total earnings
        const total = data.reduce((sum, job) => sum + (job.amount || 0), 0);
        setTotalEarnings(total);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
                <p className="text-muted-foreground">
                  View your completed jobs and earnings history
                </p>
              </div>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Average Job Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${jobs.length > 0 ? (totalEarnings / jobs.length).toFixed(2) : '0.00'}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
                <CardDescription>
                  A list of all your completed jobs and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-labor-primary"></div>
                  </div>
                ) : jobs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell>
                            {job.completed_at ? format(new Date(job.completed_at), 'MMM d, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{job.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {job.description}
                            </div>
                          </TableCell>
                          <TableCell>{job.client_name || 'Client'}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${job.amount?.toFixed(2) || '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <h3 className="text-lg font-medium">No earnings yet</h3>
                    <p className="text-muted-foreground mt-1">
                      Complete jobs to start seeing your earnings history here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LaborEarnings;
