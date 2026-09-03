import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('--- START VERIFICATION ---');
  
  // 1. PostgreSQL
  console.log('\nTesting PostgreSQL...');
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    const userCount = await prisma.user.count();
    console.log(`[PG] Success! Connected to database. Total users: ${userCount}`);
    
    const companyCount = await prisma.company.count();
    console.log(`[PG] Success! Total companies: ${companyCount}`);
    
    await prisma.$disconnect();
  } catch (err: any) {
    console.error(`[PG] FAILED: ${err.message}`);
  }

  // 2. Supabase
  console.log('\nTesting Supabase...');
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in process.env');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.storage.from('resumes').createSignedUrl('test-resume.pdf', 300);
    if (error) {
      console.error(`[SUPABASE] STORAGE FAILED: ${error.message}`);
    } else {
      console.log(`[SUPABASE] STORAGE Success! Generated signed URL: ${data.signedUrl.substring(0, 50)}...`);
    }
  } catch (err: any) {
    console.error(`[SUPABASE] FAILED: ${err.message}`);
  }

  console.log('\nTesting Gemini...');
  console.log('[GEMINI] NOT VERIFIED (No SDK configured in AI Gateway)');

  console.log('\n--- END VERIFICATION ---');
}

main();
