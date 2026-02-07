/**
 * Data Sync Module
 * Handles synchronization of tasks and schedules with Supabase
 * Falls back to localStorage when offline
 */

import { 
  getTasks, 
  createTask, 
  updateTask as supabaseUpdateTask,
  deleteTask as supabaseDeleteTask,
  getOptimizations,
  saveOptimization 
} from '../services/supabase.js';

// ============================================
// TASKS SYNCHRONIZATION
// ============================================

/**
 * Load all tasks from Supabase (with localStorage fallback)
 * @returns {Promise<Array>} Array of tasks
 */
export async function loadTasks() {
  try {
    const { tasks, error } = await getTasks();
    
    if (error) {
      console.error('Error loading tasks from Supabase:', error);
      return loadTasksFromLocalStorage();
    }
    
    // Convert Supabase format to dashboard format
    const dashboardTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      category: task.tags && task.tags.length > 0 ? task.tags[0] : 'other',
      priority: task.priority,
      estimatedTime: task.estimated_minutes || 30,
      energyLevel: task.tags && task.tags.includes('high-energy') ? 'high' : 
                    task.tags && task.tags.includes('low-energy') ? 'low' : 'medium',
      status: task.status,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      dueDate: task.due_date,
      actualTime: task.actual_minutes
    }));
    
    // Cache in localStorage
    localStorage.setItem('context_defender_managed_tasks', JSON.stringify(dashboardTasks));
    
    return dashboardTasks;
  } catch (error) {
    console.error('Exception loading tasks:', error);
    return loadTasksFromLocalStorage();
  }
}

/**
 * Save a new task to Supabase
 * @param {Object} task - Task object
 * @returns {Promise<Object>} Created task
 */
export async function saveTask(task) {
  try {
    // Convert dashboard format to Supabase format
    const supabaseTask = {
      title: task.title,
      description: task.description || null,
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      estimated_minutes: task.estimatedTime || task.estimated_minutes || null,
      actual_minutes: task.actualTime || task.actual_minutes || null,
      due_date: task.dueDate || task.due_date || null,
      tags: buildTaskTags(task)
    };
    
    const { task: createdTask, error } = await createTask(supabaseTask);
    
    if (error) {
      console.error('Error saving task:', error);
      // Fall back to localStorage
      saveTaskToLocalStorage(task);
      return task;
    }
    
    // Convert back to dashboard format
    const dashboardTask = {
      ...task,
      id: createdTask.id,
      createdAt: createdTask.created_at,
      updatedAt: createdTask.updated_at
    };
    
    // Update localStorage
    updateTaskInLocalStorage(dashboardTask);
    
    return dashboardTask;
  } catch (error) {
    console.error('Exception saving task:', error);
    saveTaskToLocalStorage(task);
    return task;
  }
}

/**
 * Update an existing task in Supabase
 * @param {number} taskId - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated task
 */
export async function updateTask(taskId, updates) {
  try {
    // Convert dashboard format to Supabase format
    const supabaseUpdates = {
      ...(updates.title && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.status && { status: updates.status }),
      ...(updates.priority && { priority: updates.priority }),
      ...(updates.estimatedTime && { estimated_minutes: updates.estimatedTime }),
      ...(updates.actualTime && { actual_minutes: updates.actualTime }),
      ...(updates.dueDate && { due_date: updates.dueDate }),
      ...(updates.tags && { tags: updates.tags })
    };
    
    // Add energy level and category to tags if provided
    if (updates.energyLevel || updates.category) {
      const tags = supabaseUpdates.tags || [];
      if (updates.energyLevel) tags.push(`${updates.energyLevel}-energy`);
      if (updates.category) tags.unshift(updates.category);
      supabaseUpdates.tags = tags;
    }
    
    const { task: updatedTask, error } = await supabaseUpdateTask(taskId, supabaseUpdates);
    
    if (error) {
      console.error('Error updating task:', error);
      updateTaskInLocalStorage({ id: taskId, ...updates });
      return { id: taskId, ...updates };
    }
    
    // Update localStorage
    updateTaskInLocalStorage({ id: taskId, ...updates });
    
    return updatedTask;
  } catch (error) {
    console.error('Exception updating task:', error);
    updateTaskInLocalStorage({ id: taskId, ...updates });
    return { id: taskId, ...updates };
  }
}

