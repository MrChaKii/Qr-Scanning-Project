import React from 'react'

export function Table({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
}) {
  // Defensive: ensure data and columns are always arrays
  const safeData = Array.isArray(data) ? data : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  const getColumnKey = (col, index) => {
    if (col && (typeof col.key === 'string' || typeof col.key === 'number')) return col.key
    if (col && (typeof col.header === 'string' || typeof col.header === 'number')) return col.header
    if (col && typeof col.accessor === 'string') return col.accessor
    return index
  }

  const getRowKey = (item, index) => {
    const extracted = typeof keyExtractor === 'function' ? keyExtractor(item) : undefined
    if (extracted !== undefined && extracted !== null && extracted !== '') return extracted
    const candidate = item?.id ?? item?._id ?? item?.qrId
    if (candidate !== undefined && candidate !== null && candidate !== '') return candidate
    return index
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-10 bg-slate-100 border-b border-slate-200" />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 border-b border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {safeColumns.map((col, index) => (
                <th
                  key={getColumnKey(col, index)}
                  className={`px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider ${
                    col.className || ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {safeData.length > 0 ? (
              safeData.map((item, rowIndex) => {
                const rowKey = getRowKey(item, rowIndex)
                return (
                <tr
                  key={rowKey}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {safeColumns.map((col, colIndex) => (
                    <td
                      key={`${rowKey}-${getColumnKey(col, colIndex)}`}
                      className={`px-6 py-4 text-sm text-slate-900 ${
                        col.className || ''
                      }`}
                    >
                      {typeof col.accessor === 'function'
                        ? col.accessor(item)
                        : item[col.accessor]}
                    </td>
                  ))}
                </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={safeColumns.length}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
