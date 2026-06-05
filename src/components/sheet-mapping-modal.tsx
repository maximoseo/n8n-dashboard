'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, ExternalLink, FileSpreadsheet, Save } from 'lucide-react'

const LOCAL_MAPPING_KEY = 'n8n-dashboard.sheetMappings'

export interface SheetMapping {
  workflow_id: string
  sheet_url: string
  sheet_name: string
}

export interface SheetMappingData {
  sheet_url: string
  sheet_name: string
}

interface SheetMappingModalProps {
  isOpen: boolean
  onClose: () => void
  workflowId: string
  workflowName: string
  existingMapping?: SheetMapping
  onSave: (mapping: SheetMapping) => void
}

export function SheetMappingModal({
  isOpen,
  onClose,
  workflowId,
  workflowName,
  existingMapping,
  onSave,
}: SheetMappingModalProps) {
  const [sheetUrl, setSheetUrl] = useState(existingMapping?.sheet_url || '')
  const [sheetName, setSheetName] = useState(existingMapping?.sheet_name || '')
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    
    const mapping: SheetMapping = {
      workflow_id: workflowId,
      sheet_url: sheetUrl,
      sheet_name: sheetName,
    }
    
    try {
      const response = await fetch('/api/sheet-mappings', {
        method: existingMapping ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapping),
      })
      
      if (response.ok) {
        onSave(mapping)
        onClose()
      } else {
        throw new Error('Server writeback is unavailable on this static deployment')
      }
    } catch (error) {
      const existing = JSON.parse(localStorage.getItem(LOCAL_MAPPING_KEY) || '{}')
      localStorage.setItem(LOCAL_MAPPING_KEY, JSON.stringify({
        ...existing,
        [workflowId]: {
          sheet_url: sheetUrl,
          sheet_name: sheetName,
        },
      }))
      onSave(mapping)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  const isValidGoogleSheetsUrl = (url: string) => {
    return url.includes('docs.google.com/spreadsheets')
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-500" />
            Link Google Sheet
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-4">
              Workflow: <span className="text-white font-medium">{workflowName}</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sheetName" className="text-slate-300">
              Sheet Name <span className="text-slate-500">(optional)</span>
            </Label>
            <Input
              id="sheetName"
              placeholder="e.g., SEO Keywords Q3"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheetUrl" className="text-slate-300">
              Google Sheets URL
            </Label>
            <Input
              id="sheetUrl"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
            {sheetUrl && !isValidGoogleSheetsUrl(sheetUrl) && (
              <p className="text-xs text-red-400">
                Please enter a valid Google Sheets URL
              </p>
            )}
          </div>

          {sheetUrl && isValidGoogleSheetsUrl(sheetUrl) && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="w-3 h-3" />
              Preview Sheet
            </a>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!sheetUrl || !isValidGoogleSheetsUrl(sheetUrl) || isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Mapping
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component to display sheet link button on workflow card
interface SheetLinkButtonProps {
  workflowId: string
  mapping?: SheetMappingData
  onClick: () => void
}

export function SheetLinkButton({ workflowId, mapping, onClick }: SheetLinkButtonProps) {
  if (mapping?.sheet_url) {
    return (
      <a
        href={mapping.sheet_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        title={`Open sheet: ${mapping.sheet_name || 'Google Sheet'}`}
      >
        <FileSpreadsheet className="w-3 h-3" />
        Sheet
      </a>
    )
  }

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-dashed border-slate-600 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-colors"
      title="Link Google Sheet"
    >
      <FileSpreadsheet className="w-3 h-3" />
      + Sheet
    </button>
  )
}
