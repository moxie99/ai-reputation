import { TargetPerson } from '@/app/types'
import {
  GitHubService,
  GoogleVisionService,
  LinkedInService,
  PerplexityService,
  TwitterService,
} from './data-collector'
import { RedditService } from './data-collector/reddit'
import { SerpAPIService } from './data-collector/serpapi'
import { YouTubeService } from './data-collector/youtube'
import { adminDb } from '../firebase-admin'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface RetrievalResult {
  platform: string
  type: 'profile' | 'post' | 'comment' | 'article' | 'video'
  content: any
  url: string
  timestamp: string
  source: string
  confidence?: number
}

export interface PhotoMatchResult {
  platform: string
  profileUrl: string
  imageUrl: string
  matchConfidence: number
  faceData: any
}

export class DataRetrievalService {
  private perplexity: PerplexityService
  private serpApi: SerpAPIService
  private youtube: YouTubeService
  private reddit: RedditService
  private twitter: TwitterService
  private linkedin: LinkedInService
  private github: GitHubService
  private vision: GoogleVisionService

  constructor() {
    this.perplexity = new PerplexityService(
      process.env.VITE_PERPLEXITY_API_KEY!
    )
    this.serpApi = new SerpAPIService(process.env.VITE_SERP_API_KEY!)
    this.youtube = new YouTubeService(process.env.VITE_YOUTUBE_API_KEY!)
    this.reddit = new RedditService(
      process.env.VITE_REDDIT_CLIENT_ID!,
      process.env.VITE_REDDIT_CLIENT_SECRET!
    )
    this.twitter = new TwitterService(process.env.TWITTER_BEARER_TOKEN!)
    this.linkedin = new LinkedInService()
    this.github = new GitHubService()
    this.vision = new GoogleVisionService()
  }

