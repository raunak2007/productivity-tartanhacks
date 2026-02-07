/**
 * UI Rendering for schedule visualization
 * Displays three schedule proposals with time slots
 */

// Category color mapping
const CATEGORY_COLORS = {
  "Deep Work": "#ef4444", // Red
  Admin: "#f59e0b", // Yellow
  Calls: "#3b82f6", // Blue
  Errands: "#22c55e", // Green
  Communication: "#3b82f6", // Blue (alias for Calls)
  Meeting: "#8b5cf6", // Purple
  Creative: "#ec4899", // Pink
  Break: "#6b7280", // Gray
};

/**
 * Format time from minutes since midnight
 * @param {number} minutes - Minutes since start time
 * @param {Date} startTime - Base start time
 * @returns {string} Formatted time like "9:30 AM"
 */
function formatTime(minutes, startTime) {
  const time = new Date(startTime.getTime() + minutes * 60000);
  return time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Creates a task card element with time display
 * @param {Object} task - Task object
 * @param {number} startMinutes - Minutes from schedule start
 * @param {Date} startTime - Schedule start time
 * @returns {HTMLElement} Task card element
 */
function createTaskCard(task, startMinutes, startTime) {
  const card = document.createElement("div");
  card.className = "task-card";

  const color = CATEGORY_COLORS[task.category] || "#6b7280";
  card.style.borderLeftColor = color;

  if (task.rationale) {
    card.setAttribute("data-reason", task.rationale);
    card.classList.add("has-tooltip");
  }

  const timeStart = formatTime(startMinutes, startTime);
  const timeEnd = formatTime(startMinutes + task.duration, startTime);
  const priorityBadge =
    task.priority && task.priority !== "medium"
      ? `<span class="priority-badge priority-${task.priority}">${task.priority}</span>`
      : "";

  card.innerHTML = `
    <div class="task-time-slot">${timeStart} - ${timeEnd}</div>
    <div class="task-header">
      <span class="task-name">${task.task}</span>
      <span class="task-duration">${task.duration}m</span>
    </div>
    <div class="task-meta">
      <span class="task-category" style="color: ${color}">${task.category}</span>
      ${priorityBadge}
    </div>
  `;

  return card;
}

/**
 * Creates a break card element
 * @param {Object} task - Break task object
 * @param {number} startMinutes - Minutes from schedule start
 * @param {Date} startTime - Schedule start time
 * @returns {HTMLElement} Break card element
 */
function createBreakCard(task, startMinutes, startTime) {
  const card = document.createElement("div");
  card.className = "task-card break-card";

  const timeStart = formatTime(startMinutes, startTime);
  const timeEnd = formatTime(startMinutes + task.duration, startTime);

  card.innerHTML = `
    <div class="task-time-slot">${timeStart} - ${timeEnd}</div>
    <div class="break-content">
      <span class="break-icon">☕</span>
      <span class="break-text">Break</span>
      <span class="break-duration">${task.duration}m</span>
    </div>
  `;

  return card;
}

/**
 * Renders a single schedule column
 * @param {Array} tasks - Array of tasks
 * @param {HTMLElement} container - Container element
 * @param {Date} startTime - Schedule start time
 */
function renderScheduleColumn(tasks, container, startTime) {
  container.innerHTML = "";
  let currentMinutes = 0;

  tasks.forEach((task) => {
    if (task.category === "Break") {
      container.appendChild(createBreakCard(task, currentMinutes, startTime));
    } else {
      container.appendChild(createTaskCard(task, currentMinutes, startTime));
    }
    currentMinutes += task.duration;
  });
}

/**
 * Renders all three schedule proposals
 * @param {Object} scheduleData - Object with efficiency, balanced, deadline arrays
 * @param {string} startTimeStr - Start time in HH:MM format (24h)
 */
export function renderSchedules(scheduleData, startTimeStr = "09:00") {
  // Parse start time
  const [hours, minutes] = startTimeStr.split(":").map(Number);
  const startTime = new Date();
  startTime.setHours(hours, minutes, 0, 0);

  // Get containers
  const efficiencyList = document.getElementById("efficiencyList");
  const balancedList = document.getElementById("balancedList");
  const deadlineList = document.getElementById("deadlineList");

  if (!efficiencyList || !balancedList || !deadlineList) {
    console.error("Schedule containers not found in DOM");
    return;
  }

  // Render each schedule
  renderScheduleColumn(
    scheduleData.efficiency || [],
    efficiencyList,
    startTime,
  );
  renderScheduleColumn(scheduleData.balanced || [], balancedList, startTime);
  renderScheduleColumn(scheduleData.deadline || [], deadlineList, startTime);

  // Calculate and display end times
  const calcEndTime = (tasks) => tasks.reduce((sum, t) => sum + t.duration, 0);

  const efficiencyDuration = calcEndTime(scheduleData.efficiency || []);
  const balancedDuration = calcEndTime(scheduleData.balanced || []);
  const deadlineDuration = calcEndTime(scheduleData.deadline || []);

  // Update time badges
  const efficiencyTime = document.getElementById("efficiencyTime");
  const balancedTime = document.getElementById("balancedTime");
  const deadlineTime = document.getElementById("deadlineTime");

  if (efficiencyTime) {
    const endTime = formatTime(efficiencyDuration, startTime);
    efficiencyTime.textContent = `${efficiencyDuration} mins • Done by ${endTime}`;
  }
  if (balancedTime) {
    const endTime = formatTime(balancedDuration, startTime);
    balancedTime.textContent = `${balancedDuration} mins • Done by ${endTime}`;
  }
  if (deadlineTime) {
    const endTime = formatTime(deadlineDuration, startTime);
    deadlineTime.textContent = `${deadlineDuration} mins • Done by ${endTime}`;
  }

  // Calculate and display time saved (balanced - efficiency)
  const timeSaved = balancedDuration - efficiencyDuration;
  const timeSavedEl = document.getElementById("timeSavedValue");
  if (timeSavedEl && timeSaved > 0) {
    timeSavedEl.textContent = `${timeSaved} mins`;
  } else if (timeSavedEl) {
    timeSavedEl.textContent = "0 mins";
  }

  // Calculate context switches for each schedule
  // Context switch = when consecutive tasks have different categories (excluding breaks)
  const calcContextSwitches = (tasks) => {
    let switches = 0;
    let lastCategory = null;
    for (const task of tasks) {
      if (task.category === "Break") continue; // Don't count breaks as switches
      if (lastCategory && task.category !== lastCategory) {
        switches++;
      }
      lastCategory = task.category;
    }
    return switches;
  };

  const efficiencySwitches = calcContextSwitches(scheduleData.efficiency || []);
  const deadlineSwitches = calcContextSwitches(scheduleData.deadline || []);

  // Update context switches display
  const contextSwitchEl = document.getElementById("contextSwitchValue");
  const switchesSavedEl = document.getElementById("switchesSavedValue");

  if (contextSwitchEl) {
    contextSwitchEl.textContent = `${efficiencySwitches}`;
  }
  if (switchesSavedEl) {
    const switchesSaved = deadlineSwitches - efficiencySwitches;
    switchesSavedEl.textContent =
      switchesSaved > 0 ? `${switchesSaved} fewer` : "optimal";
  }

  console.log(`[RENDER] Schedules rendered with start time ${startTimeStr}`);
}
