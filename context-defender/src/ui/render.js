/**
 * UI Rendering for schedule visualization
 * Displays chaos vs optimized schedules with AI-calculated switching penalties
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
 * Creates a task card element for chaos schedule
 * @param {Object} task - Task object with task, category, duration, switch_cost, switch_reason
 * @returns {HTMLElement} Task card element
 */
function createChaosTaskCard(task) {
  const card = document.createElement("div");
  card.className = "task-card";

  const color = CATEGORY_COLORS[task.category] || "#6b7280";
  card.style.borderLeftColor = color;

  // Add switch reason as tooltip if it exists
  if (task.switch_reason) {
    card.setAttribute("data-reason", task.switch_reason);
    card.classList.add("has-tooltip");
  }

  const switchCostDisplay =
    task.switch_cost > 0
      ? `<span style="color: #ef4444; font-size: 0.85rem; margin-left: 0.5rem;">+${task.switch_cost}m</span>`
      : "";

  card.innerHTML = `
    <div class="task-header">
      <span class="task-name">${task.task}</span>
      <span class="task-duration">${task.duration}m${switchCostDisplay}</span>
    </div>
    <div class="task-category" style="color: ${color}">
      ${task.category}
    </div>
  `;

  return card;
}

/**
 * Creates a task card element for flow schedule
 * @param {Object} task - Task object with task, category, duration, rationale
 * @returns {HTMLElement} Task card element
 */
function createFlowTaskCard(task) {
  const card = document.createElement("div");
  card.className = "task-card";

  const color = CATEGORY_COLORS[task.category] || "#6b7280";
  card.style.borderLeftColor = color;

  if (task.rationale) {
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
 * @param {number} cost - Switching cost in minutes
 * @param {string} reason - Reason for the penalty
 * @returns {HTMLElement} Penalty card element
 */
function createPenaltyCard(cost, reason) {
  const card = document.createElement("div");
  card.className = "penalty-card";

  if (reason) {
    card.setAttribute("data-reason", reason);
    card.classList.add("has-tooltip");
  }

  card.innerHTML = `
    <div class="penalty-content">
      <span class="penalty-icon">⚠️</span>
      <span class="penalty-text">Switching Cost</span>
      <span class="penalty-time">+${cost}m</span>
    </div>
  `;
  return card;
}

/**
 * Renders both chaos and flow schedules
 * @param {Array} chaosData - Original task order with switch_cost and switch_reason
 * @param {Array} flowData - Optimized task order with rationale
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

  // === CHAOS SCHEDULE (with AI-calculated penalties) ===
  let chaosTotalDuration = 0;
  let totalSwitchCost = 0;
  let switchCount = 0;

  chaosData.forEach((task, index) => {
    // Add penalty card if there's a switch cost
    if (task.switch_cost > 0) {
      chaosList.appendChild(
        createPenaltyCard(task.switch_cost, task.switch_reason),
      );
      totalSwitchCost += task.switch_cost;
      switchCount++;
    }

    // Add task card
    chaosList.appendChild(createChaosTaskCard(task));
    chaosTotalDuration += task.duration;
  });

  const chaosTotalTime = chaosTotalDuration + totalSwitchCost;

  // === FLOW SCHEDULE (optimized, minimal switching) ===
  let flowTotalDuration = 0;

  flowData.forEach((task) => {
    flowList.appendChild(createFlowTaskCard(task));
    flowTotalDuration += task.duration;
  });

  // === UPDATE STATS ===
  const chaosTimeElement = document.getElementById("chaosTime");
  const flowTimeElement = document.getElementById("flowTime");

  if (chaosTimeElement) {
    chaosTimeElement.textContent = `${chaosTotalTime} mins`;
    if (totalSwitchCost > 0) {
      chaosTimeElement.setAttribute(
        "data-penalty",
        `(+${totalSwitchCost}m penalty)`,
      );
    }
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

  console.log(`[RENDER STATS]
    Chaos: ${chaosTotalTime} mins (${chaosTotalDuration} work + ${totalSwitchCost} penalties)
    Flow: ${flowTotalDuration} mins
    Switches: ${switchCount}
    Time Saved: ${chaosTotalTime - flowTotalDuration} mins
  `);
}
