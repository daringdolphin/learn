"use client"

import { useState, useEffect } from 'react'
import { FileImage, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImagePreviewProps {
  file: File | null
  className?: string
}

export function ImagePreview({ file, className }: ImagePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!file) {
      setImageUrl('')
      return
    }

    setLoading(true)
    setError('')

    const createImageUrl = async () => {
      try {
        // Create object URL for preview
        const url = URL.createObjectURL(file)
        setImageUrl(url)
      } catch (err) {
        console.error('Error creating image URL:', err)
        setError('Failed to load image preview')
      } finally {
        setLoading(false)
      }
    }

    createImageUrl()

    // Cleanup function to revoke object URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [file])

  if (!file) {
    return null
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed', className)}>
        <div className="text-center">
          <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Loading preview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center p-8 bg-red-50 rounded-lg border-2 border-dashed border-red-200', className)}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative rounded-lg overflow-hidden border-2 border-gray-200', className)}>
      <img
        src={imageUrl}
        alt="Preview of captured answer sheet"
        className="w-full h-auto max-h-96 object-contain bg-gray-50"
        style={{
          // Handle EXIF orientation automatically in modern browsers
          imageOrientation: 'from-image'
        }}
        onError={() => setError('Failed to display image')}
      />
      
      {/* Image overlay with file info */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
        <p className="text-xs truncate">
          {file.name}
        </p>
      </div>
    </div>
  )
} 