
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Clock, FileText, CheckSquare, Calendar, DollarSign } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface JobRequest {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  hours: number;
  rate: number;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  createdAt: string;
}

const LaborDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    completed: 0,
    pending: 0,
    upcoming: 0,
    totalEarnings: 0,
  });
  
  useEffect(() => {
    const fetchJobRequests = async () => {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, 'jobRequests'),
          where('laborId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const requests: JobRequest[] = [];
        let completed = 0;
        let pending = 0;
        let earnings = 0;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<JobRequest, 'id'>;
          const job: JobRequest = {
            id: doc.id,
            ...data
          };
          
          requests.push(job);
          
          // Update stats
          if (job.status === 'completed') {
            completed++;
            earnings += job.rate * job.hours;
          } else if (job.status === 'pending') {
            pending++;
          }
        });
        
        // Sort by date (newest first)
        requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setJobRequests(requests);
        setStats({
          completed,
          pending,
          upcoming: requests.filter(job => job.status === 'accepted').length,
          totalEarnings: earnings
        });
      } catch (error) {
        console.error('Error fetching job requests:', error);
        toast.error('Failed to load job requests');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobRequests();
  }, [currentUser]);
  
  const handleStatusUpdate = async (jobId: string, status: 'accepted' | 'rejected' | 'completed') => {
    if (!currentUser) return;
    
    try {
      await updateDoc(doc(db, 'jobRequests', jobId), { 
        status,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setJobRequests(prev => prev.map(job => 
        job.id === jobId ? { ...job, status } : job
      ));
      
      // Update stats
      if (status === 'completed') {
        const job = jobRequests.find(j => j.id === jobId);
        if (job) {
          setStats(prev => ({
            ...prev,
            completed: prev.completed + 1,
            upcoming: prev.upcoming - 1,
            totalEarnings: prev.totalEarnings + (job.rate * job.hours)
          }));
        }
      } else if (status === 'accepted') {
        setStats(prev => ({
          ...prev,
          pending: prev.pending - 1,
          upcoming: prev.upcoming + 1
        }));
      } else if (status === 'rejected') {
        setStats(prev => ({
          ...prev,
          pending: prev.pending - 1
        }));
      }
      
      toast.success(`Job marked as ${status}`);
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
    }
  };
  
  const renderJobCard = (job: JobRequest) => (
    <Card key={job.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <CardDescription>
              From {job.clientName} • {job.date} at {job.time}
            </CardDescription>
          </div>
          <Badge 
            className={`
              ${job.status === 'completed' ? 'bg-green-500' : ''}
              ${job.status === 'pending' ? 'bg-amber-500' : ''}
              ${job.status === 'accepted' ? 'bg-blue-500' : ''}
              ${job.status === 'rejected' ? 'bg-red-500' : ''}
            `}
          >
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm">{job.description}</p>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Location:</span> {job.location}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {job.hours} hours
            </div>
            <div>
              <span className="font-medium">Rate:</span> ${job.rate}/hr
            </div>
            <div>
              <span className="font-medium">Total:</span> ${job.rate * job.hours}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            {job.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleStatusUpdate(job.id, 'rejected')}
                >
                  Decline
                </Button>
                <Button 
                  size="sm"
                  className="bg-labor-primary hover:bg-labor-dark"
                  onClick={() => handleStatusUpdate(job.id, 'accepted')}
                >
                  Accept
                </Button>
              </>
            )}
            
            {job.status === 'accepted' && (
              <Button 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleStatusUpdate(job.id, 'completed')}
              >
                Mark as Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold">Worker Dashboard</h1>
            <Link to="/labor/profile">
              <Button variant="outline">Update Profile</Button>
            </Link>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="h-5 w-5 text-green-500" />
                <h3 className="font-medium text-sm">Completed</h3>
              </div>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </Card>
            
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h3 className="font-medium text-sm">Pending</h3>
              </div>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </Card>
            
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium text-sm">Upcoming</h3>
              </div>
              <p className="text-2xl font-bold">{stats.upcoming}</p>
            </Card>
            
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-labor-primary" />
                <h3 className="font-medium text-sm">Earnings</h3>
              </div>
              <p className="text-2xl font-bold">${stats.totalEarnings}</p>
              <Link to="/labor/earnings" className="text-xs text-labor-primary hover:underline">
                View details
              </Link>
            </Card>
          </div>
          
          {/* Job Requests */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Jobs</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading job requests...</div>
                ) : jobRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <h3 className="font-medium text-lg">No job requests yet</h3>
                    <p className="text-gray-500">
                      When clients request your services, they'll appear here.
                    </p>
                  </div>
                ) : (
                  jobRequests.map(renderJobCard)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="pending">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : jobRequests.filter(job => job.status === 'pending').length === 0 ? (
                  <div className="text-center py-8">
                    <h3>No pending job requests</h3>
                  </div>
                ) : (
                  jobRequests.filter(job => job.status === 'pending').map(renderJobCard)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="accepted">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : jobRequests.filter(job => job.status === 'accepted').length === 0 ? (
                  <div className="text-center py-8">
                    <h3>No upcoming jobs</h3>
                  </div>
                ) : (
                  jobRequests.filter(job => job.status === 'accepted').map(renderJobCard)
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="completed">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : jobRequests.filter(job => job.status === 'completed').length === 0 ? (
                  <div className="text-center py-8">
                    <h3>No completed jobs yet</h3>
                  </div>
                ) : (
                  jobRequests.filter(job => job.status === 'completed').map(renderJobCard)
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default LaborDashboard;
