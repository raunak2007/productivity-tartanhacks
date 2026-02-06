// components/TaskScheduler.jsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { FiClock, FiCalendar, FiTarget, FiZap, FiCheckCircle } from 'react-icons/fi';

const TaskScheduler = ({ userId }) => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    estimated_time: null,
    priority: 'medium',
    category: 'work',
    energy_level: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [aiEstimating, setAiEstimating] = useState(false);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const estimateTimeWithAI = async (taskTitle) => {
    setAiEstimating(true);
    // Simulate AI estimation - In production, integrate with actual AI API
    setTimeout(() => {
      const estimatedTime = Math.floor(Math.random() * 120) + 15; // 15-135 minutes
      setNewTask(prev => ({ ...prev, estimated_time: estimatedTime }));
      toast.info(`AI estimates ${estimatedTime} minutes for this task`);
      setAiEstimating(false);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('tasks').insert([
      {
        ...newTask,
        user_id: userId,
        status: 'pending',
        scheduled_start: null,
        scheduled_end: null
      }
    ]);

    if (error) {
      toast.error('Failed to add task');
    } else {
      toast.success('Task added successfully');
      setNewTask({
        title: '',
        description: '',
        estimated_time: null,
        priority: 'medium',
        category: 'work',
        energy_level: 'medium'
      });
      fetchTasks();
    }
    setLoading(false);
  };

  const optimizeSchedule = async () => {
    toast.info('AI is optimizing your schedule...');
    // Simulate AI optimization
    setTimeout(() => {
      toast.success('Schedule optimized! Tasks have been rearranged for maximum productivity');
    }, 2000);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-500/20 text-red-300 border-red-500/30',
      medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">AI Task Scheduler</h2>
            <p className="text-gray-300">Let AI optimize your productivity</p>
          </div>
          <button
            onClick={optimizeSchedule}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:opacity-90 transition"
          >
            <FiZap />
            <span>AI Optimize Schedule</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Task Title *</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What needs to be done?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="learning">Learning</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Add details about the task..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <div className="flex items-center justify-between">
                  <span>Estimated Time (minutes)</span>
                  <button
                    type="button"
                    onClick={() => estimateTimeWithAI(newTask.title)}
                    disabled={aiEstimating || !newTask.title}
                    className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
                  >
                    {aiEstimating ? 'AI Estimating...' : 'AI Estimate'}
                  </button>
                </div>
              </label>
              <input
                type="number"
                value={newTask.estimated_time || ''}
                onChange={(e) => setNewTask({ ...newTask, estimated_time: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Or let AI estimate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Energy Level Required</label>
              <select
                value={newTask.energy_level}
                onChange={(e) => setNewTask({ ...newTask, energy_level: e.target.value })}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">High Energy</option>
                <option value="medium">Medium Energy</option>
                <option value="low">Low Energy</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Adding Task...' : 'Add Task to Schedule'}
          </button>
        </form>
      </div>

      {/* Task List */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border border-gray-600">
        <h3 className="text-xl font-bold mb-4">Scheduled Tasks</h3>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className={`p-4 rounded-lg border ${getPriorityColor(task.priority)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-current rounded-full"></div>
                  <div>
                    <h4 className="font-bold">{task.title}</h4>
                    <p className="text-sm opacity-75">{task.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="flex items-center space-x-1 text-sm">
                        <FiClock />
                        <span>{task.estimated_time} min</span>
                      </span>
                      <span className="text-sm px-2 py-1 bg-gray-600/50 rounded">
                        {task.category}
                      </span>
                      <span className="text-sm px-2 py-1 bg-gray-600/50 rounded">
                        {task.energy_level} energy
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-600/50 rounded-lg">
                    <FiCheckCircle />
                  </button>
                  <button className="p-2 hover:bg-gray-600/50 rounded-lg">
                    <FiCalendar />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskScheduler;
