/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from 'googleapis'

export class YouTubeService {
  private youtube: any

  constructor(apiKey: string) {
    this.youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    })
  }

  async searchChannels(query: string, maxResults: number = 10) {
    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: 'channel',
        maxResults,
      })

      return (
        response.data.items?.map((item: any) =>
          this.normalizeChannelData(item)
        ) || []
      )
    } catch (error) {
      console.error('YouTube channel search error:', error)
      throw new Error('Failed to search YouTube channels')
    }
  }

  async getChannelDetails(channelId: string) {
    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'brandingSettings'],
        id: [channelId],
      })

      return response.data.items?.[0]
        ? this.normalizeChannelDetails(response.data.items[0])
        : null
    } catch (error) {
      console.error('YouTube channel details error:', error)
      throw new Error('Failed to get channel details')
    }
  }

  async getChannelVideos(channelId: string, maxResults: number = 50) {
    try {
      // First get the uploads playlist ID
      const channelResponse = await this.youtube.channels.list({
        part: ['contentDetails'],
        id: [channelId],
      })

      const uploadsPlaylistId =
        channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists
          ?.uploads

      if (!uploadsPlaylistId) {
        throw new Error('No uploads playlist found')
      }

      // Get videos from uploads playlist
      const videosResponse = await this.youtube.playlistItems.list({
        part: ['snippet'],
        playlistId: uploadsPlaylistId,
        maxResults,
      })

      return (
        videosResponse.data.items?.map((item: any) =>
          this.normalizeVideoData(item)
        ) || []
      )
    } catch (error) {
      console.error('YouTube videos error:', error)
      throw new Error('Failed to get channel videos')
    }
  }

  async searchVideos(query: string, maxResults: number = 25) {
    try {
      const response = await this.youtube.search.list({
        part: ['snippet'],
        q: query,
        type: 'video',
        maxResults,
      })

      return (
        response.data.items?.map((item: any) =>
          this.normalizeVideoData(item)
        ) || []
      )
    } catch (error) {
      console.error('YouTube video search error:', error)
      throw new Error('Failed to search YouTube videos')
    }
  }

  async getVideoDetails(videoId: string) {
    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [videoId],
      })

      return response.data.items?.[0]
        ? this.normalizeVideoDetails(response.data.items[0])
        : null
    } catch (error) {
      console.error('YouTube video details error:', error)
      throw new Error('Failed to get video details')
    }
  }

  async getVideoComments(videoId: string, maxResults: number = 100) {
    try {
      const response = await this.youtube.commentThreads.list({
        part: ['snippet'],
        videoId,
        maxResults,
        order: 'relevance',
      })

      return (
        response.data.items?.map((item: any) =>
          this.normalizeCommentData(item)
        ) || []
      )
    } catch (error) {
      console.error('YouTube comments error:', error)
      throw new Error('Failed to get video comments')
    }
  }

  private normalizeChannelData(channelData: any) {
    return {
      platform: 'YouTube',
      type: 'profile',
      content: {
        channelId: channelData.id?.channelId,
        title: channelData.snippet?.title,
        description: channelData.snippet?.description,
        thumbnails: channelData.snippet?.thumbnails,
        publishedAt: channelData.snippet?.publishedAt,
      },
      url: `https://youtube.com/channel/${channelData.id?.channelId}`,
      timestamp: new Date().toISOString(),
      source: 'youtube_api',
    }
  }

  private normalizeChannelDetails(channelData: any) {
    return {
      platform: 'YouTube',
      type: 'profile',
      content: {
        channelId: channelData.id,
        title: channelData.snippet?.title,
        description: channelData.snippet?.description,
        customUrl: channelData.snippet?.customUrl,
        publishedAt: channelData.snippet?.publishedAt,
        thumbnails: channelData.snippet?.thumbnails,
        statistics: channelData.statistics,
        keywords: channelData.brandingSettings?.channel?.keywords,
      },
      url: `https://youtube.com/channel/${channelData.id}`,
      timestamp: new Date().toISOString(),
      source: 'youtube_api',
    }
  }

  private normalizeVideoData(videoData: any) {
    return {
      platform: 'YouTube',
      type: 'video',
      content: {
        videoId:
          videoData.snippet?.resourceId?.videoId || videoData.id?.videoId,
        title: videoData.snippet?.title,
        description: videoData.snippet?.description,
        publishedAt: videoData.snippet?.publishedAt,
        thumbnails: videoData.snippet?.thumbnails,
        channelId: videoData.snippet?.channelId,
        channelTitle: videoData.snippet?.channelTitle,
      },
      url: `https://youtube.com/watch?v=${
        videoData.snippet?.resourceId?.videoId || videoData.id?.videoId
      }`,
      timestamp: videoData.snippet?.publishedAt,
      source: 'youtube_api',
    }
  }

  private normalizeVideoDetails(videoData: any) {
    return {
      platform: 'YouTube',
      type: 'video',
      content: {
        videoId: videoData.id,
        title: videoData.snippet?.title,
        description: videoData.snippet?.description,
        publishedAt: videoData.snippet?.publishedAt,
        thumbnails: videoData.snippet?.thumbnails,
        channelId: videoData.snippet?.channelId,
        channelTitle: videoData.snippet?.channelTitle,
        statistics: videoData.statistics,
        duration: videoData.contentDetails?.duration,
        tags: videoData.snippet?.tags,
      },
      url: `https://youtube.com/watch?v=${videoData.id}`,
      timestamp: videoData.snippet?.publishedAt,
      source: 'youtube_api',
    }
  }

  private normalizeCommentData(commentData: any) {
    const comment = commentData.snippet?.topLevelComment?.snippet
    return {
      platform: 'YouTube',
      type: 'comment',
      content: {
        text: comment?.textDisplay,
        authorDisplayName: comment?.authorDisplayName,
        authorChannelUrl: comment?.authorChannelUrl,
        likeCount: comment?.likeCount,
        publishedAt: comment?.publishedAt,
        updatedAt: comment?.updatedAt,
      },
      url: `https://youtube.com/watch?v=${commentData.snippet?.videoId}&lc=${commentData.snippet?.topLevelComment?.id}`,
      timestamp: comment?.publishedAt,
      source: 'youtube_api',
    }
  }
}
