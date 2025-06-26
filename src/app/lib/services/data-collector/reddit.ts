/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'

export class RedditService {
  private accessToken?: string
  private clientId: string
  private clientSecret: string

  constructor(clientId: string, clientSecret: string, accessToken?: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.accessToken = accessToken
  }

  async authenticate() {
    try {
      const auth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`
      ).toString('base64')

      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'ReputationLookup/1.0',
          },
        }
      )

      this.accessToken = response.data.access_token
      return this.accessToken
    } catch (error) {
      console.error('Reddit authentication error:', error)
      throw new Error('Failed to authenticate with Reddit API')
    }
  }

  async searchUsers(username: string) {
    if (!this.accessToken) {
      await this.authenticate()
    }

    try {
      const response = await axios.get(
        `https://oauth.reddit.com/user/${username}/about`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'User-Agent': 'ReputationLookup/1.0',
          },
        }
      )

      return this.normalizeUserData(response.data.data)
    } catch (error) {
      console.error('Reddit user search error:', error)
      throw new Error('Failed to search Reddit user')
    }
  }

  async getUserPosts(username: string, limit: number = 25) {
    if (!this.accessToken) {
      await this.authenticate()
    }

    try {
      const response = await axios.get(
        `https://oauth.reddit.com/user/${username}/submitted`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'User-Agent': 'ReputationLookup/1.0',
          },
          params: { limit },
        }
      )

      return response.data.data.children.map((post: any) =>
        this.normalizePostData(post.data)
      )
    } catch (error) {
      console.error('Reddit posts error:', error)
      throw new Error('Failed to get Reddit posts')
    }
  }

  async getUserComments(username: string, limit: number = 25) {
    if (!this.accessToken) {
      await this.authenticate()
    }

    try {
      const response = await axios.get(
        `https://oauth.reddit.com/user/${username}/comments`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'User-Agent': 'ReputationLookup/1.0',
          },
          params: { limit },
        }
      )

      return response.data.data.children.map((comment: any) =>
        this.normalizeCommentData(comment.data)
      )
    } catch (error) {
      console.error('Reddit comments error:', error)
      throw new Error('Failed to get Reddit comments')
    }
  }

  async searchMentions(query: string, subreddit?: string, limit: number = 25) {
    if (!this.accessToken) {
      await this.authenticate()
    }

    try {
      const searchUrl = subreddit
        ? `https://oauth.reddit.com/r/${subreddit}/search`
        : 'https://oauth.reddit.com/search'

      const response = await axios.get(searchUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'User-Agent': 'ReputationLookup/1.0',
        },
        params: {
          q: query,
          limit,
          sort: 'relevance',
          type: 'link,comment',
        },
      })

      return response.data.data.children.map((item: any) =>
        item.data.body
          ? this.normalizeCommentData(item.data)
          : this.normalizePostData(item.data)
      )
    } catch (error) {
      console.error('Reddit search error:', error)
      throw new Error('Failed to search Reddit')
    }
  }

  private normalizeUserData(userData: any) {
    return {
      platform: 'Reddit',
      type: 'profile',
      content: {
        username: userData.name,
        karma: {
          post: userData.link_karma,
          comment: userData.comment_karma,
          total: userData.total_karma,
        },
        accountAge: userData.created_utc,
        isVerified: userData.verified,
        isPremium: userData.is_gold,
        isModerator: userData.is_mod,
      },
      url: `https://reddit.com/u/${userData.name}`,
      timestamp: new Date().toISOString(),
      source: 'reddit_api',
    }
  }

  private normalizePostData(postData: any) {
    return {
      platform: 'Reddit',
      type: 'post',
      content: {
        title: postData.title,
        text: postData.selftext,
        subreddit: postData.subreddit,
        score: postData.score,
        upvoteRatio: postData.upvote_ratio,
        numComments: postData.num_comments,
      },
      url: `https://reddit.com${postData.permalink}`,
      timestamp: new Date(postData.created_utc * 1000).toISOString(),
      source: 'reddit_api',
    }
  }

  private normalizeCommentData(commentData: any) {
    return {
      platform: 'Reddit',
      type: 'comment',
      content: {
        text: commentData.body,
        subreddit: commentData.subreddit,
        score: commentData.score,
        parentId: commentData.parent_id,
        isSubmitter: commentData.is_submitter,
      },
      url: `https://reddit.com${commentData.permalink}`,
      timestamp: new Date(commentData.created_utc * 1000).toISOString(),
      source: 'reddit_api',
    }
  }
}
