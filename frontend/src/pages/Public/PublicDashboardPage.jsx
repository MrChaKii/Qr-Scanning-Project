import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Clock, UserCheck, Users } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import {
  getPublicDailyCheckInCount,
  getPublicEmployeeDailyIdleTime,
} from '../../services/public.service'
import { getCurrentIdleEmployees } from '../../services/analytics.service'
import { getDailySummary } from '../../services/attendance.service'
import { getWorkSessions } from '../../services/workSession.service'

const pad2 = (n) => String(n).padStart(2, '0')

const todayYyyyMmDd = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
}

const currentYyyyMm = () => {
  const now = new Date()
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
}

const getIsoWeekValue = (dateValue) => {
  const date = new Date(Date.UTC(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7)

  return `${date.getUTCFullYear()}-W${pad2(week)}`
}

const currentIsoWeek = () => getIsoWeekValue(new Date())

const formatHoursMinutes = (minutesValue, hoursValue) => {
  const hasMinutes = minutesValue !== undefined && minutesValue !== null && minutesValue !== ''
  const rawMinutes = hasMinutes ? Number(minutesValue) : Number(hoursValue) * 60
  const totalMinutes = Number.isFinite(rawMinutes) ? Math.max(0, Math.round(rawMinutes)) : 0
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}.${pad2(minutes)}`
}

const minutesBetween = (startValue, endValue) => {
  const start = new Date(startValue)
  const end = new Date(endValue)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0

  const minutes = (end.getTime() - start.getTime()) / 60000
  return minutes > 0 ? minutes : 0
}

const normalizeEmployeeType = (value) => value?.toLowerCase().replace(/\s+/g, '') || ''

const isYyyyMmDd = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)

const parseYyyyMmDd = (value) => {
  if (!isYyyyMmDd(value)) return new Date()

  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const formatYyyyMmDd = (dateValue) => (
  `${dateValue.getFullYear()}-${pad2(dateValue.getMonth() + 1)}-${pad2(dateValue.getDate())}`
)

const formatDisplayDate = (value) => {
  const dateValue = parseYyyyMmDd(value)
  return dateValue.toLocaleDateString('en-GB')
}

const formatMonthLabel = (value) => {
  const [year, monthNumber] = String(value || '').split('-').map(Number)
  const dateValue = year && monthNumber
    ? new Date(year, monthNumber - 1, 1)
    : new Date()

  return dateValue.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

const getWeekStartMonday = (dateValue) => {
  const monday = new Date(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate())
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)
  return monday
}

const parseIsoWeekValue = (value) => {
  const match = /^(\d{4})-W(\d{2})$/.exec(String(value || ''))
  if (!match) return getWeekStartMonday(new Date())

  const year = Number(match[1])
  const week = Number(match[2])
  const weekOneAnchor = new Date(year, 0, 4)
  const weekOneMonday = getWeekStartMonday(weekOneAnchor)
  const monday = new Date(weekOneMonday)
  monday.setDate(weekOneMonday.getDate() + ((week - 1) * 7))
  return monday
}

const getWeekDateRange = (weekValue) => {
  const start = parseIsoWeekValue(weekValue)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const dates = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return formatYyyyMmDd(day)
  })

  return { start, end, dates }
}

const formatWeekRange = (weekValue) => {
  const { start, end } = getWeekDateRange(weekValue)
  return `${start.toLocaleDateString('en-GB')} - ${end.toLocaleDateString('en-GB')}`
}

const getMonthDateRange = (monthValue) => {
  const [year, monthNumber] = String(monthValue || '').split('-').map(Number)
  const baseDate = year && monthNumber
    ? new Date(year, monthNumber - 1, 1)
    : new Date()
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
  const dates = []

  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(formatYyyyMmDd(current))
  }

  return dates
}

const COMPANY_COUNT_COLORS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0891b2',
  '#475569',
  '#be123c',
]

const WORKING_HOURS_COLORS = [
  '#0f766e',
  '#2563eb',
  '#7c3aed',
  '#d97706',
  '#dc2626',
  '#0891b2',
  '#4f46e5',
  '#be123c',
]

const PROCESS_HOURS_COLORS = [
  '#1d4ed8',
  '#059669',
  '#ca8a04',
  '#7c3aed',
  '#be123c',
  '#0891b2',
  '#4338ca',
  '#b45309',
]

const getSessionCompanyDetails = (session) => {
  const company = session?.companyId || session?.company
  const companyId = company?._id || company?.id || (typeof company === 'string' ? company : null)
  const companyName =
    company?.companyName ||
    company?.name ||
    session?.companyName ||
    'Unknown Company'

  return {
    companyId: companyId ? String(companyId) : '',
    companyName,
  }
}

const getSessionWorkMinutes = (session, now = new Date()) => {
  const durationMinutes = Number(session?.durationMinutes)
  if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
    return durationMinutes
  }

  const endTime = session?.endTime || now
  return minutesBetween(session?.startTime, endTime)
}

const buildCompanyWorkingHourRows = (dailyGroups) => {
  const grouped = new Map()
  const safeDailyGroups = Array.isArray(dailyGroups) ? dailyGroups : []
  const now = new Date()

  safeDailyGroups.forEach(({ sessions }) => {
    const safeSessions = Array.isArray(sessions) ? sessions : []

    safeSessions.forEach((session) => {
      const { companyId, companyName } = getSessionCompanyDetails(session)
      const companyKey = companyId || companyName
      const existing = grouped.get(companyKey) || {
        companyId: companyId || companyKey,
        companyName,
        totalMinutes: 0,
        sessionCount: 0,
        activeSessions: 0,
      }

      existing.totalMinutes += getSessionWorkMinutes(session, now)
      existing.sessionCount += 1
      if (!session?.endTime) {
        existing.activeSessions += 1
      }
      grouped.set(companyKey, existing)
    })
  })

  return Array.from(grouped.values())
    .sort((a, b) => {
      const minutesDiff = (Number(b.totalMinutes) || 0) - (Number(a.totalMinutes) || 0)
      return minutesDiff || String(a.companyName).localeCompare(String(b.companyName))
    })
    .map((row, index) => ({
      ...row,
      color: WORKING_HOURS_COLORS[index % WORKING_HOURS_COLORS.length],
      totalHours: row.totalMinutes / 60,
    }))
}

const getSessionProcessName = (session) => (
  session?.processName ||
  session?.process?.processName ||
  session?.processId?.processName ||
  'Unknown Process'
)

const buildProcessWorkingHourRows = (dailyGroups) => {
  const grouped = new Map()
  const safeDailyGroups = Array.isArray(dailyGroups) ? dailyGroups : []
  const now = new Date()

  safeDailyGroups.forEach(({ sessions }) => {
    const safeSessions = Array.isArray(sessions) ? sessions : []

    safeSessions.forEach((session) => {
      const processName = getSessionProcessName(session)
      const processKey = String(processName).trim().toLowerCase() || 'unknown-process'
      const existing = grouped.get(processKey) || {
        processName,
        totalMinutes: 0,
        sessionCount: 0,
        activeSessions: 0,
      }

      existing.totalMinutes += getSessionWorkMinutes(session, now)
      existing.sessionCount += 1
      if (!session?.endTime) {
        existing.activeSessions += 1
      }
      grouped.set(processKey, existing)
    })
  })

  return Array.from(grouped.values())
    .sort((a, b) => {
      const minutesDiff = (Number(b.totalMinutes) || 0) - (Number(a.totalMinutes) || 0)
      return minutesDiff || String(a.processName).localeCompare(String(b.processName))
    })
    .map((row, index) => ({
      ...row,
      color: PROCESS_HOURS_COLORS[index % PROCESS_HOURS_COLORS.length],
      totalHours: row.totalMinutes / 60,
    }))
}

const getEmployeeDisplayName = (row) => (
  row?.employeeName ||
  row?.employeeCode ||
  'Unknown Employee'
)

const getEmployeeMetaLabel = (row) => {
  const details = [
    row?.employeeCode,
    row?.employeeType,
    row?.companyName,
  ].filter(Boolean)

  return details.length > 0 ? details.join(' / ') : 'No employee details'
}

const getLargestByMinutes = (rows, key) => {
  return rows.reduce((largest, row) => {
    const rowMinutes = Number(row?.[key]) || 0
    const largestMinutes = Number(largest?.[key]) || 0
    return rowMinutes > largestMinutes ? row : largest
  }, null)
}

const buildDailyIdleSummary = (rows) => {
  const safeRows = Array.isArray(rows) ? rows : []
  const totalIdleMinutes = safeRows.reduce(
    (total, row) => total + (Number(row?.idleMinutes) || 0),
    0
  )
  const totalWorkMinutes = safeRows.reduce(
    (total, row) => total + (Number(row?.workMinutes) || 0),
    0
  )

  return {
    rows: safeRows,
    employeeCount: safeRows.length,
    totalIdleMinutes,
    totalWorkMinutes,
    averageIdleMinutes: safeRows.length > 0 ? totalIdleMinutes / safeRows.length : 0,
    highestIdleEmployee: getLargestByMinutes(safeRows, 'idleMinutes'),
    highestWorkingEmployee: getLargestByMinutes(safeRows, 'workMinutes'),
  }
}

const getAttendanceCompanyDetails = (item) => {
  const company = item?.company || item?.firstIn?.companyId || item?.lastOut?.companyId
  const companyId = company?._id || company?.id || (typeof company === 'string' ? company : null)
  const companyName =
    company?.companyName ||
    company?.name ||
    item?.companyName ||
    'Unknown Company'

  return {
    companyId: companyId ? String(companyId) : '',
    companyName,
  }
}

const getAttendanceEmployeeKey = (item, fallback) => {
  const employee = item?.employee || item?.firstIn?.employeeId || item?.lastOut?.employeeId
  const employeeId =
    employee?._id ||
    employee?.id ||
    employee?.employeeId ||
    (typeof employee === 'string' ? employee : null) ||
    item?.employeeId ||
    fallback

  return String(employeeId)
}

const buildCompanyEmployeeCountRows = (dailyGroups) => {
  const grouped = new Map()
  const safeDailyGroups = Array.isArray(dailyGroups) ? dailyGroups : []

  safeDailyGroups.forEach(({ date: groupDate, rows }) => {
    const seenForDate = new Set()
    const safeRows = Array.isArray(rows) ? rows : []

    safeRows.forEach((item, index) => {
      const { companyId, companyName } = getAttendanceCompanyDetails(item)
      const companyKey = companyId || companyName
      const employeeKey = getAttendanceEmployeeKey(item, `${companyKey}-${index}`)
      const recordKey = `${groupDate}|${companyKey}|${employeeKey}`

      if (seenForDate.has(recordKey)) return
      seenForDate.add(recordKey)

      const existing = grouped.get(companyKey) || {
        companyId: companyId || companyKey,
        companyName,
        count: 0,
      }

      existing.count += 1
      grouped.set(companyKey, existing)
    })
  })

  const total = Array.from(grouped.values()).reduce(
    (sum, row) => sum + (Number(row.count) || 0),
    0
  )

  return Array.from(grouped.values())
    .map((row, index) => ({
      ...row,
      color: COMPANY_COUNT_COLORS[index % COMPANY_COUNT_COLORS.length],
      percentage: total > 0 ? (row.count / total) * 100 : 0,
    }))
    .sort((a, b) => {
      const countDiff = (Number(b.count) || 0) - (Number(a.count) || 0)
      return countDiff || String(a.companyName).localeCompare(String(b.companyName))
    })
}

const createEmptyAttendanceMetrics = () => ({
  total: 0,
  completed: 0,
  open: 0,
  exceptions: 0,
  presenceMinutes: 0,
})

const getAttendancePresenceMinutes = (item, day) => {
  const checkInTime = item?.firstIn?.scanTime
  if (!checkInTime) return 0

  const isToday = day === todayYyyyMmDd()
  const checkOutTime = item?.lastOut?.scanTime || (isToday ? new Date() : null)
  if (!checkOutTime) return 0

  return minutesBetween(checkInTime, checkOutTime)
}

const buildAttendanceMetrics = (rows, day) => {
  const metrics = createEmptyAttendanceMetrics()
  const safeRows = Array.isArray(rows) ? rows : []

  safeRows.forEach((item) => {
    metrics.total += 1

    if (item?.firstIn && item?.lastOut) {
      metrics.completed += 1
    } else if (item?.firstIn) {
      metrics.open += 1
    } else {
      metrics.exceptions += 1
    }

    metrics.presenceMinutes += getAttendancePresenceMinutes(item, day)
  })

  return metrics
}

const aggregateAttendanceMetrics = (metricsList) => {
  return (Array.isArray(metricsList) ? metricsList : []).reduce((total, metrics) => ({
    total: total.total + (Number(metrics?.total) || 0),
    completed: total.completed + (Number(metrics?.completed) || 0),
    open: total.open + (Number(metrics?.open) || 0),
    exceptions: total.exceptions + (Number(metrics?.exceptions) || 0),
    presenceMinutes: total.presenceMinutes + (Number(metrics?.presenceMinutes) || 0),
  }), createEmptyAttendanceMetrics())
}

const attendanceFilterOptions = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

const CompanyWorkingHoursBarChart = ({ rows, isLoading }) => {
  const safeRows = Array.isArray(rows) ? rows : []
  const totalMinutes = safeRows.reduce(
    (sum, row) => sum + (Number(row.totalMinutes) || 0),
    0
  )
  const totalSessions = safeRows.reduce(
    (sum, row) => sum + (Number(row.sessionCount) || 0),
    0
  )
  const maxMinutes = Math.max(0, ...safeRows.map((row) => Number(row.totalMinutes) || 0))
  const chartRows = safeRows.slice(0, 6)

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr] xl:items-stretch">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
        {isLoading ? (
          <div className="flex min-h-96 items-center justify-center text-sm text-slate-500">
            Loading company working hours...
          </div>
        ) : safeRows.length > 0 ? (
          <div className="flex min-h-96 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Hours
                </p>
                <p className="mt-2 text-4xl font-semibold tabular-nums text-slate-950">
                  {formatHoursMinutes(totalMinutes, 0)}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {totalSessions} recorded session{totalSessions === 1 ? '' : 's'}
                </p>
              </div>
              <div className="rounded-md bg-white px-3 py-2 text-right ring-1 ring-slate-200">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Companies
                </p>
                <p className="text-xl font-semibold tabular-nums text-slate-950">
                  {safeRows.length}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-1 items-end gap-3 border-b border-l border-slate-200 px-3 pt-4">
              {chartRows.map((row) => {
                const minutes = Number(row.totalMinutes) || 0
                const heightPct = maxMinutes > 0 ? Math.max(8, (minutes / maxMinutes) * 100) : 0
                const percentage = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0

                return (
                  <div
                    key={row.companyId || row.companyName}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="flex h-44 w-full flex-col items-center justify-end gap-2">
                      <span
                        className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold tabular-nums shadow-sm"
                        style={{
                          border: `1px solid ${row.color}`,
                          color: row.color,
                        }}
                      >
                        {percentage.toFixed(1)}%
                      </span>
                      <div
                        className="w-full max-w-9 rounded-t-md shadow-sm"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: row.color,
                        }}
                        title={`${row.companyName}: ${formatHoursMinutes(minutes, 0)} hours`}
                      />
                    </div>
                    <div
                      className="w-full truncate text-center text-[11px] font-semibold text-slate-600"
                      title={row.companyName}
                    >
                      {row.companyName}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              Working hours by company
            </div>
          </div>
        ) : (
          <div className="flex min-h-96 items-center justify-center text-center text-sm text-slate-500">
            No company working hours for this period.
          </div>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Companies
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {isLoading ? 'Loading company hours...' : `${safeRows.length} company records`}
            </p>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-right ring-1 ring-slate-200">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Hours</p>
            <p className="text-xl font-semibold tabular-nums text-slate-950">
              {isLoading ? '...' : formatHoursMinutes(totalMinutes, 0)}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            Loading company working hours...
          </div>
        ) : safeRows.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {safeRows.map((row) => {
              const minutes = Number(row.totalMinutes) || 0
              const widthPct = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0
              const percentage = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0

              return (
                <div
                  key={row.companyId || row.companyName}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {row.companyName}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {row.sessionCount} session{row.sessionCount === 1 ? '' : 's'}
                      {row.activeSessions > 0 ? ` - ${row.activeSessions} active` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums text-slate-950">
                      {formatHoursMinutes(minutes, 0)}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No company working hours for this period.
          </div>
        )}
      </div>
    </div>
  )
}

const StatCard = ({ title, value, caption, icon: Icon, tone = 'slate' }) => {
  const toneStyles = {
    slate: {
      border: 'border-t-slate-300',
      shell: 'bg-slate-50 text-slate-700 ring-slate-200',
      marker: 'bg-slate-400',
      value: 'text-slate-950',
    },
    indigo: {
      border: 'border-t-indigo-500',
      shell: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
      marker: 'bg-indigo-500',
      value: 'text-indigo-950',
    },
    amber: {
      border: 'border-t-amber-500',
      shell: 'bg-amber-50 text-amber-700 ring-amber-100',
      marker: 'bg-amber-500',
      value: 'text-amber-950',
    },
    emerald: {
      border: 'border-t-emerald-500',
      shell: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
      marker: 'bg-emerald-500',
      value: 'text-emerald-950',
    },
    blue: {
      border: 'border-t-blue-500',
      shell: 'bg-blue-50 text-blue-700 ring-blue-100',
      marker: 'bg-blue-500',
      value: 'text-blue-950',
    },
    purple: {
      border: 'border-t-purple-500',
      shell: 'bg-purple-50 text-purple-700 ring-purple-100',
      marker: 'bg-purple-500',
      value: 'text-purple-950',
    },
    rose: {
      border: 'border-t-rose-500',
      shell: 'bg-rose-50 text-rose-700 ring-rose-100',
      marker: 'bg-rose-500',
      value: 'text-rose-950',
    },
  }

  const styles = toneStyles[tone] ?? toneStyles.slate

  return (
    <Card className={`p-5 border border-slate-200 border-t-4 ${styles.border} bg-white shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          <p className={`mt-3 text-4xl font-semibold tracking-tight tabular-nums ${styles.value}`}>
            {value}
          </p>
        </div>

        {Icon ? (
          <div className={`shrink-0 rounded-md p-2.5 ring-1 ${styles.shell}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>

      {caption ? (
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
          <span className={`h-2 w-2 rounded-full ${styles.marker}`} />
          <span>{caption}</span>
        </div>
      ) : null}
    </Card>
  )
}

const AttendanceMetric = ({ label, value, icon: Icon, tone = 'slate' }) => {
  const toneStyles = {
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {Icon ? (
          <span className={`rounded-md p-1.5 ring-1 ${toneStyles[tone] ?? toneStyles.slate}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">
        {value}
      </div>
    </div>
  )
}

const EmployeeAttendancePanel = ({
  view,
  selectedFilter,
  onSelectFilter,
  attendanceDate,
  attendanceWeek,
  attendanceMonth,
  onAttendanceDateChange,
  onAttendanceWeekChange,
  onAttendanceMonthChange,
  activeInputClass,
  isLoading,
}) => {
  const toneStyles = {
    indigo: 'border-t-indigo-500',
    emerald: 'border-t-emerald-500',
    blue: 'border-t-blue-500',
  }
  const metrics = view?.metrics || createEmptyAttendanceMetrics()
  const averageAttendanceMinutes = metrics.total > 0
    ? metrics.presenceMinutes / metrics.total
    : 0

  return (
    <Card className={`p-5 border-t-4 ${toneStyles[view?.tone] ?? toneStyles.indigo}`} title={null}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Employee Attendance
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {view?.period}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {view?.title}
          </p>
        </div>

        <div className="w-full xl:w-[430px]">
          <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-1.5">
            {attendanceFilterOptions.map((option) => {
              const isSelected = selectedFilter === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelectFilter(option.key)}
                  className={`h-9 rounded-md border px-4 text-sm font-semibold transition ${
                    isSelected
                      ? 'border-emerald-500 bg-white text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="mt-3">
            {selectedFilter === 'daily' ? (
              <DailyDatePicker
                value={attendanceDate}
                onChange={onAttendanceDateChange}
                isActive
              />
            ) : null}
            {selectedFilter === 'weekly' ? (
              <WeekPicker
                label={`Weekly (${view?.period})`}
                value={attendanceWeek}
                onChange={onAttendanceWeekChange}
                isActive
              />
            ) : null}
            {selectedFilter === 'monthly' ? (
              <Input
                label="Monthly"
                type="month"
                value={attendanceMonth}
                onChange={(e) => onAttendanceMonthChange(e.target.value)}
                className={activeInputClass}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-4 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="rounded-md bg-white p-2.5 text-slate-700 ring-1 ring-slate-200">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {view?.label} View
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {view?.period}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AttendanceMetric
            label="Total Attendance"
            value={isLoading ? '...' : metrics.total}
            icon={Users}
            tone="indigo"
          />
          <AttendanceMetric
            label="Completed Attendance"
            value={isLoading ? '...' : metrics.completed}
            icon={CheckCircle2}
            tone="emerald"
          />
          <AttendanceMetric
            label="Open Attendance"
            value={isLoading ? '...' : metrics.open}
            icon={Clock}
            tone="amber"
          />
          <AttendanceMetric
            label="Average Attendance Hours"
            value={isLoading ? '...' : `${formatHoursMinutes(averageAttendanceMinutes, 0)} hrs`}
            icon={CalendarDays}
            tone="blue"
          />
        </div>
      </div>
    </Card>
  )
}

const CompanyEmployeeDonut = ({ rows, isLoading }) => {
  const safeRows = Array.isArray(rows) ? rows : []
  const total = safeRows.reduce((sum, row) => sum + (Number(row.count) || 0), 0)
  let offset = 0
  const chartRows = total > 0 && !isLoading
    ? safeRows.map((row) => {
      const percentage = ((Number(row.count) || 0) / total) * 100
      const labelAngle = (((offset + (percentage / 2)) / 100) * 2 * Math.PI) - (Math.PI / 2)
      const labelRadius = 122
      const chartRow = {
        ...row,
        percentage,
        dashArray: `${percentage} ${100 - percentage}`,
        dashOffset: -offset,
        labelX: 110 + (Math.cos(labelAngle) * labelRadius),
        labelY: 110 + (Math.sin(labelAngle) * labelRadius),
      }
      offset += percentage
      return chartRow
    })
    : []

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-64 w-64">
        <svg viewBox="-42 -42 304 304" className="h-full w-full">
          <circle
            cx="110"
            cy="110"
            r="78"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="28"
          />
          {chartRows.map((row) => (
            <circle
              key={row.companyId || row.companyName}
              cx="110"
              cy="110"
              r="78"
              fill="none"
              stroke={row.color}
              strokeWidth="28"
              pathLength="100"
              strokeDasharray={row.dashArray}
              strokeDashoffset={row.dashOffset}
              transform="rotate(-90 110 110)"
            />
          ))}
          {chartRows.map((row) => (
            <g
              key={`percentage-${row.companyId || row.companyName}`}
              transform={`translate(${row.labelX} ${row.labelY})`}
            >
              <rect
                x="-23"
                y="-10"
                width="46"
                height="20"
                rx="10"
                fill="#ffffff"
                stroke={row.color}
                strokeWidth="1.4"
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill={row.color}
                fontSize="10"
                fontWeight="700"
              >
                {row.percentage.toFixed(1)}%
              </text>
            </g>
          ))}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total
          </span>
          <span className="mt-1 text-4xl font-semibold tabular-nums text-slate-950">
            {isLoading ? '...' : total}
          </span>
          <span className="mt-1 text-xs font-medium text-slate-500">
            employees
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
        <Building2 className="h-3.5 w-3.5 text-slate-500" />
        Company distribution
      </div>
    </div>
  )
}

const CompanyEmployeeCountPanel = ({
  view,
  rows,
  selectedFilter,
  onSelectFilter,
  companyCountDate,
  companyCountWeek,
  companyCountMonth,
  onCompanyCountDateChange,
  onCompanyCountWeekChange,
  onCompanyCountMonthChange,
  activeInputClass,
  isLoading,
}) => {
  const safeRows = Array.isArray(rows) ? rows : []
  const total = safeRows.reduce((sum, row) => sum + (Number(row.count) || 0), 0)

  return (
    <Card className="border-t-4 border-t-sky-500 p-5" title={null}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Company-wise Employee Count
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {view?.period}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Employee attendance count by company
          </p>
        </div>

        <div className="w-full xl:w-[430px]">
          <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-1.5">
            {attendanceFilterOptions.map((option) => {
              const isSelected = selectedFilter === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelectFilter(option.key)}
                  className={`h-9 rounded-md border px-4 text-sm font-semibold transition ${
                    isSelected
                      ? 'border-emerald-500 bg-white text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="mt-3">
            {selectedFilter === 'daily' ? (
              <DailyDatePicker
                value={companyCountDate}
                onChange={onCompanyCountDateChange}
                isActive
              />
            ) : null}
            {selectedFilter === 'weekly' ? (
              <WeekPicker
                label={`Weekly (${view?.period})`}
                value={companyCountWeek}
                onChange={onCompanyCountWeekChange}
                isActive
              />
            ) : null}
            {selectedFilter === 'monthly' ? (
              <Input
                label="Monthly"
                type="month"
                value={companyCountMonth}
                onChange={(e) => onCompanyCountMonthChange(e.target.value)}
                className={activeInputClass}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[340px_1fr] xl:items-center">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
          <CompanyEmployeeDonut rows={safeRows} isLoading={isLoading} />
        </div>

        <div className="rounded-md border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Companies
              </p>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {isLoading ? 'Loading company counts...' : `${safeRows.length} company records`}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2 text-right ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
              <p className="text-xl font-semibold tabular-nums text-slate-950">
                {isLoading ? '...' : total}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Loading company employee counts...
            </div>
          ) : safeRows.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {safeRows.map((row) => (
                <div
                  key={row.companyId || row.companyName}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {row.companyName}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${row.percentage}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums text-slate-950">
                      {row.count}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {row.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              No attendance employee counts for this period.
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

const CompanyWorkingHoursPanel = ({
  view,
  rows,
  selectedFilter,
  onSelectFilter,
  workingHoursDate,
  workingHoursWeek,
  workingHoursMonth,
  onWorkingHoursDateChange,
  onWorkingHoursWeekChange,
  onWorkingHoursMonthChange,
  activeInputClass,
  isLoading,
}) => {
  return (
    <Card className="border-t-4 border-t-sky-500 p-5" title={null}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Company-wise Working Hours
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {view?.period}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Work-session hours by company
          </p>
        </div>

        <div className="w-full xl:w-[430px]">
          <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-1.5">
            {attendanceFilterOptions.map((option) => {
              const isSelected = selectedFilter === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelectFilter(option.key)}
                  className={`h-9 rounded-md border px-4 text-sm font-semibold transition ${
                    isSelected
                      ? 'border-emerald-500 bg-white text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="mt-3">
            {selectedFilter === 'daily' ? (
              <DailyDatePicker
                value={workingHoursDate}
                onChange={onWorkingHoursDateChange}
                isActive
              />
            ) : null}
            {selectedFilter === 'weekly' ? (
              <WeekPicker
                label={`Weekly (${view?.period})`}
                value={workingHoursWeek}
                onChange={onWorkingHoursWeekChange}
                isActive
              />
            ) : null}
            {selectedFilter === 'monthly' ? (
              <Input
                label="Monthly"
                type="month"
                value={workingHoursMonth}
                onChange={(e) => onWorkingHoursMonthChange(e.target.value)}
                className={activeInputClass}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <CompanyWorkingHoursBarChart rows={rows} isLoading={isLoading} />
      </div>
    </Card>
  )
}

const ProcessWorkingHoursDonutChart = ({ rows, isLoading }) => {
  const safeRows = Array.isArray(rows) ? rows : []
  const totalMinutes = safeRows.reduce(
    (sum, row) => sum + (Number(row.totalMinutes) || 0),
    0
  )
  const totalSessions = safeRows.reduce(
    (sum, row) => sum + (Number(row.sessionCount) || 0),
    0
  )
  const maxMinutes = Math.max(0, ...safeRows.map((row) => Number(row.totalMinutes) || 0))
  const topProcess = safeRows[0]
  const topProcessMinutes = Number(topProcess?.totalMinutes) || 0
  const topProcessPercentage = totalMinutes > 0 ? (topProcessMinutes / totalMinutes) * 100 : 0
  let offset = 0
  const chartRows = totalMinutes > 0 && !isLoading
    ? safeRows.map((row) => {
      const minutes = Number(row.totalMinutes) || 0
      const percentage = (minutes / totalMinutes) * 100
      const gap = safeRows.length > 1 ? 1.2 : 0
      const visiblePercentage = Math.max(percentage - gap, 0)
      const labelAngle = (((offset + (percentage / 2)) / 100) * 2 * Math.PI) - (Math.PI / 2)
      const labelRadius = 136
      const chartRow = {
        ...row,
        percentage,
        dashArray: `${visiblePercentage} ${100 - visiblePercentage}`,
        dashOffset: -offset,
        labelX: 120 + (Math.cos(labelAngle) * labelRadius),
        labelY: 120 + (Math.sin(labelAngle) * labelRadius),
      }
      offset += percentage
      return chartRow
    })
    : []

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr] xl:items-stretch">
      <div className="rounded-md border border-slate-200 bg-slate-50 p-5">
        {isLoading ? (
          <div className="flex min-h-96 items-center justify-center text-sm text-slate-500">
            Loading process working hours...
          </div>
        ) : safeRows.length > 0 ? (
          <div className="flex min-h-96 flex-col">
            <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Process Mix
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    Working-hour share by process
                  </p>
                </div>
                <div className="rounded-md bg-slate-50 px-3 py-2 text-right ring-1 ring-slate-200">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total Hours
                  </p>
                  <p className="text-xl font-semibold tabular-nums text-slate-950">
                    {formatHoursMinutes(totalMinutes, 0)}
                  </p>
                </div>
              </div>

              <div className="relative mx-auto h-64 w-64">
                <svg viewBox="-48 -48 336 336" className="h-full w-full drop-shadow-sm">
                  <circle
                    cx="120"
                    cy="120"
                    r="92"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="78"
                    fill="#ffffff"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r="92"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="22"
                  />
                  {chartRows.map((row) => (
                    <circle
                      key={row.processName}
                      cx="120"
                      cy="120"
                      r="92"
                      fill="none"
                      stroke={row.color}
                      strokeWidth="22"
                      pathLength="100"
                      strokeDasharray={row.dashArray}
                      strokeDashoffset={row.dashOffset}
                      strokeLinecap="round"
                      transform="rotate(-90 120 120)"
                    />
                  ))}
                  <circle
                    cx="120"
                    cy="120"
                    r="64"
                    fill="none"
                    stroke="#f8fafc"
                    strokeWidth="8"
                  />
                  {chartRows.map((row) => (
                    <g
                      key={`percentage-${row.processName}`}
                      transform={`translate(${row.labelX} ${row.labelY})`}
                    >
                      <rect
                        x="-23"
                        y="-10"
                        width="46"
                        height="20"
                        rx="10"
                        fill="#ffffff"
                        stroke={row.color}
                        strokeWidth="1.4"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={row.color}
                        fontSize="10"
                        fontWeight="700"
                      >
                        {row.percentage.toFixed(1)}%
                      </text>
                    </g>
                  ))}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Hours
                  </span>
                  <span className="mt-1 text-4xl font-semibold tabular-nums text-slate-950">
                    {formatHoursMinutes(totalMinutes, 0)}
                  </span>
                  <span className="mt-1 text-xs font-medium text-slate-500">
                    total work
                  </span>
                </div>
              </div>
            </div>

            {/* <div className="mt-4 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Top Process
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: topProcess?.color }}
                    />
                    <span className="truncate text-sm font-semibold text-slate-950">
                      {topProcess?.processName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold tabular-nums text-slate-950">
                    {formatHoursMinutes(topProcessMinutes, 0)}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {topProcessPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div> */}

            <div className="mt-4 grid w-full grid-cols-2 gap-3">
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Processes
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-slate-950">
                  {safeRows.length}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Sessions
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-slate-950">
                  {totalSessions}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
              <ClipboardCheck className="h-3.5 w-3.5 text-slate-500" />
              Process performance distribution
            </div>
          </div>
        ) : (
          <div className="flex min-h-96 items-center justify-center text-center text-sm text-slate-500">
            No process working hours for this period.
          </div>
        )}
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Processes
            </p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {isLoading ? 'Loading process hours...' : `${safeRows.length} process records`}
            </p>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-right ring-1 ring-slate-200">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Hours</p>
            <p className="text-xl font-semibold tabular-nums text-slate-950">
              {isLoading ? '...' : formatHoursMinutes(totalMinutes, 0)}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            Loading process working hours...
          </div>
        ) : safeRows.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {safeRows.map((row) => {
              const minutes = Number(row.totalMinutes) || 0
              const widthPct = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0
              const percentage = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0

              return (
                <div
                  key={row.processName}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: row.color }}
                      />
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {row.processName}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: row.color,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {row.sessionCount} session{row.sessionCount === 1 ? '' : 's'}
                      {row.activeSessions > 0 ? ` - ${row.activeSessions} active` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums text-slate-950">
                      {formatHoursMinutes(minutes, 0)} hrs
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No process working hours for this period.
          </div>
        )}
      </div>
    </div>
  )
}

const ProcessWorkingHoursPanel = ({
  view,
  rows,
  selectedFilter,
  onSelectFilter,
  processHoursDate,
  processHoursWeek,
  processHoursMonth,
  onProcessHoursDateChange,
  onProcessHoursWeekChange,
  onProcessHoursMonthChange,
  activeInputClass,
  isLoading,
}) => {
  return (
    <Card className="border-t-4 border-t-indigo-500 p-5" title={null}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Process-wise Working Hours
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {view?.period}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Work-session hours by process
          </p>
        </div>

        <div className="w-full xl:w-[430px]">
          <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-slate-50 p-1.5">
            {attendanceFilterOptions.map((option) => {
              const isSelected = selectedFilter === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onSelectFilter(option.key)}
                  className={`h-9 rounded-md border px-4 text-sm font-semibold transition ${
                    isSelected
                      ? 'border-emerald-500 bg-white text-emerald-700 shadow-sm ring-2 ring-emerald-500/20'
                      : 'border-transparent text-slate-600 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="mt-3">
            {selectedFilter === 'daily' ? (
              <DailyDatePicker
                value={processHoursDate}
                onChange={onProcessHoursDateChange}
                isActive
              />
            ) : null}
            {selectedFilter === 'weekly' ? (
              <WeekPicker
                label={`Weekly (${view?.period})`}
                value={processHoursWeek}
                onChange={onProcessHoursWeekChange}
                isActive
              />
            ) : null}
            {selectedFilter === 'monthly' ? (
              <Input
                label="Monthly"
                type="month"
                value={processHoursMonth}
                onChange={(e) => onProcessHoursMonthChange(e.target.value)}
                className={activeInputClass}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProcessWorkingHoursDonutChart rows={rows} isLoading={isLoading} />
      </div>
    </Card>
  )
}

const DailyIdleSummaryMetric = ({ label, value, caption, icon: Icon, tone = 'slate' }) => {
  const toneStyles = {
    slate: 'bg-slate-50 text-slate-700 ring-slate-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-950">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className={`rounded-md p-2 ring-1 ${toneStyles[tone] ?? toneStyles.slate}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      {caption ? (
        <p className="mt-3 truncate border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
          {caption}
        </p>
      ) : null}
    </div>
  )
}

const DailyIdleLeaderRow = ({ label, row, minutesKey, tone = 'amber' }) => {
  const minutes = Number(row?.[minutesKey]) || 0
  const toneStyles = {
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${toneStyles[tone] ?? toneStyles.amber}`} />
            <span className="truncate text-sm font-semibold text-slate-950">
              {row ? getEmployeeDisplayName(row) : 'No employee records'}
            </span>
          </div>
          <p className="mt-1 truncate text-xs font-medium text-slate-500">
            {row ? getEmployeeMetaLabel(row) : 'No attendance rows for this date'}
          </p>
        </div>
        <div className="shrink-0 rounded-md bg-slate-50 px-3 py-2 text-right ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hours</p>
          <p className="text-xl font-semibold tabular-nums text-slate-950">
            {formatHoursMinutes(minutes, 0)}
          </p>
        </div>
      </div>
    </div>
  )
}

const DailyIdleHighlightsPanel = ({
  date,
  onDateChange,
  summary,
  isLoading,
}) => {
  const highestIdleMinutes = Number(summary?.highestIdleEmployee?.idleMinutes) || 0
  const highestWorkMinutes = Number(summary?.highestWorkingEmployee?.workMinutes) || 0
  const totalIdleMinutes = Number(summary?.totalIdleMinutes) || 0
  const averageIdleMinutes = Number(summary?.averageIdleMinutes) || 0

  return (
    <Card className="border-t-4 border-t-amber-500 p-5" title={null}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Daily In-Transition Time Highlights
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {formatDisplayDate(date)}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Highest In-Transition time, highest working hours and total daily In-Transition hours
          </p>
        </div>

        <div className="w-full xl:w-[280px]">
          <DailyDatePicker
            value={date}
            onChange={onDateChange}
            isActive
          />
        </div>
      </div>

      <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-slate-500">
            Loading daily In-Transition highlights...
          </div>
        ) : summary?.employeeCount > 0 ? (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DailyIdleSummaryMetric
                label="Highest In-Transition Time"
                value={`${formatHoursMinutes(highestIdleMinutes, 0)} hrs`}
                caption={getEmployeeDisplayName(summary.highestIdleEmployee)}
                icon={Clock}
                tone="amber"
              />
              <DailyIdleSummaryMetric
                label="Highest Working Hours"
                value={`${formatHoursMinutes(highestWorkMinutes, 0)} hrs`}
                caption={getEmployeeDisplayName(summary.highestWorkingEmployee)}
                icon={UserCheck}
                tone="emerald"
              />
              <DailyIdleSummaryMetric
                label="Total In-Transition Hours"
                value={`${formatHoursMinutes(totalIdleMinutes, 0)} hrs`}
                caption={`${summary.employeeCount} employee record${summary.employeeCount === 1 ? '' : 's'}`}
                icon={CalendarDays}
                tone="blue"
              />
              <DailyIdleSummaryMetric
                label="Average In-Transition Hours"
                value={`${formatHoursMinutes(averageIdleMinutes, 0)} hrs`}
                caption="Per attendance employee"
                icon={Users}
                tone="slate"
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Daily Employee Leaders
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {summary.employeeCount} attendance employee record{summary.employeeCount === 1 ? '' : 's'}
                </p>
              </div>
              <DailyIdleLeaderRow
                label="Highest In-Transition employee"
                row={summary.highestIdleEmployee}
                minutesKey="idleMinutes"
                tone="amber"
              />
              <DailyIdleLeaderRow
                label="Highest Working employee"
                row={summary.highestWorkingEmployee}
                minutesKey="workMinutes"
                tone="emerald"
              />
            </div>
          </div>
        ) : (
          <div className="flex min-h-72 items-center justify-center text-center text-sm text-slate-500">
            No daily In-Transition records for this date.
          </div>
        )}
      </div>
    </Card>
  )
}

const DailyDatePicker = ({ value, onChange, onOpenChange, isActive = false, onActivate }) => {
  const selectedDate = parseYyyyMmDd(value)
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  )
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }
  }, [isOpen, value])

  useEffect(() => {
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const monthLabel = visibleMonth.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
  const gridStart = new Date(monthStart)
  gridStart.setDate(monthStart.getDate() - monthStart.getDay())

  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart)
    day.setDate(gridStart.getDate() + index)
    return day
  })

  const goToPreviousMonth = () => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
  }

  const selectDate = (day) => {
    onActivate?.()
    onChange(formatYyyyMmDd(day))
    setIsOpen(false)
  }

  const pickerButtonClass = isActive
    ? 'border-emerald-500 shadow-emerald-100 ring-2 ring-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/20'
    : 'border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/20'

  return (
    <div ref={pickerRef} className="relative w-full">
      <label className="block text-sm font-medium text-slate-700 mb-1">Daily Date</label>
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 ${pickerButtonClass}`}
        onClick={() => {
          onActivate?.()
          setIsOpen((current) => !current)
        }}
      >
        <span>{formatDisplayDate(value)}</span>
        <CalendarDays className="h-4 w-4 text-slate-500" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-md border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-slate-900">{monthLabel}</div>
            <button
              type="button"
              className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayLabel) => (
              <div key={dayLabel}>{dayLabel}</div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayValue = formatYyyyMmDd(day)
              const isSelected = dayValue === value
              const isVisibleMonth = day.getMonth() === visibleMonth.getMonth()

              return (
                <button
                  key={dayValue}
                  type="button"
                  className={`h-8 rounded-md text-sm transition ${
                    isSelected
                      ? 'bg-blue-600 font-semibold text-white'
                      : isVisibleMonth
                        ? 'text-slate-900 hover:bg-blue-50'
                        : 'text-slate-400 hover:bg-slate-50'
                  }`}
                  onClick={() => selectDate(day)}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const WeekPicker = ({ label, value, onChange, onOpenChange, isActive = false, onActivate }) => {
  const safeValue = value || currentIsoWeek()
  const selectedWeekStart = parseIsoWeekValue(safeValue)
  const [isOpen, setIsOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selectedWeekStart.getFullYear(), selectedWeekStart.getMonth(), 1)
  )
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      setVisibleMonth(new Date(selectedWeekStart.getFullYear(), selectedWeekStart.getMonth(), 1))
    }
  }, [isOpen, safeValue])

  useEffect(() => {
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const monthLabel = visibleMonth.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
  const selectedWeekValue = getIsoWeekValue(selectedWeekStart)
  const [selectedYear, selectedWeekPart] = selectedWeekValue.split('-W')
  const selectedWeekLabel = `Week ${Number(selectedWeekPart)}, ${selectedYear}`
  const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
  const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0)
  const gridStart = getWeekStartMonday(monthStart)
  const gridEnd = getWeekStartMonday(monthEnd)
  gridEnd.setDate(gridEnd.getDate() + 6)

  const weeks = []
  for (let current = new Date(gridStart); current <= gridEnd; current.setDate(current.getDate() + 7)) {
    const weekStart = new Date(current)
    const weekValue = getIsoWeekValue(weekStart)
    const weekDays = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + index)
      return day
    })

    weeks.push({
      weekValue,
      weekNumber: Number(weekValue.split('-W')[1]),
      isSelected: weekValue === selectedWeekValue,
      days: weekDays,
    })
  }

  const goToPreviousMonth = () => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
  }

  const selectWeek = (weekValue) => {
    onActivate?.()
    onChange(weekValue || currentIsoWeek())
    setIsOpen(false)
  }

  const pickerButtonClass = isActive
    ? 'border-emerald-500 shadow-emerald-100 ring-2 ring-emerald-500/20 focus:border-emerald-500 focus:ring-emerald-500/20'
    : 'border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/20'

  return (
    <div ref={pickerRef} className="relative w-full">
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 ${pickerButtonClass}`}
        onClick={() => {
          onActivate?.()
          setIsOpen((current) => !current)
        }}
      >
        <span>{selectedWeekLabel}</span>
        <CalendarDays className="h-4 w-4 text-slate-500" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-40 mt-2 w-[360px] rounded-md border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-slate-900">{monthLabel}</div>
            <button
              type="button"
              className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-1 text-center text-xs font-medium text-slate-500">
            {['Week', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((dayLabel) => (
              <div key={dayLabel}>{dayLabel}</div>
            ))}
          </div>

          <div className="mt-2 space-y-1">
            {weeks.map((weekRow) => (
              <button
                key={weekRow.weekValue}
                type="button"
                className={`grid w-full grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-1 rounded-md border px-1 py-1 text-center text-sm transition ${
                  weekRow.isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => selectWeek(weekRow.weekValue)}
              >
                <span className="flex h-8 items-center justify-center rounded-md text-xs font-semibold">
                  {weekRow.weekNumber}
                </span>
                {weekRow.days.map((day) => {
                  const dayValue = formatYyyyMmDd(day)
                  const isVisibleMonth = day.getMonth() === visibleMonth.getMonth()
                  const isSelectedWeek = weekRow.isSelected

                  return (
                    <span
                      key={dayValue}
                      className={`flex h-8 items-center justify-center rounded-md ${
                        isSelectedWeek
                          ? 'bg-blue-600 font-semibold text-white'
                          : isVisibleMonth
                            ? 'text-slate-900'
                            : 'text-slate-400'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  )
                })}
              </button>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
              onClick={() => selectWeek(currentIsoWeek())}
            >
              This week
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export const PublicDashboardPage = () => {
  const [date, setDate] = useState(todayYyyyMmDd())
  const [week, setWeek] = useState(currentIsoWeek())
  const [month, setMonth] = useState(currentYyyyMm())
  const [activeFilter, setActiveFilter] = useState('daily')
  const [attendanceFilter, setAttendanceFilter] = useState('daily')
  const [attendanceDate, setAttendanceDate] = useState(todayYyyyMmDd())
  const [attendanceWeek, setAttendanceWeek] = useState(currentIsoWeek())
  const [attendanceMonth, setAttendanceMonth] = useState(currentYyyyMm())
  const [companyCountFilter, setCompanyCountFilter] = useState('daily')
  const [companyCountDate, setCompanyCountDate] = useState(todayYyyyMmDd())
  const [companyCountWeek, setCompanyCountWeek] = useState(currentIsoWeek())
  const [companyCountMonth, setCompanyCountMonth] = useState(currentYyyyMm())
  const [workingHoursFilter, setWorkingHoursFilter] = useState('daily')
  const [workingHoursDate, setWorkingHoursDate] = useState(todayYyyyMmDd())
  const [workingHoursWeek, setWorkingHoursWeek] = useState(currentIsoWeek())
  const [workingHoursMonth, setWorkingHoursMonth] = useState(currentYyyyMm())
  const [processHoursFilter, setProcessHoursFilter] = useState('daily')
  const [processHoursDate, setProcessHoursDate] = useState(todayYyyyMmDd())
  const [processHoursWeek, setProcessHoursWeek] = useState(currentIsoWeek())
  const [processHoursMonth, setProcessHoursMonth] = useState(currentYyyyMm())
  const [idleHighlightsDate, setIdleHighlightsDate] = useState(todayYyyyMmDd())
  const [checkInCount, setCheckInCount] = useState(0)
  const isDailyDatePickerActive = useRef(false)

  const [currentIdleRows, setCurrentIdleRows] = useState([])
  const [companyCountRows, setCompanyCountRows] = useState([])
  const [workingHoursRows, setWorkingHoursRows] = useState([])
  const [processHoursRows, setProcessHoursRows] = useState([])
  const [dailyIdleRows, setDailyIdleRows] = useState([])
  const [attendanceMetrics, setAttendanceMetrics] = useState({
    daily: createEmptyAttendanceMetrics(),
    weekly: createEmptyAttendanceMetrics(),
    monthly: createEmptyAttendanceMetrics(),
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false)
  const [isCompanyCountLoading, setIsCompanyCountLoading] = useState(false)
  const [isWorkingHoursLoading, setIsWorkingHoursLoading] = useState(false)
  const [isProcessHoursLoading, setIsProcessHoursLoading] = useState(false)
  const [isIdleHighlightsLoading, setIsIdleHighlightsLoading] = useState(false)
  const [error, setError] = useState('')

  const idleCounts = useMemo(() => {
    const safeRows = Array.isArray(currentIdleRows) ? currentIdleRows : []
    const manpower = safeRows.filter((row) => normalizeEmployeeType(row.employeeType) === 'manpower').length
    const permanent = safeRows.filter((row) => normalizeEmployeeType(row.employeeType) === 'permanent').length
    const casual = safeRows.filter((row) => normalizeEmployeeType(row.employeeType) === 'casual').length
    return { manpower, permanent, casual, total: safeRows.length }
  }, [currentIdleRows])

  const dailyIdleSummary = useMemo(
    () => buildDailyIdleSummary(dailyIdleRows),
    [dailyIdleRows]
  )

  const weekRangeLabel = useMemo(() => formatWeekRange(week), [week])
  const attendanceWeekRange = useMemo(() => getWeekDateRange(attendanceWeek), [attendanceWeek])
  const attendanceWeekRangeLabel = useMemo(() => formatWeekRange(attendanceWeek), [attendanceWeek])
  const companyCountWeekRange = useMemo(() => getWeekDateRange(companyCountWeek), [companyCountWeek])
  const companyCountWeekRangeLabel = useMemo(() => formatWeekRange(companyCountWeek), [companyCountWeek])
  const workingHoursWeekRange = useMemo(() => getWeekDateRange(workingHoursWeek), [workingHoursWeek])
  const workingHoursWeekRangeLabel = useMemo(() => formatWeekRange(workingHoursWeek), [workingHoursWeek])
  const processHoursWeekRange = useMemo(() => getWeekDateRange(processHoursWeek), [processHoursWeek])
  const processHoursWeekRangeLabel = useMemo(() => formatWeekRange(processHoursWeek), [processHoursWeek])

  const activeFilterInputClass =
    '!border-emerald-500 shadow-emerald-100 !ring-2 !ring-emerald-500/20 focus:!border-emerald-500 focus:!ring-emerald-500/20'

  const selectCommonFilter = (filter) => {
    setActiveFilter(filter)
    setAttendanceFilter(filter)
    setCompanyCountFilter(filter)
    setWorkingHoursFilter(filter)
    setProcessHoursFilter(filter)
    if (filter === 'daily') {
      setAttendanceDate(date)
      setCompanyCountDate(date)
      setWorkingHoursDate(date)
      setProcessHoursDate(date)
      setIdleHighlightsDate(date)
    } else if (filter === 'weekly') {
      setAttendanceWeek(week)
      setCompanyCountWeek(week)
      setWorkingHoursWeek(week)
      setProcessHoursWeek(week)
    } else if (filter === 'monthly') {
      setAttendanceMonth(month)
      setCompanyCountMonth(month)
      setWorkingHoursMonth(month)
      setProcessHoursMonth(month)
    }
  }

  const handleCommonDateChange = (value) => {
    setDate(value)
    setActiveFilter('daily')
    setAttendanceFilter('daily')
    setCompanyCountFilter('daily')
    setWorkingHoursFilter('daily')
    setProcessHoursFilter('daily')
    setAttendanceDate(value)
    setCompanyCountDate(value)
    setWorkingHoursDate(value)
    setProcessHoursDate(value)
    setIdleHighlightsDate(value)
  }

  const handleCommonWeekChange = (value) => {
    const nextWeek = value || currentIsoWeek()
    setWeek(nextWeek)
    setActiveFilter('weekly')
    setAttendanceFilter('weekly')
    setCompanyCountFilter('weekly')
    setWorkingHoursFilter('weekly')
    setProcessHoursFilter('weekly')
    setAttendanceWeek(nextWeek)
    setCompanyCountWeek(nextWeek)
    setWorkingHoursWeek(nextWeek)
    setProcessHoursWeek(nextWeek)
  }

  const handleCommonMonthChange = (value) => {
    setMonth(value)
    setActiveFilter('monthly')
    setAttendanceFilter('monthly')
    setCompanyCountFilter('monthly')
    setWorkingHoursFilter('monthly')
    setProcessHoursFilter('monthly')
    setAttendanceMonth(value)
    setCompanyCountMonth(value)
    setWorkingHoursMonth(value)
    setProcessHoursMonth(value)
  }

  const attendanceViews = useMemo(() => ({
    daily: {
      label: 'Daily',
      title: 'Daily Attendance',
      period: formatDisplayDate(attendanceDate),
      metrics: attendanceMetrics.daily,
      tone: 'indigo',
    },
    weekly: {
      label: 'Weekly',
      title: 'Weekly Attendance',
      period: attendanceWeekRangeLabel,
      metrics: attendanceMetrics.weekly,
      tone: 'emerald',
    },
    monthly: {
      label: 'Monthly',
      title: 'Monthly Attendance',
      period: formatMonthLabel(attendanceMonth),
      metrics: attendanceMetrics.monthly,
      tone: 'blue',
    },
  }), [attendanceDate, attendanceMetrics, attendanceMonth, attendanceWeekRangeLabel])

  const selectedAttendanceView = attendanceViews[attendanceFilter] || attendanceViews.daily

  const companyCountViews = useMemo(() => ({
    daily: {
      label: 'Daily',
      period: formatDisplayDate(companyCountDate),
    },
    weekly: {
      label: 'Weekly',
      period: companyCountWeekRangeLabel,
    },
    monthly: {
      label: 'Monthly',
      period: formatMonthLabel(companyCountMonth),
    },
  }), [companyCountDate, companyCountMonth, companyCountWeekRangeLabel])

  const selectedCompanyCountView = companyCountViews[companyCountFilter] || companyCountViews.daily

  const workingHoursViews = useMemo(() => ({
    daily: {
      label: 'Daily',
      period: formatDisplayDate(workingHoursDate),
    },
    weekly: {
      label: 'Weekly',
      period: workingHoursWeekRangeLabel,
    },
    monthly: {
      label: 'Monthly',
      period: formatMonthLabel(workingHoursMonth),
    },
  }), [workingHoursDate, workingHoursMonth, workingHoursWeekRangeLabel])

  const selectedWorkingHoursView = workingHoursViews[workingHoursFilter] || workingHoursViews.daily

  const processHoursViews = useMemo(() => ({
    daily: {
      label: 'Daily',
      period: formatDisplayDate(processHoursDate),
    },
    weekly: {
      label: 'Weekly',
      period: processHoursWeekRangeLabel,
    },
    monthly: {
      label: 'Monthly',
      period: formatMonthLabel(processHoursMonth),
    },
  }), [processHoursDate, processHoursMonth, processHoursWeekRangeLabel])

  const selectedProcessHoursView = processHoursViews[processHoursFilter] || processHoursViews.daily

  const load = async (shouldUpdate = () => true, showLoader = true) => {
    if (showLoader) setIsLoading(true)
    setError('')
    try {
      const [
        currentIdle,
        checkInData,
      ] = await Promise.all([
        getCurrentIdleEmployees(date),
        getPublicDailyCheckInCount(date),
      ])

      if (!shouldUpdate()) return

      setCurrentIdleRows(Array.isArray(currentIdle) ? currentIdle : [])
      setCheckInCount(Number(checkInData?.count) || 0)
    } catch (e) {
      if (!shouldUpdate()) return
      setCurrentIdleRows([])
      setCheckInCount(0)
      setError(e?.response?.data?.message || e?.message || 'Failed to load dashboard')
    } finally {
      if (showLoader && shouldUpdate()) setIsLoading(false)
    }
  }

  const loadEmployeeAttendance = async (shouldUpdate = () => true, showLoader = true) => {
    if (showLoader) setIsAttendanceLoading(true)
    try {
      let metrics = createEmptyAttendanceMetrics()

      if (attendanceFilter === 'daily') {
        metrics = await getDailySummary(attendanceDate).then((rows) =>
          buildAttendanceMetrics(rows, attendanceDate)
        )
      } else if (attendanceFilter === 'weekly') {
        metrics = await Promise.all(
          attendanceWeekRange.dates.map((weekDate) =>
            getDailySummary(weekDate).then((rows) => buildAttendanceMetrics(rows, weekDate))
          )
        ).then(aggregateAttendanceMetrics)
      } else if (attendanceFilter === 'monthly') {
        metrics = await Promise.all(
          getMonthDateRange(attendanceMonth).map((monthDate) =>
            getDailySummary(monthDate).then((rows) => buildAttendanceMetrics(rows, monthDate))
          )
        ).then(aggregateAttendanceMetrics)
      }

      if (!shouldUpdate()) return

      setAttendanceMetrics((current) => ({
        ...current,
        [attendanceFilter]: metrics || createEmptyAttendanceMetrics(),
      }))
    } catch (e) {
      if (!shouldUpdate()) return
      setAttendanceMetrics((current) => ({
        ...current,
        [attendanceFilter]: createEmptyAttendanceMetrics(),
      }))
    } finally {
      if (showLoader && shouldUpdate()) setIsAttendanceLoading(false)
    }
  }

  const loadCompanyEmployeeCounts = async (shouldUpdate = () => true, showLoader = true) => {
    if (showLoader) setIsCompanyCountLoading(true)
    try {
      let dailyGroups = []

      if (companyCountFilter === 'daily') {
        const rows = await getDailySummary(companyCountDate)
        dailyGroups = [{ date: companyCountDate, rows }]
      } else if (companyCountFilter === 'weekly') {
        dailyGroups = await Promise.all(
          companyCountWeekRange.dates.map((weekDate) =>
            getDailySummary(weekDate).then((rows) => ({ date: weekDate, rows }))
          )
        )
      } else if (companyCountFilter === 'monthly') {
        dailyGroups = await Promise.all(
          getMonthDateRange(companyCountMonth).map((monthDate) =>
            getDailySummary(monthDate).then((rows) => ({ date: monthDate, rows }))
          )
        )
      }

      if (!shouldUpdate()) return

      setCompanyCountRows(buildCompanyEmployeeCountRows(dailyGroups))
    } catch (e) {
      if (!shouldUpdate()) return
      setCompanyCountRows([])
    } finally {
      if (showLoader && shouldUpdate()) setIsCompanyCountLoading(false)
    }
  }

  const loadCompanyWorkingHours = async (shouldUpdate = () => true, showLoader = true) => {
    if (showLoader) setIsWorkingHoursLoading(true)
    try {
      let dailyGroups = []

      if (workingHoursFilter === 'daily') {
        const sessions = await getWorkSessions({ date: workingHoursDate })
        dailyGroups = [{ date: workingHoursDate, sessions }]
      } else if (workingHoursFilter === 'weekly') {
        dailyGroups = await Promise.all(
          workingHoursWeekRange.dates.map((weekDate) =>
            getWorkSessions({ date: weekDate }).then((sessions) => ({ date: weekDate, sessions }))
          )
        )
      } else if (workingHoursFilter === 'monthly') {
        dailyGroups = await Promise.all(
          getMonthDateRange(workingHoursMonth).map((monthDate) =>
            getWorkSessions({ date: monthDate }).then((sessions) => ({ date: monthDate, sessions }))
          )
        )
      }

      if (!shouldUpdate()) return

      setWorkingHoursRows(buildCompanyWorkingHourRows(dailyGroups))
    } catch (e) {
      if (!shouldUpdate()) return
      setWorkingHoursRows([])
    } finally {
      if (showLoader && shouldUpdate()) setIsWorkingHoursLoading(false)
    }
  }

  const loadProcessWorkingHours = async (shouldUpdate = () => true, showLoader = true) => {
    if (showLoader) setIsProcessHoursLoading(true)
    try {
      let dailyGroups = []

      if (processHoursFilter === 'daily') {
        const sessions = await getWorkSessions({ date: processHoursDate })
        dailyGroups = [{ date: processHoursDate, sessions }]
      } else if (processHoursFilter === 'weekly') {
        dailyGroups = await Promise.all(
          processHoursWeekRange.dates.map((weekDate) =>
            getWorkSessions({ date: weekDate }).then((sessions) => ({ date: weekDate, sessions }))
          )
        )
      } else if (processHoursFilter === 'monthly') {
        dailyGroups = await Promise.all(
          getMonthDateRange(processHoursMonth).map((monthDate) =>
            getWorkSessions({ date: monthDate }).then((sessions) => ({ date: monthDate, sessions }))
          )
        )
      }

      if (!shouldUpdate()) return

      setProcessHoursRows(buildProcessWorkingHourRows(dailyGroups))
    } catch (e) {
      if (!shouldUpdate()) return
      setProcessHoursRows([])
    } finally {
      if (showLoader && shouldUpdate()) setIsProcessHoursLoading(false)
    }
  }

  const loadDailyIdleHighlights = async (shouldUpdate = () => true, showLoader = true) => {
    if (showLoader) setIsIdleHighlightsLoading(true)
    try {
      const rows = await getPublicEmployeeDailyIdleTime(idleHighlightsDate)

      if (!shouldUpdate()) return

      setDailyIdleRows(Array.isArray(rows) ? rows : [])
    } catch (e) {
      if (!shouldUpdate()) return
      setDailyIdleRows([])
    } finally {
      if (showLoader && shouldUpdate()) setIsIdleHighlightsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    const shouldUpdate = () => isMounted

    load(shouldUpdate)
    const refreshInterval = window.setInterval(() => {
      if (isDailyDatePickerActive.current) return
      load(shouldUpdate, false)
    }, 60000)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
    }
  }, [date, month, week])

  useEffect(() => {
    let isMounted = true
    const shouldUpdate = () => isMounted

    loadEmployeeAttendance(shouldUpdate)
    const refreshInterval = window.setInterval(() => {
      loadEmployeeAttendance(shouldUpdate, false)
    }, 60000)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
    }
  }, [attendanceDate, attendanceFilter, attendanceMonth, attendanceWeek])

  useEffect(() => {
    let isMounted = true
    const shouldUpdate = () => isMounted

    loadCompanyEmployeeCounts(shouldUpdate)
    const refreshInterval = window.setInterval(() => {
      loadCompanyEmployeeCounts(shouldUpdate, false)
    }, 60000)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
    }
  }, [companyCountDate, companyCountFilter, companyCountMonth, companyCountWeek])

  useEffect(() => {
    let isMounted = true
    const shouldUpdate = () => isMounted

    loadCompanyWorkingHours(shouldUpdate)
    const refreshInterval = window.setInterval(() => {
      loadCompanyWorkingHours(shouldUpdate, false)
    }, 60000)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
    }
  }, [workingHoursDate, workingHoursFilter, workingHoursMonth, workingHoursWeek])

  useEffect(() => {
    let isMounted = true
    const shouldUpdate = () => isMounted

    loadProcessWorkingHours(shouldUpdate)
    const refreshInterval = window.setInterval(() => {
      loadProcessWorkingHours(shouldUpdate, false)
    }, 60000)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
    }
  }, [processHoursDate, processHoursFilter, processHoursMonth, processHoursWeek])

  useEffect(() => {
    let isMounted = true
    const shouldUpdate = () => isMounted

    loadDailyIdleHighlights(shouldUpdate)
    const refreshInterval = window.setInterval(() => {
      loadDailyIdleHighlights(shouldUpdate, false)
    }, 60000)

    return () => {
      isMounted = false
      window.clearInterval(refreshInterval)
    }
  }, [idleHighlightsDate])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="text-xs font-semibold tracking-[0.25em] text-slate-500 uppercase">
              SCAN
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              Employee Efficiency System
            </h1>
            <p className="mt-1 text-slate-600">Public dashboard and analytics</p>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md px-4 py-3 text-sm mb-6">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <Card title="Loading">
            <Spinner />
          </Card>
        ) : (
          <>
            <section className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Daily Workforce Status
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    {formatDisplayDate(date)}
                  </h2>
                </div>
                <p className="text-sm font-medium text-slate-500">
                  Current attendance and In-Transition employee counts
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Check-in Persons"
                  value={checkInCount}
                  caption="Checked in at security"
                  icon={UserCheck}
                  tone="indigo"
                />
                <StatCard
                  title="In-Transition Manpower"
                  value={idleCounts.manpower}
                  caption="Currently In-Transition manpower"
                  icon={Clock}
                  tone="amber"
                />
                <StatCard
                  title="In-Transition Permanent"
                  value={idleCounts.permanent}
                  caption="Currently In-Transition permanent"
                  icon={Users}
                  tone="emerald"
                />
                <StatCard
                  title="In-Transition Casual"
                  value={idleCounts.casual}
                  caption="Currently In-Transition casual"
                  icon={Users}
                  tone="rose"
                />
              </div>
            </section>

            <div className="mt-8 mb-4">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Analytics</h2>
            </div>

            <Card className="p-5" title={null}>
              <div className="mx-auto w-full max-w-6xl">
                <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Common Filter
                    </span>
                  </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[260px_360px_220px_160px] lg:items-end lg:justify-center">
                  <DailyDatePicker
                    value={date}
                    onChange={handleCommonDateChange}
                    isActive={activeFilter === 'daily'}
                    onActivate={() => selectCommonFilter('daily')}
                    onOpenChange={(isOpen) => {
                      isDailyDatePickerActive.current = isOpen
                    }}
                  />
                  <WeekPicker
                    label={`Weekly (${weekRangeLabel})`}
                    value={week}
                    onChange={handleCommonWeekChange}
                    isActive={activeFilter === 'weekly'}
                    onActivate={() => selectCommonFilter('weekly')}
                  />
                  <Input
                    label="Monthly"
                    type="month"
                    value={month}
                    onClick={() => selectCommonFilter('monthly')}
                    onFocus={() => selectCommonFilter('monthly')}
                    onChange={(e) => handleCommonMonthChange(e.target.value)}
                    className={activeFilter === 'monthly' ? activeFilterInputClass : ''}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      load()
                      loadEmployeeAttendance()
                      loadCompanyEmployeeCounts()
                      loadCompanyWorkingHours()
                      loadProcessWorkingHours()
                      loadDailyIdleHighlights()
                    }}
                    disabled={isLoading}
                    className="h-10 w-full"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </Card>

            <div className="mt-6 flex flex-col gap-6">
              <EmployeeAttendancePanel
                view={selectedAttendanceView}
                selectedFilter={attendanceFilter}
                onSelectFilter={setAttendanceFilter}
                attendanceDate={attendanceDate}
                attendanceWeek={attendanceWeek}
                attendanceMonth={attendanceMonth}
                onAttendanceDateChange={setAttendanceDate}
                onAttendanceWeekChange={setAttendanceWeek}
                onAttendanceMonthChange={setAttendanceMonth}
                activeInputClass={activeFilterInputClass}
                isLoading={isAttendanceLoading}
              />

              <CompanyEmployeeCountPanel
                view={selectedCompanyCountView}
                rows={companyCountRows}
                selectedFilter={companyCountFilter}
                onSelectFilter={setCompanyCountFilter}
                companyCountDate={companyCountDate}
                companyCountWeek={companyCountWeek}
                companyCountMonth={companyCountMonth}
                onCompanyCountDateChange={setCompanyCountDate}
                onCompanyCountWeekChange={setCompanyCountWeek}
                onCompanyCountMonthChange={setCompanyCountMonth}
                activeInputClass={activeFilterInputClass}
                isLoading={isCompanyCountLoading}
              />

              <CompanyWorkingHoursPanel
                view={selectedWorkingHoursView}
                rows={workingHoursRows}
                selectedFilter={workingHoursFilter}
                onSelectFilter={setWorkingHoursFilter}
                workingHoursDate={workingHoursDate}
                workingHoursWeek={workingHoursWeek}
                workingHoursMonth={workingHoursMonth}
                onWorkingHoursDateChange={setWorkingHoursDate}
                onWorkingHoursWeekChange={setWorkingHoursWeek}
                onWorkingHoursMonthChange={setWorkingHoursMonth}
                activeInputClass={activeFilterInputClass}
                isLoading={isWorkingHoursLoading}
              />

              <ProcessWorkingHoursPanel
                view={selectedProcessHoursView}
                rows={processHoursRows}
                selectedFilter={processHoursFilter}
                onSelectFilter={setProcessHoursFilter}
                processHoursDate={processHoursDate}
                processHoursWeek={processHoursWeek}
                processHoursMonth={processHoursMonth}
                onProcessHoursDateChange={setProcessHoursDate}
                onProcessHoursWeekChange={setProcessHoursWeek}
                onProcessHoursMonthChange={setProcessHoursMonth}
                activeInputClass={activeFilterInputClass}
                isLoading={isProcessHoursLoading}
              />

              <DailyIdleHighlightsPanel
                date={idleHighlightsDate}
                onDateChange={setIdleHighlightsDate}
                summary={dailyIdleSummary}
                isLoading={isIdleHighlightsLoading}
              />

            </div>
          </>
        )}
      </div>
    </div>
  )
}
