import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ShieldCheck, User2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from '@/lib/utils';
import Navigation from '@/components/Navigation';
import { supabase } from '../../integrations/supabase/client';

const ClientDashboard = () => {
  const { currentUser, userData } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Update any code that uses user.uid to use user.id instead
  const fetchJobs = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', currentUser.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setJobs(data);
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
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Book Labor</CardTitle>
                <CardDescription>Hire someone for a task</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Button onClick={() => navigate('/client/book')} className="w-full">
                  Find Labor
                </Button>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>View and update your profile</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Button onClick={() => navigate('/client/profile')} className="w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Your Jobs</CardTitle>
                <CardDescription>Manage your active and past jobs</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {loading ? (
                  <div>Loading jobs...</div>
                ) : jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div key={job.id} className="border rounded-md p-4">
                      <h3 className="font-semibold">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.description}</p>
                    </div>
                  ))
                ) : (
                  <div>No jobs found.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
