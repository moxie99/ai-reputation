import { ImageAnnotatorClient } from '@google-cloud/vision'

export class GoogleVisionService {
  private client: ImageAnnotatorClient

  constructor(keyFilename?: string) {
    this.client = new ImageAnnotatorClient({
      keyFilename: keyFilename || process.env.GOOGLE_APPLICATION_CREDENTIALS,
    })
  }

  async detectFaces(imageBuffer: Buffer) {
    try {
      const [result] = await this.client.faceDetection({
        image: { content: imageBuffer },
      })

      const faces = result.faceAnnotations || []

      return faces.map((face) => ({
        boundingPoly: face.boundingPoly,
        confidence: face.detectionConfidence,
        landmarks: face.landmarks,
        emotions: {
          joy: face.joyLikelihood,
          sorrow: face.sorrowLikelihood,
          anger: face.angerLikelihood,
          surprise: face.surpriseLikelihood,
        },
        headwear: face.headwearLikelihood,
        blurred: face.blurredLikelihood,
      }))
    } catch (error) {
      console.error('Google Vision face detection error:', error)
      throw new Error('Failed to detect faces')
    }
  }

  async extractFaceEmbeddings(imageBuffer: Buffer) {
    try {
      // Note: Google Vision API doesn't provide face embeddings directly
      // This would require additional ML models or services like Face API
      const faces = await this.detectFaces(imageBuffer)

      // For now, return face detection data
      // In production, you'd use a dedicated face recognition service
      return faces.map((face) => ({
        boundingBox: face.boundingPoly,
        confidence: face.confidence,
        // embeddings would be calculated here with a face recognition model
        embeddings: null, // Placeholder for actual embeddings
      }))
    } catch (error) {
      console.error('Face embeddings extraction error:', error)
      throw new Error('Failed to extract face embeddings')
    }
  }

  async compareFaces(image1Buffer: Buffer, image2Buffer: Buffer) {
    try {
      const [faces1, faces2] = await Promise.all([
        this.detectFaces(image1Buffer),
        this.detectFaces(image2Buffer),
      ])

      if (faces1.length === 0 || faces2.length === 0) {
        return {
          match: false,
          confidence: 0,
          reason: 'No faces detected in one or both images',
        }
      }

      // Basic comparison based on face detection confidence
      // In production, this would use actual face recognition/comparison
      const avgConfidence1 =
        faces1.reduce((sum, face) => sum + (face.confidence || 0), 0) /
        faces1.length
      const avgConfidence2 =
        faces2.reduce((sum, face) => sum + (face.confidence || 0), 0) /
        faces2.length

      // Placeholder logic - in production, use proper face comparison
      const similarity = Math.min(avgConfidence1, avgConfidence2)

      return {
        match: similarity > 0.7,
        confidence: similarity,
        reason:
          similarity > 0.7
            ? 'Faces detected with high confidence'
            : 'Low confidence face match',
      }
    } catch (error) {
      console.error('Face comparison error:', error)
      throw new Error('Failed to compare faces')
    }
  }

  async analyzeImage(imageBuffer: Buffer) {
    try {
      const [result] = await this.client.annotateImage({
        image: { content: imageBuffer },
        features: [
          { type: 'FACE_DETECTION' },
          { type: 'LABEL_DETECTION' },
          { type: 'TEXT_DETECTION' },
          { type: 'SAFE_SEARCH_DETECTION' },
        ],
      })

      return {
        faces: result.faceAnnotations || [],
        labels: result.labelAnnotations || [],
        text: result.textAnnotations || [],
        safeSearch: result.safeSearchAnnotation,
        imageProperties: result.imagePropertiesAnnotation,
      }
    } catch (error) {
      console.error('Image analysis error:', error)
      throw new Error('Failed to analyze image')
    }
  }
}
