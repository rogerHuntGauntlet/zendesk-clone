import dotenv from 'dotenv';
import path from 'path';
import { testBasicUserFlow } from './outreach-user-test';

// Load environment variables
dotenv.config({
  path: path.resolve(process.cwd(), '.env.local')
});

// Verify required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH',
  'NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH',
  'OPENAI_API_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

console.log('🔧 Environment configured');
console.log('📁 Project:', process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH);

// Run the test
console.log('\n🚀 Starting user flow test...');
testBasicUserFlow()
  .then(result => {
    if (result.success && result.results) {
      console.log('\n✅ All tests passed!');
      console.log('\nQuick Summary:');
      console.log('- Initial message generated');
      console.log('- Follow-up message generated');
      console.log('- Metrics collected');
      
      // Display key metrics
      const { metrics } = result.results;
      if (metrics) {
        console.log('\n📊 Key Metrics:');
        console.log(`- Success Rate: ${metrics.successRate.toFixed(2)}%`);
        console.log(`- Avg Response Time: ${metrics.avgResponseTime}ms`);
        console.log(`- Error Rate: ${metrics.errorRate.toFixed(2)}%`);
      }
    } else {
      console.error('\n❌ Test failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }); 