import { NextResponse } from 'next/server';
import { Client, Run } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";

const OUTREACH_PROJECT_NAME = process.env.NEXT_PUBLIC_LANGSMITH_PROJECT_OUTREACH || "outreach-crm-ai";

interface TavilySearchResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
  }>;
  query: string;
}

interface RunParams {
  name: string;
  run_type: string;
  project_name: string;
  inputs: Record<string, unknown>;
  start_time: number;
}

export async function POST(req: Request) {
  // Initialize LangSmith components
  const client = new Client({
    apiUrl: process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT_OUTREACH,
    apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY_OUTREACH,
  });

  const tracer = new LangChainTracer({
    projectName: OUTREACH_PROJECT_NAME,
  });

  let run: Run | undefined;

  try {
    const { ticket } = await req.json();
    console.log('🔍 Starting web research for:', ticket.title);

    // Start LangSmith run
    const runParams: RunParams = {
      name: "Web Research",
      run_type: "chain",
      project_name: OUTREACH_PROJECT_NAME,
      inputs: { ticket },
      start_time: Date.now()
    };
    run = await client.createRun(runParams) as unknown as Run;

    // Extract prospect and company information for search
    const prospectName = ticket.title.includes(':') 
      ? ticket.title.split(':')[1].trim()
      : ticket.title;
    
    const companyMatch = ticket.description.match(/Company Overview:\s*([^\n]+)/i) ||
                        ticket.description.match(/(?:at|from|with)\s+([^\n,]+)/i);
    const companyName = companyMatch ? companyMatch[1].trim() : '';

    // Construct search query
    const searchQuery = `${prospectName} ${companyName} professional background linkedin`;

    try {
      // Call Tavily API
      const tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
        },
        body: JSON.stringify({
          query: searchQuery,
          search_depth: 'advanced',
          include_domains: ['linkedin.com', 'crunchbase.com', 'bloomberg.com', 'forbes.com'],
          max_results: 5
        })
      });

      if (!tavilyResponse.ok) {
        console.warn('Tavily API request failed, continuing without research data');
        if (run) {
          await client.updateRun(run.id, {
            end_time: Date.now(),
            error: 'Tavily API request failed',
            outputs: {
              research: null,
              status: 'skipped',
              message: 'Web research unavailable'
            }
          });
        }
        return NextResponse.json({ 
          research: null,
          status: 'skipped',
          message: 'Web research unavailable'
        });
      }

      const searchData: TavilySearchResponse = await tavilyResponse.json();

      // Process and summarize the results
      const summary = {
        prospect: {
          name: prospectName,
          company: companyName,
          sources: searchData.results.map(result => ({
            title: result.title,
            url: result.url
          })),
          background: searchData.results
            .map(result => result.content)
            .join('\n\n')
        },
        searchQuery,
        timestamp: new Date().toISOString()
      };

      console.log('✅ Web research complete');
      
      // Update LangSmith run with success
      if (run) {
        await client.updateRun(run.id, {
          end_time: Date.now(),
          outputs: {
            research: summary,
            status: 'completed'
          }
        });
      }

      return NextResponse.json({ 
        research: summary,
        status: 'completed'
      });

    } catch (error) {
      console.warn('Failed to perform web research, continuing without research data:', error);
      
      // Update LangSmith run with error
      if (run) {
        await client.updateRun(run.id, {
          end_time: Date.now(),
          error: error instanceof Error ? error.message : 'Failed to perform web research',
          outputs: {
            research: null,
            status: 'skipped',
            message: 'Web research unavailable'
          }
        });
      }

      return NextResponse.json({ 
        research: null,
        status: 'skipped',
        message: 'Web research unavailable'
      });
    }

  } catch (error) {
    console.error('❌ Error parsing request:', error);
    
    // Update LangSmith run with error
    if (run) {
      await client.updateRun(run.id, {
        end_time: Date.now(),
        error: error instanceof Error ? error.message : 'Failed to parse request',
        outputs: {
          research: null,
          status: 'error',
          message: 'Failed to parse request'
        }
      });
    }

    return NextResponse.json({ 
      research: null,
      status: 'error',
      message: 'Failed to parse request'
    });
  }
} 