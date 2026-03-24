import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yefvypbyakgyugoyshmw.supabase.co";
const SUPABASE_KEY = "sb_publishable_eFqcK7a1Ddg91rjtMGQ5MQ_8FxvLd4C";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function dbSignup({ username, email, password, avatar }) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ username, email, password, avatar, role: 'member', rep: 0, verified: false, following: [], bio: 'New to AquaForum 🐠' }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function dbLogin({ username, password }) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', username)
    .single();
  if (error) throw error;
  if (data.password !== password) throw new Error('Invalid password');
  return data;
}

export async function dbGetUser(id) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function dbGetAllUsers() {
  const { data, error } = await supabase.from('users').select('*').order('join_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function dbUpdateUser(id, updates) {
  const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function dbCheckBan(userId) {
  const { data } = await supabase.from('bans').select('user_id').eq('user_id', userId).single();
  return !!data;
}

// ─── Posts ────────────────────────────────────────────────────────────────────
export async function dbGetPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, replies(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizePost);
}

export async function dbCreatePost(post) {
  const { data, error } = await supabase
    .from('posts')
    .insert([{
      author_id: post.authorId,
      author_name: post.authorName,
      author_avatar: post.authorAvatar,
      title: post.title,
      body: post.body,
      category: post.category,
      flair: post.flair,
      type: post.type || 'post',
      media: post.media || [],
      poll_options: post.pollOptions || null,
      journal_updates: [],
      likes: 0,
      liked_by: [],
      bookmarked_by: [],
      pinned: false,
      removed: false,
    }])
    .select()
    .single();
  if (error) throw error;
  return normalizePost(data);
}

export async function dbUpdatePost(id, updates) {
  const dbUpdates = {};
  if (updates.likes !== undefined) dbUpdates.likes = updates.likes;
  if (updates.likedBy !== undefined) dbUpdates.liked_by = updates.likedBy;
  if (updates.bookmarkedBy !== undefined) dbUpdates.bookmarked_by = updates.bookmarkedBy;
  if (updates.pinned !== undefined) dbUpdates.pinned = updates.pinned;
  if (updates.removed !== undefined) dbUpdates.removed = updates.removed;
  if (updates.pollOptions !== undefined) dbUpdates.poll_options = updates.pollOptions;
  if (updates.journalUpdates !== undefined) dbUpdates.journal_updates = updates.journalUpdates;
  const { error } = await supabase.from('posts').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

// ─── Replies ──────────────────────────────────────────────────────────────────
export async function dbCreateReply(reply) {
  const { data, error } = await supabase
    .from('replies')
    .insert([{
      post_id: reply.postId,
      author_id: reply.authorId,
      author_name: reply.authorName,
      author_avatar: reply.authorAvatar,
      text: reply.text,
      media: reply.media || [],
      likes: 0,
      liked_by: [],
      is_bot: reply.isBot || false,
      removed: false,
    }])
    .select()
    .single();
  if (error) throw error;
  return normalizeReply(data);
}

export async function dbUpdateReply(id, updates) {
  const dbUpdates = {};
  if (updates.likes !== undefined) dbUpdates.likes = updates.likes;
  if (updates.likedBy !== undefined) dbUpdates.liked_by = updates.likedBy;
  if (updates.removed !== undefined) dbUpdates.removed = updates.removed;
  const { error } = await supabase.from('replies').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function dbGetNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(n => ({ id: n.id, type: n.type, text: n.text, postId: n.post_id, read: n.read, time: new Date(n.created_at).getTime() }));
}

export async function dbCreateNotification({ userId, type, text, postId }) {
  const { error } = await supabase.from('notifications').insert([{ user_id: userId, type, text, post_id: postId, read: false }]);
  if (error) console.error('Notification error:', error);
}

export async function dbMarkNotifsRead(userId) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  if (error) throw error;
}

// ─── DMs ──────────────────────────────────────────────────────────────────────
export async function dbGetDms(userId) {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*, dm_messages(*)')
    .or(`user1.eq.${userId},user2.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(d => ({
    id: d.id, user1: d.user1, user2: d.user2,
    messages: (d.dm_messages || []).map(m => ({ id: m.id, from: m.from_user, to: m.to_user, text: m.text, read: m.read, time: new Date(m.created_at).getTime() })).sort((a, b) => a.time - b.time)
  }));
}

export async function dbCreateDm(user1, user2) {
  const { data, error } = await supabase.from('direct_messages').insert([{ user1, user2 }]).select().single();
  if (error) throw error;
  return { id: data.id, user1: data.user1, user2: data.user2, messages: [] };
}

export async function dbSendDm({ conversationId, from, to, text }) {
  const { data, error } = await supabase.from('dm_messages').insert([{ conversation_id: conversationId, from_user: from, to_user: to, text, read: false }]).select().single();
  if (error) throw error;
  return { id: data.id, from: data.from_user, to: data.to_user, text: data.text, read: data.read, time: new Date(data.created_at).getTime() };
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export async function dbGetReports() {
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ id: r.id, postId: r.post_id, reportedBy: r.reported_by, time: new Date(r.created_at).getTime() }));
}

export async function dbCreateReport(postId, reportedBy) {
  const { error } = await supabase.from('reports').insert([{ post_id: postId, reported_by: reportedBy }]);
  if (error) throw error;
}

export async function dbDeleteReport(id) {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw error;
}

// ─── Mod Log ──────────────────────────────────────────────────────────────────
export async function dbGetModLog() {
  const { data, error } = await supabase.from('mod_log').select('*, users(username)').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data || []).map(l => ({ action: l.action, targetId: l.target_id, by: l.users?.username || 'Unknown', time: new Date(l.created_at).getTime() }));
}

export async function dbAddModLog(action, targetId, performedBy) {
  const { error } = await supabase.from('mod_log').insert([{ action, target_id: String(targetId), performed_by: performedBy }]);
  if (error) console.error('Mod log error:', error);
}

// ─── Bans ─────────────────────────────────────────────────────────────────────
export async function dbGetBans() {
  const { data, error } = await supabase.from('bans').select('user_id');
  if (error) throw error;
  return (data || []).map(b => b.user_id);
}

export async function dbBanUser(userId) {
  const { error } = await supabase.from('bans').insert([{ user_id: userId }]);
  if (error) throw error;
}

export async function dbUnbanUser(userId) {
  const { error } = await supabase.from('bans').delete().eq('user_id', userId);
  if (error) throw error;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
function normalizePost(p) {
  return {
    id: p.id,
    authorId: p.author_id,
    authorName: p.author_name,
    authorAvatar: p.author_avatar,
    title: p.title,
    body: p.body,
    category: p.category,
    flair: p.flair,
    type: p.type || 'post',
    media: p.media || [],
    pollOptions: p.poll_options || null,
    journalUpdates: p.journal_updates || [],
    likes: p.likes || 0,
    likedBy: p.liked_by || [],
    bookmarkedBy: p.bookmarked_by || [],
    pinned: p.pinned || false,
    removed: p.removed || false,
    time: new Date(p.created_at).getTime(),
    replies: (p.replies || []).map(normalizeReply).sort((a, b) => a.time - b.time),
    reports: [],
  };
}

function normalizeReply(r) {
  return {
    id: r.id,
    postId: r.post_id,
    authorId: r.author_id,
    authorName: r.author_name,
    authorAvatar: r.author_avatar,
    text: r.text,
    media: r.media || [],
    likes: r.likes || 0,
    likedBy: r.liked_by || [],
    isBot: r.is_bot || false,
    removed: r.removed || false,
    time: new Date(r.created_at).getTime(),
  };
}
