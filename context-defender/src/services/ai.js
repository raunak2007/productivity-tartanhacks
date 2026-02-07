/**
 * AI Service - Cognitive Science Consultant
 * Analyzes task schedules and quantifies context switching costs
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Fetches an optimized schedule with cognitive switching cost analysis
 * @param {string} userText - Raw text containing tasks to be scheduled
 * @returns {Promise<{chaos: Array, flow: Array, metrics: Object}>} Schedule with penalties and metrics
 */
export async function fetchSchedule(userText) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your environment.",
    );
  }

  const systemPrompt = `You are an Expert in Cognitive Science and Industrial Engineering specializing in productivity optimization and context switching costs.

CRITICAL TASK: Parse the user's raw input into TWO schedules with scientifically-grounded context switching penalties.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CHAOS SCHEDULE (Original Order + Penalties)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For EVERY task (except the first one):
1. Analyze BOTH the PREVIOUS task and the CURRENT task content
2. Estimate a specific "switch_cost" in minutes based on the cognitive distance between them
3. Provide a brief "switch_reason" explaining why this specific transition incurs this penalty

Context Switching Cost Analysis (Task-Specific):
You must analyze the ACTUAL TASKS, not just categories. Consider:

COGNITIVE STATE REQUIRED:
- Deep focus state (coding, writing, complex analysis) → High mental load
- Administrative state (email, scheduling, expenses) → Light processing
- Social/communication state (calls, meetings) → Different mental mode
- Physical state (errands, breaks) → Non-cognitive

SWITCHING COST EXAMPLES:
• 20-25 mins: "Shifting from deep debugging session to checking emails requires complete mental context reset"
• 18-22 mins: "Transitioning from writing documentation to making phone calls disrupts flow state"
• 12-15 mins: "Moving from code review to running errands requires context closure and mental transition"
• 8-12 mins: "Switching from scheduling meeting to expense reports involves different admin systems"
• 3-5 mins: "Transitioning between similar admin tasks like email to Slack requires minimal overhead"
• 2-4 mins: "Moving from one meeting to another maintains social/communication state"

CRITICAL: Estimate the EXACT switching cost based on:
- Depth of focus required by previous task (deeper = higher exit cost)
- Cognitive distance between task types (coding → email is HUGE)
- Mental state preservation (similar tasks = lower cost)
- Context closure needs (complex work needs wind-down time)

The first task has switch_cost: 0 and switch_reason: "First task of the day"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FLOW SCHEDULE (Optimized + Rationale)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Group tasks by category to minimize switching:
- Deep Work tasks together (coding, writing, analysis)
- Admin tasks batched (email, expenses, scheduling)
- Calls/Meetings grouped when possible
- Errands consolidated

For EVERY task, provide a "rationale" explaining its placement:
Example: "Batched with other Admin tasks to preserve focus state"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
METRICS CALCULATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Calculate:
- total_chaos_duration: Sum of all task durations + all switch_costs
- total_flow_duration: Sum of all task durations only (minimal switching)
- time_saved: total_chaos_duration - total_flow_duration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ OUTPUT FORMAT (CRITICAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON. NO markdown code blocks. NO explanations.

EXACT SCHEMA:
{
  "chaos": [
    {
      "task": "Task name",
      "category": "Deep Work|Admin|Calls|Errands",
      "duration": <number in minutes>,
      "switch_cost": <number in minutes, 0 for first task>,
      "switch_reason": "Brief explanation of the cognitive penalty"
    }
  ],
  "flow": [
    {
      "task": "Task name",
      "category": "Deep Work|Admin|Calls|Errands",
      "duration": <number in minutes>,
      "rationale": "Why this task is placed here in the optimized schedule"
    }
  ],
  "metrics": {
    "total_chaos_duration": <sum of durations + switch_costs>,
    "total_flow_duration": <sum of durations only>,
    "time_saved": <difference between chaos and flow>
  }
}

Categories MUST be one of: "Deep Work", "Admin", "Calls", "Errands", "Break", "Communication"

REMEMBER: 
- First chaos task has switch_cost: 0
- Flow tasks have NO switch_cost (they're optimized)
- Be realistic with switching penalties based on cognitive science research`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Context Defender",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userText,
          },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API request failed: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ""
        }`,
      );
    }

    const data = await response.json();

    // Extract the content from the response
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from OpenRouter API");
    }

    // Parse the JSON response
    let schedule;
    try {
      // Remove potential markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      schedule = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error(
        `Failed to parse AI response as JSON: ${parseError.message}`,
      );
    }

    // Validate the structure
    if (!schedule.chaos || !Array.isArray(schedule.chaos)) {
      throw new Error(
        'Invalid schedule format: missing or invalid "chaos" array',
      );
    }

    if (!schedule.flow || !Array.isArray(schedule.flow)) {
      throw new Error(
        'Invalid schedule format: missing or invalid "flow" array',
      );
    }

    if (!schedule.metrics || typeof schedule.metrics !== "object") {
      throw new Error(
        'Invalid schedule format: missing or invalid "metrics" object',
      );
    }

    // Validate chaos tasks
    schedule.chaos.forEach((task, index) => {
      if (!task.task || typeof task.task !== "string") {
        throw new Error(
          `Invalid task at chaos[${index}]: missing or invalid "task" field`,
        );
      }
      if (!task.category || typeof task.category !== "string") {
        throw new Error(
          `Invalid task at chaos[${index}]: missing or invalid "category" field`,
        );
      }
      if (typeof task.duration !== "number" || task.duration <= 0) {
        throw new Error(
          `Invalid task at chaos[${index}]: missing or invalid "duration" field`,
        );
      }
      if (typeof task.switch_cost !== "number" || task.switch_cost < 0) {
        throw new Error(
          `Invalid task at chaos[${index}]: missing or invalid "switch_cost" field`,
        );
      }
      if (!task.switch_reason || typeof task.switch_reason !== "string") {
        throw new Error(
          `Invalid task at chaos[${index}]: missing or invalid "switch_reason" field`,
        );
      }
    });

    // Validate flow tasks
    schedule.flow.forEach((task, index) => {
      if (!task.task || typeof task.task !== "string") {
        throw new Error(
          `Invalid task at flow[${index}]: missing or invalid "task" field`,
        );
      }
      if (!task.category || typeof task.category !== "string") {
        throw new Error(
          `Invalid task at flow[${index}]: missing or invalid "category" field`,
        );
      }
      if (typeof task.duration !== "number" || task.duration <= 0) {
        throw new Error(
          `Invalid task at flow[${index}]: missing or invalid "duration" field`,
        );
      }
      if (!task.rationale || typeof task.rationale !== "string") {
        throw new Error(
          `Invalid task at flow[${index}]: missing or invalid "rationale" field`,
        );
      }
    });

    // Validate metrics
    const requiredMetrics = [
      "total_chaos_duration",
      "total_flow_duration",
      "time_saved",
    ];
    requiredMetrics.forEach((metric) => {
      if (typeof schedule.metrics[metric] !== "number") {
        throw new Error(
          `Invalid metrics: missing or invalid "${metric}" field`,
        );
      }
    });

    return schedule;
  } catch (error) {
    // Log the error for debugging
    console.error("Error in fetchSchedule:", error);

    // Re-throw with a user-friendly message
    if (error.message.includes("fetch")) {
      throw new Error(
        `Network error while contacting OpenRouter: ${error.message}`,
      );
    }

    throw error;
  }
}
