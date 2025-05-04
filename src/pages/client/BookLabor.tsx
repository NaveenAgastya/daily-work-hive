
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Search, Filter, Star, ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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
  verified: boolean;
  completedJobs?: number;
  rating?: number;
}

const BookLabor = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [laborers, setLaborers] = useState<LaborProfile[]>([]);
  const [filteredLaborers, setFilteredLaborers] = useState<LaborProfile[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  
  const allSkills = [
    'Construction', 'Plumbing', 'Electrical', 'Carpentry', 'Painting',
    'Gardening', 'Cleaning', 'Moving', 'Delivery', 'Driving'
  ];
  
  useEffect(() => {
    const fetchLaborers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'labor'),
          where('profileCompleted', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        const labors: LaborProfile[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          labors.push({
            uid: doc.id,
            displayName: data.displayName || 'Worker',
            fullName: data.fullName || data.displayName || 'Worker',
            skills: data.skills || [],
            hourlyRate: data.hourlyRate || '0',
            experience: data.experience || '0',
            bio: data.bio || '',
            city: data.city || 'Unknown',
            verified: !!data.idProofUrl, // Consider verified if ID proof is uploaded
            completedJobs: Math.floor(Math.random() * 50), // Mock data
            rating: Number((3 + Math.random() * 2).toFixed(1)), // Mock rating between 3-5, converted to number
          });
        });
        
        // Sort by rating (highest first)
        labors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        
        setLaborers(labors);
        setFilteredLaborers(labors);
      } catch (error) {
        console.error('Error fetching laborers:', error);
        toast.error('Failed to load available workers');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLaborers();
  }, []);
  
  // Filter laborers based on search text and selected skill
  useEffect(() => {
    let filtered = [...laborers];
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(laborer => 
        laborer.fullName.toLowerCase().includes(searchLower) ||
        laborer.bio.toLowerCase().includes(searchLower) ||
        laborer.city.toLowerCase().includes(searchLower) ||
        laborer.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }
    
    if (selectedSkill) {
      filtered = filtered.filter(laborer =>
        laborer.skills.includes(selectedSkill)
      );
    }
    
    setFilteredLaborers(filtered);
  }, [searchText, selectedSkill, laborers]);
  
  const handleSkillFilter = (skill: string) => {
    if (selectedSkill === skill) {
      setSelectedSkill(null); // Deselect if already selected
    } else {
      setSelectedSkill(skill);
    }
  };
  
  const viewLaborProfile = (laborId: string) => {
    navigate(`/client/labor/${laborId}`);
  };
  
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      
      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold">Find a Worker</h1>
          </div>
          
          {/* Search and Filter */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name, skill, or location..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2 whitespace-nowrap">
                <Filter className="h-4 w-4" />
                <span>Sort By</span>
              </Button>
            </div>
            
            {/* Skills Filter */}
            <ScrollArea className="w-full whitespace-nowrap mt-4">
              <div className="flex gap-2 py-1">
                {allSkills.map((skill) => (
                  <Button
                    key={skill}
                    variant={selectedSkill === skill ? "default" : "outline"}
                    size="sm"
                    className={selectedSkill === skill ? "bg-labor-primary" : ""}
                    onClick={() => handleSkillFilter(skill)}
                  >
                    {skill}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Results */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <p>Finding available workers...</p>
              </div>
            ) : filteredLaborers.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg mb-2">No workers found</h3>
                <p className="text-gray-500">Try adjusting your search filters</p>
              </div>
            ) : (
              filteredLaborers.map((laborer) => (
                <Card key={laborer.uid} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                      <div className="bg-labor-light p-6 md:p-8 md:w-2/3">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-xl font-semibold">{laborer.fullName}</h3>
                            <div className="flex items-center mt-1">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                <span className="ml-1 text-sm">{laborer.rating}</span>
                              </div>
                              <span className="mx-2 text-gray-300">|</span>
                              <span className="text-sm text-gray-500">
                                {laborer.completedJobs} jobs completed
                              </span>
                              {laborer.verified && (
                                <>
                                  <span className="mx-2 text-gray-300">|</span>
                                  <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                                    Verified
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">${laborer.hourlyRate}/hr</p>
                            <p className="text-sm text-gray-500">{laborer.city}</p>
                          </div>
                        </div>
                        
                        <p className="mt-4 text-sm line-clamp-2">
                          {laborer.bio || "No bio available"}
                        </p>
                        
                        <div className="mt-4 flex flex-wrap gap-1">
                          {laborer.skills.slice(0, 4).map((skill, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {laborer.skills.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{laborer.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center p-4 bg-white md:w-1/3">
                        <Button 
                          className="bg-labor-primary hover:bg-labor-dark w-full flex items-center justify-center gap-2"
                          onClick={() => viewLaborProfile(laborer.uid)}
                        >
                          View Profile
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookLabor;
