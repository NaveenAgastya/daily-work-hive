import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import Navigation from '@/components/Navigation';
import { supabase } from '../../integrations/supabase/client';
import { Job } from '@/types/job';

// Define the type for each data point in the chart
interface EarningsDataPoint {
  date: string;
  earnings: number;
}

const LaborEarnings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [earningsData, setEarningsData] = useState<EarningsDataPoint[]>([]);
  
  useEffect(() => {
    const fetchCompletedJobs = async () => {
      if (!currentUser) return;
      
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('labor_id', currentUser.id)
          .eq('status', 'completed');
        
        if (error) throw error;
        
        if (data) {
          const typedData = data as Job[];
          setCompletedJobs(typedData);
          
          // Calculate total earnings
          const total = typedData.reduce((sum, job) => sum + (job.amount || 0), 0);
          setTotalEarnings(total);
          
          // Generate data for the chart
          // Group jobs by date and sum earnings
          const earningsByDate = typedData.reduce((acc, job) => {
            const date = job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Unknown';
            if (!acc[date]) {
              acc[date] = 0;
            }
            acc[date] += (job.amount || 0);
            return acc;
          }, {} as Record<string, number>);
          
          // Convert to array format for the chart
          const chartData = Object.keys(earningsByDate).map(date => ({
            date,
            earnings: earningsByDate[date]
          }));
          
          setEarningsData(chartData);
        }
      } catch (error) {
        console.error('Error fetching completed jobs:', error);
        toast.error('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompletedJobs();
  }, [currentUser]);
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Earnings</CardTitle>
              <CardDescription>A summary of your completed jobs and earnings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div>Loading earnings data...</div>
              ) : (
                <>
                  <div className="text-2xl font-semibold">Total Earnings: ${totalEarnings.toFixed(2)}</div>
                  
                  {earningsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={earningsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="earnings" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div>No earnings data available.</div>
                  )}
                  
                  <h3 className="text-xl font-semibold">Completed Jobs</h3>
                  {completedJobs.length > 0 ? (
                    <ul>
                      {completedJobs.map((job) => (
                        <li key={job.id} className="py-2 border-b">
                          {job.title} - ${job.amount?.toFixed(2) || '0.00'} (Completed on {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Unknown'})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>No completed jobs found.</div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LaborEarnings;
