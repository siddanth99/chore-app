import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/server/auth/role'
import { getPaymentReportForUser } from '@/server/api/payments'

/**
 * GET /api/payments/report
 * Returns payment report as JSON or CSV
 * Query params:
 * - format: 'json' | 'csv' (default: 'json')
 * - from: YYYY-MM-DD (optional)
 * - to: YYYY-MM-DD (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const fromStr = searchParams.get('from')
    const toStr = searchParams.get('to')

    // Parse date filters
    let fromDate: Date | undefined
    let toDate: Date | undefined

    if (fromStr) {
      const parsed = new Date(fromStr)
      if (!isNaN(parsed.getTime())) {
        fromDate = parsed
      }
    }

    if (toStr) {
      const parsed = new Date(toStr)
      if (!isNaN(parsed.getTime())) {
        toDate = parsed
      }
    }

    // Get payment report
    const report = await getPaymentReportForUser(user.id, user.role, {
      fromDate,
      toDate,
    })

    // Return JSON format
    if (format === 'json') {
      return NextResponse.json({ payments: report.payments })
    }

    // Return CSV format
    if (format === 'csv') {
      // Build CSV header
      const header = 'Date,Chore,Direction,From,To,Method,Amount,Notes\n'

      // Build CSV rows
      const rows = report.payments.map((p) => {
        const date = new Date(p.createdAt).toLocaleDateString('en-GB')
        const chore = `"${p.choreTitle.replace(/"/g, '""')}"`
        const direction = p.direction.replace(/_/g, ' ')
        const from = `"${p.fromUserName.replace(/"/g, '""')}"`
        const to = `"${p.toUserName.replace(/"/g, '""')}"`
        const method = p.method.replace(/_/g, ' ')
        const amount = p.amount
        const notes = p.notes ? `"${p.notes.replace(/"/g, '""')}"` : ''

        return `${date},${chore},${direction},${from},${to},${method},${amount},${notes}`
      })

      const csv = header + rows.join('\n')

      // Generate filename with current date
      const filename = `payments-${new Date().toISOString().slice(0, 10)}.csv`

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // Invalid format
    return NextResponse.json({ error: 'Invalid format. Use "json" or "csv"' }, { status: 400 })
  } catch (error: any) {
    console.error('Error generating payment report:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate payment report' },
      { status: 500 }
    )
  }
}

