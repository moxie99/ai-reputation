/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from 'openai'

export class OpenAIService {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
    })
  }

  async analyzeContent(content: string, category: string, context?: string) {
    try {
      const prompt = `
        Analyze the following content for reputation assessment in the category: ${category}
        
        ${context ? `Context: ${context}` : ''}
        
        Content to analyze:
        ${content}
        
        Please provide:
        1. A brief summary of the content's relevance to ${category}
        2. Detailed reasoning for your assessment
        3. Any concerning or noteworthy elements that should be flagged
        4. Overall assessment of how this content reflects on the person's reputation
        
        Be objective, factual, and consider context. Flag content only if it's genuinely concerning.
      `

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert reputation analyst. Provide objective, balanced analysis of content for reputation assessment purposes. Be thorough but fair in your evaluation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      })

      return {
        analysis: response.choices[0].message.content,
        usage: response.usage,
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to analyze content with OpenAI')
    }
  }

  async generateReportSummary(
    categoryAnalyses: Record<string, any>,
    targetPerson: any
  ) {
    try {
      const prompt = `
        Generate a comprehensive executive summary for a reputation report about ${
          targetPerson.name
        }.
        
        Based on the following category analyses:
        ${Object.entries(categoryAnalyses)
          .map(
            ([category, analysis]) =>
              `${category}: ${JSON.stringify(analysis, null, 2)}`
          )
          .join('\n\n')}
        
        Provide a balanced, professional executive summary that:
        1. Gives an overall assessment of the person's digital reputation
        2. Highlights key findings across all categories
        3. Notes any significant positive or concerning patterns
        4. Maintains objectivity and professional tone
        5. Is suitable for business or professional contexts
        
        Keep it concise but comprehensive (2-3 paragraphs).
      `

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional reputation analyst creating executive summaries for business stakeholders. Maintain objectivity and professional tone.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      })

      return response.choices[0].message.content
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to generate report summary')
    }
  }
}
