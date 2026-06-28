"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileText, Plus, Trash2, Download, Calculator, User, Building, Calendar, DollarSign, Eye, History, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { generateInvoicePDF, calculateInvoiceTotals, generateInvoiceNumber } from "@/lib/pdf-utils"
import type { InvoiceData, InvoiceItem } from "@/lib/pdf-utils"
import { useAuth } from "@/contexts/auth-context"
import { saveInvoice, getInvoices, updateInvoiceStatus, deleteInvoice } from "@/actions/ai-actions"
import type { Invoice } from "@/lib/supabaseClient"

export function InvoiceGenerator() {
  const { user, userProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const [pastInvoicesOpen, setPastInvoicesOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [message, setMessage] = useState("")
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    provider: {
      name: userProfile?.name || "",
      email: userProfile?.email || "",
      address: "",
      phone: "",
      website: "",
    },
    client: {
      name: "",
      email: "",
      address: "",
      company: "",
    },
    items: [
      {
        description: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
    subtotal: 0,
    tax: {
      rate: 0,
      amount: 0,
    },
    total: 0,
    notes: "",
    paymentTerms: "Payment is due within 30 days of invoice date.",
  })

  const updateInvoiceData = (field: string, value: any) => {
    setInvoiceData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateProvider = (field: string, value: string) => {
    setInvoiceData((prev) => ({
      ...prev,
      provider: {
        ...prev.provider,
        [field]: value,
      },
    }))
  }

  const updateClient = (field: string, value: string) => {
    setInvoiceData((prev) => ({
      ...prev,
      client: {
        ...prev.client,
        [field]: value,
      },
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...invoiceData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    }

    // Calculate amount for this item
    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate
    }

    setInvoiceData((prev) => ({
      ...prev,
      items: updatedItems,
    }))

    // Recalculate totals
    calculateTotals(updatedItems)
  }

  const addItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ],
    }))
  }

  const removeItem = (index: number) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index)
    setInvoiceData((prev) => ({
      ...prev,
      items: updatedItems,
    }))
    calculateTotals(updatedItems)
  }

  const calculateTotals = (items: InvoiceItem[]) => {
    const totals = calculateInvoiceTotals(items, invoiceData.tax?.rate || 0)
    setInvoiceData((prev) => ({
      ...prev,
      subtotal: totals.subtotal,
      tax: {
        ...prev.tax!,
        amount: totals.taxAmount,
      },
      total: totals.total,
    }))
  }

  const handleGeneratePDF = async () => {
    setGenerating(true)
    try {
      await generateInvoicePDF(invoiceData)
      setOpen(false)
      // Reset form
      setInvoiceData({
        ...invoiceData,
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: {
          name: "",
          email: "",
          address: "",
          company: "",
        },
        items: [
          {
            description: "",
            quantity: 1,
            rate: 0,
            amount: 0,
          },
        ],
        subtotal: 0,
        tax: {
          rate: 0,
          amount: 0,
        },
        total: 0,
        notes: "",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setGenerating(false)
    }
  }

  const isFormValid = () => {
    return (
      invoiceData.client.name.trim() !== "" &&
      invoiceData.client.email.trim() !== "" &&
      invoiceData.items.some((item) => item.description.trim() !== "" && item.amount > 0)
    )
  }

  const handleSaveInvoice = async () => {
    if (!user) return
    
    setSaving(true)
    setMessage("")
    
    try {
      const result = await saveInvoice(invoiceData, user.id)
      if (result.success) {
        setMessage("Invoice saved successfully!")
        // Refresh invoices list
        fetchInvoices()
        // Reset form
        setInvoiceData({
          ...invoiceData,
          invoiceNumber: generateInvoiceNumber(),
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          client: {
            name: "",
            email: "",
            address: "",
            company: "",
          },
          items: [
            {
              description: "",
              quantity: 1,
              rate: 0,
              amount: 0,
            },
          ],
          subtotal: 0,
          tax: {
            rate: 0,
            amount: 0,
          },
          total: 0,
          notes: "",
        })
      } else {
        setMessage(result.message || "Failed to save invoice")
      }
    } catch (error) {
      console.error("Error saving invoice:", error)
      setMessage("An error occurred while saving the invoice")
    } finally {
      setSaving(false)
    }
  }

  const fetchInvoices = async () => {
    if (!user) return
    
    setLoadingInvoices(true)
    try {
      const result = await getInvoices(user.id)
      if (result.success) {
        setInvoices(result.invoices || [])
      }
    } catch (error) {
      console.error("Error fetching invoices:", error)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: "draft" | "sent" | "paid" | "overdue") => {
    try {
      const result = await updateInvoiceStatus(invoiceId, status)
      if (result.success) {
        // Update local state
        setInvoices(prev => prev.map(invoice => 
          invoice.id === invoiceId ? { ...invoice, status } : invoice
        ))
      }
    } catch (error) {
      console.error("Error updating invoice status:", error)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return
    
    try {
      const result = await deleteInvoice(invoiceId)
      if (result.success) {
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId))
      }
    } catch (error) {
      console.error("Error deleting invoice:", error)
    }
  }

  const handleGeneratePDFFromSaved = async (invoice: Invoice) => {
    try {
      const invoiceDataForPDF: InvoiceData = {
        invoiceNumber: invoice.invoice_number,
        invoiceDate: new Date(invoice.invoice_date),
        dueDate: new Date(invoice.due_date),
        provider: invoice.provider,
        client: invoice.client,
        items: invoice.items,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        notes: invoice.notes || "",
        paymentTerms: invoice.payment_terms || "",
      }
      
      await generateInvoicePDF(invoiceDataForPDF)
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "sent":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "sent":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700">
            <FileText className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Generate Client Invoice
            </DialogTitle>
            <DialogDescription>Create a professional PDF invoice for your client</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 w-full">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={invoiceData.invoiceNumber}
                    onChange={(e) => updateInvoiceData("invoiceNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="invoiceDate">Invoice Date</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceData.invoiceDate.toISOString().split("T")[0]}
                    onChange={(e) => updateInvoiceData("invoiceDate", new Date(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceData.dueDate.toISOString().split("T")[0]}
                    onChange={(e) => updateInvoiceData("dueDate", new Date(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Provider Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <Label htmlFor="providerName">Name</Label>
                  <Input
                    id="providerName"
                    value={invoiceData.provider.name}
                    onChange={(e) => updateProvider("name", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="providerEmail">Email</Label>
                  <Input
                    id="providerEmail"
                    type="email"
                    value={invoiceData.provider.email}
                    onChange={(e) => updateProvider("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="providerPhone">Phone</Label>
                  <Input
                    id="providerPhone"
                    value={invoiceData.provider.phone}
                    onChange={(e) => updateProvider("phone", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="providerWebsite">Website</Label>
                  <Input
                    id="providerWebsite"
                    value={invoiceData.provider.website}
                    onChange={(e) => updateProvider("website", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="providerAddress">Address</Label>
                  <Textarea
                    id="providerAddress"
                    value={invoiceData.provider.address}
                    onChange={(e) => updateProvider("address", e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={invoiceData.client.name}
                    onChange={(e) => updateClient("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Client Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={invoiceData.client.email}
                    onChange={(e) => updateClient("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientCompany">Company</Label>
                  <Input
                    id="clientCompany"
                    value={invoiceData.client.company}
                    onChange={(e) => updateClient("company", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="clientAddress">Address</Label>
                  <Textarea
                    id="clientAddress"
                    value={invoiceData.client.address}
                    onChange={(e) => updateClient("address", e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Invoice Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full">
                {invoiceData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 p-4 border rounded-lg w-full">
                    <div className="md:col-span-2">
                      <Label htmlFor={`description-${index}`}>Description</Label>
                      <Input
                        id={`description-${index}`}
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        placeholder="Service or product description"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`rate-${index}`}>Rate ($)</Label>
                      <Input
                        id={`rate-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(index, "rate", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-end gap-2 w-full">
                      <div className="flex-1">
                        <Label>Amount</Label>
                        <div className="h-10 flex items-center px-3 bg-gray-50 border rounded-md">
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      </div>
                      {invoiceData.items.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Totals and Tax */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Totals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={invoiceData.tax?.rate || 0}
                      onChange={(e) => {
                        const rate = Number.parseFloat(e.target.value) || 0
                        setInvoiceData((prev) => ({
                          ...prev,
                          tax: {
                            rate,
                            amount: (prev.subtotal * rate) / 100,
                          },
                          total: prev.subtotal + (prev.subtotal * rate) / 100,
                        }))
                      }}
                    />
                  </div>
                  <div className="space-y-2 w-full">
                    <div className="flex justify-between w-full">
                      <span>Subtotal:</span>
                      <span className="font-medium">${invoiceData.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-full">
                      <span>Tax:</span>
                      <span className="font-medium">${(invoiceData.tax?.amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 w-full">
                      <span>Total:</span>
                      <span className="text-green-600">${invoiceData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes and Payment Terms */}
            <Card>
              <CardContent className="space-y-4 w-full">
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Textarea
                    id="paymentTerms"
                    value={invoiceData.paymentTerms}
                    onChange={(e) => updateInvoiceData("paymentTerms", e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={invoiceData.notes}
                    onChange={(e) => updateInvoiceData("notes", e.target.value)}
                    placeholder="Additional notes or terms..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 w-full">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  onClick={handleSaveInvoice}
                  disabled={!isFormValid() || saving}
                  variant="outline"
                >
                  {saving ? (
                    <>
                      <FileText className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Save Invoice
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleGeneratePDF}
                  disabled={!isFormValid() || generating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {generating ? (
                    <>
                      <Download className="h-4 w-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate PDF Invoice
                    </>
                  )}
                </Button>
              </div>
            </div>

            {message && (
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {!isFormValid() && (
              <Alert>
                <AlertDescription>
                  Please fill in the required fields: Client Name, Client Email, and at least one invoice item with a
                  description and amount.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Past Invoices Dialog */}
      <Dialog open={pastInvoicesOpen} onOpenChange={setPastInvoicesOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={() => fetchInvoices()}>
            <History className="h-4 w-4 mr-2" />
            View Past Invoices
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              Past Invoices
            </DialogTitle>
            <DialogDescription>View and manage your saved invoices</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 w-full">
            {loadingInvoices ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
                <p className="text-gray-600 mb-4">Create your first invoice to get started.</p>
                <Button onClick={() => setPastInvoicesOpen(false)}>
                  Create Invoice
                </Button>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="hover:shadow-md transition-shadow w-full">
                    <CardContent className="p-4 w-full">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2 w-full">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-lg">{invoice.invoice_number}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {getStatusIcon(invoice.status)}
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">
                            <span className="font-medium">{invoice.client.name}</span>
                            {invoice.client.company && ` - ${invoice.client.company}`}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Date: {new Date(invoice.invoice_date).toLocaleDateString()}</span>
                            <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                            <span className="font-medium text-green-600">${invoice.total.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 w-full">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGeneratePDFFromSaved(invoice)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Update status to sent
                              handleUpdateInvoiceStatus(invoice.id, "sent")
                            }}
                            disabled={invoice.status === "sent" || invoice.status === "paid"}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Mark Sent
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Update status to paid
                              handleUpdateInvoiceStatus(invoice.id, "paid")
                            }}
                            disabled={invoice.status === "paid"}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
