import { ReputationReport, TargetPerson, DataSource } from '@/app/types'
import { NextRequest, NextResponse } from 'next/server'
import { DataRetrievalService } from '@/app/lib/services/data-retrieval'
import { OpenAIService } from '@/app/lib/services/data-collector/openapi'

// Helper to group data sources by platform/type for each category
function groupDataForCategories(data: unknown[]): Record<string, DataSource[]> {
  // This is a simple mapping. In production, use more advanced logic/ML.
  return {
    professionalConduct: (data as DataSource[]).filter((d) =>
      ['LinkedIn', 'GitHub'].includes(d.platform)
    ),
    publicStatements: (data as DataSource[]).filter(
      (d) =>
        ['Twitter', 'Reddit', 'YouTube'].includes(d.platform) &&
        ['post', 'comment', 'video'].includes(d.type)
    ),
    socialBehavior: (data as DataSource[]).filter((d) =>
      ['Reddit', 'Twitter', 'YouTube'].includes(d.platform)
    ),
    controversies: (data as DataSource[]).filter((d) =>
      ['Google News', 'Google Search', 'Perplexity'].includes(d.platform)
    ),
    expertise: (data as DataSource[]).filter((d) =>
      ['GitHub', 'LinkedIn', 'YouTube'].includes(d.platform)
    ),
    credibility: data as DataSource[], // Use all data for overall credibility
  }
}

// Helper to convert RetrievalResult to DataSource
function toDataSource(d: unknown): DataSource {
  const obj = d as {
    platform: string
    url: string
    content: unknown
    timestamp: string | null | undefined
    type: DataSource['type']
  }
  return {
    platform: obj.platform,
    url: obj.url,
    content:
      typeof obj.content === 'string'
        ? obj.content
        : JSON.stringify(obj.content ?? ''),
    timestamp: String(obj.timestamp ?? ''),
    type: obj.type,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { targetPerson }: { targetPerson: TargetPerson } =
      await request.json()

    // 1. Retrieve all data
    const retrievalService = new DataRetrievalService()
    const openai = new OpenAIService(process.env.OPENAI_API_KEY!)
    const retrievedData = await retrievalService.retrieveAllData(targetPerson)

    // 2. Group data for each category
    const grouped = groupDataForCategories(retrievedData)

    // 3. Analyze and summarize each category using OpenAI
    const categories: ReputationReport['categories'] = {
      professionalConduct: {
        name: 'Professional Conduct',
        summary: '',
        reasoning: '',
        flaggedContent: [],
        sources: grouped.professionalConduct.map(toDataSource),
      },
      publicStatements: {
        name: 'Public Statements',
        summary: '',
        reasoning: '',
        flaggedContent: [],
        sources: grouped.publicStatements.map(toDataSource),
      },
      socialBehavior: {
        name: 'Social Behavior',
        summary: '',
        reasoning: '',
        flaggedContent: [],
        sources: grouped.socialBehavior.map(toDataSource),
      },
      controversies: {
        name: 'Controversies',
        summary: '',
        reasoning: '',
        flaggedContent: [],
        sources: grouped.controversies.map(toDataSource),
      },
      expertise: {
        name: 'Expertise & Credibility',
        summary: '',
        reasoning: '',
        flaggedContent: [],
        sources: grouped.expertise.map(toDataSource),
      },
      credibility: {
        name: 'Overall Credibility',
        summary: '',
        reasoning: '',
        flaggedContent: [],
        sources: grouped.credibility.map(toDataSource),
      },
    }

    // 4. For each category, generate summary and reasoning
    for (const cat of Object.values(categories)) {
      const content = cat.sources.map((s) => s.content).join('\n---\n')
      if (content.trim().length === 0) continue
      try {
        const analysis = await openai.analyzeContent(content, cat.name)
        // Try to parse the response for summary/reasoning
        if (analysis.analysis) {
          // Simple split: first paragraph as summary, rest as reasoning
          const [summary, ...rest] = analysis.analysis.split('\n')
          cat.summary = summary.trim()
          cat.reasoning = rest.join('\n').trim()
        }
      } catch {
        cat.summary = 'AI analysis unavailable.'
        cat.reasoning = ''
      }
    }

    // 5. Generate overall summary
    let overallSummary: string | null = ''
    try {
      overallSummary = await openai.generateReportSummary(
        categories,
        targetPerson
      )
    } catch {
      overallSummary = 'AI summary unavailable.'
    }

    // 6. Build the report
    const report: ReputationReport = {
      id: `report-${Date.now()}`,
      targetPerson,
      generatedAt: new Date().toISOString(),
      categories,
      overallSummary,
      dataSourcesUsed: Array.from(
        new Set(
          (retrievedData as { platform: string }[]).map((d) => d.platform)
        )
      ),
      limitations: [
        'Analysis limited to publicly available information',
        'Some social media accounts may be private or restricted',
        'Historical data beyond 24 months may be incomplete',
        'AI analysis may miss context or nuance in some content',
      ],
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
