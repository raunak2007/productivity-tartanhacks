/**
 * AI Service for generating optimized task schedules
 * Uses OpenRouter API to analyze and reorder tasks
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Fetches an optimized schedule from OpenAI based on user input
 * @param {string} userText - Raw text containing tasks to be scheduled
 * @returns {Promise<{chaos: Array, optimized: Array}>} Schedule with original and optimized task lists
 */
export async function fetchSchedule(userText) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your environment.",
    );
  }

  const systemPrompt = `You are an Expert Productivity Scheduler.

Your goal is to parse the user's raw text into a list of tasks and optimize their order to minimize context switching.

Output Format Requirements:
- Return ONLY valid JSON (no markdown, no code blocks, no explanations)
- The JSON must have exactly two arrays: "chaos" and "optimized"
- "chaos" contains tasks in their original order
- "optimized" contains the same tasks reordered to batch similar contexts (e.g., Deep Work sessions together, Admin tasks together, Creative work together)

Task Object Structure:
Each task must be an object with these fields:
- task: string (name/description of the task)
- category: string (e.g., "Deep Work", "Admin", "Meeting", "Creative", "Break", "Communication")
- duration: number (duration in minutes)
- rationale: string (one short sentence explaining the placement, e.g., "Batched with email to save context switching" or "Placed during peak focus hours")

Scheduling Principles:
- Batch similar context tasks together (e.g., all emails, all coding, all meetings)
- Place deep work during typical high-energy periods
- Group quick admin tasks together
- Consider natural energy flows throughout the day

Example output structure:
{
  "chaos": [
    {"task": "Check email", "category": "Communication", "duration": 15, "rationale": "Original position as requested"},
    {"task": "Write code", "category": "Deep Work", "duration": 90, "rationale": "Original position as requested"}
  ],
  "optimized": [
    {"task": "Write code", "category": "Deep Work", "duration": 90, "rationale": "Moved to start for peak focus time"},
    {"task": "Check email", "category": "Communication", "duration": 15, "rationale": "Batched with other communication tasks"}
  ]
}`;

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
        max_tokens: 2000,
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
      console.error("Failed to parse OpenAI response:", content);
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

    if (!schedule.optimized || !Array.isArray(schedule.optimized)) {
      throw new Error(
        'Invalid schedule format: missing or invalid "optimized" array',
      );
    }

    // Validate task objects
    const validateTasks = (tasks, arrayName) => {
      tasks.forEach((task, index) => {
        if (!task.task || typeof task.task !== "string") {
          throw new Error(
            `Invalid task at ${arrayName}[${index}]: missing or invalid "task" field`,
          );
        }
        if (!task.category || typeof task.category !== "string") {
          throw new Error(
            `Invalid task at ${arrayName}[${index}]: missing or invalid "category" field`,
          );
        }
        if (typeof task.duration !== "number" || task.duration <= 0) {
          throw new Error(
            `Invalid task at ${arrayName}[${index}]: missing or invalid "duration" field`,
          );
        }
        if (!task.rationale || typeof task.rationale !== "string") {
          throw new Error(
            `Invalid task at ${arrayName}[${index}]: missing or invalid "rationale" field`,
          );
        }
      });
    };

    validateTasks(schedule.chaos, "chaos");
    validateTasks(schedule.optimized, "optimized");

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
