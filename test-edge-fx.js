import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://losocdmndydgmqdrcoyc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc29jZG1uZHlkZ21xZHJjb3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjMzMDMsImV4cCI6MjA5MDczOTMwM30.qxzY6XrRAdEellIxhzHMSiZvD2WOlTVyj1ozcfidpgE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWithAuth() {
  console.log('Logging in...');
  const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'prvtonbld@gmail.com',
    password: 'Success23!'
  });

  if (signInError || !session) {
    console.error('Sign in failed:', signInError);
    return;
  }

  console.log('Logged in as:', session.user.email);
  
  try {
    console.log('Invoking create-checkout...');
    const response = await supabase.functions.invoke('create-checkout', {
      body: { tier: 'pro' }
    });
    
    console.log('RESPONSE:', response);
  } catch (e) {
    console.error('EXCEPTION:', e);
  }
}

testWithAuth();
