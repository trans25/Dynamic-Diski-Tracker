export type ChartImageFormat = 'png' | 'jpeg' | 'webp'

type ExportImageOptions = {
  fileName: string
  format: ChartImageFormat
  quality?: number
  backgroundColor?: string
}

type ExportPdfOptions = {
  fileName: string
  backgroundColor?: string
}

function getChartSvg(container: HTMLElement): SVGSVGElement {
  const svg = container.querySelector('svg')
  if (!svg) {
    throw new Error('Chart SVG not found. Render the chart before exporting.')
  }
  return svg
}

function getSvgSize(svg: SVGSVGElement): { width: number; height: number } {
  const viewBox = svg.viewBox?.baseVal
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height }
  }

  const rect = svg.getBoundingClientRect()
  return {
    width: Math.max(1, Math.round(rect.width)),
    height: Math.max(1, Math.round(rect.height)),
  }
}

function serializeSvg(svg: SVGSVGElement): string {
  const serializer = new XMLSerializer()
  return serializer.serializeToString(svg)
}

async function svgToCanvas(svg: SVGSVGElement, backgroundColor: string): Promise<HTMLCanvasElement> {
  const { width, height } = getSvgSize(svg)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Could not create canvas context for chart export.')
  }

  context.fillStyle = backgroundColor
  context.fillRect(0, 0, width, height)

  const svgMarkup = serializeSvg(svg)
  const encoded = encodeURIComponent(svgMarkup)
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encoded}`

  await new Promise<void>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      context.drawImage(image, 0, 0, width, height)
      resolve()
    }
    image.onerror = () => reject(new Error('Failed to render chart image.'))
    image.src = dataUrl
  })

  return canvas
}

function triggerDownload(dataUrl: string, fileName: string) {
  const anchor = document.createElement('a')
  anchor.href = dataUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

export async function exportChartImage(container: HTMLElement, options: ExportImageOptions) {
  const svg = getChartSvg(container)
  const canvas = await svgToCanvas(svg, options.backgroundColor ?? '#ffffff')
  const mimeType = `image/${options.format}`
  const quality = options.quality ?? 0.95
  const dataUrl = canvas.toDataURL(mimeType, quality)

  triggerDownload(dataUrl, `${options.fileName}.${options.format}`)
}

export async function exportChartPdf(container: HTMLElement, options: ExportPdfOptions) {
  const { jsPDF } = await import('jspdf')
  const svg = getChartSvg(container)
  const canvas = await svgToCanvas(svg, options.backgroundColor ?? '#ffffff')
  const imageData = canvas.toDataURL('image/png', 1)

  const pdf = new jsPDF({
    orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  })

  pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(`${options.fileName}.pdf`)
}

export async function printChart(container: HTMLElement, title: string) {
  const svg = getChartSvg(container)
  const canvas = await svgToCanvas(svg, '#ffffff')
  const imageData = canvas.toDataURL('image/png', 1)

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800')
  if (!printWindow) {
    throw new Error('Popup blocked. Allow popups to print charts.')
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { margin: 0; padding: 24px; font-family: Arial, sans-serif; }
          img { width: 100%; height: auto; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        <img src="${imageData}" alt="${title}" />
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}