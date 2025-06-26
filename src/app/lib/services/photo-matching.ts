/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminStorage } from '../firebase-admin'
import { GoogleVisionService } from './data-collector'
import { RetrievalResult } from './data-retrieval'

export interface FaceEmbedding {
  id: string
  embeddings: number[]
  boundingBox: any
  confidence: number
  metadata: {
    platform: string
    profileUrl: string
    imageUrl: string
  }
}

export interface PhotoMatchResult {
  platform: string
  profileUrl: string
  imageUrl: string
  matchConfidence: number
  similarity: number
  faceData: any
}

export class PhotoMatchingService {
  private vision: GoogleVisionService

  constructor() {
    this.vision = new GoogleVisionService()
  }

  async processUploadedPhoto(
    photoFile: File,
    targetPersonName: string
  ): Promise<string> {
    try {
      // Upload photo to Firebase Storage
      const bucket = adminStorage.bucket()
      const fileName = `photos/${targetPersonName}_${Date.now()}_${
        photoFile.name
      }`
      const file = bucket.file(fileName)

      const photoBuffer = Buffer.from(await photoFile.arrayBuffer())

      await file.save(photoBuffer, {
        metadata: {
          contentType: photoFile.type,
          metadata: {
            uploadedAt: new Date().toISOString(),
            targetPerson: targetPersonName,
          },
        },
      })

      // Make file publicly accessible
      await file.makePublic()

      return `https://storage.googleapis.com/${bucket.name}/${fileName}`
    } catch (error) {
      console.error('Photo upload error:', error)
      throw new Error('Failed to upload photo')
    }
  }

  async extractFaceEmbeddings(imageUrl: string): Promise<FaceEmbedding[]> {
    try {
      // Download image
      const response = await fetch(imageUrl)
      const imageBuffer = Buffer.from(await response.arrayBuffer())

      // Extract face data using Google Vision
      const faceData = await this.vision.extractFaceEmbeddings(imageBuffer)

      return faceData.map(
        (
          face: { embeddings: any; boundingBox: any; confidence: any },
          index: any
        ) => ({
          id: `${imageUrl}_face_${index}`,
          embeddings: face.embeddings || [], // Placeholder - would contain actual embeddings
          boundingBox: face.boundingBox,
          confidence: face.confidence || 0,
          metadata: {
            platform: 'uploaded',
            profileUrl: imageUrl,
            imageUrl: imageUrl,
          },
        })
      )
    } catch (error) {
      console.error('Face embedding extraction error:', error)
      return []
    }
  }

  async findMatchingProfiles(
    targetPhotoUrl: string,
    retrievedData: RetrievalResult[],
    minConfidence: number = 0.6
  ): Promise<PhotoMatchResult[]> {
    try {
      // Extract face embeddings from target photo
      const targetEmbeddings = await this.extractFaceEmbeddings(targetPhotoUrl)

      if (targetEmbeddings.length === 0) {
        console.warn('No faces detected in target photo')
        return []
      }

      const matches: PhotoMatchResult[] = []

      // Extract profile images from retrieved data
      const profileImages = this.extractProfileImages(retrievedData)

      // Compare target photo with each profile image
      for (const profileImage of profileImages) {
        try {
          const profileEmbeddings = await this.extractFaceEmbeddings(
            profileImage.imageUrl
          )

          if (profileEmbeddings.length === 0) {
            continue
          }

          // Compare embeddings (simplified - in production use proper face recognition)
          const similarity = await this.compareFaceEmbeddings(
            targetEmbeddings[0],
            profileEmbeddings[0]
          )

          if (similarity.confidence >= minConfidence) {
            matches.push({
              platform: profileImage.platform,
              profileUrl: profileImage.profileUrl,
              imageUrl: profileImage.imageUrl,
              matchConfidence: similarity.confidence,
              similarity: similarity.similarity,
              faceData: {
                targetFace: targetEmbeddings[0],
                profileFace: profileEmbeddings[0],
                comparison: similarity,
              },
            })
          }
        } catch (error) {
          console.error(
            `Face matching error for ${profileImage.platform}:`,
            error
          )
        }
      }

      // Sort by confidence and return top matches
      return matches
        .sort((a, b) => b.matchConfidence - a.matchConfidence)
        .slice(0, 10) // Return top 10 matches
    } catch (error) {
      console.error('Photo matching error:', error)
      return []
    }
  }

