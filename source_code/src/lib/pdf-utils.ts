// PDF generation utilities for invoices using jsPDF

export interface InvoiceItem {
    description: string
    quantity: number
    rate: number
    amount: number
  }
  
  export interface InvoiceData {
    invoiceNumber: string
    invoiceDate: Date
    dueDate: Date
    provider: {
      name: string
      email: string
      address?: string
      phone?: string
      website?: string
    }
    client: {
      name: string
      email: string
      address?: string
      company?: string
    }
    items: InvoiceItem[]
    subtotal: number
    tax?: {
      rate: number
      amount: number
    }
    total: number
    notes?: string
    paymentTerms?: string
  }
  
  // Generate PDF invoice using jsPDF
  export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<void> {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import("jspdf")
  
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    let yPosition = 20
  
    // Colors
    const primaryColor = [79, 70, 229] // Indigo
    const grayColor = [107, 114, 128]
    const lightGrayColor = [243, 244, 246]
  
    // Helper functions
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      if (options.color) {
        if (Array.isArray(options.color) && options.color.length === 3) {
          doc.setTextColor(options.color[0], options.color[1], options.color[2])
        }
      }
      if (options.fontSize) doc.setFontSize(options.fontSize)
      if (options.fontStyle) doc.setFont("helvetica", options.fontStyle)
      doc.text(text, x, y)
      // Reset to defaults
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
    }
  
    const addLine = (x1: number, y1: number, x2: number, y2: number, color = [0, 0, 0]) => {
      if (Array.isArray(color) && color.length === 3) {
        doc.setDrawColor(color[0], color[1], color[2])
      }
      doc.line(x1, y1, x2, y2)
      doc.setDrawColor(0, 0, 0)
    }
  
    const addRect = (x: number, y: number, width: number, height: number, fillColor?: number[]) => {
      if (fillColor && Array.isArray(fillColor) && fillColor.length === 3) {
        doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
        doc.rect(x, y, width, height, "F")
      } else {
        doc.rect(x, y, width, height)
      }
    }
  
    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
    const formatDate = (date: Date) =>
      date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
  
    // Header
    addText("INVOICE", 20, yPosition, { fontSize: 28, fontStyle: "bold", color: primaryColor })
    addText("ServiceSuite", pageWidth - 60, yPosition, { fontSize: 16, fontStyle: "bold", color: primaryColor })
    yPosition += 15
  
    // Invoice details (top right)
    const invoiceDetailsX = pageWidth - 80
    addText(`Invoice #: ${invoiceData.invoiceNumber}`, invoiceDetailsX, yPosition, { fontSize: 10 })
    yPosition += 8
    addText(`Date: ${formatDate(invoiceData.invoiceDate)}`, invoiceDetailsX, yPosition, { fontSize: 10 })
    yPosition += 8
    addText(`Due: ${formatDate(invoiceData.dueDate)}`, invoiceDetailsX, yPosition, { fontSize: 10 })
    yPosition += 20
  
    // Provider information (left side)
    addText("From:", 20, yPosition, { fontSize: 12, fontStyle: "bold" })
    yPosition += 8
    addText(invoiceData.provider.name, 20, yPosition, { fontSize: 11, fontStyle: "bold" })
    yPosition += 6
    addText(invoiceData.provider.email, 20, yPosition, { fontSize: 10, color: grayColor })
    yPosition += 6
    if (invoiceData.provider.phone) {
      addText(invoiceData.provider.phone, 20, yPosition, { fontSize: 10, color: grayColor })
      yPosition += 6
    }
    if (invoiceData.provider.address) {
      addText(invoiceData.provider.address, 20, yPosition, { fontSize: 10, color: grayColor })
      yPosition += 6
    }
    if (invoiceData.provider.website) {
      addText(invoiceData.provider.website, 20, yPosition, { fontSize: 10, color: primaryColor })
      yPosition += 6
    }
  
    // Client information (right side)
    const clientX = pageWidth / 2 + 10
    let clientY =
      yPosition -
      (invoiceData.provider.phone ? 30 : 24) -
      (invoiceData.provider.address ? 6 : 0) -
      (invoiceData.provider.website ? 6 : 0)
  
    addText("Bill To:", clientX, clientY, { fontSize: 12, fontStyle: "bold" })
    clientY += 8
    if (invoiceData.client.company) {
      addText(invoiceData.client.company, clientX, clientY, { fontSize: 11, fontStyle: "bold" })
      clientY += 6
    }
    addText(invoiceData.client.name, clientX, clientY, {
      fontSize: 11,
      fontStyle: invoiceData.client.company ? "normal" : "bold",
    })
    clientY += 6
    addText(invoiceData.client.email, clientX, clientY, { fontSize: 10, color: grayColor })
    clientY += 6
    if (invoiceData.client.address) {
      addText(invoiceData.client.address, clientX, clientY, { fontSize: 10, color: grayColor })
      clientY += 6
    }
  
    yPosition += 20
  
    // Items table
    const tableStartY = yPosition
    const tableHeaders = ["Description", "Qty", "Rate", "Amount"]
    const columnWidths = [100, 20, 30, 30]
    const columnX = [20, 120, 140, 170]
  
    // Table header
    addRect(20, yPosition - 5, pageWidth - 40, 12, lightGrayColor)
    tableHeaders.forEach((header, index) => {
      addText(header, columnX[index], yPosition, { fontSize: 10, fontStyle: "bold" })
    })
    yPosition += 15
  
    // Table rows
    invoiceData.items.forEach((item, index) => {
      if (yPosition > pageHeight - 50) {
        doc.addPage()
        yPosition = 20
      }
  
      // Alternate row background
      if (index % 2 === 1) {
        addRect(20, yPosition - 5, pageWidth - 40, 12, [249, 250, 251])
      }
  
      addText(item.description, columnX[0], yPosition, { fontSize: 10 })
      addText(item.quantity.toString(), columnX[1], yPosition, { fontSize: 10 })
      addText(formatCurrency(item.rate), columnX[2], yPosition, { fontSize: 10 })
      addText(formatCurrency(item.amount), columnX[3], yPosition, { fontSize: 10 })
      yPosition += 12
    })
  
    // Table border
    addLine(20, tableStartY - 5, pageWidth - 20, tableStartY - 5)
    addLine(20, yPosition - 2, pageWidth - 20, yPosition - 2)
  
    yPosition += 10
  
    // Totals section
    const totalsX = pageWidth - 80
    addText("Subtotal:", totalsX - 30, yPosition, { fontSize: 10 })
    addText(formatCurrency(invoiceData.subtotal), totalsX, yPosition, { fontSize: 10 })
    yPosition += 8
  
    if (invoiceData.tax) {
      addText(`Tax (${invoiceData.tax.rate}%):`, totalsX - 30, yPosition, { fontSize: 10 })
      addText(formatCurrency(invoiceData.tax.amount), totalsX, yPosition, { fontSize: 10 })
      yPosition += 8
    }
  
    // Total line
    addLine(totalsX - 35, yPosition, pageWidth - 20, yPosition, primaryColor)
    yPosition += 8
    addText("Total:", totalsX - 30, yPosition, { fontSize: 12, fontStyle: "bold" })
    addText(formatCurrency(invoiceData.total), totalsX, yPosition, {
      fontSize: 12,
      fontStyle: "bold",
      color: primaryColor,
    })
    yPosition += 20
  
    // Payment terms and notes
    if (invoiceData.paymentTerms) {
      addText("Payment Terms:", 20, yPosition, { fontSize: 10, fontStyle: "bold" })
      yPosition += 8
      addText(invoiceData.paymentTerms, 20, yPosition, { fontSize: 10, color: grayColor })
      yPosition += 15
    }
  
    if (invoiceData.notes) {
      addText("Notes:", 20, yPosition, { fontSize: 10, fontStyle: "bold" })
      yPosition += 8
      // Split long notes into multiple lines
      const noteLines = doc.splitTextToSize(invoiceData.notes, pageWidth - 40)
      noteLines.forEach((line: string) => {
        addText(line, 20, yPosition, { fontSize: 10, color: grayColor })
        yPosition += 6
      })
    }
  
    // Footer
    const footerY = pageHeight - 20
    addLine(20, footerY - 5, pageWidth - 20, footerY - 5, [229, 231, 235])
    addText("Generated by ServiceSuite", 20, footerY, { fontSize: 8, color: grayColor })
    addText(`Generated on ${formatDate(new Date())}`, pageWidth - 60, footerY, { fontSize: 8, color: grayColor })
  
    // Save the PDF
    const fileName = `invoice-${invoiceData.invoiceNumber}-${invoiceData.client.name.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`
    doc.save(fileName)
  }
  
  // Calculate invoice totals
  export function calculateInvoiceTotals(
    items: InvoiceItem[],
    taxRate = 0,
  ): {
    subtotal: number
    taxAmount: number
    total: number
  } {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount
  
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    }
  }
  
  // Generate invoice number
  export function generateInvoiceNumber(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `INV-${year}${month}-${random}`
  }
  