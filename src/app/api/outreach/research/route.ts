import { NextResponse } from 'next/server';

interface TavilySearchResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
  }>;
  query: string;
}

export async function POST(req: Request) {
  try {
    const { ticket } = await req.json();
    console.log('🔍 Starting web research for:', ticket.title);

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
      return NextResponse.json({ 
        research: summary,
        status: 'completed'
      });

    } catch (error) {
      console.warn('Failed to perform web research, continuing without research data:', error);
      return NextResponse.json({ 
        research: null,
        status: 'skipped',
        message: 'Web research unavailable'
      });
    }

  } catch (error) {
    console.error('❌ Error parsing request:', error);
    return NextResponse.json({ 
      research: null,
      status: 'error',
      message: 'Failed to parse request'
    });
  }
} 