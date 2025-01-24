-- Additional materials for Prompt Engineering Basics
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Interactive Exercise: Basic Prompts',
  '# Interactive Exercise: Writing Basic Prompts

## Exercise 1: Role-based Prompting
Write a prompt for each of these scenarios:

1. You need a data scientist to analyze customer churn data
2. You need a marketing expert to write email copy
3. You need a software architect to review system design

## Exercise 2: Task Decomposition
Break down these complex tasks into smaller prompts:

1. Creating a full marketing campaign
2. Debugging a complex application
3. Writing technical documentation

## Exercise 3: Output Format Control
Write prompts that specify these output formats:

1. JSON structure for API response
2. Markdown table for data comparison
3. Bullet points for action items

Submit your answers in the text area below.',
  'exercise',
  id,
  3
from zen_learning_paths where name = 'Fundamentals of Prompt Engineering';

-- Video content for Prompt Engineering
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Video: Prompt Engineering Best Practices',
  '# Video: Prompt Engineering Best Practices

[Video Placeholder]

## Key Topics Covered
1. Clear and specific instructions
2. Context setting
3. Example usage
4. Common pitfalls
5. Real-world applications

## Practice Questions
1. What makes a prompt effective?
2. How do you handle ambiguous responses?
3. When should you use examples in prompts?',
  'video',
  id,
  4
from zen_learning_paths where name = 'Fundamentals of Prompt Engineering';

-- Additional materials for Advanced Prompt Patterns
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Few-Shot Learning Patterns',
  '# Few-Shot Learning in Prompt Engineering

## Understanding Few-Shot Learning
Few-shot learning helps models understand patterns through examples.

## Example Implementation
```
Classification task:
Input: "The product arrived damaged"
Category: Complaint

Input: "Great customer service!"
Category: Praise

Input: "When will my order arrive?"
Category: Inquiry

Input: [user input]
Category:
```

## Best Practices
1. Use consistent formatting
2. Provide diverse examples
3. Match the target task
4. Keep examples relevant

## Exercise
Create a few-shot prompt for:
1. Sentiment analysis
2. Language translation
3. Code generation',
  'article',
  id,
  2
from zen_learning_paths where name = 'Advanced Prompt Engineering Techniques';

-- Interactive exercise for Advanced Patterns
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Interactive Exercise: Advanced Prompting',
  '# Interactive Exercise: Advanced Prompt Patterns

## Exercise 1: Chain-of-Thought Implementation
Create a chain-of-thought prompt for:
1. Mathematical problem solving
2. Logical reasoning
3. Decision making

## Exercise 2: Few-Shot Learning
Design few-shot prompts for:
1. Code review comments
2. Bug report classification
3. Feature request prioritization

## Exercise 3: Meta-Prompting
Create meta-prompts that:
1. Generate variations of a prompt
2. Optimize existing prompts
3. Debug problematic prompts

Submit your solutions and explain your reasoning.',
  'exercise',
  id,
  3
from zen_learning_paths where name = 'Advanced Prompt Engineering Techniques';

-- Additional materials for AI Agent Architecture
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Building Autonomous Agents',
  '# Building Autonomous AI Agents

## Agent Components
1. Perception System
2. Memory Management
3. Decision Engine
4. Action Framework

## Implementation Example
```typescript
interface Memory {
  shortTerm: Map<string, any>;
  longTerm: Map<string, any>;
}

class AutonomousAgent {
  private memory: Memory;
  private goals: Goal[];
  
  constructor() {
    this.memory = {
      shortTerm: new Map(),
      longTerm: new Map()
    };
    this.goals = [];
  }

  async perceive(input: any): Promise<void> {
    // Process input and update memory
    const perception = await this.processInput(input);
    this.updateMemory(perception);
  }

  async decide(): Promise<Action> {
    // Evaluate goals and current state
    const currentState = this.assessState();
    const nextAction = await this.planNextAction(currentState);
    return nextAction;
  }

  async act(action: Action): Promise<Result> {
    // Execute action and observe results
    const result = await action.execute();
    this.learnFromResult(result);
    return result;
  }
}
```

## Best Practices
1. Clear goal definition
2. State management
3. Error handling
4. Learning mechanisms',
  'article',
  id,
  2
from zen_learning_paths where name = 'Building AI Agents';

-- Interactive exercise for AI Agents
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Interactive Exercise: Agent Implementation',
  '# Interactive Exercise: Implementing AI Agents

## Exercise 1: Basic Agent
Implement a simple AI agent that can:
1. Process text input
2. Make decisions based on rules
3. Execute basic actions

