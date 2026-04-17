import { compressImage, CompressImageOptions } from '@/lib/compress-image'
import { uploadImage } from '@/lib/upload-image'
import { useState, useRef } from 'react'
import { toast } from 'sonner'

export type UploadStage = 'compressing' | 'uploading' | null

interface UseCompressedImageUploadOptions {
  /** Cloudinary upload preset */
  uploadPreset: string
  /** Called with { public_id, secure_url } on success */
  onSuccess: (value: { public_id: string; secure_url: string }) => void
  /** Optional compression options — defaults suit profile pictures */
  compressionOptions?: CompressImageOptions
  /** Label used in toast messages, e.g. "Staff profile image" */
  label?: string
}

interface UseCompressedImageUploadReturn {
  isUploading: boolean
  uploadStage: UploadStage
  tempPreview: string | null
  uploadError: boolean
  fileInputRef: React.RefObject<HTMLInputElement>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleRemove: (onRemove: () => void) => void
  handleRetry: () => void
  stageLabel: string
}

const DEFAULT_COMPRESSION: CompressImageOptions = {
  maxSizeMB: 0.8,
  maxDimension: 800,
  initialQuality: 0.85,
  minQuality: 0.4,
}

export function useCompressedImageUpload({
  uploadPreset,
  onSuccess,
  compressionOptions,
  label = 'Image',
}: UseCompressedImageUploadOptions): UseCompressedImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState<UploadStage>(null)
  const [tempPreview, setTempPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null!)

  const opts = { ...DEFAULT_COMPRESSION, ...compressionOptions }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WEBP, GIF)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    const tempUrl = URL.createObjectURL(file)
    setTempPreview(tempUrl)
    setUploadError(false)
    setIsUploading(true)

    try {
      // ── Step 1: Compress ──────────────────────────────────────────────────
      setUploadStage('compressing')
      const { file: compressed, originalSizeMB, compressedSizeMB, compressionRatio } =
        await compressImage(file, opts)

      if (process.env.NODE_ENV === 'development') {
        console.info(
          `[compress] ${label} | ${originalSizeMB.toFixed(2)} MB → ${compressedSizeMB.toFixed(2)} MB | ${compressionRatio.toFixed(2)}x`
        )
      }

      // ── Step 2: Upload WebP ───────────────────────────────────────────────
      setUploadStage('uploading')
      const result = await uploadImage({ image: compressed, uploadPreset })

      if (!result?.secure_url || !result?.public_id) {
        throw new Error('Missing Cloudinary data in response')
      }

      onSuccess({ public_id: result.public_id, secure_url: result.secure_url })

      URL.revokeObjectURL(tempUrl)
      setTempPreview(null)

      const savedPct = Math.round(((originalSizeMB - compressedSizeMB) / originalSizeMB) * 100)
      toast.success(
        savedPct > 5
          ? `${label} uploaded! (${savedPct}% smaller)`
          : `${label} uploaded successfully!`
      )
    } catch (error) {
      console.error(`Error uploading ${label}:`, error)
      setUploadError(true)
      const isCanvasError = error instanceof Error && error.message.includes('canvas')
      toast.error(
        isCanvasError
          ? `Failed to process ${label.toLowerCase()}. Try a different file.`
          : `Failed to upload ${label.toLowerCase()}. Please try again.`
      )
      URL.revokeObjectURL(tempUrl)
      setTempPreview(null)
    } finally {
      setIsUploading(false)
      setUploadStage(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = (onRemove: () => void) => {
    if (tempPreview) {
      URL.revokeObjectURL(tempPreview)
      setTempPreview(null)
    }
    setUploadError(false)
    onRemove()
    toast.info(`${label} removed`)
  }

  const handleRetry = () => {
    setUploadError(false)
    fileInputRef.current?.click()
  }

  const stageLabel =
    uploadStage === 'compressing' ? 'Compressing...' :
    uploadStage === 'uploading'   ? 'Uploading...'   : 'Uploading...'

  return {
    isUploading,
    uploadStage,
    tempPreview,
    uploadError,
    fileInputRef,
    handleFileChange,
    handleRemove,
    handleRetry,
    stageLabel,
  }
}