
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, CheckSquare, Clock, Calendar } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface JobRequest {
  id: string;
  laborId: string;
  laborName: string;
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

const ClientDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    completed: 0,
    totalSpent: 0,
  });
  
  useEffect(() => {
    const fetchJobRequests = async () => {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, 'jobRequests'),
          where('clientId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const requests: JobRequest[] = [];
        let pending = 0;
        let accepted = 0;
        let completed = 0;
        let totalSpent = 0;
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<JobRequest, 'id'>;
          const job: JobRequest = {
            id: doc.id,
            ...data
          };
          
          requests.push(job);
          
          // Update stats
          if (job.status === 'pending') {
            pending++;
          } else if (job.status === 'accepted') {
            accepted++;
          } else if (job.status === 'completed') {
            completed++;
            totalSpent += job.rate * job.hours;
          }
        });
        
        // Sort by date (newest first)
        requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setJobRequests(requests);
        setStats({
          pending,
          accepted,
          completed,
          totalSpent
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
  
  const renderJobCard = (job: JobRequest) => (
    <Card key={job.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.title}</CardTitle>
            <CardDescription>
              Worker: {job.laborName} • {job.date} at {job.time}
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
            <h1 className="text-2xl font-bold">Client Dashboard</h1>
            <Link to="/client/book">
              <Button className="bg-labor-primary hover:bg-labor-dark">Book a Worker</Button>
            </Link>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                <h3 className="font-medium text-sm">Accepted</h3>
              </div>
              <p className="text-2xl font-bold">{stats.accepted}</p>
            </Card>
            
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="h-5 w-5 text-green-500" />
                <h3 className="font-medium text-sm">Completed</h3>
              </div>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </Card>
            
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-sm">Total Spent</h3>
              </div>
              <p className="text-2xl font-bold">${stats.totalSpent}</p>
            </Card>
          </div>
          
          {/* Job Requests */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Jobs</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
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
                      Book your first worker to get started.
                    </p>
                    <Link to="/client/book" className="mt-4 inline-block">
                      <Button className="bg-labor-primary hover:bg-labor-dark">Book a Worker</Button>
                    </Link>
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
                    <h3>No accepted jobs</h3>
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

export default ClientDashboard;
