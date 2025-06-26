/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'

export class LinkedInService {
  private accessToken?: string

  constructor(accessToken?: string) {
    this.accessToken = accessToken
  }

  // OAuth-based data retrieval (when user connects their account)
  async getOwnProfile() {
    if (!this.accessToken) {
      throw new Error(
        'LinkedIn access token required for authenticated requests'
      )
    }

    try {
      const response = await axios.get('https://api.linkedin.com/v2/people/~', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      return response.data
    } catch (error) {
      console.error('LinkedIn profile error:', error)
      throw new Error('Failed to get LinkedIn profile')
    }
  }

  async getOwnPosts(count: number = 20) {
    if (!this.accessToken) {
      throw new Error(
        'LinkedIn access token required for authenticated requests'
      )
    }

    try {
      const response = await axios.get(
        `https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:person:${await this.getPersonId()}&count=${count}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data.elements || []
    } catch (error) {
      console.error('LinkedIn posts error:', error)
      throw new Error('Failed to get LinkedIn posts')
    }
  }

  // Public data scraping fallback (when no OAuth connection)
  async searchPublicProfiles(name: string, company?: string) {
    // Note: This would require web scraping or third-party services
    // as LinkedIn's public API is very limited for search
    console.warn(
      'LinkedIn public search requires web scraping or third-party services'
    )

    return {
      profiles: [],
      limitation: 'LinkedIn public search requires additional implementation',
    }
  }

  private async getPersonId(): Promise<string> {
    const profile = await this.getOwnProfile()
    return profile.id
  }

  // Normalize LinkedIn data to standard format
  normalizeProfileData(rawData: any) {
    return {
      platform: 'LinkedIn',
      type: 'profile',
      content: {
        name: `${rawData.localizedFirstName} ${rawData.localizedLastName}`,
        headline: rawData.localizedHeadline,
        location: rawData.location,
        industry: rawData.industry,
        summary: rawData.summary,
      },
      url: `https://linkedin.com/in/${rawData.publicIdentifier}`,
      timestamp: new Date().toISOString(),
      source: 'linkedin_api',
    }
  }

  normalizePostData(rawPost: any) {
    return {
      platform: 'LinkedIn',
      type: 'post',
      content: rawPost.text?.text || '',
      url: `https://linkedin.com/feed/update/${rawPost.id}`,
      timestamp: new Date(rawPost.created?.time || Date.now()).toISOString(),
      engagement: {
        likes: rawPost.totalSocialActivityCounts?.numLikes || 0,
        comments: rawPost.totalSocialActivityCounts?.numComments || 0,
        shares: rawPost.totalSocialActivityCounts?.numShares || 0,
      },
      source: 'linkedin_api',
    }
  }
}
