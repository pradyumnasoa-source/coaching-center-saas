'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import type { Student, Batch } from '@/lib/types'

interface StudentWithBatch extends Student {
  batches: Batch | null
}

interface Props {
  centerId: string
  onGenerated: () => void
}

export default function GenerateInvoiceDialog({ centerId, onGenerated }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [students, setStudents] = useState<StudentWithBatch[]>([])
  const [error, setError] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string>('ALL')
  const [amountDue, setAmountDue] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (!open) return
    setFetching(true)
    setError(null)
    const supabase = createClient()
    supabase
      .from('students')
      .select('*, batches(*)')
      .eq('center_id', centerId)
      .eq('status', 'ACTIVE')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setStudents((data as StudentWithBatch[]) ?? [])
        setFetching(false)
      })
  }, [open, centerId])

  function handleStudentChange(val: string | null) {
    const id = val ?? 'ALL'
    setStudentId(id)
    if (id !== 'ALL') {
      const student = students.find(s => s.id === id)
      setAmountDue(String(student?.batches?.monthly_fee ?? ''))
    } else {
      setAmountDue('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dueDate) { setError('Please select a due date.'); return }

    const targets = studentId === 'ALL' ? students : students.filter(s => s.id === studentId)
    if (targets.length === 0) { setError('No active students found.'); return }

    if (studentId !== 'ALL' && !amountDue) { setError('Please enter amount.'); return }

    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const invoices = targets.map(s => ({
      student_id: s.id,
      amount_due: studentId === 'ALL'
        ? Number(s.batches?.monthly_fee ?? 0)
        : parseFloat(amountDue),
      due_date: dueDate,
      status: 'PENDING',
    }))

    const { error: insertError } = await supabase.from('invoices').insert(invoices)

    if (insertError) {
      setError(insertError.message)
    } else {
      setOpen(false)
      setStudentId('ALL')
      setAmountDue('')
      setDueDate('')
      onGenerated()
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="w-4 h-4 mr-1" /> Generate Invoice
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
        </DialogHeader>

        {fetching ? (
          <p className="text-sm text-gray-500 py-4 text-center">Loading students...</p>
        ) : students.length === 0 && !error ? (
          <p className="text-sm text-amber-600 py-4 text-center">No active students found. Enroll students first.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label>Student</Label>
              <Select defaultValue="ALL" onValueChange={handleStudentChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All active students (use batch fee)</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.batches?.name ?? 'No batch'} (₹{s.batches?.monthly_fee ?? 0}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Amount Due (₹)</Label>
              <Input
                type="number"
                min={1}
                placeholder={studentId === 'ALL' ? 'Auto — uses each student\'s batch fee' : 'Enter amount'}
                value={amountDue}
                onChange={e => setAmountDue(e.target.value)}
                disabled={studentId === 'ALL'}
              />
              {studentId === 'ALL' && (
                <p className="text-xs text-gray-500">Each student's invoice will use their batch's monthly fee.</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Generating...'
                  : studentId === 'ALL'
                    ? `Generate for ${students.length} student${students.length !== 1 ? 's' : ''}`
                    : 'Generate Invoice'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
