import { useState, useRef } from 'react'
import { UploadCloud, AlertTriangle, AlertCircle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react'
import { financialService } from '../../services/financialService'
import { useApp } from '../../context/useApp'

export function CsvUploader() {
  const { applyUploadedCsvData, loadSampleFinancials, loadingFinancial } = useApp()
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [validationIssues, setValidationIssues] = useState({ warnings: [], errors: [] })
  const fileInputRef = useRef(null)

  const handleFile = async (file) => {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Invalid file type. Please upload a .csv file.')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)
    setValidationIssues({ warnings: [], errors: [] })

    try {
      const response = await financialService.uploadFinancialCsv(file)
      await applyUploadedCsvData(response)

      setUploadSuccess({
        filename: response.filename,
        validRows: response.valid_rows,
        totalRows: response.total_rows,
      })

      if (response.warnings?.length > 0 || response.errors?.length > 0) {
        setValidationIssues({
          warnings: response.warnings || [],
          errors: response.errors || [],
        })
      }
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Upload Financial CSV</h3>
          <p className="text-xs text-slate-500">
            Ingest budget and actual spending datasets (max 10MB, up to 10,000 rows)
          </p>
        </div>
        <button
          onClick={loadSampleFinancials}
          disabled={loadingFinancial || uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
        >
          {loadingFinancial ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Use Synthetic Sample
        </button>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-slate-50/30'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''

            if (file) {
              handleFile(file)
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            {uploading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div className="text-sm font-semibold text-slate-800">
            {uploading ? (
              'Parsing and validating CSV...'
            ) : (
              <>
                <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop
              </>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Required headers: <span className="font-mono text-slate-600">department</span>,{' '}
            <span className="font-mono text-slate-600">budget</span>,{' '}
            <span className="font-mono text-slate-600">actual</span>
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{uploadSuccess.filename}</strong> uploaded: {uploadSuccess.validRows} valid rows of {uploadSuccess.totalRows} processed.
            </span>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong>Upload Failed:</strong> {uploadError}
          </div>
        </div>
      )}

      {/* Validation Warnings / Excluded Rows */}
      {(validationIssues.warnings.length > 0 || validationIssues.errors.length > 0) && (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Validation Notices ({validationIssues.warnings.length + validationIssues.errors.length})
          </div>

          {validationIssues.warnings.map((warn, i) => (
            <p key={`warn-${i}`} className="text-amber-800 text-[11px]">
              • {warn}
            </p>
          ))}

          {validationIssues.errors.map((err, i) => (
            <p key={`err-${i}`} className="text-rose-800 text-[11px]">
              • Row {err.row_index}: {err.issue} {err.value ? `(value: ${err.value})` : ''}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
