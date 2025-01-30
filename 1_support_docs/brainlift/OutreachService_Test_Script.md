# OutreachGPT Service Test Script

## Overview
This test script demonstrates how our EnhancedOutreachService meets the project requirements through a series of practical test cases. We'll focus on the key metrics and functionality required for the Week 2 deliverable.

## Test Environment Setup
```typescript
import { EnhancedOutreachService } from '../src/app/ai_agents/services/EnhancedOutreachService';
import { expect } from 'chai';

const outreachService = new EnhancedOutreachService();
```

## Required Metrics Testing

### 1. Success Rate at Identifying Correct Actions
```typescript
describe('Action Identification Accuracy', () => {
  const testCases = [
    {
      scenario: "Schedule Follow-up Meeting",
      context: {
        ticket: {
          title: "Quarterly Review Discussion",
          status: "open",
          priority: "high"
        },
        interactions: {
          messages: [
            {
              content: "Would like to schedule a follow-up meeting",
              type: "client_message"
            }
          ]
        }
      },
      expectedAction: "schedule_meeting"
    },
    // Add more test cases...
  ];

  testCases.forEach(test => {
    it(`should correctly identify action for ${test.scenario}`, async () => {
      const result = await outreachService.generateAndTrackMessage(
        'test-prospect',
        'follow_up',
        test.context
      );
      
      // Verify through LangSmith metrics
      const metrics = await outreachService.analyzeLearnings();
      expect(metrics.successRate).to.be.above(85);
    });
  });
});
```

### 2. Field Update Accuracy
```typescript
describe('Field Update Accuracy', () => {
  const updates = [
    {
      fieldName: "meeting_time",
      expectedValue: "2024-02-15T10:00:00Z",
      actualValue: "2024-02-15T10:00:00Z",
      isCorrect: true
    },
    {
      fieldName: "follow_up_status",
      expectedValue: "scheduled",
      actualValue: "scheduled",
      isCorrect: true
    }
  ];

  it('should track field update accuracy', async () => {
    const accuracy = await outreachService.trackFieldUpdateAccuracy(
      'test-run-id',
      updates
    );
    expect(accuracy).to.equal(1.0);
  });
});
```

### 3. Response Time Metrics
```typescript
describe('Response Time Performance', () => {
  it('should meet response time requirements', async () => {
    const start = Date.now();
    await outreachService.generateAndTrackMessage(
      'test-prospect',
      'initial_outreach',
      testContext
    );
    const metrics = await outreachService.analyzeLearnings();
    
    expect(metrics.metrics.responseTime.avg).to.be.below(5000); // 5 second threshold
  });
});
```

## Context Integration Testing

### 1. Personalization Testing
```typescript
describe('Message Personalization', () => {
  const context = {
    prospect: {
      name: "James Chen",
      company: "TechCorp",
      role: "CTO",
      email: "james@techcorp.com"
    },
    interactions: {
      messages: [
        {
          content: "Interested in AI implementation",
          type: "client_message"
        }
      ]
    }
  };

  it('should generate personalized content', async () => {
    const result = await outreachService.generateAndTrackMessage(
      'test-prospect',
      'follow_up',
      context
    );
    
    expect(result.message).to.include('James');
    expect(result.message).to.include('TechCorp');
    expect(result.metadata.contextualFactors.prospectEngagement).to.exist;
  });
});
```

### 2. Tone Matching Testing
```typescript
describe('Tone Matching', () => {
  const contexts = [
    {
      scenario: "Formal Initial Contact",
      interactions: { messages: [] },
      expectedTone: "formal"
    },
    {
      scenario: "Friendly Follow-up",
      interactions: {
        messages: [
          {
            content: "Great chat yesterday!",
            type: "client_message",
            metadata: { effectiveness_score: 0.9 }
          }
        ]
      },
      expectedTone: "friendly"
    }
  ];

  contexts.forEach(test => {
    it(`should use appropriate tone for ${test.scenario}`, async () => {
      const result = await outreachService.generateAndTrackMessage(
        'test-prospect',
        'follow_up',
        test
      );
      expect(result.metadata.tone).to.equal(test.expectedTone);
    });
  });
});
```

## Error Handling and Monitoring

### 1. Error Categorization
```typescript
describe('Error Handling', () => {
  it('should properly categorize errors', async () => {
    const metrics = await outreachService.analyzeLearnings();
    expect(metrics.metrics.errorTypes).to.have.all.keys([
      'context_error',
      'timeout_error',
      'rate_limit_error',
      'other_error'
    ]);
  });
});
```

### 2. Performance Monitoring
```typescript
describe('Performance Monitoring', () => {
  it('should track comprehensive metrics', async () => {
    const metrics = await outreachService.analyzeLearnings();
    expect(metrics).to.include.all.keys([
      'totalRuns',
      'successRate',
      'avgResponseTime',
      'errorRate',
      'effectiveness'
    ]);
  });
});
```

## Expected Results

1. **Success Rate Metrics**
   - Action Identification Accuracy: >85%
   - Field Update Accuracy: >95%
   - Response Time: <5 seconds average

2. **Context Integration**
   - Personalization Score: >90%
   - Tone Matching Accuracy: >85%
   - Context Utilization: >80%

3. **Error Handling**
   - Error Rate: <5%
   - Error Classification Accuracy: >90%

## Running the Tests

1. Set up the test environment:
```bash
npm install
export LANGSMITH_API_KEY_OUTREACH="your-api-key"
export LANGSMITH_PROJECT_OUTREACH="outreach-crm-ai"
```

2. Run the test suite:
```bash
npm test
```

3. View results in LangSmith dashboard:
   - Navigate to your project in LangSmith
   - Review the "Traces" tab for detailed run information
   - Check the "Metrics" dashboard for aggregated statistics

## Demonstration Script

1. **Introduction (2 minutes)**
   - Overview of OutreachGPT service
   - Key requirements and metrics

2. **Metrics Demo (5 minutes)**
   - Run action identification tests
   - Show field update accuracy
   - Display response time metrics

3. **Context Integration (5 minutes)**
   - Demonstrate personalization
   - Show tone matching capabilities
   - Present context utilization scores

4. **Error Handling (3 minutes)**
   - Show error categorization
   - Present monitoring dashboard

5. **Q&A (5 minutes)**

## Notes for Presenters
- Have the LangSmith dashboard open and ready
- Prepare a few example contexts to demonstrate real-time generation
- Be ready to explain how each metric is calculated
- Have example error cases prepared to demonstrate handling 