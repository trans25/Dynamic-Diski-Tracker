import { useState, type MouseEvent, type RefObject } from 'react'
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ImageIcon from '@mui/icons-material/Image'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import PrintIcon from '@mui/icons-material/Print'
import { useNotify } from '../NotificationProvider'
import {
  exportChartImage,
  exportChartPdf,
  printChart,
  type ChartImageFormat,
} from '../../utils/chartExport'

type ChartActionsProps = {
  chartRef: RefObject<HTMLElement | null>
  fileName: string
  title: string
}

export function ChartActions({ chartRef, fileName, title }: ChartActionsProps) {
  const notify = useNotify()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const open = Boolean(anchorEl)

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const withChart = async (action: (container: HTMLElement) => Promise<void>) => {
    const container = chartRef.current
    if (!container) {
      notify('Chart is not ready yet. Try again in a second.', 'warning')
      return
    }

    try {
      await action(container)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export chart.'
      notify(message, 'error')
    }
  }

  const exportImage = async (format: ChartImageFormat) => {
    handleClose()
    await withChart((container) => exportChartImage(container, { fileName, format }))
  }

  const exportPdf = async () => {
    handleClose()
    await withChart((container) => exportChartPdf(container, { fileName }))
  }

  const print = async () => {
    handleClose()
    await withChart((container) => printChart(container, title))
  }

  return (
    <>
      <Tooltip title="Export chart">
        <IconButton size="small" onClick={handleOpen}>
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => exportImage('png')}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export PNG</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportImage('jpeg')}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export JPEG</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => exportImage('webp')}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export WEBP</ListItemText>
        </MenuItem>
        <MenuItem onClick={exportPdf}>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={print}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}