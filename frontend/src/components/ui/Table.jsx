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
                  key={index}
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
              safeData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {safeColumns.map((col, index) => (
                    <td
                      key={index}
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
              ))
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
