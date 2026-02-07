/**
 * UI Rendering for schedule visualization
 * Displays three schedule proposals with timeline visual
 */

// Category color mapping - 3 color groups by task type
// RED = Focus/creative work | BLUE = Communication | GREEN = Admin/physical
const CATEGORY_COLORS = {
  "Deep Work": { bg: "#ef4444", text: "#ffffff", border: "#f87171" }, // Red - focus
  Creative: { bg: "#dc2626", text: "#ffffff", border: "#ef4444" }, // Red - focus
  Calls: { bg: "#3b82f6", text: "#ffffff", border: "#60a5fa" }, // Blue - communication
  Meeting: { bg: "#2563eb", text: "#ffffff", border: "#3b82f6" }, // Blue - communication
  Communication: { bg: "#1d4ed8", text: "#ffffff", border: "#2563eb" }, // Blue - communication
  Admin: { bg: "#22c55e", text: "#ffffff", border: "#4ade80" }, // Green - admin
  Errands: { bg: "#16a34a", text: "#ffffff", border: "#22c55e" }, // Green - physical
  Break: { bg: "#15803d", text: "#ffffff", border: "#16a34a" }, // Green - break
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
 * Creates a timeline task item (pill/chip style)
 * @param {Object} task - Task object
 * @param {number} startMinutes - Minutes from schedule start
 * @param {Date} startTime - Schedule start time
 * @param {boolean} isLast - Whether this is the last item
 * @returns {HTMLElement} Timeline item element
 */
function createTimelineItem(task, startMinutes, startTime, isLast) {
  const item = document.createElement("div");
  item.className = `timeline-item${isLast ? " last" : ""}`;

  const colors = CATEGORY_COLORS[task.category] || CATEGORY_COLORS.Break;
  const timeStart = formatTime(startMinutes, startTime);
  const timeEnd = formatTime(startMinutes + task.duration, startTime);

  const isBreak = task.category === "Break";
  const priorityIndicator =
    task.priority === "high"
      ? '<span class="priority-dot high"></span>'
      : task.priority === "low"
        ? '<span class="priority-dot low"></span>'
        : "";

  item.innerHTML = `
    <div class="timeline-time">
      <span class="time-start">${timeStart}</span>
      <span class="time-end">${timeEnd}</span>
    </div>
    <div class="timeline-marker">
      <div class="timeline-dot" style="background: ${colors.bg}; box-shadow: 0 0 0 3px #ffffff, 0 0 0 4px ${colors.bg};"></div>
      ${!isLast ? '<div class="timeline-line"></div>' : ""}
    </div>
    <div class="timeline-pill" style="border-left-color: ${colors.bg};">
      ${isBreak ? '<span class="pill-icon">☕</span>' : ""}
      <span class="pill-name">${task.task}</span>
      <span class="pill-duration">${task.duration}m</span>
      ${priorityIndicator}
    </div>
  `;

  if (task.rationale) {
    item.setAttribute("data-reason", task.rationale);
    item.classList.add("has-tooltip");
  }

  return item;
}

/**
 * Renders a single schedule column with timeline
 * @param {Array} tasks - Array of tasks
 * @param {HTMLElement} container - Container element
 * @param {Date} startTime - Schedule start time
 */
function renderScheduleColumn(tasks, container, startTime) {
  container.innerHTML = "";

  // Add timeline wrapper
  const timeline = document.createElement("div");
  timeline.className = "timeline";

  let currentMinutes = 0;

  tasks.forEach((task, index) => {
    const isLast = index === tasks.length - 1;
    timeline.appendChild(
      createTimelineItem(task, currentMinutes, startTime, isLast),
    );
    currentMinutes += task.duration;
  });

  container.appendChild(timeline);
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
    if (switchesSaved > 0) {
      switchesSavedEl.textContent = `(${switchesSaved} fewer than Priority)`;
    } else if (switchesSaved < 0) {
      switchesSavedEl.textContent = `(${Math.abs(switchesSaved)} more than Priority)`;
    } else {
      switchesSavedEl.textContent = `(same as Priority)`;
    }
  }

  console.log(`[RENDER] Schedules rendered with start time ${startTimeStr}`);
}
