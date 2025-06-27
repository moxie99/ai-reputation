/* eslint-disable @typescript-eslint/no-explicit-any */
import { TwitterApi, TwitterApiReadOnly  } from 'twitter-api-v2'

export class TwitterService {
  private client: TwitterApiReadOnly;

  constructor(
    bearerToken: string,
    accessToken?: string,
    accessSecret?: string
  ) {
    const baseClient =
      accessToken && accessSecret
        ? new TwitterApi({
            appKey: process.env.TWITTER_API_KEY!,
            appSecret: process.env.TWITTER_API_SECRET!,
            accessToken,
            accessSecret,
          })
        : new TwitterApi(bearerToken)

    // Use .readOnly to safely access v2 endpoints
    this.client = baseClient.readOnly
  }

  async searchUsers(query: string) {
    try {
      const users = await this.client.v2.searchUsers(query, {
        'user.fields': [
          'created_at',
          'description',
          'location',
          'public_metrics',
          'verified',
          'profile_image_url',
        ],
      })

      return users.data?.map((user: any) => this.normalizeUserData(user)) || []
    } catch (error) {
      console.error('Twitter user search error:', error)
      throw new Error('Failed to search Twitter users')
    }
  }

  async getUserByUsername(username: string) {
    try {
      const user = await this.client.v2.userByUsername(username, {
        'user.fields': [
          'created_at',
          'description',
          'location',
          'public_metrics',
          'verified',
          'profile_image_url',
        ],
      })

      return user.data ? this.normalizeUserData(user.data) : null
    } catch (error) {
      console.error('Twitter user lookup error:', error)
      throw new Error('Failed to get Twitter user')
    }
  }

  async getUserTweets(userId: string, maxResults: number = 100) {
    try {
      const tweets = await this.client.v2.userTimeline(userId, {
        max_results: maxResults,
        'tweet.fields': [
          'created_at',
          'public_metrics',
          'context_annotations',
          'lang',
        ],
        exclude: ['retweets', 'replies'],
      })

      return (
        tweets.data?.map((tweet: any) => this.normalizeTweetData(tweet)) || []
      )
    } catch (error) {
      console.error('Twitter tweets error:', error)
      throw new Error('Failed to get user tweets')
    }
  }

  async searchTweets(query: string, maxResults: number = 100) {
    try {
      const tweets = await this.client.v2.search(query, {
        max_results: maxResults,
        'tweet.fields': [
          'created_at',
          'public_metrics',
          'context_annotations',
          'author_id',
          'lang',
        ],
        'user.fields': ['username', 'name', 'verified'],
      })

      return (
        tweets.data?.map((tweet: any) => this.normalizeTweetData(tweet)) || []
      )
    } catch (error) {
      console.error('Twitter search error:', error)
      throw new Error('Failed to search tweets')
    }
  }

  async getUserMentions(query: string, maxResults: number = 100) {
    try {
      const searchQuery = `"${query}" -is:retweet`
      const tweets = await this.searchTweets(searchQuery, maxResults)

      return tweets.filter((tweet: { content: string }) =>
        tweet.content.toLowerCase().includes(query.toLowerCase())
      )
    } catch (error) {
      console.error('Twitter mentions error:', error)
      throw new Error('Failed to search mentions')
    }
  }

  private normalizeUserData(userData: any) {
    return {
      platform: 'Twitter',
      type: 'profile',
      content: {
        username: userData.username,
        name: userData.name,
        description: userData.description,
        location: userData.location,
        verified: userData.verified,
        metrics: userData.public_metrics,
        profileImageUrl: userData.profile_image_url,
        createdAt: userData.created_at,
      },
      url: `https://twitter.com/${userData.username}`,
      timestamp: new Date().toISOString(),
      source: 'twitter_api',
    }
  }

  private normalizeTweetData(tweetData: any) {
    return {
      platform: 'Twitter',
      type: 'post',
      content: {
        text: tweetData.text,
        language: tweetData.lang,
        metrics: tweetData.public_metrics,
        contextAnnotations: tweetData.context_annotations,
      },
      url: `https://twitter.com/i/status/${tweetData.id}`,
      timestamp: tweetData.created_at,
      source: 'twitter_api',
    }
  }
}
