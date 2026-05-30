'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

interface Props {
  centerId: string
  onAdded: () => void
}

export default function AddLeadDialog({ centerId, onAdded }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ student_name: '', parent_phone: '', notes: '' })
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('leads').insert({
      center_id: centerId,
      student_name: form.student_name,
      parent_phone: form.parent_phone,
      notes: form.notes || null,
      status: 'NEW',
    })

    if (error) {
      setError(error.message)
    } else {
      setOpen(false)
      setForm({ student_name: '', parent_phone: '', notes: '' })
      onAdded()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="w-4 h-4 mr-1" /> Add Lead
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Student Name</Label>
            <Input
              placeholder="e.g. Rahul Sharma"
              value={form.student_name}
              onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Parent Phone</Label>
            <Input
              placeholder="e.g. 9876543210"
              value={form.parent_phone}
              onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="e.g. Interested in JEE batch"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Lead'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
