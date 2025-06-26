/* eslint-disable @typescript-eslint/no-unused-vars */
import axios from 'axios'

export class PerplexityService {
  private apiKey: string
  private baseUrl = 'https://api.perplexity.ai'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async search(
    query: string,
    options?: {
      model?: string
      max_tokens?: number
      temperature?: number
    }
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: options?.model || 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant that searches for and analyzes public information about people. Focus on factual, verifiable information from reliable sources.',
            },
            {
              role: 'user',
              content: query,
            },
          ],
          max_tokens: options?.max_tokens || 1000,
          temperature: options?.temperature || 0.2,
          return_citations: true,
          return_images: false,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        content: response.data.choices[0].message.content,
        citations: response.data.citations || [],
        usage: response.data.usage,
      }
    } catch (error) {
      console.error('Perplexity API error:', error)
      throw new Error('Failed to search with Perplexity API')
    }
  }

  async searchPersonReputation(
    name: string,
    socialHandles?: Record<string, string>
  ) {
    const handlesList = socialHandles
      ? Object.entries(socialHandles)
          .filter(([_, handle]) => handle)
          .map(([platform, handle]) => `${platform}: ${handle}`)
          .join(', ')
      : ''

    const query = `
      Search for comprehensive public information about "${name}"${
      handlesList ? ` (social handles: ${handlesList})` : ''
    }. 
      
      Please provide:
      1. Professional background and career information
      2. Public statements, interviews, or notable quotes
      3. Social media presence and engagement patterns
      4. Any controversies, legal issues, or negative incidents
      5. Professional achievements and expertise areas
      6. Community involvement and reputation
      
      Focus on factual, verifiable information with proper source attribution.
    `

    return this.search(query)
  }
}
