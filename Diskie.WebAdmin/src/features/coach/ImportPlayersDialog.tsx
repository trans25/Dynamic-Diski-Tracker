import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import type { ImportPlayerRow } from '../../api/types'

type ImportPlayersDialogProps = {
  open: boolean
  submitting?: boolean
  onClose: () => void
  onSubmit: (rows: ImportPlayerRow[]) => void
  onUploadFile?: (file: File) => void
}

const SAMPLE =
  'fullName,position,jerseyNumber,dateOfBirth,guardianName,guardianEmail,guardianPhone\n' +
  'Jordan Smith,Midfield,10,2009-04-12,Casey Smith,casey@example.com,+27123456789\n' +
  'Alex Doe,Defender,4,,,'

// Parses a simple CSV. Quoted fields are not required for this lightweight import.
function parseCsv(text: string): { rows: ImportPlayerRow[]; errors: string[] } {
  const errors: string[] = []
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length === 0) {
    return { rows: [], errors: ['The file is empty.'] }
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idx = (name: string) => header.indexOf(name)
  const nameIdx = idx('fullname')
  if (nameIdx === -1) {
    return { rows: [], errors: ['Missing required "fullName" column.'] }
  }

  const rows: ImportPlayerRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    const fullName = cols[nameIdx] ?? ''
    if (!fullName) {
      errors.push(`Row ${i + 1}: missing full name — skipped.`)
      continue
    }
    const jersey = cols[idx('jerseynumber')]
    rows.push({
      fullName,
      position: cols[idx('position')] || null,
      jerseyNumber: jersey ? Number(jersey) : null,
      dateOfBirth: cols[idx('dateofbirth')] || null,
      guardianName: cols[idx('guardianname')] || null,
      guardianEmail: cols[idx('guardianemail')] || null,
      guardianPhone: cols[idx('guardianphone')] || null,
    })
  }

  return { rows, errors }
}

export function ImportPlayersDialog({
  open,
  submitting,
  onClose,
  onSubmit,
  onUploadFile,
}: ImportPlayersDialogProps) {
  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (open) {
      setText('')
      setSelectedFile(null)
    }
  }, [open])

  const parsed = useMemo(() => (text.trim() ? parseCsv(text) : null), [text])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setSelectedFile(file)
    setText(await file.text())
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Import Players (CSV)</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Upload a CSV file or paste rows below. Required column:{' '}
            <strong>fullName</strong>. Optional: position, jerseyNumber,
            dateOfBirth, guardianName, guardianEmail, guardianPhone.
          </Typography>

          <Box>
            <Button variant="outlined" component="label" size="small">
              Choose CSV file
              <input
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </Button>
            <Link
              component="button"
              type="button"
              variant="body2"
              sx={{ ml: 2 }}
              onClick={() => setText(SAMPLE)}
            >
              Load sample
            </Link>
          </Box>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SAMPLE}
            rows={8}
            style={{
              width: '100%',
              fontFamily: 'monospace',
              fontSize: 13,
              padding: 12,
              borderRadius: 8,
              resize: 'vertical',
            }}
          />

          {parsed && (
            <Alert severity={parsed.rows.length > 0 ? 'info' : 'warning'}>
              {parsed.rows.length} player(s) ready to import
              {parsed.errors.length > 0
                ? ` · ${parsed.errors.length} row(s) skipped`
                : ''}
              .
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={submitting || ((!parsed || parsed.rows.length === 0) && !selectedFile)}
          onClick={() => {
            if (selectedFile && onUploadFile) {
              onUploadFile(selectedFile)
              return
            }
            if (parsed) {
              onSubmit(parsed.rows)
            }
          }}
        >
          {selectedFile && onUploadFile ? 'Upload CSV' : `Import ${parsed?.rows.length ? `(${parsed.rows.length})` : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