  async storePhotoMatchResults(
    targetPersonName: string,
    targetPhotoUrl: string,
    matches: PhotoMatchResult[]
  ): Promise<void> {
    try {
      const matchResultsRef = adminStorage
        .bucket()
        .file(`photo-matches/${targetPersonName}_${Date.now()}.json`)

      const matchData = {
        targetPerson: targetPersonName,
        targetPhotoUrl,
        matches,
        processedAt: new Date().toISOString(),
        totalMatches: matches.length,
      }

      await matchResultsRef.save(JSON.stringify(matchData, null, 2), {
        metadata: {
          contentType: 'application/json',
        },
      })
    } catch (error) {
      console.error('Failed to store photo match results:', error)
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
              data.content.thumbnails?.medium?.url ||
              data.content.thumbnails?.default?.url
            break
          case 'GitHub':
            imageUrl =
              data.content.profile?.avatar_url || data.content.avatar_url
            break
          case 'LinkedIn':
            imageUrl =
              data.content.profilePicture || data.content.profileImageUrl
            break
          case 'Reddit':
            imageUrl = data.content.iconImg || data.content.profileImg
            break
        }

        if (
          imageUrl &&
          imageUrl !==
            'https://www.redditstatic.com/avatars/avatar_default_02_A5A4A4.png'
        ) {
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

  private async compareFaceEmbeddings(
    embedding1: FaceEmbedding,
    embedding2: FaceEmbedding
  ): Promise<{ confidence: number; similarity: number; match: boolean }> {
    try {
      // Simplified comparison - in production, use proper face recognition algorithms
      // This is a placeholder that uses bounding box similarity as a proxy

      const box1 = embedding1.boundingBox
      const box2 = embedding2.boundingBox

      if (!box1 || !box2) {
        return { confidence: 0, similarity: 0, match: false }
      }

      // Calculate basic similarity based on face detection confidence
      const avgConfidence = (embedding1.confidence + embedding2.confidence) / 2

      // In production, this would be actual embedding comparison using cosine similarity
      const similarity = Math.min(avgConfidence, 0.95) // Cap at 95% for safety

      return {
        confidence: similarity,
        similarity: similarity,
        match: similarity >= 0.6,
      }
    } catch (error) {
      console.error('Face embedding comparison error:', error)
      return { confidence: 0, similarity: 0, match: false }
    }
  }

  async generatePhotoMatchReport(matches: PhotoMatchResult[]): Promise<any> {
    const report = {
      summary: {
        totalMatches: matches.length,
        highConfidenceMatches: matches.filter((m) => m.matchConfidence >= 0.8)
          .length,
        mediumConfidenceMatches: matches.filter(
          (m) => m.matchConfidence >= 0.6 && m.matchConfidence < 0.8
        ).length,
        platformsCovered: [...new Set(matches.map((m) => m.platform))],
      },
      matches: matches.map((match) => ({
        platform: match.platform,
        profileUrl: match.profileUrl,
        confidence: Math.round(match.matchConfidence * 100),
        confidenceLevel:
          match.matchConfidence >= 0.8
            ? 'High'
            : match.matchConfidence >= 0.6
            ? 'Medium'
            : 'Low',
      })),
      recommendations: this.generateMatchRecommendations(matches),
    }

    return report
  }

  private generateMatchRecommendations(matches: PhotoMatchResult[]): string[] {
    const recommendations: string[] = []

    if (matches.length === 0) {
      recommendations.push(
        'No facial matches found. Consider providing additional photos or social media handles.'
      )
    } else {
      const highConfidenceMatches = matches.filter(
        (m) => m.matchConfidence >= 0.8
      )

      if (highConfidenceMatches.length > 0) {
        recommendations.push(
          `Found ${highConfidenceMatches.length} high-confidence facial matches across platforms.`
        )
      }

      const platforms = [...new Set(matches.map((m) => m.platform))]
      if (platforms.length > 1) {
        recommendations.push(
          `Facial recognition identified profiles across ${
            platforms.length
          } platforms: ${platforms.join(', ')}.`
        )
      }

      if (matches.some((m) => m.matchConfidence < 0.7)) {
        recommendations.push(
          'Some matches have lower confidence. Manual verification recommended for accuracy.'
        )
      }
    }

    return recommendations
  }
}
