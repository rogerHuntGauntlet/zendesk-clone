import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { ticket, research, ticketHistory } = await req.json();
    console.log('📊 Analyzing ticket:', ticket.id);

    // Extract prospect name from title (assuming format "Prospect: Name")
    const prospectName = ticket.title.includes(':') 
      ? ticket.title.split(':')[1].trim()
      : ticket.title;

    // Combine ticket data with research and history data
    const analysis = {
      prospectInfo: {
        name: prospectName,
        role: extractRole(ticket.description, research?.prospect?.background),
        company: extractCompany(ticket.description, research?.prospect?.company),
        contactInfo: extractContactInfo(ticket.description),
        webResearch: research ? {
          sources: research.prospect.sources,
          background: research.prospect.background
        } : null,
        history: ticketHistory ? {
          totalInteractions: ticketHistory.insights.totalSessions,
          lastInteraction: ticketHistory.insights.lastInteractionDate,
          commonActivities: ticketHistory.insights.commonActivities,
          significantEvents: ticketHistory.insights.significantEvents,
          recentSessions: ticketHistory.sessions.slice(0, 3).map(session => ({
            date: session.created_at,
            summary: session.summary,
            activities: session.activities
          }))
        } : null
      },
      companyInfo: {
        industry: extractIndustry(ticket.description),
        size: extractCompanySize(ticket.description),
        techStack: extractTechStack(ticket.description)
      },
      interests: extractInterests(ticket.description, research?.prospect?.background),
      keyPoints: extractKeyPoints(ticket.description, research?.prospect?.background),
      suggestedApproach: determineSuggestedApproach(
        ticket.description, 
        research?.prospect?.background,
        ticketHistory?.insights
      ),
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

function extractRole(description: string, researchBackground?: string): string {
  const roleMatch = description.match(/(?:Role|Position|Title):\s*([^\n]+)/i) ||
                   description.match(/([^\n,]+(?:CEO|CTO|CFO|COO|Director|Manager|Lead|Head)[^\n,]*)/i);
  
  if (researchBackground) {
    const researchRoleMatch = researchBackground.match(/(?:is|as|a)\s+([^\n,]+(?:CEO|CTO|CFO|COO|Director|Manager|Lead|Head)[^\n,]*)/i);
    if (researchRoleMatch) return researchRoleMatch[1].trim();
  }
  
  return roleMatch ? roleMatch[1].trim() : '';
}

function extractCompany(description: string, researchCompany?: string): string {
  const companyMatch = description.match(/Company Overview:\s*([^\n]+)/i) ||
                      description.match(/(?:at|from|with)\s+([^\n,]+)/i);
  
  return researchCompany || (companyMatch ? companyMatch[1].trim() : '');
}

function extractInterests(description: string, researchBackground?: string): string[] {
  const interests: Set<string> = new Set();
  
  // Extract from description
  const interestsMatch = description.match(/Interests?:?\s*([^\n]+)/i);
  if (interestsMatch) {
    interestsMatch[1].split(/[,;]/).forEach(interest => 
      interests.add(interest.trim())
    );
  }

  // Extract from research background
  if (researchBackground) {
    const keywords = ['interested in', 'passionate about', 'focuses on', 'specializes in'];
    keywords.forEach(keyword => {
      const regex = new RegExp(`${keyword}\\s+([^.]+)`, 'gi');
      const matches = researchBackground.match(regex);
      matches?.forEach(match => {
        const interest = match.replace(new RegExp(`${keyword}\\s+`, 'i'), '').trim();
        interests.add(interest);
      });
    });
  }

  return Array.from(interests);
}

function extractKeyPoints(description: string, researchBackground?: string): string[] {
  const keyPoints: Set<string> = new Set();

  // Extract from description
  const points = description.match(/[^.!?]+[.!?]+/g) || [];
  points.forEach(point => {
    if (point.includes('key') || point.includes('important') || point.includes('note')) {
      keyPoints.add(point.trim());
    }
  });

  // Extract from research background
  if (researchBackground) {
    const relevantPoints = researchBackground.match(/[^.!?]+[.!?]+/g) || [];
    relevantPoints.forEach(point => {
      if (point.includes('achievement') || 
          point.includes('led') || 
          point.includes('developed') || 
          point.includes('launched') ||
          point.includes('managed')) {
        keyPoints.add(point.trim());
      }
    });
  }

  return Array.from(keyPoints);
}

function determineSuggestedApproach(
  description: string, 
  researchBackground?: string,
  historyInsights?: any
): string {
  let approach = 'Standard professional outreach';
  
  if (researchBackground) {
    if (researchBackground.toLowerCase().includes('startup') || 
        researchBackground.toLowerCase().includes('founder')) {
      approach = 'Entrepreneurial focus, emphasize innovation and growth potential';
    } else if (researchBackground.toLowerCase().includes('enterprise') || 
               researchBackground.toLowerCase().includes('corporate')) {
      approach = 'Enterprise-focused, emphasize scalability and reliability';
    }
  }

  if (description.toLowerCase().includes('urgent') || 
      description.toLowerCase().includes('priority')) {
    approach = 'High-priority outreach, emphasize immediate value and quick implementation';
  }

  // Consider history in approach
  if (historyInsights) {
    const totalSessions = historyInsights.totalSessions || 0;
    if (totalSessions > 3) {
      approach = 'Relationship-based approach, reference previous interactions';
    }
    
    const hasRecentMeeting = historyInsights.significantEvents?.some(
      (event: any) => event.type === 'meeting_scheduled'
    );
    if (hasRecentMeeting) {
      approach = 'Follow-up focused, build on recent meeting discussions';
    }
  }

  return approach;
}

function extractContactInfo(description: string): string {
  const emailMatch = description.match(/\b[\w\.-]+@[\w\.-]+\.\w+\b/);
  const phoneMatch = description.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
  
  const contactInfo = [];
  if (emailMatch) contactInfo.push(emailMatch[0]);
  if (phoneMatch) contactInfo.push(phoneMatch[0]);
  
  return contactInfo.join(', ');
}

function extractCompanySize(description: string): string {
  const sizeMatch = description.match(/(?:Company Size|Employees|Team Size):\s*([^\n]+)/i);
  return sizeMatch ? sizeMatch[1].trim() : '';
}

function extractTechStack(description: string): string[] {
  const techStackMatch = description.match(/(?:Tech Stack|Technology|Technologies):\s*([^\n]+)/i);
  return techStackMatch 
    ? techStackMatch[1].split(/[,;]/).map(tech => tech.trim())
    : [];
}

function extractIndustry(description: string): string {
  const industryMatch = description.match(/Industry:\s*([^\\n]+)/i);
  return industryMatch ? industryMatch[1].trim() : 'Unknown';
} 