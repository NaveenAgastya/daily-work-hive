import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';
import { CalendarDays, DollarSign, User2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '../../integrations/supabase/client';
import { Job } from '@/types/job';

const LaborDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  const fetchJobs = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('labor_id', currentUser.id);
        
      if (error) throw error;
      
      if (data) {
        setJobs(data as Job[]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchJobs();
  }, [currentUser]);
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Profile Card */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>View and manage your profile details</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4 p-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/avatars/01.png" alt="Avatar" />
                  <AvatarFallback>{currentUser?.email ? getInitials(currentUser.email) : 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-lg font-semibold">{currentUser?.email || 'No Email'}</p>
                  <p className="text-sm text-muted-foreground">Labor/Worker</p>
                </div>
                <Button onClick={() => navigate('/labor/profile')}>Edit Profile</Button>
              </CardContent>
            </Card>
            
            {/* Earnings Card */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Earnings</CardTitle>
                <CardDescription>View your total earnings and job history</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="rounded-full bg-green-100 p-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold">$0.00</p>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/labor/earnings')}>View Details</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Upcoming Appointments Card */}
            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Upcoming Jobs</CardTitle>
                <CardDescription>View your upcoming job schedule</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {loading ? (
                  <p>Loading jobs...</p>
                ) : jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div key={job.id} className="border rounded-md p-4">
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                      {/* Display other job details here */}
                    </div>
                  ))
                ) : (
                  <p>No upcoming jobs scheduled.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LaborDashboard;
