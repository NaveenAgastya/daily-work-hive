import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';
import { LaborProfile } from '@/types/laborProfile';

interface LaborDetailsType extends LaborProfile {
  profiles?: {
    full_name?: string;
    display_name?: string;
  };
  avatar?: string;
}

const LaborDetails = () => {
  const { id: laborId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [laborDetails, setLaborDetails] = useState<LaborDetailsType | null>(null);
  const [loading, setLoading] = useState(true);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('');
  };

  useEffect(() => {
    const fetchLaborDetails = async () => {
      if (!laborId) return;
      
      try {
        const { data, error } = await supabase
          .from('labor_profiles')
          .select(`
            *,
            profiles:user_id(full_name, display_name)
          `)
          .eq('user_id', laborId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setLaborDetails({
            ...data,
            avatar: '',
          });
        }
      } catch (error) {
        console.error('Error fetching labor details:', error);
        toast.error('Failed to load labor details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLaborDetails();
  }, [laborId]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading labor details...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Labor Details</CardTitle>
          <CardDescription>View detailed information about the selected labor.</CardDescription>
        </CardHeader>
        <CardContent>
          {laborDetails && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={laborDetails.avatar || ''} alt={laborDetails.profiles?.full_name || 'Labor'} />
                  <AvatarFallback>{getInitials(laborDetails.profiles?.full_name || laborDetails.profiles?.display_name || 'Labor')}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold">{laborDetails.profiles?.full_name || laborDetails.profiles?.display_name || 'Unknown Labor'}</h2>
                  <p className="text-gray-500">Skills: {laborDetails.skills.join(', ')}</p>
                  <p className="text-gray-500">Hourly Rate: ${laborDetails.hourly_rate}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Bio</h3>
                <p>{laborDetails.bio || 'No bio available.'}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Contact Information</h3>
                <p>Phone: {laborDetails.phone}</p>
                <p>City: {laborDetails.city || 'Not specified'}</p>
              </div>
              
              <div>
                <Button>Book Now</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LaborDetails;
