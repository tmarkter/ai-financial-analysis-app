import { getOpenAI } from "../agent/openai";

export interface AgentTask {
  id: string;
  type: "data_fetch" | "analysis" | "comparison" | "synthesis";
  description: string;
  dependencies: string[];
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
  error?: string;
}

export interface OrchestrationPlan {
  query: string;
  tasks: AgentTask[];
  finalSynthesis?: string;
}

export async function createOrchestrationPlan(query: string): Promise<OrchestrationPlan> {
  const openai = getOpenAI();
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an AI orchestration planner for financial analysis. Break down complex queries into parallel and sequential tasks.

Task Types:
- data_fetch: Get data from APIs (can run in parallel)
- analysis: Analyze fetched data (depends on data_fetch)
- comparison: Compare multiple entities (depends on their analyses)
- synthesis: Combine all insights into final answer (depends on all analyses)

Return JSON with:
{
  "tasks": [
    {
      "id": "task_1",
      "type": "data_fetch",
      "description": "Fetch Apple stock data",
      "dependencies": []
    },
    {
      "id": "task_2", 
      "type": "analysis",
      "description": "Analyze Apple financials",
      "dependencies": ["task_1"]
    }
  ]
}

Dependencies ensure proper execution order. Tasks with no dependencies run in parallel.`,
      },
      {
        role: "user",
        content: `Create an orchestration plan for: "${query}"`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const plan = JSON.parse(completion.choices[0].message.content || "{}");
  
  return {
    query,
    tasks: (plan.tasks || []).map((t: any) => ({
      ...t,
      status: "pending" as const,
    })),
  };
}

export async function executeTask(task: AgentTask, context: Map<string, any>): Promise<any> {
  const openai = getOpenAI();
  
  const dependencyResults = task.dependencies
    .map(dep => context.get(dep))
    .filter(Boolean);
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an AI agent executing a specific task in a larger workflow.
        
Task Type: ${task.type}
Description: ${task.description}

Use the dependency results to complete your task. Return structured JSON appropriate for the task type.`,
      },
      {
        role: "user",
        content: `Dependency Results: ${JSON.stringify(dependencyResults)}
        
Execute the task and return the result as JSON.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(completion.choices[0].message.content || "{}");
}

export async function orchestrate(query: string): Promise<OrchestrationPlan> {
  const plan = await createOrchestrationPlan(query);
  const results = new Map<string, any>();
  const completed = new Set<string>();
  
  // Execute tasks in dependency order
  while (completed.size < plan.tasks.length) {
    const readyTasks = plan.tasks.filter(
      task => 
        task.status === "pending" &&
        task.dependencies.every(dep => completed.has(dep))
    );
    
    if (readyTasks.length === 0) break;
    
    // Execute ready tasks in parallel
    await Promise.all(
      readyTasks.map(async (task) => {
        try {
          task.status = "running";
          const result = await executeTask(task, results);
          task.result = result;
          task.status = "completed";
          results.set(task.id, result);
          completed.add(task.id);
        } catch (error) {
          task.status = "failed";
          task.error = error instanceof Error ? error.message : "Unknown error";
        }
      })
    );
  }
  
  // Final synthesis
  const openai = getOpenAI();
  const synthesis = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are synthesizing the results of multiple AI agents into a coherent financial analysis.",
      },
      {
        role: "user",
        content: `Query: ${query}
        
Task Results: ${JSON.stringify(Array.from(results.entries()))}

Provide a comprehensive synthesis of these findings.`,
      },
    ],
  });
  
  plan.finalSynthesis = synthesis.choices[0].message.content || "";
  
  return plan;
}