  async retrieveAllData(
    targetPerson: TargetPerson
  ): Promise<RetrievalResult[]> {
    const results: RetrievalResult[] = []
    const retrievalId = `retrieval_${Date.now()}`

    try {
      // Store retrieval session
      await this.storeRetrievalSession(retrievalId, targetPerson)

      // Parallel data retrieval from all sources
      const retrievalPromises = [
        this.retrievePerplexityData(targetPerson),
        this.retrieveSerpApiData(targetPerson),
        this.retrieveYouTubeData(targetPerson),
        this.retrieveRedditData(targetPerson),
        this.retrieveTwitterData(targetPerson),
        this.retrieveLinkedInData(targetPerson),
        this.retrieveGitHubData(targetPerson),
      ]

      const retrievalResults = await Promise.allSettled(retrievalPromises)

      // Process results and handle errors
      retrievalResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(...result.value)
        } else {
          console.error(
            `Retrieval failed for source ${index}:`,
            result.status === 'rejected' ? result.reason : 'Unknown error'
          )
        }
      })

      // Store raw retrieved data
      await this.storeRetrievalResults(retrievalId, results)

      return results
    } catch (error) {
      console.error('Data retrieval error:', error)
      throw new Error('Failed to retrieve data from sources')
    }
  }

  async processPhotoMatching(
    targetPerson: TargetPerson,
    retrievedData: RetrievalResult[]
  ): Promise<PhotoMatchResult[]> {
    if (!targetPerson.photo) {
      return []
    }

    try {
      // Upload and process the target photo
      const photoBuffer = Buffer.from(await targetPerson.photo.arrayBuffer())
      const targetFaceData = await this.vision.extractFaceEmbeddings(
        photoBuffer
      )

      if (targetFaceData.length === 0) {
        console.warn('No faces detected in uploaded photo')
        return []
      }

      const matchResults: PhotoMatchResult[] = []

      // Extract profile images from retrieved data
      const profileImages = this.extractProfileImages(retrievedData)

      // Compare with each profile image
      for (const profileImage of profileImages) {
        try {
          // Download profile image
          const imageResponse = await fetch(profileImage.imageUrl)
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

          // Compare faces
          const comparison = await this.vision.compareFaces(
            photoBuffer,
            imageBuffer
          )

          if (comparison.match && comparison.confidence > 0.6) {
            matchResults.push({
              platform: profileImage.platform,
              profileUrl: profileImage.profileUrl,
              imageUrl: profileImage.imageUrl,
              matchConfidence: comparison.confidence,
              faceData: comparison,
            })
          }
        } catch (error) {
          console.error(
            `Photo matching error for ${profileImage.platform}:`,
            error
          )
        }
      }

      return matchResults.sort((a, b) => b.matchConfidence - a.matchConfidence)
    } catch (error) {
      console.error('Photo matching process error:', error)
      return []
    }
  }

  private async retrievePerplexityData(
    targetPerson: TargetPerson
  ): Promise<RetrievalResult[]> {
    try {
      const searchResult = await this.perplexity.searchPersonReputation(
        targetPerson.name,
        targetPerson.socialHandles
      )

      return [
        {
          platform: 'Perplexity',
          type: 'article',
          content: {
            text: searchResult.content,
            citations: searchResult.citations,
          },
          url: 'https://perplexity.ai',
          timestamp: new Date().toISOString(),
          source: 'perplexity_api',
        },
      ]
    } catch (error) {
      console.error('Perplexity retrieval error:', error)
      return []
    }
  }

  private async retrieveSerpApiData(
    targetPerson: TargetPerson
  ): Promise<RetrievalResult[]> {
    try {
      const searchResults = await this.serpApi.searchPersonInformation(
        targetPerson.name
      )
      const results: RetrievalResult[] = []

      searchResults.forEach((searchResult) => {
        searchResult.organic_results?.forEach((result: any) => {
          results.push({
            platform: 'Google Search',
            type: 'article',
            content: {
              title: result.title,
              snippet: result.snippet,
              displayedLink: result.displayed_link,
            },
            url: result.link,
            timestamp: new Date().toISOString(),
            source: 'serpapi',
          })
        })

        searchResult.news_results?.forEach((result: any) => {
          results.push({
            platform: 'Google News',
            type: 'article',
            content: {
              title: result.title,
              snippet: result.snippet,
              source: result.source,
              date: result.date,
            },
            url: result.link,
            timestamp: result.date || new Date().toISOString(),
            source: 'serpapi',
          })
        })
      })

      return results
    } catch (error) {
      console.error('SerpAPI retrieval error:', error)
      return []
    }
  }

  private async retrieveYouTubeData(
    targetPerson: TargetPerson
  ): Promise<RetrievalResult[]> {
    try {
      const results: RetrievalResult[] = []

      // Search for channels
      const channels = await this.youtube.searchChannels(targetPerson.name)
      results.push(...channels)

      // Search for videos mentioning the person
      const videos = await this.youtube.searchVideos(`"${targetPerson.name}"`)
      results.push(...videos)

      // If YouTube handle is provided, get specific channel data
      if (targetPerson.socialHandles?.youtube) {
        const channelHandle = targetPerson.socialHandles.youtube.replace(
          '@',
          ''
        )
        const channelVideos = await this.youtube.searchChannels(channelHandle)
        results.push(...channelVideos)
      }

      return results
    } catch (error) {
      console.error('YouTube retrieval error:', error)
      return []
    }
  }

  private async retrieveRedditData(
    targetPerson: TargetPerson
  ): Promise<RetrievalResult[]> {
    try {
      const results: RetrievalResult[] = []

      // Search for mentions
      const mentions = await this.reddit.searchMentions(
        `"${targetPerson.name}"`
      )
      results.push(...mentions)

      // If Reddit username is provided, get user data
      if (targetPerson.socialHandles?.reddit) {
        const username = targetPerson.socialHandles.reddit.replace('u/', '')
        const [userProfile, userPosts, userComments] = await Promise.all([
          this.reddit.searchUsers(username),
          this.reddit.getUserPosts(username),
          this.reddit.getUserComments(username),
        ])

        results.push(userProfile, ...userPosts, ...userComments)
      }

      return results
    } catch (error) {
      console.error('Reddit retrieval error:', error)
      return []
    }
  }

  private async retrieveTwitterData(
    targetPerson: TargetPerson
  ): Promise<RetrievalResult[]> {
    try {
      const results: RetrievalResult[] = []

      // Search for users
      const users = await this.twitter.searchUsers(targetPerson.name)
      results.push(...users)

      // Search for mentions
      const mentions = await this.twitter.getUserMentions(targetPerson.name)
      results.push(...mentions)

      // If Twitter handle is provided, get specific user data
      if (targetPerson.socialHandles?.twitter) {
        const username = targetPerson.socialHandles.twitter.replace('@', '')
        const user = await this.twitter.getUserByUsername(username)
        if (user) {
          results.push(user)
          // Get user's tweets
          const tweets = await this.twitter.getUserTweets(user.content.id)
          results.push(...tweets)
        }
      }

      return results
    } catch (error) {
      console.error('Twitter retrieval error:', error)
      return []
    }
  }

  private async retrieveLinkedInData(
    targetPerson: TargetPerson
  ): Promise<RetrievalResult[]> {
    try {
      const results: RetrievalResult[] = []

      // For now, LinkedIn requires OAuth or web scraping
      // This is a placeholder for future implementation
      if (targetPerson.socialHandles?.linkedin) {
        const profiles = await this.linkedin.searchPublicProfiles(
          targetPerson.name,
          targetPerson.socialHandles.linkedin
        )
        results.push(...profiles.profiles)
      }

      return results
    } catch (error) {
      console.error('LinkedIn retrieval error:', error)
      return []
    }
  }

  private async retrieveGitHubData(
    targetPerson: TargetPerson
  ): Promise<RetrievalResult[]> {
    try {
      const results: RetrievalResult[] = []

      // Search for users
      const users = await this.github.searchUsers(targetPerson.name)

      // If GitHub handle is provided, get specific user data
      if (targetPerson.socialHandles?.github) {
        const analysis = await this.github.analyzeUserActivity(
          targetPerson.socialHandles.github
        )
        results.push({
          platform: 'GitHub',
          type: 'profile',
          content: analysis,
          url: `https://github.com/${targetPerson.socialHandles.github}`,
          timestamp: new Date().toISOString(),
          source: 'github_api',
        })
      } else if (users.length > 0) {
        // Analyze the first matching user
        const analysis = await this.github.analyzeUserActivity(
          users[0].username
        )
        results.push({
          platform: 'GitHub',
          type: 'profile',
          content: analysis,
          url: users[0].html_url,
          timestamp: new Date().toISOString(),
          source: 'github_api',
        })
      }

      return results
    } catch (error) {
      console.error('GitHub retrieval error:', error)
      return []
    }
  }

  private extractProfileImages(retrievedData: RetrievalResult[]) {
    const profileImages: {
      platform: string
      profileUrl: string
      imageUrl: string
    }[] = []

    retrievedData.forEach((data) => {
      if (data.type === 'profile' && data.content) {
        let imageUrl = null
        const profileUrl = data.url

        // Extract profile image URLs based on platform
        switch (data.platform) {
          case 'Twitter':
            imageUrl = data.content.profileImageUrl
            break
          case 'YouTube':
            imageUrl =
              data.content.thumbnails?.high?.url ||
              data.content.thumbnails?.default?.url
            break
          case 'GitHub':
            imageUrl = data.content.profile?.avatar_url
            break
          case 'LinkedIn':
            imageUrl = data.content.profilePicture
            break
        }

        if (imageUrl) {
          profileImages.push({
            platform: data.platform,
            profileUrl,
            imageUrl,
          })
        }
      }
    })

    return profileImages
  }

  private async storeRetrievalSession(
    retrievalId: string,
    targetPerson: TargetPerson
  ) {
    try {
      await adminDb
        .collection('retrievalSessions')
        .doc(retrievalId)
        .set({
          targetPerson: {
            name: targetPerson.name,
            email: targetPerson.email,
            socialHandles: targetPerson.socialHandles,
          },
          startedAt: new Date().toISOString(),
          status: 'in_progress',
        })
    } catch (error) {
      console.error('Failed to store retrieval session:', error)
    }
  }

  private async storeRetrievalResults(
    retrievalId: string,
    results: RetrievalResult[]
  ) {
    try {
      const batch = adminDb.batch()

      // Update session status
      const sessionRef = adminDb
        .collection('retrievalSessions')
        .doc(retrievalId)
      batch.update(sessionRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        resultCount: results.length,
      })

      // Store individual results
      results.forEach((result, index) => {
        const resultRef = adminDb
          .collection('retrievalResults')
          .doc(`${retrievalId}_${index}`)
        batch.set(resultRef, {
          retrievalId,
          ...result,
          storedAt: new Date().toISOString(),
        })
      })

      await batch.commit()
    } catch (error) {
      console.error('Failed to store retrieval results:', error)
    }
  }
}
