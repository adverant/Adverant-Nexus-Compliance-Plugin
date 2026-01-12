/**
 * Reports Page - Simplified Version
 *
 * Minimal implementation to debug client-side error.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Plus, Loader2 } from 'lucide-react'

// Report interface
interface Report {
  id: string
  title: string
  type: string
  status: string
  createdAt: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading with mock data
    const timer = setTimeout(() => {
      setReports([
        {
          id: '1',
          title: 'Q4 2025 Executive Compliance Summary',
          type: 'executive_summary',
          status: 'ready',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'EU AI Act Gap Analysis',
          type: 'gap_analysis',
          status: 'ready',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ])
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-cyan-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Report Library</h1>
          <p className="text-sm text-neutral-400">Generate, view, and manage compliance reports</p>
        </div>
      </div>

      {/* New Report Button */}
      <div className="flex justify-end">
        <Link
          href="/compliance/reports/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600"
        >
          <Plus className="h-4 w-4" />
          Generate Report
        </Link>
      </div>

      {/* Reports List */}
      <div className="rounded-xl border border-neutral-700 bg-neutral-800/50">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-500" />
            <p className="text-lg font-medium mb-2 text-white">No reports found</p>
            <p className="text-sm mb-4 text-neutral-400">Generate your first compliance report</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-700">
            {reports.map((report) => (
              <div key={report.id} className="p-4 flex items-center gap-4 hover:bg-neutral-700/30">
                <div className="p-2 rounded-lg bg-neutral-700">
                  <FileText className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{report.title}</p>
                  <p className="text-xs text-neutral-400">
                    {report.type} • {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}