## Exercise 2: Memory System
Create a memory management system that:
1. Stores conversation history
2. Maintains context
3. Forgets irrelevant information

## Exercise 3: Goal-Oriented Behavior
Implement a goal system that:
1. Prioritizes objectives
2. Plans actions
3. Evaluates success

Submit your code implementation.',
  'exercise',
  id,
  3
from zen_learning_paths where name = 'Building AI Agents';

-- Additional materials for LLM Integration
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Advanced Integration Patterns',
  '# Advanced LLM Integration Patterns

## Streaming Responses
```typescript
async function streamCompletion(prompt: string) {
  const response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      prompt,
      stream: true
    })
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    const chunk = decoder.decode(value);
    // Process chunk
    yield chunk;
  }
}
```

## Function Calling
```typescript
interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

async function callWithFunctions(
  prompt: string,
  functions: FunctionDefinition[]
) {
  const response = await openai.createCompletion({
    model: "gpt-4",
    prompt,
    functions,
    function_call: "auto"
  });

  const { function_call } = response.choices[0];
  if (function_call) {
    // Handle function call
    const result = await executeFunctionCall(function_call);
    return result;
  }

  return response.choices[0].text;
}
```

## Best Practices
1. Error handling
2. Rate limiting
3. Fallback strategies
4. Response validation',
  'article',
  id,
  2
from zen_learning_paths where name = 'LLM Integration Patterns';

-- Interactive exercise for LLM Integration
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Interactive Exercise: LLM Integration',
  '# Interactive Exercise: LLM Integration

## Exercise 1: Streaming Implementation
Implement a streaming response handler that:
1. Processes chunks of data
2. Updates UI in real-time
3. Handles errors gracefully

## Exercise 2: Function Calling
Create a function calling system that:
1. Defines available functions
2. Handles function calls
3. Processes results

## Exercise 3: Error Handling
Implement robust error handling for:
1. API failures
2. Rate limiting
3. Invalid responses

Submit your code implementation.',
  'exercise',
  id,
  3
from zen_learning_paths where name = 'LLM Integration Patterns';

-- Additional materials for System Optimization
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Advanced Optimization Techniques',
  '# Advanced LLM System Optimization

## Token Usage Optimization
```typescript
class TokenOptimizer {
  private maxTokens: number;
  private tokenEstimator: TokenEstimator;

  constructor(maxTokens: number) {
    this.maxTokens = maxTokens;
    this.tokenEstimator = new TokenEstimator();
  }

  optimizePrompt(prompt: string): string {
    const tokens = this.tokenEstimator.count(prompt);
    if (tokens <= this.maxTokens) return prompt;

    return this.truncateToFit(prompt);
  }

  private truncateToFit(prompt: string): string {
    // Implement smart truncation
    // Preserve context and instructions
    // Remove less important information
  }
}
```

## Response Caching
```typescript
class ResponseCache {
  private cache: Map<string, CachedResponse>;
  private ttl: number;

  constructor(ttl: number) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  async get(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.response;
  }

  set(key: string, response: string): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }
}
```

## Load Balancing
```typescript
class LoadBalancer {
  private endpoints: string[];
  private currentIndex: number;
  private weights: Map<string, number>;

  constructor(endpoints: string[]) {
    this.endpoints = endpoints;
    this.currentIndex = 0;
    this.weights = new Map();
  }

  getNextEndpoint(): string {
    // Implement weighted round-robin
    // Consider endpoint performance
    // Handle failures
  }

  updateWeight(endpoint: string, latency: number): void {
    // Update endpoint weights based on performance
  }
}
```',
  'article',
  id,
  2
from zen_learning_paths where name = 'AI System Optimization';

-- Interactive exercise for System Optimization
insert into zen_learning_materials (title, content, type, path_id, order_index)
select 
  'Interactive Exercise: System Optimization',
  '# Interactive Exercise: System Optimization

## Exercise 1: Token Optimization
Implement a token optimization system that:
1. Estimates token usage
2. Truncates prompts intelligently
3. Preserves important context

## Exercise 2: Caching System
Create a caching system that:
1. Stores responses efficiently
2. Handles cache invalidation
3. Implements cache strategies

## Exercise 3: Load Balancing
Implement a load balancer that:
1. Distributes requests
2. Monitors endpoint health
3. Adapts to performance

Submit your code implementation.',
  'exercise',
  id,
  3
from zen_learning_paths where name = 'AI System Optimization'; 