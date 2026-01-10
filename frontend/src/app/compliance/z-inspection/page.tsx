/**
 * Z-Inspection Reports Page
 *
 * Import and track Z-Inspection findings.
 * Features:
 * - Real API integration with proper error handling
 * - Toast notifications for user feedback
 * - Form validation with type guards
 * - Finding management with add/remove
 */

'use client'

import { useState, useCallback } from 'react'
import { FileSearch, Upload, FileText, Loader2, X, Plus, Trash2, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/compliance'
import { StatCard, StatGrid } from '@/components/coinest'
import { DataTable } from '@/components/coinest'
import { InlineError } from '@/components/error-boundary'
import { useToast } from '@/components/toast'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery'
import { cn } from '@/lib/utils'
import {
  complianceApi,
  isRiskLevel,
  isTrustworthyAIRequirement,
} from '@/lib/compliance-api'
import type {
  ZInspectionReport,
  RiskLevel,
  TrustworthyAIRequirement,
} from '@/lib/compliance-api'

// ============================================================================
// Types
// ============================================================================

interface NewFinding {
  category: string
  description: string
  severity: RiskLevel
  affectedRequirement?: TrustworthyAIRequirement
  recommendation?: string
}

interface ImportFormState {
  title: string
  aiSystemId: string
  aiSystemName: string
  reportContent: string
  findings: NewFinding[]
}

const initialImportFormState: ImportFormState = {
  title: '',
  aiSystemId: '',
  aiSystemName: '',
  reportContent: '',
  findings: [],
}

const initialNewFinding: NewFinding = {
  category: '',
  description: '',
  severity: 'medium',
  affectedRequirement: undefined,
  recommendation: '',
}

// ============================================================================
// Main Component
// ============================================================================

export default function ZInspectionPage() {
  const tc = useThemeClasses()
  const { toast } = useToast()
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState<ImportFormState>(initialImportFormState)
  const [newFinding, setNewFinding] = useState<NewFinding>(initialNewFinding)

  // Fetch Z-Inspection reports with error handling
  const {
    data: reports,
    isLoading,
    error,
    refetch,
  } = useApiQuery<ZInspectionReport[]>(
    () => complianceApi.listZInspectionReports(),
    {
      onError: (message) => {
        toast.error('Failed to load Z-Inspection reports', message)
      },
    }
  )

  // Import report mutation
  const importMutation = useApiMutation<ZInspectionReport, Parameters<typeof complianceApi.importZInspectionReport>[0]>(
    (data) => complianceApi.importZInspectionReport(data),
    {
      onSuccess: () => {
        toast.success('Report imported', 'The Z-Inspection report has been imported successfully.')
        setShowImportModal(false)
        resetForm()
        refetch()
      },
      onError: (message) => {
        toast.error('Failed to import report', message)
      },
    }
  )

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setImportData(initialImportFormState)
    setNewFinding(initialNewFinding)
  }, [])

  // Handle import form field changes
  const handleImportFieldChange = useCallback((field: keyof ImportFormState, value: string) => {
    setImportData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Handle new finding field changes with type guards
  const handleFindingFieldChange = useCallback((field: keyof NewFinding, value: string) => {
    if (field === 'severity') {
      if (isRiskLevel(value)) {
        setNewFinding((prev) => ({ ...prev, severity: value }))
      }
    } else if (field === 'affectedRequirement') {
      if (value === '' || isTrustworthyAIRequirement(value)) {
        setNewFinding((prev) => ({
          ...prev,
          affectedRequirement: value === '' ? undefined : value as TrustworthyAIRequirement,
        }))
      }
    } else {
      setNewFinding((prev) => ({ ...prev, [field]: value }))
    }
  }, [])

  // Add finding to the list
  const handleAddFinding = useCallback(() => {
    if (!newFinding.category.trim() || !newFinding.description.trim()) {
      toast.warning('Validation Error', 'Category and Description are required for each finding.')
      return
    }

    setImportData((prev) => ({
      ...prev,
      findings: [...prev.findings, { ...newFinding }],
    }))
    setNewFinding(initialNewFinding)
  }, [newFinding, toast])

  // Remove finding from the list
  const handleRemoveFinding = useCallback((index: number) => {
    setImportData((prev) => ({
      ...prev,
      findings: prev.findings.filter((_, i) => i !== index),
    }))
  }, [])

  // Validate and submit import
  const handleSubmitImport = useCallback(async () => {
    if (!importData.title.trim()) {
      toast.warning('Validation Error', 'Report title is required.')
      return
    }

    await importMutation.mutate({
      title: importData.title.trim(),
      aiSystemId: importData.aiSystemId.trim() || undefined,
      aiSystemName: importData.aiSystemName.trim() || undefined,
      reportContent: importData.reportContent.trim() || undefined,
      findings: importData.findings.length > 0 ? importData.findings : undefined,
    })
  }, [importData, importMutation, toast])

  // Calculate statistics
  const reportList = reports || []
  const totalFindings = reportList.reduce((acc, r) => acc + r.findingCount, 0)
  const totalMapped = reportList.reduce((acc, r) => acc + r.mappedControlCount, 0)
  const pendingCount = reportList.filter(r => r.status === 'pending').length

  // Check if import form is valid
  const isImportFormValid = importData.title.trim().length > 0

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn('h-8 w-8 animate-spin', tc.accentCyan)} />
          <p className={tc.textMuted}>Loading Z-Inspection reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Z-Inspection Reports"
        description="Import and track Z-Inspection findings"
        icon={<FileSearch className={cn('h-6 w-6', tc.accentCyan)} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className={cn('flex items-center gap-2 px-3 py-2 rounded-lg', tc.buttonSecondary)}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg', tc.buttonPrimary)}
            >
              <Upload className="h-4 w-4" />
              Import Report
            </button>
          </div>
        }
      />

      {/* Error State */}
      {error && (
        <InlineError message={error} onRetry={refetch} />
      )}

      <StatGrid columns={4}>
        <StatCard title="Total Reports" value={reportList.length} icon={<FileText className="h-5 w-5" />} variant="default" />
        <StatCard title="Total Findings" value={totalFindings} variant="cyan" />
        <StatCard title="Mapped Controls" value={totalMapped} variant="success" />
        <StatCard title="Pending Import" value={pendingCount} variant="warning" />
      </StatGrid>

      {reportList.length === 0 && !error ? (
        <div className={cn('rounded-xl border p-12 text-center', tc.card)}>
          <FileSearch className={cn('h-12 w-12 mx-auto mb-4', tc.textMuted)} />
          <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>No Z-Inspection Reports</h3>
          <p className={cn('text-sm mb-4', tc.textMuted)}>
            No Z-Inspection reports have been imported yet. Import a report to start tracking findings.
          </p>
          <button
            onClick={() => setShowImportModal(true)}
            className={cn('px-4 py-2 rounded-lg', tc.buttonPrimary)}
          >
            Import First Report
          </button>
        </div>
      ) : reportList.length > 0 && (
        <DataTable
          columns={[
            { key: 'title', header: 'Report Title', sortable: true },
            {
              key: 'aiSystemName',
              header: 'AI System',
              sortable: true,
              render: (value) => value ? String(value) : <span className={tc.textMuted}>-</span>,
            },
            { key: 'findingCount', header: 'Findings', sortable: true },
            { key: 'tensionCount', header: 'Tensions', sortable: true },
            { key: 'mappedControlCount', header: 'Mapped Controls', sortable: true },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              render: (value) => (
                <span className={cn(
                  'badge',
                  value === 'integrated' ? tc.badgeSuccess :
                  value === 'mapped' ? tc.badgeInfo :
                  tc.badgeWarning
                )}>
                  {String(value)}
                </span>
              ),
            },
            {
              key: 'importedAt',
              header: 'Imported',
              sortable: true,
              render: (value) => {
                if (!value) return <span className={tc.textMuted}>-</span>
                try {
                  return new Date(String(value)).toLocaleDateString()
                } catch {
                  return <span className={tc.textMuted}>Invalid date</span>
                }
              },
            },
          ]}
          data={reportList as unknown as Record<string, unknown>[]}
        />
      )}

      {/* Import Report Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowImportModal(false)
              resetForm()
            }}
          />
          <div className={cn('relative w-full max-w-2xl mx-4 rounded-xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto', tc.card)}>
            <button
              onClick={() => {
                setShowImportModal(false)
                resetForm()
              }}
              className={cn('absolute top-4 right-4 p-2 rounded-lg', tc.buttonGhost)}
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className={cn('text-xl font-bold mb-6', tc.textPrimary)}>Import Z-Inspection Report</h2>

            <div className="space-y-4">
              <div>
                <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>
                  Report Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Customer Service AI Inspection Q1 2024"
                  value={importData.title}
                  onChange={(e) => handleImportFieldChange('title', e.target.value)}
                  className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>AI System ID</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={importData.aiSystemId}
                    onChange={(e) => handleImportFieldChange('aiSystemId', e.target.value)}
                    className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                  />
                </div>
                <div>
                  <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>AI System Name</label>
                  <input
                    type="text"
                    placeholder="e.g., CS Chatbot v2"
                    value={importData.aiSystemName}
                    onChange={(e) => handleImportFieldChange('aiSystemName', e.target.value)}
                    className={cn('w-full px-3 py-2 rounded-lg border', tc.input)}
                  />
                </div>
              </div>

              <div>
                <label className={cn('text-sm font-medium mb-1 block', tc.textSecondary)}>Report Content</label>
                <textarea
                  placeholder="Paste the full Z-Inspection report content here..."
                  value={importData.reportContent}
                  onChange={(e) => handleImportFieldChange('reportContent', e.target.value)}
                  rows={4}
                  className={cn('w-full px-3 py-2 rounded-lg border resize-none', tc.input)}
                />
              </div>

              {/* Findings Section */}
              <div className={cn('border rounded-lg p-4', tc.card)}>
                <h3 className={cn('text-sm font-semibold mb-3', tc.textPrimary)}>
                  Findings ({importData.findings.length})
                </h3>

                {importData.findings.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {importData.findings.map((finding, index) => (
                      <div key={index} className={cn('flex items-start gap-3 p-3 rounded-lg', tc.bgTertiary)}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('badge', tc.badgeInfo)}>{finding.category}</span>
                            <span className={cn(
                              'badge',
                              finding.severity === 'critical' ? tc.badgeCritical :
                              finding.severity === 'high' ? tc.badgeHigh :
                              finding.severity === 'medium' ? tc.badgeMedium :
                              tc.badgeLow
                            )}>
                              {finding.severity}
                            </span>
                          </div>
                          <p className={cn('text-sm truncate', tc.textSecondary)}>{finding.description}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveFinding(index)}
                          className={cn('p-1 rounded hover:bg-red-500/20', tc.textMuted)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Finding Form */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Category (e.g., Transparency)"
                      value={newFinding.category}
                      onChange={(e) => handleFindingFieldChange('category', e.target.value)}
                      className={cn('px-3 py-2 rounded-lg border text-sm', tc.input)}
                    />
                    <select
                      value={newFinding.severity}
                      onChange={(e) => handleFindingFieldChange('severity', e.target.value)}
                      className={cn('px-3 py-2 rounded-lg border text-sm', tc.input)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Description"
                    value={newFinding.description}
                    onChange={(e) => handleFindingFieldChange('description', e.target.value)}
                    className={cn('w-full px-3 py-2 rounded-lg border text-sm', tc.input)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newFinding.affectedRequirement || ''}
                      onChange={(e) => handleFindingFieldChange('affectedRequirement', e.target.value)}
                      className={cn('px-3 py-2 rounded-lg border text-sm', tc.input)}
                    >
                      <option value="">Affected Requirement (optional)</option>
                      <option value="human_agency_oversight">Human Agency & Oversight</option>
                      <option value="technical_robustness_safety">Technical Robustness & Safety</option>
                      <option value="privacy_data_governance">Privacy & Data Governance</option>
                      <option value="transparency">Transparency</option>
                      <option value="diversity_fairness_nondiscrimination">Diversity, Fairness & Non-discrimination</option>
                      <option value="societal_environmental_wellbeing">Societal & Environmental Wellbeing</option>
                      <option value="accountability">Accountability</option>
                    </select>
                    <button
                      onClick={handleAddFinding}
                      disabled={!newFinding.category.trim() || !newFinding.description.trim()}
                      className={cn(
                        'flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm',
                        tc.buttonSecondary,
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                    >
                      <Plus className="h-4 w-4" />
                      Add Finding
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-inherit">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  resetForm()
                }}
                className={cn('px-4 py-2 rounded-lg', tc.buttonSecondary)}
                disabled={importMutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitImport}
                disabled={importMutation.isLoading || !isImportFormValid}
                className={cn(
                  'px-4 py-2 rounded-lg flex items-center gap-2',
                  tc.buttonPrimary,
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {importMutation.isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}