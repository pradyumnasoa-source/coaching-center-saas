'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props { userId: string }

export default function SetupCenter({ userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', owner_name: '', phone_number: '', upi_id: '',
    batch_name: '', monthly_fee: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: center, error: centerErr } = await supabase
      .from('centers')
      .insert({
        owner_id: userId,
        name: form.name,
        owner_name: form.owner_name,
        phone_number: form.phone_number,
        upi_id: form.upi_id,
      })
      .select()
      .single()

    if (centerErr) { setError(centerErr.message); setLoading(false); return }

    if (form.batch_name && form.monthly_fee) {
      await supabase.from('batches').insert({
        center_id: center.id,
        name: form.batch_name,
        monthly_fee: parseFloat(form.monthly_fee),
      })
    }

    router.refresh()
  }

  const field = (key: keyof typeof form, label: string, placeholder: string, type = 'text') => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required={key !== 'batch_name' && key !== 'monthly_fee'}
      />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set Up Your Coaching Center</CardTitle>
          <CardDescription>One-time setup. You can update these details later.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {field('name', 'Center Name', 'e.g. Sharma Classes')}
            {field('owner_name', 'Your Name', 'e.g. Ramesh Sharma')}
            {field('phone_number', 'Your WhatsApp Number', 'e.g. 9876543210')}
            {field('upi_id', 'UPI ID', 'e.g. ramesh@upi')}

            <hr />
            <p className="text-sm font-medium text-gray-700">First Batch (optional)</p>
            {field('batch_name', 'Batch Name', 'e.g. JEE 2026 Morning')}
            {field('monthly_fee', 'Monthly Fee (₹)', 'e.g. 2500', 'number')}

            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Setting up...' : 'Launch Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
