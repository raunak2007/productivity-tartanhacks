/**
 * AI Service - Cognitive Science Consultant
 * Analyzes task schedules and generates multiple optimization strategies
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Fetches three optimized schedule proposals
 * @param {string} userText - Raw text containing tasks to be scheduled
 * @returns {Promise<{efficiency: Array, balanced: Array, deadline: Array}>} Three schedule proposals
 */
export async function fetchSchedule(userText) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your environment.",
    );
  }

  const systemPrompt = `You are an Expert in Cognitive Science and Industrial Engineering specializing in productivity optimization.

CRITICAL TASK: Parse the user's tasks and generate THREE different schedule proposals.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 SCHEDULE 1: EFFICIENCY (Pure Focus)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Batch similar tasks together to minimize context switching
- Group by category: Deep Work → Admin → Calls → Errands
- No breaks included - maximum throughput
- Best for: Short intense work sessions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧘 SCHEDULE 2: BALANCED (Sustainable)  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Group similar tasks but add recovery breaks
- Insert a 10-minute break after every 90 minutes of work
- Insert a 5-minute break between different task categories
- Best for: Full workday, preventing burnout

For breaks, use:
{
  "task": "Break",
  "category": "Break",
  "duration": 5 or 10,
  "rationale": "Recovery break to prevent mental fatigue"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ SCHEDULE 3: DEADLINE (Priority First)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Order by inferred priority/urgency
- Tasks that sound urgent or important come first
- Keywords like "urgent", "deadline", "important", "ASAP" = high priority
- Deep Work tasks that require focus = higher priority than admin
- Best for: When you have deadlines or limited time

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 TASK CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Categories (pick the best fit):
- "Deep Work": coding, writing, designing, analysis, research, studying
- "Admin": email, scheduling, paperwork, expenses, planning
- "Calls": phone calls, video meetings, interviews
- "Communication": Slack, messaging, quick chats
- "Errands": shopping, appointments, physical tasks
- "Break": rest, recovery (only add in balanced schedule)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ OUTPUT FORMAT (CRITICAL - JSON ONLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON. NO markdown. NO explanation text.

{
  "efficiency": [
    {
      "task": "Task name",
      "category": "Deep Work|Admin|Calls|Communication|Errands",
      "duration": <number in minutes>,
      "rationale": "Why placed here"
    }
  ],
  "balanced": [
    {
      "task": "Task name or Break",
      "category": "Category or Break",
      "duration": <number in minutes>,
      "rationale": "Why placed here"
    }
  ],
  "deadline": [
    {
      "task": "Task name",
      "category": "Deep Work|Admin|Calls|Communication|Errands",
      "duration": <number in minutes>,
      "priority": "high|medium|low",
      "rationale": "Why this priority"
    }
  ]
}

IMPORTANT:
- All three schedules must contain the SAME user tasks (just reordered)
- Only "balanced" schedule should include Break tasks
- Duration must match what user specified
- Keep task names exactly as user wrote them
- If a task has [Category: X] specified, you MUST use that exact category - do not override user's choice`;

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
        model: "openai/gpt-4o-mini",
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
        temperature: 0.3,
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

    // Validate the three schedules exist
    const requiredSchedules = ["efficiency", "balanced", "deadline"];
    requiredSchedules.forEach((name) => {
      if (!schedule[name] || !Array.isArray(schedule[name])) {
        throw new Error(
          `Invalid schedule format: missing or invalid "${name}" array`,
        );
      }
    });

    // Validate tasks in each schedule
    requiredSchedules.forEach((scheduleName) => {
      schedule[scheduleName].forEach((task, index) => {
        if (!task.task || typeof task.task !== "string") {
          throw new Error(
            `Invalid task at ${scheduleName}[${index}]: missing "task" field`,
          );
        }
        if (!task.category || typeof task.category !== "string") {
          throw new Error(
            `Invalid task at ${scheduleName}[${index}]: missing "category" field`,
          );
        }
        if (typeof task.duration !== "number" || task.duration <= 0) {
          throw new Error(
            `Invalid task at ${scheduleName}[${index}]: missing "duration" field`,
          );
        }
      });
    });

    // Calculate metrics for each schedule
    const calcDuration = (tasks) =>
      tasks.reduce((sum, t) => sum + t.duration, 0);

    schedule.metrics = {
      efficiency: { total_duration: calcDuration(schedule.efficiency) },
      balanced: { total_duration: calcDuration(schedule.balanced) },
      deadline: { total_duration: calcDuration(schedule.deadline) },
    };

    console.log("[AI] Generated 3 schedules:", {
      efficiency: schedule.efficiency.length + " tasks",
      balanced: schedule.balanced.length + " tasks",
      deadline: schedule.deadline.length + " tasks",
      metrics: schedule.metrics,
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