/**
 * Delete a task from Supabase
 * @param {number} taskId - Task ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteTask(taskId) {
  try {
    const { error } = await supabaseDeleteTask(taskId);
    
    if (error) {
      console.error('Error deleting task:', error);
      deleteTaskFromLocalStorage(taskId);
      return false;
    }
    
    deleteTaskFromLocalStorage(taskId);
    return true;
  } catch (error) {
    console.error('Exception deleting task:', error);
    deleteTaskFromLocalStorage(taskId);
    return false;
  }
}

// ============================================
// SCHEDULE/OPTIMIZATION SYNCHRONIZATION
// ============================================

/**
 * Save a schedule optimization to Supabase
 * @param {Object} optimization - Optimization data
 * @returns {Promise<Object>} Saved optimization
 */
export async function saveSchedule(optimization) {
  try {
    const { optimization: saved, error } = await saveOptimization(optimization);
    
    if (error) {
      console.error('Error saving optimization:', error);
      saveScheduleToLocalStorage(optimization);
      return optimization;
    }
    
    // Cache latest optimization
    localStorage.setItem('context_defender_latest_optimization', JSON.stringify(saved));
    
    return saved;
  } catch (error) {
    console.error('Exception saving schedule:', error);
    saveScheduleToLocalStorage(optimization);
    return optimization;
  }
}

/**
 * Load optimization history from Supabase
 * @returns {Promise<Array>} Array of optimizations
 */
export async function loadScheduleHistory() {
  try {
    const { optimizations, error } = await getOptimizations();
    
    if (error) {
      console.error('Error loading optimizations:', error);
      return loadScheduleHistoryFromLocalStorage();
    }
    
    // Cache in localStorage
    localStorage.setItem('context_defender_optimizations', JSON.stringify(optimizations));
    
    return optimizations;
  } catch (error) {
    console.error('Exception loading schedule history:', error);
    return loadScheduleHistoryFromLocalStorage();
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build tags array from task object
 */
function buildTaskTags(task) {
  const tags = [];
  
  if (task.category) tags.push(task.category);
  if (task.energyLevel) tags.push(`${task.energyLevel}-energy`);
  
  return tags.length > 0 ? tags : null;
}

/**
 * LocalStorage fallback functions
 */
function loadTasksFromLocalStorage() {
  const savedTasks = localStorage.getItem('context_defender_managed_tasks');
  return savedTasks ? JSON.parse(savedTasks) : [];
}

function saveTaskToLocalStorage(task) {
  const tasks = loadTasksFromLocalStorage();
  tasks.push(task);
  localStorage.setItem('context_defender_managed_tasks', JSON.stringify(tasks));
}

function updateTaskInLocalStorage(updatedTask) {
  const tasks = loadTasksFromLocalStorage();
  const index = tasks.findIndex(t => t.id === updatedTask.id);
  
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updatedTask };
  } else {
    tasks.push(updatedTask);
  }
  
  localStorage.setItem('context_defender_managed_tasks', JSON.stringify(tasks));
}

function deleteTaskFromLocalStorage(taskId) {
  const tasks = loadTasksFromLocalStorage();
  const filtered = tasks.filter(t => t.id !== taskId);
  localStorage.setItem('context_defender_managed_tasks', JSON.stringify(filtered));
}

function saveScheduleToLocalStorage(optimization) {
  const optimizations = loadScheduleHistoryFromLocalStorage();
  optimizations.unshift(optimization);
  localStorage.setItem('context_defender_optimizations', JSON.stringify(optimizations));
  localStorage.setItem('context_defender_latest_optimization', JSON.stringify(optimization));
}

function loadScheduleHistoryFromLocalStorage() {
  const saved = localStorage.getItem('context_defender_optimizations');
  return saved ? JSON.parse(saved) : [];
}

// ============================================
// SYNC STATUS
// ============================================

/**
 * Check if user is online and can sync with Supabase
 * @returns {Promise<boolean>}
 */
export async function canSync() {
  if (!navigator.onLine) {
    return false;
  }
  
  try {
    const { getCurrentUser } = await import('../services/supabase.js');
    const { user } = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Get sync status message
 * @returns {Promise<string>}
 */
export async function getSyncStatus() {
  const online = await canSync();
  return online ? 'Synced with cloud' : 'Offline - using local storage';
}
