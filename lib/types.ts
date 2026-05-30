export type LeadStatus = 'NEW' | 'FOLLOW_UP' | 'CONVERTED'
export type StudentStatus = 'ACTIVE' | 'INACTIVE'
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE'

export interface Center {
  id: string
  owner_id: string
  name: string
  owner_name: string
  phone_number: string
  upi_id: string
  payment_url: string | null
  brochure_url: string | null
  created_at: string
}

export interface Batch {
  id: string
  center_id: string
  name: string
  monthly_fee: number
  created_at: string
}

export interface Lead {
  id: string
  center_id: string
  student_name: string
  parent_phone: string
  status: LeadStatus
  notes: string | null
  nudge_count: number
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  center_id: string
  batch_id: string
  name: string
  parent_phone: string
  billing_date: number
  status: StudentStatus
  created_at: string
  batches?: Batch
}

export interface Invoice {
  id: string
  student_id: string
  amount_due: number
  due_date: string
  status: InvoiceStatus
  reminder_count: number
  razorpay_link: string | null
  created_at: string
  updated_at: string
  students?: Student
}

export interface Payment {
  id: string
  invoice_id: string
  amount_paid: number
  txn_reference: string
  paid_at: string
}
