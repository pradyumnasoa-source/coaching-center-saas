'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import GenerateInvoiceDialog from './GenerateInvoiceDialog'
import SendReminderDialog from './SendReminderDialog'
import SetPaymentLinkDialog from './SetPaymentLinkDialog'
import type { Invoice, InvoiceStatus, Center } from '@/lib/types'

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
}

interface Props { centerId: string; center: Center }

export default function InvoicesTable({ centerId, center }: Props) {
  const supabase = createClient()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<InvoiceStatus | 'ALL'>('ALL')

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    const supabase = createClient()
    await supabase.from('invoices').delete().eq('id', id)
    fetchInvoices()
  }

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('center_id', centerId)

    const studentIds = students?.map(s => s.id) ?? []
    if (studentIds.length === 0) {
      setInvoices([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('invoices')
      .select('*, students(name, parent_phone, batches(name))')
      .in('student_id', studentIds)
      .order('due_date', { ascending: true })

    setInvoices(data ?? [])
    setLoading(false)
  }, [centerId])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const filtered = filter === 'ALL' ? invoices : invoices.filter(i => i.status === filter)
  const pendingCount = invoices.filter(i => i.status === 'PENDING').length
  const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length
  const totalPending = invoices
    .filter(i => i.status === 'PENDING' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + Number(i.amount_due), 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GenerateInvoiceDialog centerId={centerId} onGenerated={fetchInvoices} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700 font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
        </div>
        <div className="rounded-lg border bg-red-50 p-4">
          <p className="text-sm text-red-700 font-medium">Overdue</p>
          <p className="text-2xl font-bold text-red-900">{overdueCount}</p>
        </div>
        <div className="rounded-lg border bg-orange-50 p-4">
          <p className="text-sm text-orange-700 font-medium">Total Outstanding</p>
          <p className="text-2xl font-bold text-orange-900">₹{totalPending.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={v => setFilter(v as InvoiceStatus | 'ALL')}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="OVERDUE">Overdue</TabsTrigger>
          <TabsTrigger value="PAID">Paid</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reminders</TableHead>
              <TableHead>Payment Link</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">Loading...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  No {filter !== 'ALL' ? filter.toLowerCase() : ''} invoices found.
                </TableCell>
              </TableRow>
            ) : filtered.map(invoice => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {(invoice.students as any)?.name ?? '—'}
                  <p className="text-xs text-gray-400">{(invoice.students as any)?.parent_phone}</p>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {(invoice.students as any)?.batches?.name ?? '—'}
                </TableCell>
                <TableCell className="font-semibold">
                  ₹{Number(invoice.amount_due).toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
                    {invoice.status}
                  </span>
                </TableCell>
                <TableCell className="text-center text-sm text-gray-500">
                  {invoice.reminder_count}
                </TableCell>
                <TableCell>
                  <SetPaymentLinkDialog
                    invoiceId={invoice.id}
                    currentLink={invoice.razorpay_link}
                    onUpdated={fetchInvoices}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {(invoice.status === 'PENDING' || invoice.status === 'OVERDUE') && (
                      <SendReminderDialog invoice={invoice} center={center} onSent={fetchInvoices} />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteInvoice(invoice.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
