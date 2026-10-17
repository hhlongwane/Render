// Starter integration for a Vite-based JavaScript app.
// Install @supabase/supabase-js and set VITE_SUPABASE_URL plus
// VITE_SUPABASE_ANON_KEY in your app's local/deployment environment.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Sign in first to access your Survival AI data.');
  return data.user;
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function saveMemory(memoryKey, content, metadata = {}) {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('ai_memories')
    .upsert(
      {
        user_id: user.id,
        memory_key: memoryKey,
        content,
        metadata,
      },
      { onConflict: 'user_id,memory_key' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listMemories({ limit = 100 } = {}) {
  await requireUser();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  const { data, error } = await supabase
    .from('ai_memories')
    .select('id,memory_key,content,metadata,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw error;
  return data;
}

export async function deleteMemory(memoryId) {
  await requireUser();
  const { error } = await supabase.from('ai_memories').delete().eq('id', memoryId);
  if (error) throw error;
}

export async function uploadPrivateFile(file) {
  const user = await requireUser();
  if (!(file instanceof File)) throw new TypeError('Choose a file to upload.');

  const safeName = file.name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-120) || 'upload.bin';
  const objectPath = user.id + '/' + crypto.randomUUID() + '-' + safeName;

  const { data, error } = await supabase.storage
    .from('survival-ai-files')
    .upload(objectPath, file, { upsert: false });

  if (error) throw error;
  return data;
}

export async function createPrivateFileDownloadUrl(objectPath, expiresInSeconds = 60) {
  await requireUser();
  const lifetime = Math.max(1, Math.min(Number(expiresInSeconds) || 60, 3600));
  const { data, error } = await supabase.storage
    .from('survival-ai-files')
    .createSignedUrl(objectPath, lifetime);

  if (error) throw error;
  return data.signedUrl;
}
