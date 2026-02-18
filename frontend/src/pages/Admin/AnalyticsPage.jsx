import React, { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import {
  getManpowerDailyAverageHoursByCompany,
  getManpowerDailyHoursByCompany,
  getManpowerMonthlyHoursByCompany,
} from '../../services/analytics.service'
import { getPublicDashboardSummary } from '../../services/public.service'

const pad2 = (n) => String(n).padStart(2, '0')

const todayYyyyMmDd = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

const currentYyyyMm = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
}

const formatHours = (value) => {
  const n = Number(value)
  if (Number.isNaN(n)) return '0.00'
  return n.toFixed(2)
}

const MonthlyBarChart = ({ rows }) => {
  const safeRows = Array.isArray(rows) ? rows : []

  const maxHours = useMemo(() => {
    const hours = safeRows.map((r) => Number(r.totalHours) || 0)
    return Math.max(0, ...hours)
  }, [safeRows])

  if (safeRows.length === 0) {
    return (
      <div className="text-slate-500 text-sm">No data for selected month.</div>
    )
  }

  const palette = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-amber-600',
    'bg-purple-600',
    'bg-rose-600',
    'bg-cyan-600',
  ]

  return (
    <div className="w-full">
      <div className="flex items-end gap-4 h-56 border border-slate-200 rounded-md p-4 bg-slate-50 overflow-x-auto">
        {safeRows.map((row, idx) => {
          const hours = Number(row.totalHours) || 0
          const heightPct = maxHours > 0 ? (hours / maxHours) * 100 : 0
          const color = palette[idx % palette.length]

          return (
            <div key={row.companyId || row.companyName || idx} className="flex flex-col items-center min-w-20">
              <div className="text-xs text-slate-700 mb-2">{formatHours(hours)}</div>
              <div className="w-10 h-40 flex items-end">
                <div
                  className={`w-full rounded-t ${color}`}
                  style={{ height: `${heightPct}%` }}
                  title={`${row.companyName}: ${formatHours(hours)} hours`}
                />
              </div>
              <div className="mt-2 text-xs text-slate-600 text-center wrap-break-word max-w-20">
                {row.companyName}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-2 text-xs text-slate-500">
        Bars show monthly manpower work hours by company.
      </div>
    </div>
  )
}

export const AnalyticsPage = () => {
  const [date, setDate] = useState(todayYyyyMmDd())
  const [month, setMonth] = useState(currentYyyyMm())

  const [dailyRows, setDailyRows] = useState([])
  const [dailyAvgRows, setDailyAvgRows] = useState([])
  const [monthlyRows, setMonthlyRows] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)

  

  const load = async () => {
    setIsLoading(true)
    setError('')

    try {
      const [daily, dailyAvg, monthly, summaryData] = await Promise.all([
        getManpowerDailyHoursByCompany(date),
        getManpowerDailyAverageHoursByCompany(date),
        getManpowerMonthlyHoursByCompany(month),
        getPublicDashboardSummary(),
      ])

      setDailyRows(Array.isArray(daily) ? daily : [])
      setDailyAvgRows(Array.isArray(dailyAvg) ? dailyAvg : [])
      setMonthlyRows(Array.isArray(monthly) ? monthly : [])
      setSummary(summaryData)
    } catch (e) {
      setDailyRows([])
      setDailyAvgRows([])
      setMonthlyRows([])
      setSummary(null)
      setError(e?.response?.data?.message || e?.message || 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, month])

  const dailyColumns = [
    { header: 'Company', accessor: 'companyName' },
    {
      header: 'Total Hours',
      accessor: (row) => formatHours(row.totalHours),
      className: 'text-right',
    },
    {
      header: 'Sessions',
      accessor: (row) => row.sessionCount ?? 0,
      className: 'text-right',
    },
  ]

  const dailyAvgColumns = [
    { header: 'Company', accessor: 'companyName' },
    {
      header: 'Avg Hours / Session',
      accessor: (row) => formatHours(row.averageHoursPerSession),
      className: 'text-right',
    },
    {
      header: 'Total Hours',
      accessor: (row) => formatHours(row.totalHours),
      className: 'text-right',
    },
  ]

  const monthlyColumns = [
    { header: 'Company', accessor: 'companyName' },
    {
      header: 'Monthly Hours',
      accessor: (row) => formatHours(row.totalHours),
      className: 'text-right',
    },
    {
      header: 'Sessions',
      accessor: (row) => row.sessionCount ?? 0,
      className: 'text-right',
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-600">Manpower work hours (company-wise)</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <Input
              label="Daily Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-auto"
            />
            <Input
              label="Monthly"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-auto"
            />
            <Button variant="outline" onClick={load} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <Card title="Loading">
            <Spinner />
          </Card>
        ) : (
          <>
            <Card title={`Daily manpower work hours (Company-wise) — ${date}`}>
              <Table
                data={dailyRows}
                columns={dailyColumns}
                keyExtractor={(row) => row.companyId || row.companyName}
                emptyMessage="No manpower sessions for this date"
              />
            </Card>

            <Card title={`Daily average manpower work hours (Company-wise) — ${date}`}>
              <Table
                data={dailyAvgRows}
                columns={dailyAvgColumns}
                keyExtractor={(row) => row.companyId || row.companyName}
                emptyMessage="No manpower sessions for this date"
              />
            </Card>

            <Card title={`Monthly manpower work hours (Company-wise) — ${month}`}>
              <div className="mb-6">
                <MonthlyBarChart rows={monthlyRows} />
              </div>
              <Table
                data={monthlyRows}
                columns={monthlyColumns}
                keyExtractor={(row) => row.companyId || row.companyName}
                emptyMessage="No manpower sessions for this month"
              />
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
