'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Send } from 'lucide-react'
import type { Lead, Center } from '@/lib/types'

interface Props {
  lead: Lead
  center: Center
  onSent: () => void
}

function buildMessage(lead: Lead, center: Center, nudge: number): string {
  const brochureLine = center.brochure_url
    ? `\n\n📄 View our brochure: ${center.brochure_url}`
    : ''

  if (nudge === 0) {
    return `Hello! 👋

I'm *${center.owner_name}* from *${center.name}*.

We noticed your interest in joining us — we'd love to have *${lead.student_name}* be part of our family!

Here's what makes us different:
✅ Expert faculty with proven results
✅ Small batch sizes for personal attention
✅ Regular tests & progress tracking
✅ Affordable fee structure${brochureLine}

Feel free to call us at ${center.phone_number} or simply reply here to know more.

Looking forward to hearing from you! 😊`
  }

  if (nudge === 1) {
    return `Hello again! 😊

Just following up on behalf of *${center.name}*.

We have limited seats available and wouldn't want *${lead.student_name}* to miss out!

Our batches are designed to:
📚 Build strong fundamentals
🎯 Focus on exam-oriented preparation
📈 Ensure consistent improvement${brochureLine}

Admissions are filling up fast. Would you like to schedule a free counselling session?

Call us: ${center.phone_number}`
  }

  return `Hi! A quick reminder from *${center.name}*.

We still have a spot reserved for *${lead.student_name}*. 🎓

Many students who joined us this year are already seeing great results. We'd hate for ${lead.student_name} to miss this opportunity!${brochureLine}

If you have any doubts or questions, I'm just a call away: *${center.phone_number}*

Hope to see you soon! 🙏`
}

export default function NudgeLeadDialog({ lead, center, onSent }: Props) {
  const [open, setOpen] = useState(false)
  const nudge = lead.nudge_count ?? 0
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  function handleOpen(val: boolean) {
    if (val) setMessage(buildMessage(lead, center, nudge))
    setOpen(val)
  }

  async function handleSend() {
    setSending(true)
    const supabase = createClient()
    await supabase
      .from('leads')
      .update({ nudge_count: nudge + 1 })
      .eq('id', lead.id)

    const phone = lead.parent_phone.replace(/\D/g, '')
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/91${phone}?text=${encoded}`, '_blank')

    setSending(false)
    setOpen(false)
    onSent()
  }

  const nudgeLabel = nudge === 0 ? '1st nudge' : nudge === 1 ? '2nd nudge' : `${nudge + 1}th nudge`

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Send className="w-3.5 h-3.5 mr-1" /> Nudge
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nudge {lead.student_name} — {nudgeLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-xs text-gray-500">To: {lead.parent_phone}</p>

          <div className="space-y-1">
            <Label>Message (editable)</Label>
            <Textarea
              rows={12}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="text-sm font-sans leading-relaxed resize-none"
            />
          </div>

          {!center.brochure_url && (
            <p className="text-xs text-amber-600">
              No brochure link set. Add one in Settings to include it automatically.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {sending ? 'Opening...' : 'Send via WhatsApp'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
