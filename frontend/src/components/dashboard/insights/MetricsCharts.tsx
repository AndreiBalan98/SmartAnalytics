/**
 * MetricsCharts Component
 * 7 comparative line charts using Recharts
 */

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getCurrencySymbol } from '@/lib/currency'

interface ChartDataPoint {
  day: number
  [key: string]: string | number
}

interface MetricsChartsProps {
  data: ChartDataPoint[]
  entities: Array<{ id: string; name: string; type: string; start_date?: string; end_date?: string }>
  currency: string
}

export default function MetricsCharts({ data, entities, currency }: MetricsChartsProps) {
  const currencySymbol = getCurrencySymbol(currency)

  // Paleta de culori pentru linii
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#ef4444', // red
    '#6366f1', // indigo
  ]

  const charts = [
    {
      title: `Total Spend (${currency})`,
      dataKey: 'spend',
      valueFormatter: (value: number) => `${currencySymbol}${value.toFixed(2)}`,
    },
    {
      title: 'Total Impressions',
      dataKey: 'impressions',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Total Clicks',
      dataKey: 'clicks',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Total Reach',
      dataKey: 'reach',
      valueFormatter: (value: number) => value.toLocaleString(),
    },
    {
      title: 'CTR (%)',
      dataKey: 'ctr',
      valueFormatter: (value: number) => `${value.toFixed(2)}%`,
    },
    {
      title: `CPC (${currency})`,
      dataKey: 'cpc',
      valueFormatter: (value: number) => `${currencySymbol}${value.toFixed(2)}`,
    },
    {
      title: `CPM (${currency})`,
      dataKey: 'cpm',
      valueFormatter: (value: number) => `${currencySymbol}${value.toFixed(2)}`,
    },
  ]

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#9ca3af',
        }}
      >
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
          Nu sunt date pentru grafice
        </p>
        <p style={{ fontSize: '0.875rem' }}>
          Selectează ad accounts, campaigns, ad sets sau ads pentru a vedea grafice
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '1rem 1.5rem' }}>
      <h3
        style={{
          margin: '0 0 1.5rem 0',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#1f2937',
        }}
      >
        Grafice Comparative
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {charts.map((chart, index) => (
          <div
            key={chart.dataKey}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            <h4
              style={{
                margin: '0 0 1rem 0',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {chart.title}
            </h4>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="day"
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                  tickFormatter={(day) => `Ziua ${day}`}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '0.75rem' }}
                  tickFormatter={chart.valueFormatter}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                  formatter={(value: number | undefined) =>
                    value !== undefined ? chart.valueFormatter(value) : 'N/A'
                  }
                />
                <Legend
                  wrapperStyle={{ fontSize: '0.75rem' }}
                  iconType="line"
                />

                {/* Linii pentru fiecare entity */}
                {entities.map((entity, idx) => {
                  const dataKey = `${chart.dataKey}_${entity.id}`
                  return (
                    <Line
                      key={entity.id}
                      type="monotone"
                      dataKey={dataKey}
                      name={entity.name}
                      stroke={colors[idx % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  )
}
