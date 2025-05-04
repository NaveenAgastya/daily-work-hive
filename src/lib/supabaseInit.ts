
import { supabase } from "../integrations/supabase/client";

// Function to initialize and setup Supabase storage
export const initSupabaseStorage = async () => {
  try {
    // Check if id_proofs bucket exists, if not create it
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    const idProofsBucketExists = buckets.some(bucket => bucket.name === 'id_proofs');
    
    if (!idProofsBucketExists) {
      console.log('Creating id_proofs bucket...');
      const { data, error } = await supabase.storage.createBucket('id_proofs', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        throw error;
      }
      
      console.log('id_proofs bucket created successfully');
    }
    
    // Create appropriate policies for the bucket 
    // This is typically done in the Supabase dashboard, not programmatically
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing Supabase storage:', error);
    return { success: false, error };
  }
};

// Add the initSupabaseStorage function to your initialization code
// You might call this in App.tsx on initial load
