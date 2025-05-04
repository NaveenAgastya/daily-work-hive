
import { supabase } from "../integrations/supabase/client";

// Function to initialize and setup Supabase storage
export const initSupabaseStorage = async () => {
  try {
    // Since we created the id_proofs bucket in the SQL migration,
    // we only need to check if it exists and handle any other setup if needed
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    const idProofsBucketExists = buckets.some(bucket => bucket.name === 'id_proofs');
    
    if (!idProofsBucketExists) {
      console.log('id_proofs bucket does not exist, creating...');
      const { data, error } = await supabase.storage.createBucket('id_proofs', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (error) {
        throw error;
      }
      
      console.log('id_proofs bucket created successfully');
    } else {
      console.log('id_proofs bucket already exists');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error initializing Supabase storage:', error);
    return { success: false, error };
  }
};
