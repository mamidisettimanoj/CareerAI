import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export class ResumeStorageService {
  private readonly BUCKET_NAME = 'resumes';

  async uploadResume(profileId: string, file: File): Promise<string> {
    const supabase = createClient();
    
    // Opaque storage key: {profileId}/{uuid}.pdf
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      throw new Error('Unsupported file extension');
    }
    
    const key = `${profileId}/${uuidv4()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(key, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload failed:', error);
      throw new Error('STORAGE_UPLOAD_FAILED');
    }

    return data.path; // The storage key
  }

  async deleteResume(path: string) {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw new Error('STORAGE_DELETE_FAILED');
    }
  }

  async getDownloadUrl(path: string, profileId: string): Promise<string> {
    // Basic verification - Ensure path starts with profileId
    if (!path.startsWith(`${profileId}/`)) {
      throw new Error('UNAUTHORIZED');
    }

    const supabase = createClient();
    // Use createSignedUrl for private buckets
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(path, 60); // 60 seconds expiry

    if (error || !data) {
      throw new Error('FAILED_TO_GENERATE_URL');
    }

    return data.signedUrl;
  }
}
