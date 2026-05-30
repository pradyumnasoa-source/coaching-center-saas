'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AddLeadDialog from './AddLeadDialog'
import ConvertLeadDialog from './ConvertLeadDialog'
import NudgeLeadDialog from './NudgeLeadDialog'
import type { Lead, LeadStatus, Center } from '@/lib/types'

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  FOLLOW_UP: 'bg-yellow-100 text-yellow-800',
  CONVERTED: 'bg-green-100 text-green-800',
}

interface Props { centerId: string; center: Center }

export default function LeadsTable({ centerId, center }: Props) {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('center_id', centerId)
      .order('created_at', { ascending: false })
    setLeads(data ?? [])
    setLoading(false)
  }, [centerId])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function updateStatus(id: string, status: LeadStatus) {
    await supabase.from('leads').update({ status }).eq('id', id)
    fetchLeads()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{leads.length} lead{leads.length !== 1 ? 's' : ''}</p>
        <AddLeadDialog centerId={centerId} onAdded={fetchLeads} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Parent Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">Loading...</TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">No leads yet. Add your first lead.</TableCell>
              </TableRow>
            ) : leads.map(lead => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.student_name}</TableCell>
                <TableCell>{lead.parent_phone}</TableCell>
                <TableCell>
                  <Select
                    value={lead.status}
                    onValueChange={val => updateStatus(lead.id, val as LeadStatus)}
                    disabled={lead.status === 'CONVERTED'}
                  >
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-gray-500 text-sm max-w-[160px] truncate">
                  {lead.notes ?? '—'}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  {new Date(lead.created_at).toLocaleDateString('en-IN')}
                </TableCell>
                <TableCell className="text-right">
                  {lead.status === 'CONVERTED' ? (
                    <Badge className={STATUS_COLORS.CONVERTED}>Enrolled</Badge>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      {lead.status === 'FOLLOW_UP' && (
                        <NudgeLeadDialog lead={lead} center={center} onSent={fetchLeads} />
                      )}
                      <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)}>
                        Convert
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConvertLeadDialog
        lead={selectedLead}
        centerId={centerId}
        onClose={() => setSelectedLead(null)}
        onConverted={() => { setSelectedLead(null); fetchLeads() }}
      />
    </div>
  )
}
