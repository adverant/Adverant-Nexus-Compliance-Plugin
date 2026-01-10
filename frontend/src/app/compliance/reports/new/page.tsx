/**
 * Report Generation Wizard
 *
 * 4-step wizard for generating compliance reports:
 * 1. Type Selection - Choose report type
 * 2. Scope - Select frameworks, date range, assessments
 * 3. Customize - Configure sections, branding
 * 4. Export - Choose format, schedule, recipients
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  FileBarChart,
  FileCheck,
  FilePieChart,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar,
  Settings,
  Download,
  Mail,
  Clock,
  Loader2,
  Eye,
} from 'lucide-react'
import { useThemeClasses } from '@/hooks/useThemeClasses'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/compliance'
import { complianceApi } from '@/lib/compliance-api'

// Report types
type ReportType = 'executive_summary' | 'full_audit' | 'gap_analysis' | 'remediation_plan' | 'board_presentation'

const REPORT_TYPES: {
  type: ReportType
  title: string
  description: string
  icon: typeof FileText
  estimatedPages: string
}[] = [
  {
    type: 'executive_summary',
    title: 'Executive Summary',
    description: 'High-level overview for leadership with key metrics and recommendations',
    icon: FileBarChart,
    estimatedPages: '5-10 pages',
  },
  {
    type: 'full_audit',
    title: 'Full Audit Report',
    description: 'Comprehensive assessment with all control findings and evidence',
    icon: FileText,
    estimatedPages: '50-100+ pages',
  },
  {
    type: 'gap_analysis',
    title: 'Gap Analysis',
    description: 'Detailed comparison of current state vs. compliance requirements',
    icon: FilePieChart,
    estimatedPages: '20-40 pages',
  },
  {
    type: 'remediation_plan',
    title: 'Remediation Plan',
    description: 'Action-oriented roadmap with tasks, timelines, and responsibilities',
    icon: FileCheck,
    estimatedPages: '15-30 pages',
  },
  {
    type: 'board_presentation',
    title: 'Board Presentation',
    description: 'PowerPoint-ready slides with key visualizations and talking points',
    icon: FileSpreadsheet,
    estimatedPages: '10-15 slides',
  },
]

// Export formats
type ExportFormat = 'pdf' | 'html' | 'markdown' | 'json' | 'pptx'

const EXPORT_FORMATS: { format: ExportFormat; label: string; description: string }[] = [
  { format: 'pdf', label: 'PDF', description: 'Print-ready document' },
  { format: 'html', label: 'HTML', description: 'Interactive web report' },
  { format: 'markdown', label: 'Markdown', description: 'Plain text for documentation' },
  { format: 'json', label: 'JSON', description: 'Machine-readable data' },
  { format: 'pptx', label: 'PowerPoint', description: 'Presentation slides' },
]

// Schedule frequency
type ScheduleFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'quarterly'

const SCHEDULE_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: 'none', label: 'One-time (No Schedule)' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
]

// Frameworks (mock)
const FRAMEWORKS = [
  { id: 'iso27001', name: 'ISO 27001', controlCount: 93 },
  { id: 'gdpr', name: 'GDPR', controlCount: 220 },
  { id: 'eu_ai_act', name: 'EU AI Act', controlCount: 74 },
  { id: 'nis2', name: 'NIS2', controlCount: 47 },
  { id: 'soc2', name: 'SOC 2', controlCount: 64 },
  { id: 'iso27701', name: 'ISO 27701', controlCount: 50 },
]

// Report sections
const REPORT_SECTIONS = [
  { id: 'executive_summary', label: 'Executive Summary', default: true },
  { id: 'compliance_overview', label: 'Compliance Overview', default: true },
  { id: 'control_findings', label: 'Control Findings', default: true },
  { id: 'evidence_summary', label: 'Evidence Summary', default: true },
  { id: 'risk_analysis', label: 'Risk Analysis', default: true },
  { id: 'recommendations', label: 'AI Recommendations', default: true },
  { id: 'trend_analysis', label: 'Trend Analysis', default: false },
  { id: 'appendix', label: 'Detailed Appendix', default: false },
]

// Wizard steps
const STEPS = [
  { id: 1, title: 'Type', icon: FileText },
  { id: 2, title: 'Scope', icon: Settings },
  { id: 3, title: 'Customize', icon: Eye },
  { id: 4, title: 'Export', icon: Download },
]

export default function NewReportPage() {
  const tc = useThemeClasses()
  const router = useRouter()

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Type Selection
  const [reportType, setReportType] = useState<ReportType | null>(null)

  // Step 2: Scope
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([])
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [includeAllAssessments, setIncludeAllAssessments] = useState(true)

  // Step 3: Customize
  const [selectedSections, setSelectedSections] = useState<string[]>(
    REPORT_SECTIONS.filter((s) => s.default).map((s) => s.id)
  )
  const [includeCompanyLogo, setIncludeCompanyLogo] = useState(true)
  const [includeConfidentialWatermark, setIncludeConfidentialWatermark] = useState(false)
  const [reportTitle, setReportTitle] = useState('')

  // Step 4: Export
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>('none')
  const [emailRecipients, setEmailRecipients] = useState('')

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)

  // Auto-generate report title
  useEffect(() => {
    if (reportType && selectedFrameworks.length > 0) {
      const typeName = REPORT_TYPES.find((t) => t.type === reportType)?.title || ''
      const frameworkNames = selectedFrameworks
        .map((id) => FRAMEWORKS.find((f) => f.id === id)?.name)
        .filter(Boolean)
        .join(', ')
      const date = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      setReportTitle(`${typeName} - ${frameworkNames} - ${date}`)
    }
  }, [reportType, selectedFrameworks])

  // Toggle framework selection
  const toggleFramework = (frameworkId: string) => {
    setSelectedFrameworks((prev) =>
      prev.includes(frameworkId)
        ? prev.filter((id) => id !== frameworkId)
        : [...prev, frameworkId]
    )
  }

  // Toggle section selection
  const toggleSection = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  // Validation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return reportType !== null
      case 2:
        return selectedFrameworks.length > 0
      case 3:
        return selectedSections.length > 0 && reportTitle.trim() !== ''
      case 4:
        return true
      default:
        return false
    }
  }

  // Navigation
  const goToNextStep = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  // Generate report
  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Navigate to reports library
      router.push('/compliance/reports')
    } catch (error) {
      console.error('Failed to generate report:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={<FileText className="h-6 w-6 text-coinest-accent-cyan" />}
        title="Generate Report"
        description="Create a new compliance report with customized content and formatting"
      />

      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              disabled={step.id > currentStep}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                currentStep === step.id
                  ? tc.buttonPrimary
                  : step.id < currentStep
                  ? 'bg-green-500/20 text-green-400 cursor-pointer'
                  : cn(tc.bgTertiary, tc.textMuted, 'cursor-not-allowed')
              )}
            >
              {step.id < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{step.title}</span>
            </button>
            {index < STEPS.length - 1 && (
              <ChevronRight className={cn('h-5 w-5 mx-2', tc.textMuted)} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className={cn('rounded-xl border p-6', tc.border, tc.bgSecondary)}>
        {/* Step 1: Type Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>
                Select Report Type
              </h3>
              <p className={cn('text-sm', tc.textMuted)}>
                Choose the type of report that best fits your needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORT_TYPES.map((type) => {
                const Icon = type.icon
                const isSelected = reportType === type.type
                return (
                  <button
                    key={type.type}
                    onClick={() => setReportType(type.type)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'border-coinest-accent-cyan bg-coinest-accent-cyan/10'
                        : cn(tc.border, 'hover:border-coinest-accent-cyan/50')
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        isSelected ? 'bg-coinest-accent-cyan/20' : tc.bgTertiary
                      )}>
                        <Icon className={cn(
                          'h-5 w-5',
                          isSelected ? 'text-coinest-accent-cyan' : tc.textMuted
                        )} />
                      </div>
                      <div className="flex-1">
                        <p className={cn('font-medium mb-1', tc.textPrimary)}>
                          {type.title}
                        </p>
                        <p className={cn('text-xs mb-2', tc.textMuted)}>
                          {type.description}
                        </p>
                        <span className={cn('text-xs px-2 py-0.5 rounded', tc.bgTertiary, tc.textMuted)}>
                          {type.estimatedPages}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Scope */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>
                Define Report Scope
              </h3>
              <p className={cn('text-sm', tc.textMuted)}>
                Select frameworks and date range to include in the report
              </p>
            </div>

            {/* Framework Selection */}
            <div>
              <label className={cn('block text-sm font-medium mb-3', tc.textPrimary)}>
                Frameworks <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {FRAMEWORKS.map((framework) => {
                  const isSelected = selectedFrameworks.includes(framework.id)
                  return (
                    <button
                      key={framework.id}
                      onClick={() => toggleFramework(framework.id)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-coinest-accent-cyan bg-coinest-accent-cyan/10'
                          : cn(tc.border, 'hover:border-coinest-accent-cyan/50')
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn('font-medium', tc.textPrimary)}>
                          {framework.name}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-coinest-accent-cyan" />}
                      </div>
                      <span className={cn('text-xs', tc.textMuted)}>
                        {framework.controlCount} controls
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tc.textMuted)} />
                  <input
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    className={cn('w-full pl-10 pr-4 py-2 rounded-lg border', tc.input)}
                  />
                </div>
              </div>
              <div>
                <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                  End Date
                </label>
                <div className="relative">
                  <Calendar className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tc.textMuted)} />
                  <input
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    className={cn('w-full pl-10 pr-4 py-2 rounded-lg border', tc.input)}
                  />
                </div>
              </div>
            </div>

            {/* Assessment filter */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAllAssessments}
                  onChange={(e) => setIncludeAllAssessments(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-transparent text-coinest-accent-cyan focus:ring-coinest-accent-cyan"
                />
                <span className={cn('text-sm', tc.textPrimary)}>
                  Include all completed assessments in date range
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Customize */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>
                Customize Report
              </h3>
              <p className={cn('text-sm', tc.textMuted)}>
                Configure sections and branding options
              </p>
            </div>

            {/* Report Title */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                Report Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title..."
                className={cn('w-full px-4 py-2 rounded-lg border', tc.input)}
              />
            </div>

            {/* Sections */}
            <div>
              <label className={cn('block text-sm font-medium mb-3', tc.textPrimary)}>
                Include Sections <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {REPORT_SECTIONS.map((section) => {
                  const isSelected = selectedSections.includes(section.id)
                  return (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-coinest-accent-cyan bg-coinest-accent-cyan/10'
                          : cn(tc.border, 'hover:border-coinest-accent-cyan/50')
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn('text-sm', tc.textPrimary)}>
                          {section.label}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-coinest-accent-cyan" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Branding Options */}
            <div className="space-y-3">
              <label className={cn('block text-sm font-medium', tc.textPrimary)}>
                Branding Options
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCompanyLogo}
                  onChange={(e) => setIncludeCompanyLogo(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-transparent text-coinest-accent-cyan focus:ring-coinest-accent-cyan"
                />
                <span className={cn('text-sm', tc.textPrimary)}>
                  Include company logo
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeConfidentialWatermark}
                  onChange={(e) => setIncludeConfidentialWatermark(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-transparent text-coinest-accent-cyan focus:ring-coinest-accent-cyan"
                />
                <span className={cn('text-sm', tc.textPrimary)}>
                  Add &quot;Confidential&quot; watermark
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Export */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className={cn('text-lg font-semibold mb-2', tc.textPrimary)}>
                Export Options
              </h3>
              <p className={cn('text-sm', tc.textMuted)}>
                Choose format, schedule, and distribution
              </p>
            </div>

            {/* Export Format */}
            <div>
              <label className={cn('block text-sm font-medium mb-3', tc.textPrimary)}>
                Export Format
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {EXPORT_FORMATS.map((format) => {
                  const isSelected = exportFormat === format.format
                  return (
                    <button
                      key={format.format}
                      onClick={() => setExportFormat(format.format)}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-all',
                        isSelected
                          ? 'border-coinest-accent-cyan bg-coinest-accent-cyan/10'
                          : cn(tc.border, 'hover:border-coinest-accent-cyan/50')
                      )}
                    >
                      <p className={cn('font-medium text-sm mb-1', tc.textPrimary)}>
                        {format.label}
                      </p>
                      <p className={cn('text-xs', tc.textMuted)}>
                        {format.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                Schedule
              </label>
              <div className="relative">
                <Clock className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', tc.textMuted)} />
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value as ScheduleFrequency)}
                  className={cn('w-full pl-10 pr-4 py-2 rounded-lg border', tc.input)}
                >
                  {SCHEDULE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email Recipients */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', tc.textPrimary)}>
                Email Recipients (optional)
              </label>
              <div className="relative">
                <Mail className={cn('absolute left-3 top-3 h-4 w-4', tc.textMuted)} />
                <textarea
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="Enter email addresses, one per line..."
                  rows={3}
                  className={cn('w-full pl-10 pr-4 py-2 rounded-lg border resize-none', tc.input)}
                />
              </div>
              <p className={cn('text-xs mt-1', tc.textMuted)}>
                Report will be emailed to these recipients when ready
              </p>
            </div>

            {/* Summary */}
            <div className={cn('p-4 rounded-lg', tc.bgTertiary)}>
              <h4 className={cn('font-medium mb-3', tc.textPrimary)}>Report Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className={tc.textMuted}>Type:</span>
                <span className={tc.textPrimary}>
                  {REPORT_TYPES.find((t) => t.type === reportType)?.title}
                </span>
                <span className={tc.textMuted}>Frameworks:</span>
                <span className={tc.textPrimary}>
                  {selectedFrameworks.map((id) => FRAMEWORKS.find((f) => f.id === id)?.name).join(', ')}
                </span>
                <span className={tc.textMuted}>Sections:</span>
                <span className={tc.textPrimary}>{selectedSections.length} selected</span>
                <span className={tc.textMuted}>Format:</span>
                <span className={tc.textPrimary}>{exportFormat.toUpperCase()}</span>
                <span className={tc.textMuted}>Schedule:</span>
                <span className={tc.textPrimary}>
                  {SCHEDULE_OPTIONS.find((s) => s.value === scheduleFrequency)?.label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousStep}
          disabled={currentStep === 1}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            currentStep === 1 ? 'opacity-50 cursor-not-allowed' : '',
            tc.buttonSecondary
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {currentStep < 4 ? (
          <button
            onClick={goToNextStep}
            disabled={!canProceed()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              !canProceed() ? 'opacity-50 cursor-not-allowed' : '',
              tc.buttonPrimary
            )}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              'flex items-center gap-2 px-6 py-2 rounded-lg',
              tc.buttonPrimary
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate Report
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
