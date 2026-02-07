import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

// Initialize Supabase client
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
);

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

/**
 * Sign up with email and password
 * @param {string} email
 * @param {string} password
 * @param {string} fullName
 * @returns {Promise<{user, error}>}
 */
export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/pages/dashboard.html`,
    },
  });

  if (error) {
    return { user: null, error };
  }

  // Create profile after signup (works with auto-confirm)
  if (data.user) {
    await createUserProfile(data.user.id, fullName, email);
  }

  return { user: data.user, error: null };
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, error}>}
 */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data?.user, error };
}

/**
 * Sign in with Google OAuth
 * @returns {Promise<{error}>}
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/pages/dashboard.html`,
    },
  });

  return { error };
}

/**
 * Sign out current user
 * @returns {Promise<{error}>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current session
 * @returns {Promise<{session, error}>}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session, error };
}

/**
 * Get current user
 * @returns {Promise<{user, error}>}
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user, error };
}

/**
 * Listen to auth state changes
 * @param {Function} callback - Called with (event, session)
 * @returns {Object} Subscription object with unsubscribe method
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

/**
 * Create user profile
 * @param {string} userId
 * @param {string} fullName
 * @param {string} email
 * @returns {Promise<{profile, error}>}
 */
export async function createUserProfile(userId, fullName, email) {
  const { data, error } = await supabase
    .from("profiles")
    .insert([
      {
        id: userId,
        full_name: fullName,
        email: email,
      },
    ])
    .select()
    .single();

  return { profile: data, error };
}

/**
 * Get user profile
 * @param {string} userId
 * @returns {Promise<{profile, error}>}
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { profile: data, error };
}

/**
 * Update user profile
 * @param {string} userId
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<{profile, error}>}
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  return { profile: data, error };
}

// ============================================
// TASK FUNCTIONS
// ============================================

/**
 * Create a new task
 * @param {Object} task - Task object
 * @returns {Promise<{task, error}>}
 */
export async function createTask(task) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("createTask: User not authenticated");
    return { task: null, error: new Error("Not authenticated") };
  }

  console.log("createTask: Saving task for user:", user.id, "Task:", task);

  const { data, error } = await supabase
    .from("tasks")
    .insert([
      {
        user_id: user.id,
        ...task,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("createTask: Error saving task:", error);
  } else {
    console.log("createTask: Task saved successfully:", data);
  }

  return { task: data, error };
}

/**
 * Get all tasks for current user
 * @returns {Promise<{tasks, error}>}
 */
export async function getTasks() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("getTasks: User not authenticated");
    return { tasks: [], error: new Error("Not authenticated") };
  }

  console.log("getTasks: Loading tasks for user:", user.id);

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTasks: Error loading tasks:", error);
  } else {
    console.log(
      "getTasks: Loaded",
      data?.length || 0,
      "tasks for user:",
      user.id,
    );
  }

  return { tasks: data || [], error };
}

/**
 * Update a task
 * @param {string} taskId
 * @param {Object} updates
 * @returns {Promise<{task, error}>}
 */
export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .select()
    .single();

  return { task: data, error };
}

/**
 * Delete a task
 * @param {string} taskId
 * @returns {Promise<{error}>}
 */
export async function deleteTask(taskId) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  return { error };
}

// ============================================
// SCHEDULE/OPTIMIZATION FUNCTIONS
// ============================================

/**
 * Save an optimization (schedule)
 * @param {Object} optimization
 * @returns {Promise<{optimization, error}>}
 */
export async function saveOptimization(optimization) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("saveOptimization: User not authenticated");
    return { optimization: null, error: new Error("Not authenticated") };
  }

  console.log("saveOptimization: Saving optimization for user:", user.id);

  const { data, error } = await supabase
    .from("optimizations")
    .insert([
      {
        user_id: user.id,
        ...optimization,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("saveOptimization: Error saving optimization:", error);
  } else {
    console.log("saveOptimization: Optimization saved successfully:", data.id);
  }

  return { optimization: data, error };
}

/**
 * Get all optimizations for current user
 * @returns {Promise<{optimizations, error}>}
 */
export async function getOptimizations() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("getOptimizations: User not authenticated");
    return { optimizations: [], error: new Error("Not authenticated") };
  }

  console.log("getOptimizations: Loading optimizations for user:", user.id);

  const { data, error } = await supabase
    .from("optimizations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getOptimizations: Error loading optimizations:", error);
  } else {
    console.log(
      "getOptimizations: Loaded",
      data?.length || 0,
      "optimizations for user:",
      user.id,
    );
  }

  return { optimizations: data || [], error };
}

/**
 * Get the latest optimization for current user
 * @returns {Promise<{optimization, error}>}
 */
export async function getLatestOptimization() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { optimization: null, error: new Error("Not authenticated") };
  }

  const { data, error } = await supabase
    .from("optimizations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return { optimization: data, error };
}

/**
 * Get global saved minutes (public function)
 * @returns {Promise<{totalMinutes, error}>}
 */
export async function getGlobalSavedMinutes() {
  const { data, error } = await supabase.rpc("get_global_saved_minutes");
  return { totalMinutes: data, error };
}
