import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LeadsTable from '@/components/dashboard/LeadsTable'
import InvoicesTable from '@/components/dashboard/InvoicesTable'
import SetupCenter from '@/components/dashboard/SetupCenter'
import LogoutButton from '@/components/dashboard/LogoutButton'
import EditCenterDialog from '@/components/dashboard/EditCenterDialog'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: center } = await supabase
    .from('centers')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!center) {
    return <SetupCenter userId={user.id} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{center.name}</h1>
          <p className="text-sm text-gray-500">Owner: {center.owner_name}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">UPI: {center.upi_id}</span>
          <EditCenterDialog center={center} />
          <LogoutButton />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="leads">
          <TabsList className="mb-6">
            <TabsTrigger value="leads">Leads / CRM</TabsTrigger>
            <TabsTrigger value="invoices">Fee Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>Leads</CardTitle>
                <CardDescription>
                  Track enquiries, follow up, and convert leads to enrolled students.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeadsTable centerId={center.id} center={center} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Fee Invoices</CardTitle>
                <CardDescription>
                  All invoices. WhatsApp reminders are sent automatically 3 days before due date.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoicesTable centerId={center.id} center={center} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
