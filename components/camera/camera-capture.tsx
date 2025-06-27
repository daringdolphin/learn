"use client"

import { useState, useRef, ChangeEvent } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ImagePreview } from '@/components/camera/image-preview'

interface CameraCaptureProps {
  onImageCapture: (file: File) => void
  onImageRemove: () => void
  disabled?: boolean
  className?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

export function CameraCapture({ 
  onImageCapture, 
  onImageRemove, 
  disabled = false, 
  className 
}: CameraCaptureProps) {
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>('')
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB'
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return 'Please upload a JPEG or PNG image'
    }

    return null
  }

  const handleFileSelection = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setCapturedFile(file)
    onImageCapture(file)
  }

  const handleCameraCapture = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelection(file)
    }
  }

  const handleRemoveImage = () => {
    setCapturedFile(null)
    setError('')
    onImageRemove()
    
    // Clear file inputs
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
    if (uploadInputRef.current) {
      uploadInputRef.current.value = ''
    }
  }

  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const triggerUpload = () => {
    if (uploadInputRef.current) {
      uploadInputRef.current.click()
    }
  }

  return (
    <div className={cn('w-full', className)}>
      {!capturedFile ? (
        <div className="space-y-4">
          {/* Camera/Upload Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Camera Capture */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={triggerCamera}
              disabled={disabled}
              className="h-24 flex-col gap-2 border-2 border-dashed hover:border-blue-300 hover:bg-blue-50"
            >
              <Camera className="h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium">Take Photo</span>
            </Button>

            {/* File Upload */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={triggerUpload}
              disabled={disabled}
              className="h-24 flex-col gap-2 border-2 border-dashed hover:border-green-300 hover:bg-green-50"
            >
              <Upload className="h-8 w-8 text-green-600" />
              <span className="text-sm font-medium">Upload Image</span>
            </Button>
          </div>

          {/* Helper Text */}
          <div className="text-center text-sm text-gray-600">
            <p>Capture or upload your answer sheet</p>
            <p className="text-xs text-gray-500 mt-1">
              Maximum 10MB • JPEG or PNG format
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
            disabled={disabled}
          />
          
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleUpload}
            className="hidden"
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <ImagePreview file={capturedFile} />
          
          {/* Image Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveImage}
              disabled={disabled}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Remove Image
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={triggerCamera}
              disabled={disabled}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Retake
            </Button>
          </div>

          {/* File Info */}
          <div className="text-xs text-gray-500 text-center">
            {capturedFile.name} • {(capturedFile.size / 1024 / 1024).toFixed(1)}MB
          </div>
        </div>
      )}
    </div>
  )
} 