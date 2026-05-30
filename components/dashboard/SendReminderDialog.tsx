'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { BellRing } from 'lucide-react'
import type { Invoice, Center } from '@/lib/types'

interface Props {
  invoice: Invoice
  center: Center
  onSent: () => void
}

export default function SendReminderDialog({ invoice, center, onSent }: Props) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const student = (invoice as any).students
  const batch = student?.batches
  const phone = student?.parent_phone?.replace(/\D/g, '')
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const paymentLine = invoice.razorpay_link
    ? `\nPay here: ${invoice.razorpay_link}`
    : center.payment_url
      ? `\nPay here: ${center.payment_url}`
      : ''

  const message = `Dear Parent,

This is a reminder from *${center.name}*.

Student: *${student?.name ?? ''}*
Batch: *${batch?.name ?? ''}*
Fee Due: *₹${Number(invoice.amount_due).toLocaleString('en-IN')}*
Due Date: *${dueDate}*

Kindly pay via UPI: *${center.upi_id}*${paymentLine}

For any queries, contact us at ${center.phone_number}.

Thank you,
${center.owner_name}`

  async function handleSend() {
    setSending(true)
    const supabase = createClient()
    await supabase
      .from('invoices')
      .update({ reminder_count: invoice.reminder_count + 1 })
      .eq('id', invoice.id)

    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/91${phone}?text=${encoded}`, '_blank')

    setSending(false)
    setOpen(false)
    onSent()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <BellRing className="w-3.5 h-3.5 mr-1" /> Remind
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send WhatsApp Reminder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <p className="text-xs text-gray-500 mb-1">To: {student?.name} ({student?.parent_phone})</p>
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 border p-4 text-sm text-gray-800 font-sans leading-relaxed">
              {message}
            </pre>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending} className="bg-green-600 hover:bg-green-700 text-white">
              {sending ? 'Opening...' : 'Send via WhatsApp'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
