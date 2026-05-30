'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'lucide-react'

interface Props {
  invoiceId: string
  currentLink: string | null
  onUpdated: () => void
}

export default function SetPaymentLinkDialog({ invoiceId, currentLink, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState(currentLink ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('invoices')
      .update({ razorpay_link: link || null })
      .eq('id', invoiceId)

    if (error) {
      setError(error.message)
    } else {
      setOpen(false)
      onUpdated()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="ghost" className="h-auto p-0 text-blue-600 hover:text-blue-800 hover:bg-transparent text-sm" />}>
        {currentLink ? (
          <span className="underline underline-offset-2">{currentLink.length > 20 ? 'View / Edit' : currentLink}</span>
        ) : (
          <span className="flex items-center gap-1 text-gray-400 hover:text-blue-600">
            <Link className="w-3.5 h-3.5" /> Add link
          </span>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payment Link</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Link URL</Label>
            <Input
              placeholder="https://rzp.io/l/... or upi://pay?..."
              value={link}
              onChange={e => setLink(e.target.value)}
            />
            <p className="text-xs text-gray-500">Paste a Razorpay link, UPI deep link, or any payment URL.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            {currentLink && (
              <Button
                type="button"
                variant="ghost"
                className="text-red-500 hover:text-red-700"
                onClick={async () => {
                  setLink('')
                  const supabase = createClient()
                  await supabase.from('invoices').update({ razorpay_link: null }).eq('id', invoiceId)
                  setOpen(false)
                  onUpdated()
                }}
              >
                Remove
              </Button>
            )}
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
