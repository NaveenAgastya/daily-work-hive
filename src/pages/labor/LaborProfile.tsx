import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

const skillOptions = [
  'Construction', 'Plumbing', 'Electrical', 'Carpentry', 'Painting',
  'Gardening', 'Cleaning', 'Moving', 'Delivery', 'Driving',
  'Cooking', 'Babysitting', 'Pet Care', 'Computer Repair', 'Teaching',
  'Event Staff', 'Security', 'Warehouse', 'Factory Worker', 'General Labor'
];

const LaborProfile = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    skills: [] as string[],
    hourlyRate: '',
    experience: '',
    bio: '',
  });
  
  const [idProof, setIdProof] = useState<File | null>(null);
  const [idProofUrl, setIdProofUrl] = useState('');
  const [idProofUploadProgress, setIdProofUploadProgress] = useState(0);
  const [idProofUploading, setIdProofUploading] = useState(false);
  
  // Load existing profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile({
            fullName: userData.fullName || userData.displayName || '',
            phone: userData.phone || '',
            address: userData.address || '',
            city: userData.city || '',
            skills: userData.skills || [],
            hourlyRate: userData.hourlyRate || '',
            experience: userData.experience || '',
            bio: userData.bio || '',
          });
          
          if (userData.idProofUrl) {
            setIdProofUrl(userData.idProofUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      }
    };
    
    fetchUserProfile();
  }, [currentUser]);
  
  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdProof(e.target.files[0]);
    }
  };
  
  const uploadIdProof = async () => {
    if (!idProof || !currentUser) return;
    
    setIdProofUploading(true);
    
    try {
      // Create a reference for the file
      const fileRef = ref(storage, `id_proofs/${currentUser.uid}/${idProof.name}`);
      
      // Upload the file
      const uploadTask = uploadBytesResumable(fileRef, idProof);
      
      // Monitor upload progress
      uploadTask.on(
        'state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setIdProofUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading ID proof:', error);
          toast.error('Failed to upload ID proof');
          setIdProofUploading(false);
        },
        async () => {
          // Upload completed, get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setIdProofUrl(downloadURL);
          
          // Update user document with ID proof URL
          try {
            await updateDoc(doc(db, "users", currentUser.uid), {
              idProofUrl: downloadURL,
              idProofName: idProof.name
            });
            toast.success('ID proof uploaded successfully');
          } catch (error) {
            console.error('Error updating user document:', error);
            toast.error('Failed to save ID proof reference');
          }
          
          setIdProofUploading(false);
        }
      );
    } catch (error) {
      console.error('Error starting upload:', error);
      toast.error('Failed to start upload');
      setIdProofUploading(false);
    }
  };
  
  const deleteIdProof = async () => {
    if (!currentUser || !idProofUrl) return;
    
    try {
      // First get the document to get the filename
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists() && userDoc.data().idProofName) {
        const idProofName = userDoc.data().idProofName;
        
        // Delete from storage
        const fileRef = ref(storage, `id_proofs/${currentUser.uid}/${idProofName}`);
        await deleteObject(fileRef);
        
        // Remove from user document
        await updateDoc(doc(db, "users", currentUser.uid), {
          idProofUrl: null,
          idProofName: null
        });
        
        setIdProofUrl('');
        toast.success('ID proof deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting ID proof:', error);
      toast.error('Failed to delete ID proof');
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSkillChange = (skill: string) => {
    setProfile(prev => {
      // If skill is already selected, remove it
      if (prev.skills.includes(skill)) {
        return {
          ...prev,
          skills: prev.skills.filter(s => s !== skill)
        };
      }
      
      // Otherwise add it
      return {
        ...prev,
        skills: [...prev.skills, skill]
      };
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('You must be logged in to update your profile');
      return;
    }
    
    // Validate required fields
    if (!profile.fullName || !profile.phone || profile.skills.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate hourly rate is a number
    if (isNaN(Number(profile.hourlyRate))) {
      toast.error('Hourly rate must be a number');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload ID proof if selected but not yet uploaded
      if (idProof && !idProofUrl) {
        await uploadIdProof();
      }
      
      // Update user profile in Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        ...profile,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Profile updated successfully');
      navigate('/labor/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Profile</CardTitle>
                <CardDescription>
                  Add your information so clients can find and hire you for jobs. 
                  Don't forget to upload your ID proof for verification.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={profile.fullName}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={profile.phone}
                      onChange={handleInputChange}
                      placeholder="Your contact number"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={profile.address}
                        onChange={handleInputChange}
                        placeholder="Your address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={profile.city}
                        onChange={handleInputChange}
                        placeholder="Your city"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Select Your Skills *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {skillOptions.map((skill) => (
                        <div key={skill} className="flex items-center">
                          <Button
                            type="button"
                            variant={profile.skills.includes(skill) ? "default" : "outline"}
                            size="sm"
                            className={`w-full ${profile.skills.includes(skill) ? 'bg-labor-primary text-white' : ''}`}
                            onClick={() => handleSkillChange(skill)}
                          >
                            {skill}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
                    <Input
                      id="hourlyRate"
                      name="hourlyRate"
                      value={profile.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="Your hourly rate"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      name="experience"
                      value={profile.experience}
                      onChange={handleInputChange}
                      placeholder="Years of experience"
                      type="number"
                      min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio / Description</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={profile.bio}
                      onChange={handleInputChange}
                      placeholder="Tell clients about yourself and your expertise"
                      rows={4}
                    />
                  </div>
                  
                  {/* ID Proof Upload Section */}
                  <div className="space-y-2 border rounded-md p-4">
                    <Label className="block mb-2">ID Proof * (Required for verification)</Label>
                    
                    {idProofUrl ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="bg-green-100 text-green-700 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>ID Proof Uploaded</span>
                        </div>
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          onClick={deleteIdProof}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input 
                          type="file" 
                          onChange={handleIdProofChange}
                          accept="image/*,application/pdf"
                        />
                        
                        {idProof && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={uploadIdProof}
                            disabled={idProofUploading}
                            className="mt-2"
                          >
                            {idProofUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading... ({Math.round(idProofUploadProgress)}%)
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload ID Proof
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Please upload a valid government-issued ID (passport, driver's license, national ID).
                      This is required for verification and will be kept secure.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-labor-primary hover:bg-labor-dark" 
                    disabled={loading || (idProof && !idProofUrl)}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : 'Save Profile'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LaborProfile;
