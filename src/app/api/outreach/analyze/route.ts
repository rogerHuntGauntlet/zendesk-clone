import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { ticket } = await req.json();
    console.log('📊 Analyzing ticket:', ticket.id);

    // Simulate analysis (we can make this more sophisticated later)
    const analysis = {
      prospectType: ticket.title.toLowerCase().includes('prospect') ? 'prospect' : 'lead',
      industry: extractIndustry(ticket.description),
      keyPoints: extractKeyPoints(ticket.description),
      suggestedApproach: determineSuggestedApproach(ticket.description),
      priority: ticket.priority
    };

    console.log('✅ Analysis complete:', analysis);
    return NextResponse.json({ analysis });

  } catch (error) {
    console.error('❌ Error analyzing ticket:', error);
    return NextResponse.json(
      { error: 'Failed to analyze ticket' },
      { status: 500 }
    );
  }
}

function extractIndustry(description: string): string {
  const industryMatch = description.match(/Industry:\s*([^\\n]+)/);
  return industryMatch ? industryMatch[1].trim() : 'Unknown';
}

function extractKeyPoints(description: string): string[] {
  const points = [];
  
  // Extract company size if available
  const sizeMatch = description.match(/Company Size:([^\\n]+)/);
  if (sizeMatch) points.push(`Size: ${sizeMatch[1].trim()}`);
  
  // Extract tech stack if available
  const techMatch = description.match(/Tech Stack:([^\\n]+)/);
  if (techMatch) points.push(`Tech: ${techMatch[1].trim()}`);
  
  // Extract interests if available
  const interestsMatch = description.match(/Interests:([^\\n]+)/);
  if (interestsMatch) points.push(`Interests: ${interestsMatch[1].trim()}`);

  return points;
}

function determineSuggestedApproach(description: string): string {
  const approachMatch = description.match(/Recommended Approach:([^]*?)(?=\\n|$)/);
  return approachMatch ? approachMatch[1].trim() : 'Standard outreach';
} 