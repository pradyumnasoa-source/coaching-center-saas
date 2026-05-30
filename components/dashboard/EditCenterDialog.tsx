'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'
import type { Center } from '@/lib/types'

interface Props {
  center: Center
}

export default function EditCenterDialog({ center }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: center.name,
    owner_name: center.owner_name,
    phone_number: center.phone_number,
    upi_id: center.upi_id,
    payment_url: center.payment_url ?? '',
    brochure_url: center.brochure_url ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('centers')
      .update({ ...form, payment_url: form.payment_url || null, brochure_url: form.brochure_url || null })
      .eq('id', center.id)

    if (error) {
      setError(error.message)
    } else {
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  const field = (key: keyof typeof form, label: string, placeholder: string) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required
      />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Settings className="w-4 h-4 mr-1" /> Settings
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Center Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {field('name', 'Center Name', 'e.g. Sharma Classes')}
          {field('owner_name', 'Owner Name', 'e.g. Ramesh Sharma')}
          {field('phone_number', 'WhatsApp Number', 'e.g. 9876543210')}
          {field('upi_id', 'UPI ID', 'e.g. ramesh@upi')}
          <div className="space-y-1">
            <Label>Payment URL (optional)</Label>
            <Input
              placeholder="https://rzp.io/l/... or https://pages.razorpay.com/..."
              value={form.payment_url}
              onChange={e => setForm(f => ({ ...f, payment_url: e.target.value }))}
            />
            <p className="text-xs text-gray-500">Static link included in all WhatsApp reminders.</p>
          </div>
          <div className="space-y-1">
            <Label>Brochure URL (optional)</Label>
            <Input
              placeholder="https://drive.google.com/... or any public link"
              value={form.brochure_url}
              onChange={e => setForm(f => ({ ...f, brochure_url: e.target.value }))}
            />
            <p className="text-xs text-gray-500">Included in follow-up nudge messages automatically.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
