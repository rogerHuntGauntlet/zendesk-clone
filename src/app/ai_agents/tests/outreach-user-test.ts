import { EnhancedOutreachService } from '../services/EnhancedOutreachService';

// Basic user flow test
async function testBasicUserFlow() {
  console.log('🚀 Starting Basic User Flow Test');
  const outreachService = new EnhancedOutreachService();

  try {
    // 1. Simple outreach generation
    console.log('\n📝 Testing simple outreach generation...');
    const simpleContext = {
      prospect: {
        name: "John Doe",
        company: "Acme Corp",
        role: "CEO",
        email: "john@acmecorp.com"
      },
      ticket: {
        id: "ticket-123",
        title: "Initial Contact",
        description: "Interested in our enterprise solution",
        status: "open",
        priority: "high",
        category: "sales",
        metadata: {}
      },
      interactions: {
        messages: [],
        activities: [],
        summaries: []
      }
    };

    const simpleResult = await outreachService.generateAndTrackMessage(
      'prospect-123',
      'initial_outreach',
      simpleContext
    );

    console.log('✅ Generated Message:', simpleResult.message);
    console.log('📊 Metadata:', JSON.stringify(simpleResult.metadata, null, 2));

    // 2. Follow-up with context
    console.log('\n📝 Testing follow-up with context...');
    const followUpContext = {
      ...simpleContext,
      interactions: {
        messages: [
          {
            content: "Thanks for reaching out. I'd like to learn more about pricing.",
            type: "client_message",
            created_at: new Date().toISOString()
          }
        ],
        activities: [
          {
            activity_type: "email_open",
            content: "Opened initial email",
            created_at: new Date().toISOString(),
            metadata: { open_count: 2 }
          }
        ],
        summaries: []
      }
    };

    const followUpResult = await outreachService.generateAndTrackMessage(
      'prospect-123',
      'follow_up',
      followUpContext
    );

    console.log('✅ Generated Follow-up:', followUpResult.message);
    console.log('📊 Follow-up Metadata:', JSON.stringify(followUpResult.metadata, null, 2));

    // 3. Check metrics
    console.log('\n📊 Checking system metrics...');
    const metrics = await outreachService.analyzeLearnings();
    console.log('System Metrics:', JSON.stringify(metrics, null, 2));

    return {
      success: true,
      results: {
        initialOutreach: simpleResult,
        followUp: followUpResult,
        metrics
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test
if (require.main === module) {
  testBasicUserFlow().then(result => {
    if (result.success) {
      console.log('\n✅ User flow test completed successfully!');
    } else {
      console.error('\n❌ User flow test failed:', result.error);
      process.exit(1);
    }
  });
}

export { testBasicUserFlow }; 