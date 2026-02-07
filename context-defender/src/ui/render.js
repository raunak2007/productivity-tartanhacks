/**
 * UI Rendering for schedule visualization
 * Displays chaos vs optimized schedules with context switching penalties
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

const SWITCHING_COST_MINUTES = 23;

/**
 * Creates a task card element
 * @param {Object} task - Task object with task, category, duration, rationale
 * @param {boolean} includeRationale - Whether to add rationale as tooltip
 * @returns {HTMLElement} Task card element
 */
function createTaskCard(task, includeRationale = false) {
  const card = document.createElement("div");
  card.className = "task-card";

  const color = CATEGORY_COLORS[task.category] || "#6b7280";
  card.style.borderLeftColor = color;

  if (includeRationale && task.rationale) {
    card.setAttribute("data-reason", task.rationale);
    card.classList.add("has-tooltip");
  }

  card.innerHTML = `
    <div class="task-header">
      <span class="task-name">${task.task}</span>
      <span class="task-duration">${task.duration}m</span>
    </div>
    <div class="task-category" style="color: ${color}">
      ${task.category}
    </div>
  `;

  return card;
}

/**
 * Creates a penalty card for context switching
 * @returns {HTMLElement} Penalty card element
 */
function createPenaltyCard() {
  const card = document.createElement("div");
  card.className = "penalty-card";
  card.innerHTML = `
    <div class="penalty-content">
      <span class="penalty-icon">⚠️</span>
      <span class="penalty-text">Switching Cost</span>
      <span class="penalty-time">+${SWITCHING_COST_MINUTES}m</span>
    </div>
  `;
  return card;
}

/**
 * Renders both chaos and optimized schedules
 * @param {Array} chaosData - Original task order
 * @param {Array} flowData - Optimized task order
 */
export function renderSchedules(chaosData, flowData) {
  // Get containers
  const chaosList = document.getElementById("chaosList");
  const flowList = document.getElementById("flowList");

  if (!chaosList || !flowList) {
    console.error("Schedule containers not found in DOM");
    return;
  }

  // Clear existing content
  chaosList.innerHTML = "";
  flowList.innerHTML = "";

  // === CHAOS SCHEDULE (with penalties) ===
  let previousCategory = null;
  let switchCount = 0;
  let chaosTotalDuration = 0;

  chaosData.forEach((task) => {
    // Check if category changed (context switch)
    if (previousCategory !== null && previousCategory !== task.category) {
      chaosList.appendChild(createPenaltyCard());
      switchCount++;
    }

    // Add task card
    chaosList.appendChild(createTaskCard(task, false));
    chaosTotalDuration += task.duration;
    previousCategory = task.category;
  });

  // Calculate total chaos time (tasks + penalties)
  const chaosTotalTime =
    chaosTotalDuration + switchCount * SWITCHING_COST_MINUTES;

  // === FLOW SCHEDULE (optimized, no penalties) ===
  let flowTotalDuration = 0;

  flowData.forEach((task) => {
    // Add task card with rationale tooltip
    flowList.appendChild(createTaskCard(task, true));
    flowTotalDuration += task.duration;
  });

  // === UPDATE STATS ===
  const chaosTimeElement = document.getElementById("chaosTime");
  const flowTimeElement = document.getElementById("flowTime");

  if (chaosTimeElement) {
    chaosTimeElement.textContent = `${chaosTotalTime} mins`;
    chaosTimeElement.setAttribute(
      "data-penalty",
      `(+${switchCount * SWITCHING_COST_MINUTES}m penalty)`,
    );
  }

  if (flowTimeElement) {
    flowTimeElement.textContent = `${flowTotalDuration} mins`;
  }

  // Update additional stats if elements exist
  const switchCountElement = document.getElementById("switchCount");
  if (switchCountElement) {
    switchCountElement.textContent = switchCount;
  }

  const timeSavedElement = document.getElementById("timeSaved");
  if (timeSavedElement) {
    const saved = chaosTotalTime - flowTotalDuration;
    timeSavedElement.textContent = `${saved} mins`;
    timeSavedElement.style.color = saved > 0 ? "#22c55e" : "#6b7280";
  }

  console.log(`📊 Render Stats:
    Chaos: ${chaosTotalTime} mins (${chaosTotalDuration} work + ${switchCount * SWITCHING_COST_MINUTES} penalties)
    Flow: ${flowTotalDuration} mins
    Switches: ${switchCount}
    Time Saved: ${chaosTotalTime - flowTotalDuration} mins
  `);
}
