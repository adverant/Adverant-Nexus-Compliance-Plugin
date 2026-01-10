/**
 * Evidence Upload Widget
 *
 * Drag-and-drop file upload widget for attaching evidence to findings.
 * Supports multiple file types with validation and progress tracking.
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import { complianceApi, type EvidenceType } from '@/lib/compliance-api'
import { EVIDENCE_TYPES, EVIDENCE_TYPE_LABELS } from '@/types/compliance'

// File type configuration
const ALLOWED_FILE_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF' },
  'image/png': { icon: ImageIcon, label: 'PNG' },
  'image/jpeg': { icon: ImageIcon, label: 'JPEG' },
  'image/gif': { icon: ImageIcon, label: 'GIF' },
  'image/webp': { icon: ImageIcon, label: 'WebP' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'Word' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileSpreadsheet, label: 'Excel' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: FileText, label: 'PowerPoint' },
  'text/csv': { icon: FileSpreadsheet, label: 'CSV' },
  'application/json': { icon: FileText, label: 'JSON' },
  'text/plain': { icon: FileText, label: 'Text' },
  'application/zip': { icon: File, label: 'ZIP' },
  'text/x-log': { icon: FileText, label: 'Log' },
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Upload status
type UploadStatus = 'pending' | 'uploading' | 'success' | 'error'

interface FileUpload {
  id: string
  file: File
  status: UploadStatus
  progress: number
  error?: string
}

interface EvidenceUploadWidgetProps {
  controlId: string
  findingId?: string
  assessmentId?: string
  onUploadComplete?: () => void
  className?: string
}

export function EvidenceUploadWidget({
  controlId,
  findingId,
  assessmentId,
  onUploadComplete,
  className,
}: EvidenceUploadWidgetProps) {
  const tc = useThemeClasses()

  const [evidenceType, setEvidenceType] = useState<EvidenceType>('document')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<FileUpload[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Validate file
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`
    }
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      return 'File type not supported'
    }
    return null
  }

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: FileUpload[] = []
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      if (!file) continue
      const error = validateFile(file)
      newFiles.push({
        id: generateId(),
        file,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
      })
    }
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  // Drag handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  // Upload files
  const handleUpload = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    for (const fileUpload of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id ? { ...f, status: 'uploading' as UploadStatus } : f
        )
      )

      try {
        // Create form data for file upload
        const formData = new FormData()
        formData.append('file', fileUpload.file)
        formData.append('type', evidenceType)
        formData.append('title', fileUpload.file.name)
        formData.append('controlId', controlId)
        if (description) formData.append('description', description)
        if (findingId) formData.append('findingId', findingId)
        if (assessmentId) formData.append('assessmentId', assessmentId)

        // Upload via API
        await complianceApi.uploadEvidence(formData)

        // Update status to success
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileUpload.id ? { ...f, status: 'success' as UploadStatus, progress: 100 } : f
          )
        )
      } catch (err) {
        console.error('Upload failed:', err)
        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileUpload.id
              ? { ...f, status: 'error' as UploadStatus, error: 'Upload failed' }
              : f
          )
        )
      }
    }

    setIsUploading(false)
    onUploadComplete?.()
  }

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    const config = ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES]
    return config?.icon || File
  }

  // Count by status
  const pendingCount = files.filter((f) => f.status === 'pending').length
  const successCount = files.filter((f) => f.status === 'success').length
  const errorCount = files.filter((f) => f.status === 'error').length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Evidence Type Selector */}
      <div>
        <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
          Evidence Type
        </label>
        <div className="flex flex-wrap gap-2">
          {EVIDENCE_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setEvidenceType(type)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                evidenceType === type
                  ? tc.buttonPrimary
                  : tc.buttonSecondary
              )}
            >
              {EVIDENCE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-coinest-accent-cyan bg-coinest-accent-cyan/10'
            : cn(tc.border, 'hover:border-coinest-accent-cyan/50'),
          tc.bgTertiary
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          accept={Object.keys(ALLOWED_FILE_TYPES).join(',')}
        />
        <Upload className={cn('h-10 w-10 mx-auto mb-3', tc.textMuted)} />
        <p className={cn('text-sm font-medium mb-1', tc.textPrimary)}>
          Drop files here or click to browse
        </p>
        <p className={cn('text-xs', tc.textMuted)}>
          PDF, Images, Documents, CSV, JSON, ZIP up to 50MB
        </p>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className={cn('text-sm font-medium', tc.textPrimary)}>
              Selected Files ({files.length})
            </p>
            {successCount > 0 && (
              <span className={cn('text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400')}>
                {successCount} uploaded
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {files.map((fileUpload) => {
              const FileIcon = getFileIcon(fileUpload.file.type)
              return (
                <div
                  key={fileUpload.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border',
                    tc.border,
                    fileUpload.status === 'error' && 'border-red-500/50 bg-red-500/10',
                    fileUpload.status === 'success' && 'border-green-500/50 bg-green-500/10'
                  )}
                >
                  <FileIcon className={cn('h-5 w-5 shrink-0', tc.textMuted)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm truncate', tc.textPrimary)}>
                      {fileUpload.file.name}
                    </p>
                    <p className={cn('text-xs', tc.textMuted)}>
                      {(fileUpload.file.size / 1024).toFixed(1)} KB
                      {fileUpload.error && (
                        <span className="text-red-400 ml-2">{fileUpload.error}</span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {fileUpload.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(fileUpload.id)
                        }}
                        className={cn('p-1 rounded', tc.buttonGhost)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {fileUpload.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-coinest-accent-cyan" />
                    )}
                    {fileUpload.status === 'success' && (
                      <Check className="h-4 w-4 text-green-400" />
                    )}
                    {fileUpload.status === 'error' && (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description for these evidence files..."
          rows={3}
          className={cn('w-full px-4 py-2 rounded-lg border resize-none', tc.input)}
        />
      </div>

      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <div className={cn('text-sm', tc.textMuted)}>
          {pendingCount > 0 && `${pendingCount} file${pendingCount !== 1 ? 's' : ''} ready to upload`}
          {errorCount > 0 && (
            <span className="text-red-400 ml-2">
              ({errorCount} error{errorCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={pendingCount === 0 || isUploading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
            pendingCount > 0 && !isUploading ? tc.buttonPrimary : 'opacity-50 cursor-not-allowed ' + tc.buttonPrimary
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload {pendingCount > 0 ? `${pendingCount} File${pendingCount !== 1 ? 's' : ''}` : 'Files'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default EvidenceUploadWidget