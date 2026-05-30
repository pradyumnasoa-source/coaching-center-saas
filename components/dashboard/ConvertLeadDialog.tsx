'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { Lead, Batch } from '@/lib/types'

interface Props {
  lead: Lead | null
  centerId: string
  onClose: () => void
  onConverted: () => void
}

export default function ConvertLeadDialog({ lead, centerId, onClose, onConverted }: Props) {
  const supabase = createClient()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ batch_id: '', billing_date: '1' })

  useEffect(() => {
    if (!lead) return
    supabase
      .from('batches')
      .select('*')
      .eq('center_id', centerId)
      .then(({ data }) => setBatches(data ?? []))
  }, [lead, centerId])

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault()
    if (!lead) return
    setLoading(true)
    setError(null)

    const { data: student, error: studentErr } = await supabase
      .from('students')
      .insert({
        center_id: centerId,
        batch_id: form.batch_id,
        name: lead.student_name,
        parent_phone: lead.parent_phone,
        billing_date: parseInt(form.billing_date),
        status: 'ACTIVE',
      })
      .select()
      .single()

    if (studentErr) { setError(studentErr.message); setLoading(false); return }

    const selectedBatch = batches.find(b => b.id === form.batch_id)
    if (selectedBatch && student) {
      const dueDate = new Date()
      dueDate.setDate(parseInt(form.billing_date))
      await supabase.from('invoices').insert({
        student_id: student.id,
        amount_due: selectedBatch.monthly_fee,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'PENDING',
      })
    }

    await supabase.from('leads').update({ status: 'CONVERTED' }).eq('id', lead.id)

    setLoading(false)
    onConverted()
  }

  return (
    <Dialog open={!!lead} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert Lead to Student</DialogTitle>
        </DialogHeader>
        {lead && (
          <form onSubmit={handleConvert} className="space-y-4 mt-2">
            <div className="rounded-md bg-gray-50 p-3 text-sm">
              <p><span className="font-medium">Student:</span> {lead.student_name}</p>
              <p><span className="font-medium">Parent Phone:</span> {lead.parent_phone}</p>
            </div>

            <div className="space-y-1">
              <Label>Assign Batch</Label>
              {batches.length === 0 ? (
                <p className="text-sm text-amber-600">No batches found. Add a batch first.</p>
              ) : (
                <Select onValueChange={(val: string | null) => setForm(f => ({ ...f, batch_id: val ?? '' }))} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} — ₹{b.monthly_fee}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1">
              <Label>Billing Day (1–28)</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={form.billing_date}
                onChange={e => setForm(f => ({ ...f, billing_date: e.target.value }))}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={loading || batches.length === 0}>
                {loading ? 'Converting...' : 'Convert to Student'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
