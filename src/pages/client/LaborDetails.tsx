
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Star, MapPin, Clock, Calendar, DollarSign, Check, AlertCircle, Briefcase, Award } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface LaborProfile {
  uid: string;
  displayName: string;
  fullName: string;
  skills: string[];
  hourlyRate: string;
  experience: string;
  bio: string;
  city: string;
  phone: string;
  verified: boolean;
}

const LaborDetails = () => {
  const { id: laborId } = useParams<{ id: string }>();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [laborer, setLaborer] = useState<LaborProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [bookingDetails, setBookingDetails] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    hours: 4,
    location: userData?.address || '',
  });
  
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchLaborProfile = async () => {
      if (!laborId) return;
      
      try {
        const laborDoc = await getDoc(doc(db, "users", laborId));
        
        if (laborDoc.exists()) {
          const data = laborDoc.data();
          setLaborer({
            uid: laborDoc.id,
            displayName: data.displayName || 'Worker',
            fullName: data.fullName || data.displayName || 'Worker',
            skills: data.skills || [],
            hourlyRate: data.hourlyRate || '0',
            experience: data.experience || '0',
            bio: data.bio || '',
            city: data.city || 'Unknown',
            phone: data.phone || 'Not provided',
            verified: !!data.idProofUrl,
          });
        } else {
          toast.error('Worker not found');
          navigate('/client/book');
        }
      } catch (error) {
        console.error('Error fetching labor profile:', error);
        toast.error('Failed to load worker details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLaborProfile();
  }, [laborId, navigate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !laborer) {
      toast.error('You must be logged in to book a worker');
      return;
    }
    
    // Validate required fields
    if (!bookingDetails.title || !bookingDetails.date || !bookingDetails.time || !bookingDetails.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create job request in Firestore
      const jobRequest = {
        clientId: currentUser.uid,
        clientName: userData?.fullName || userData?.displayName || 'Client',
        laborId: laborer.uid,
        laborName: laborer.fullName,
        title: bookingDetails.title,
        description: bookingDetails.description,
        date: bookingDetails.date,
        time: bookingDetails.time,
        hours: Number(bookingDetails.hours),
        location: bookingDetails.location,
        rate: Number(laborer.hourlyRate),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      await addDoc(collection(db, "jobRequests"), jobRequest);
      
      toast.success('Booking request sent successfully!');
      navigate('/client/dashboard');
    } catch (error) {
      console.error('Error creating job request:', error);
      toast.error('Failed to send booking request');
    } finally {
      setSubmitting(false);
      setDialogOpen(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading worker profile...</p>
        </main>
      </div>
    );
  }
  
  if (!laborer) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-2 text-xl font-semibold">Worker Not Found</h2>
            <p className="mt-1 text-gray-500">This worker profile does not exist or has been removed</p>
            <Button 
              onClick={() => navigate('/client/book')} 
              className="mt-4"
            >
              Back to Worker List
            </Button>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-500 font-bold mb-4">
                      {laborer.fullName.charAt(0)}
                    </div>
                    <CardTitle className="text-xl">{laborer.fullName}</CardTitle>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <Star className="h-4 w-4 text-gray-300" />
                      <span className="ml-2">4.0</span>
                    </div>
                    {laborer.verified && (
                      <Badge className="mt-2 bg-green-500">Verified ID</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    <span>{laborer.city}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                    <span>${laborer.hourlyRate} per hour</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-gray-500 mr-2" />
                    <span>{laborer.experience} years experience</span>
                  </div>
                  
                  <div className="pt-2">
                    <p className="font-medium text-sm mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {laborer.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-labor-primary hover:bg-labor-dark">
                        Book This Worker
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                      <DialogHeader>
                        <DialogTitle>Book {laborer.fullName}</DialogTitle>
                        <DialogDescription>
                          Fill out the form below to request this worker for your job
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-1">
                            <Label htmlFor="title">Job Title *</Label>
                            <Input 
                              id="title" 
                              name="title"
                              value={bookingDetails.title}
                              onChange={handleInputChange}
                              placeholder="e.g. House Painting, Plumbing Repair"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="description">Job Description</Label>
                            <Textarea 
                              id="description" 
                              name="description"
                              value={bookingDetails.description}
                              onChange={handleInputChange}
                              placeholder="Describe the work that needs to be done"
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor="date">Date *</Label>
                              <Input 
                                id="date" 
                                name="date"
                                type="date"
                                value={bookingDetails.date}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="time">Time *</Label>
                              <Input 
                                id="time" 
                                name="time"
                                type="time"
                                value={bookingDetails.time}
                                onChange={handleInputChange}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="hours">Estimated Hours *</Label>
                            <Input 
                              id="hours" 
                              name="hours"
                              type="number"
                              min="1"
                              step="0.5"
                              value={bookingDetails.hours}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="location">Job Location *</Label>
                            <Input 
                              id="location" 
                              name="location"
                              value={bookingDetails.location}
                              onChange={handleInputChange}
                              placeholder="Enter the address where work will be done"
                              required
                            />
                          </div>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <p className="text-sm font-medium">Booking Summary</p>
                            <div className="flex justify-between mt-2 text-sm">
                              <span>Rate:</span>
                              <span>${laborer.hourlyRate}/hour</span>
                            </div>
                            <div className="flex justify-between mt-1 text-sm">
                              <span>Estimated Duration:</span>
                              <span>{bookingDetails.hours} hours</span>
                            </div>
                            <div className="flex justify-between mt-1 font-medium">
                              <span>Estimated Total:</span>
                              <span>${Number(laborer.hourlyRate) * bookingDetails.hours}</span>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            className="bg-labor-primary hover:bg-labor-dark"
                            disabled={submitting}
                          >
                            {submitting ? 'Sending Request...' : 'Send Booking Request'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </div>
            
            {/* Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">
                    {laborer.bio || 'This worker has not added a bio yet.'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>What to expect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">Verified Identity</h4>
                      <p className="text-sm text-gray-500">This worker has verified their identity with government-issued ID</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">Skilled Professional</h4>
                      <p className="text-sm text-gray-500">Experienced with {laborer.skills.slice(0, 3).join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium">Direct Communication</h4>
                      <p className="text-sm text-gray-500">Communicate directly through our platform to discuss job details</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Job History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Mock job history */}
                    <div className="flex gap-3">
                      <Award className="h-5 w-5 text-labor-primary" />
                      <div>
                        <h4 className="font-medium">Home Renovation</h4>
                        <div className="flex items-center mt-0.5">
                          <div className="flex">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          </div>
                          <span className="text-sm text-gray-500 ml-2">2 weeks ago</span>
                        </div>
                        <p className="text-sm mt-1">
                          "Very professional and completed the work ahead of schedule. Would hire again."
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Award className="h-5 w-5 text-labor-primary" />
                      <div>
                        <h4 className="font-medium">Kitchen Plumbing</h4>
                        <div className="flex items-center mt-0.5">
                          <div className="flex">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <Star className="h-3 w-3 text-gray-300" />
                          </div>
                          <span className="text-sm text-gray-500 ml-2">1 month ago</span>
                        </div>
                        <p className="text-sm mt-1">
                          "Fixed our leaking sink quickly and efficiently. Great value for money."
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LaborDetails;
