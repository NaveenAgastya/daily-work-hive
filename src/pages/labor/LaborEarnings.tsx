
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Calendar, Download } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface Job {
  id: string;
  title: string;
  date: string;
  hours: number;
  rate: number;
  status: string;
  clientName: string;
}

const LaborEarnings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [timeFrame, setTimeFrame] = useState('week');
  
  // Stats
  const [stats, setStats] = useState({
    totalEarnings: 0,
    weeklyAverage: 0,
    jobsCompleted: 0,
    averageJobValue: 0,
  });
  
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchJobs = async () => {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, 'jobRequests'),
          where('laborId', '==', currentUser.uid),
          where('status', '==', 'completed')
        );
        
        const querySnapshot = await getDocs(q);
        const completedJobs: Job[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          completedJobs.push({
            id: doc.id,
            title: data.title,
            date: data.date,
            hours: data.hours,
            rate: data.rate,
            status: data.status,
            clientName: data.clientName,
          });
        });
        
        // Sort by date (newest first)
        completedJobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setJobs(completedJobs);
        
        // Calculate stats
        const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.hours * job.rate), 0);
        const jobsCompleted = completedJobs.length;
        
        setStats({
          totalEarnings,
          weeklyAverage: jobsCompleted > 0 ? (totalEarnings / (jobsCompleted / 4)) : 0, // rough weekly estimate
          jobsCompleted,
          averageJobValue: jobsCompleted > 0 ? (totalEarnings / jobsCompleted) : 0,
        });
        
        // Generate initial chart data
        prepareChartData(completedJobs, 'week');
      } catch (error) {
        console.error('Error fetching completed jobs:', error);
        toast.error('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [currentUser]);
  
  // Process data for charts based on selected timeframe
  const prepareChartData = (jobs: Job[], period: string) => {
    const now = new Date();
    let data: any[] = [];
    
    if (period === 'week') {
      // Last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dayJobs = jobs.filter(job => {
          const jobDate = new Date(job.date);
          return jobDate.toDateString() === date.toDateString();
        });
        
        const earnings = dayJobs.reduce((sum, job) => sum + (job.hours * job.rate), 0);
        
        data.push({
          name: days[date.getDay()],
          earnings,
          jobs: dayJobs.length,
        });
      }
    } else if (period === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - 6);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() - (i * 7));
        
        const weekJobs = jobs.filter(job => {
          const jobDate = new Date(job.date);
          return jobDate >= weekStart && jobDate <= weekEnd;
        });
        
        const earnings = weekJobs.reduce((sum, job) => sum + (job.hours * job.rate), 0);
        
        data.push({
          name: `Week ${4 - i}`,
          earnings,
          jobs: weekJobs.length,
        });
      }
    } else if (period === 'year') {
      // Last 12 months
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthYear = `${monthNames[month.getMonth()]} ${month.getFullYear()}`;
        
        const monthJobs = jobs.filter(job => {
          const jobDate = new Date(job.date);
          return jobDate.getMonth() === month.getMonth() && 
                 jobDate.getFullYear() === month.getFullYear();
        });
        
        const earnings = monthJobs.reduce((sum, job) => sum + (job.hours * job.rate), 0);
        
        data.push({
          name: monthNames[month.getMonth()],
          earnings,
          jobs: monthJobs.length,
        });
      }
    }
    
    setChartData(data);
  };
  
  const handleTimeFrameChange = (value: string) => {
    setTimeFrame(value);
    prepareChartData(jobs, value);
  };
  
  // Mock function for exporting earnings report
  const exportEarningsReport = () => {
    toast.success("Earnings report export started. Check your downloads folder.");
    // In a real app, this would generate and download a CSV/PDF report
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold">Earnings Dashboard</h1>
            <Button variant="outline" onClick={exportEarningsReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-labor-primary" />
                <h3 className="font-medium text-sm">Total Earnings</h3>
              </div>
              <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
            </Card>
            
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium text-sm">Weekly Avg</h3>
              </div>
              <p className="text-2xl font-bold">${stats.weeklyAverage.toFixed(2)}</p>
            </Card>
            
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h3 className="font-medium text-sm">Jobs Completed</h3>
              </div>
              <p className="text-2xl font-bold">{stats.jobsCompleted}</p>
            </Card>
            
            <Card className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-amber-500" />
                <h3 className="font-medium text-sm">Avg Job Value</h3>
              </div>
              <p className="text-2xl font-bold">${stats.averageJobValue.toFixed(2)}</p>
            </Card>
          </div>
          
          {/* Earnings Chart */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Earnings Overview</CardTitle>
                    <CardDescription>Visualize your earnings over time</CardDescription>
                  </div>
                  <Select
                    defaultValue={timeFrame}
                    onValueChange={handleTimeFrameChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select time frame" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 4 Weeks</SelectItem>
                      <SelectItem value="year">Last 12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[300px] pt-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="earnings" 
                        name="Earnings ($)" 
                        stroke="#0057B8" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Job Activity Chart */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Job Activity</CardTitle>
                <CardDescription>Number of jobs completed</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading chart data...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="jobs" 
                        name="Jobs Completed" 
                        fill="#7DC8F7" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>Your most recent completed jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading job data...</div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p>No completed jobs yet</p>
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-3">Job Title</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Hours</th>
                        <th className="px-4 py-3">Rate</th>
                        <th className="px-4 py-3 text-right">Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.slice(0, 5).map((job) => (
                        <tr key={job.id} className="border-b">
                          <td className="px-4 py-3">{job.title}</td>
                          <td className="px-4 py-3">{job.clientName}</td>
                          <td className="px-4 py-3">{job.date}</td>
                          <td className="px-4 py-3">{job.hours}</td>
                          <td className="px-4 py-3">${job.rate}/hr</td>
                          <td className="px-4 py-3 text-right font-medium">${(job.hours * job.rate).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LaborEarnings;
