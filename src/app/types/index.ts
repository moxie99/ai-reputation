export interface TargetPerson {
  name: string
  email?: string
  socialHandles?: {
    linkedin?: string
    reddit?: string
    twitter?: string
    youtube?: string
    github?: string
    instagram?: string
  }
  photo?: File
}

export interface DataSource {
  platform: string
  url: string
  content: string
  timestamp: string
  type: 'post' | 'comment' | 'article' | 'video' | 'profile'
}

export interface AnalysisCategory {
  name: string
  summary: string
  reasoning: string
  flaggedContent: FlaggedContent[]
  sources: DataSource[]
}

export interface FlaggedContent {
  content: string
  reason: string
  severity: 'low' | 'medium' | 'high'
  source: DataSource
}

export interface ReputationReport {
  id: string
  targetPerson: TargetPerson
  generatedAt: string
  categories: {
    professionalConduct: AnalysisCategory
    publicStatements: AnalysisCategory
    socialBehavior: AnalysisCategory
    controversies: AnalysisCategory
    expertise: AnalysisCategory
    credibility: AnalysisCategory
  }
  overallSummary: string | null | undefined
  dataSourcesUsed: string[]
  limitations: string[]
}

export interface ConnectedAccount {
  platform: string
  username: string
  accessToken: string
  refreshToken?: string
  connectedAt: string
  permissions: string[]
}

export interface SearchProgress {
  stage: string
  progress: number
  message: string
}
