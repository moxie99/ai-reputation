/* eslint-disable @typescript-eslint/no-explicit-any */
import { Octokit } from '@octokit/rest'

export class GitHubService {
  private octokit: Octokit

  constructor(accessToken?: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    })
  }

  async searchUsers(query: string) {
    try {
      const response = await this.octokit.search.users({
        q: query,
        per_page: 10,
      })

      return response.data.items.map((user) => ({
        username: user.login,
        name: user.name,
        bio: user.bio,
        company: user.company,
        location: user.location,
        email: user.email,
        blog: user.blog,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }))
    } catch (error) {
      console.error('GitHub user search error:', error)
      throw new Error('Failed to search GitHub users')
    }
  }

  async getUserProfile(username: string) {
    try {
      const [userResponse, reposResponse, eventsResponse] = await Promise.all([
        this.octokit.users.getByUsername({ username }),
        this.octokit.repos.listForUser({
          username,
          per_page: 10,
          sort: 'updated',
        }),
        this.octokit.activity.listPublicEventsForUser({
          username,
          per_page: 30,
        }),
      ])

      return {
        profile: userResponse.data,
        repositories: reposResponse.data,
        recentActivity: eventsResponse.data,
      }
    } catch (error) {
      console.error('GitHub profile error:', error)
      throw new Error('Failed to get GitHub profile')
    }
  }

  async analyzeUserActivity(username: string) {
    try {
      const profile = await this.getUserProfile(username)

      // Analyze commit patterns, repository topics, contribution activity
      const activityAnalysis = {
        totalRepos: profile.repositories.length,
        languages: this.extractLanguages(profile.repositories),
        recentCommits: this.analyzeRecentActivity(profile.recentActivity),
        collaborationPatterns: this.analyzeCollaboration(
          profile.recentActivity
        ),
        projectTypes: this.categorizeProjects(profile.repositories),
      }

      return {
        ...profile,
        analysis: activityAnalysis,
      }
    } catch (error) {
      console.error('GitHub activity analysis error:', error)
      throw new Error('Failed to analyze GitHub activity')
    }
  }

  private extractLanguages(repos: any[]) {
    const languages = new Set()
    repos.forEach((repo) => {
      if (repo.language) languages.add(repo.language)
    })
    return Array.from(languages)
  }

  private analyzeRecentActivity(events: any[]) {
    return events
      .filter((event) => event.type === 'PushEvent')
      .slice(0, 10)
      .map((event) => ({
        repo: event.repo.name,
        commits: event.payload.commits?.length || 0,
        date: event.created_at,
      }))
  }

  private analyzeCollaboration(events: any[]) {
    const collaborations = events
      .filter((event) =>
        ['PullRequestEvent', 'IssuesEvent', 'ForkEvent'].includes(event.type)
      )
      .map((event) => ({
        type: event.type,
        repo: event.repo.name,
        date: event.created_at,
      }))

    return collaborations
  }

  private categorizeProjects(repos: any[]) {
    return repos.map((repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      topics: repo.topics || [],
      isForked: repo.fork,
      lastUpdated: repo.updated_at,
    }))
  }
}
