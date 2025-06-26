/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'

export class SerpAPIService {
  private apiKey: string
  private baseUrl = 'https://serpapi.com/search'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchGoogle(
    query: string,
    options?: {
      num?: number
      start?: number
      location?: string
      hl?: string
      gl?: string
    }
  ) {
    try {
      const params = {
        q: query,
        api_key: this.apiKey,
        engine: 'google',
        num: options?.num || 10,
        start: options?.start || 0,
        location: options?.location || 'United States',
        hl: options?.hl || 'en',
        gl: options?.gl || 'us',
      }

      const response = await axios.get(this.baseUrl, { params })

      return {
        organic_results: response.data.organic_results || [],
        news_results: response.data.news_results || [],
        people_also_ask: response.data.people_also_ask || [],
        related_searches: response.data.related_searches || [],
        search_metadata: response.data.search_metadata,
      }
    } catch (error) {
      console.error('SerpAPI error:', error)
      throw new Error('Failed to search with SerpAPI')
    }
  }

  async searchNews(
    query: string,
    options?: {
      num?: number
      tbm?: string
    }
  ) {
    try {
      const params = {
        q: query,
        api_key: this.apiKey,
        engine: 'google',
        tbm: 'nws',
        num: options?.num || 10,
      }

      const response = await axios.get(this.baseUrl, { params })

      return {
        news_results: response.data.news_results || [],
        search_metadata: response.data.search_metadata,
      }
    } catch (error) {
      console.error('SerpAPI news search error:', error)
      throw new Error('Failed to search news with SerpAPI')
    }
  }

  async searchPersonInformation(name: string, additionalTerms?: string[]) {
    const baseQuery = `"${name}"`
    const queries = [
      baseQuery,
      `${baseQuery} professional`,
      `${baseQuery} controversy`,
      `${baseQuery} achievement`,
      ...(additionalTerms || []).map((term) => `${baseQuery} ${term}`),
    ]

    const results = await Promise.allSettled(
      queries.map((query) => this.searchGoogle(query, { num: 5 }))
    )

    return results
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value)
  }
}
