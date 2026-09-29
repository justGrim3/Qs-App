import { supabase } from './supabaseClient';

// Returns { done: [slugs], data: { slug: {...} } } for the signed-in user.
export async function loadProgress() {
  const { data: u } = await supabase.auth.getUser();
  if (!u || !u.user) return { done: [], data: {}, userId: null };
  const { data } = await supabase.from('lesson_progress').select('lesson_slug, data').eq('user_id', u.user.id);
  const done = (data || []).map(r => r.lesson_slug);
  const map = {};
  (data || []).forEach(r => { map[r.lesson_slug] = r.data || {}; });
  return { done, data: map, userId: u.user.id };
}

export async function saveProgress(userId, slug, extra) {
  await supabase.from('lesson_progress').upsert({
    user_id: userId,
    lesson_slug: slug,
    data: extra || {},
    completed_at: new Date().toISOString()
  });
}
