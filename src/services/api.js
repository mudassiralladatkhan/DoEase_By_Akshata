import { supabase, isSupabaseConfigured } from './supabase.js';

class ApiService {
  // --- Auth ---
  async signUp({ username, email, password, mobile, timezone }) {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          mobile: mobile,
          timezone: timezone,
        }
      }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email, password) {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  onAuthStateChange(callback) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  }

  async getSession() {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getUser() {
    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, mobile, current_streak, last_streak_updated, email_notifications_enabled, timezone')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("Error fetching profile:", error);
      throw error;
    }

    return {
      ...user,
      username: profile ? profile.username : user.email,
      mobile: profile ? profile.mobile : null,
      current_streak: profile ? profile.current_streak : 0,
      last_streak_updated: profile ? profile.last_streak_updated : null,
      email_notifications_enabled: profile ? profile.email_notifications_enabled : true,
      timezone: profile ? profile.timezone : null,
    };
  }
  
  async updateUser(userId, userData) {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...userData, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    await supabase.auth.refreshSession();
    
    return data;
  }

  // --- Streak Logic ---
  async checkAndResetStreak(userId) {
    if (!isSupabaseConfigured) return;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('current_streak, last_streak_updated')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile for streak check:', error);
      return;
    }

    if (!profile.last_streak_updated || profile.current_streak === 0) {
      return; // No active streak to break
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastUpdated = new Date(profile.last_streak_updated);
    lastUpdated.setHours(0, 0, 0, 0);

    const diffTime = today - lastUpdated;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ current_streak: 0 })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Error resetting streak:', updateError);
      } else {
        await supabase.auth.refreshSession();
      }
    }
  }

  async updateStreakOnTaskCompletion(userId) {
    if (!isSupabaseConfigured) return;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('current_streak, last_streak_updated')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile for streak update:', error);
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];

    if (profile.last_streak_updated === today) {
      return; // Already updated today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    if (profile.last_streak_updated === yesterdayStr) {
      newStreak = (profile.current_streak || 0) + 1;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        last_streak_updated: today,
      })
      .eq('id', userId);

    if (updateError) throw updateError;
    
    await supabase.auth.refreshSession();
  }

  // --- Tasks ---
  async getTasks(userId) {
    if (!isSupabaseConfigured || !userId) return [];
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async addTask(userId, taskData) {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...taskData, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateTask(taskId, updates) {
    if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTask(taskId) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    if (error) throw error;
  }
}

export const api = new ApiService();
