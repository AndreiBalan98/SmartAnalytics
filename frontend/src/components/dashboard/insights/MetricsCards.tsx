/**
 * MetricsCards Component
 * 7 metric cards with TOP performers
 */

'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/currency'

interface TopPerformer {
  entityId: string
  entityName: string
  entityType: string
  value: number
}

interface MetricCardData {
  label: string
  icon: string
  color: string
  description: string
  topPerformers: TopPerformer[]
  valueFormatter: (value: number) => string
}

interface MetricsCardsProps {
  topSpend?: TopPerformer[]
  topImpressions?: TopPerformer[]
  topClicks?: TopPerformer[]
  topReach?: TopPerformer[]
  topCTR?: TopPerformer[]
  topCPC?: TopPerformer[]
  topCPM?: TopPerformer[]
  currency: string
}

export default function MetricsCards({
  topSpend,
  topImpressions,
  topClicks,
  topReach,
  topCTR,
  topCPC,
  topCPM,
  currency,
}: MetricsCardsProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'account':
        return '📊'
      case 'campaign':
        return '🎯'
      case 'adset':
        return '📢'
      case 'ad':
        return '🎨'
      default:
        return '📊'
    }
  }

  const metricDescriptions: { [key: string]: string } = {
    'Total Spend': 'Suma totală cheltuită în perioada selectată',
    'Impressions': 'De câte ori au fost afișate anunțurile',
    'Clicks': 'Numărul total de click-uri pe anunțuri',
    'Reach': 'Numărul de persoane unice care au văzut anunțurile',
    'CTR': 'Click-Through Rate - procentul de impresii care au generat click-uri',
    'CPC': 'Cost Per Click - costul mediu per click',
    'CPM': 'Cost Per Mille - costul per 1000 de impresii',
  }

  const cardsData: MetricCardData[] = [
    {
      label: 'Total Spend',
      icon: '💰',
      color: '#3b82f6',
      description: metricDescriptions['Total Spend'],
      topPerformers: topSpend || [],
      valueFormatter: (v) => formatCurrency(v, currency),
    },
    {
      label: 'Impressions',
      icon: '👁️',
      color: '#10b981',
      description: metricDescriptions['Impressions'],
      topPerformers: topImpressions || [],
      valueFormatter: (v) => Math.floor(v).toLocaleString(),
    },
    {
      label: 'Clicks',
      icon: '🖱️',
      color: '#f59e0b',
      description: metricDescriptions['Clicks'],
      topPerformers: topClicks || [],
      valueFormatter: (v) => Math.floor(v).toLocaleString(),
    },
    {
      label: 'Reach',
      icon: '📢',
      color: '#8b5cf6',
      description: metricDescriptions['Reach'],
      topPerformers: topReach || [],
      valueFormatter: (v) => Math.floor(v).toLocaleString(),
    },
    {
      label: 'CTR',
      icon: '📈',
      color: '#06b6d4',
      description: metricDescriptions['CTR'],
      topPerformers: topCTR || [],
      valueFormatter: (v) => `${v.toFixed(2)}%`,
    },
    {
      label: 'CPC',
      icon: '💵',
      color: '#ec4899',
      description: metricDescriptions['CPC'],
      topPerformers: topCPC || [],
      valueFormatter: (v) => formatCurrency(v, currency),
    },
    {
      label: 'CPM',
      icon: '📊',
      color: '#6366f1',
      description: metricDescriptions['CPM'],
      topPerformers: topCPM || [],
      valueFormatter: (v) => formatCurrency(v, currency),
    },
  ]

  return (
    <div style={{ padding: '1rem 1.5rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
        }}
      >
        {cardsData.map((card, index) => {
          return (
            <div
              key={card.label}
              style={{
                gridColumn: index < 4 ? 'span 1' : 'span 1',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.25rem',
                transition: 'all 0.2s',
                position: 'relative',
                minHeight: '280px',
              }}
            >
              {/* Header cu Icon și Info Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: `2px solid ${card.color}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
                  <span
                    style={{
                      fontSize: '0.875rem',
                      color: '#1f2937',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {card.label}
                  </span>
                </div>
                {/* Info Button */}
                <button
                  onMouseEnter={() => setShowTooltip(card.label)}
                  onMouseLeave={() => setShowTooltip(null)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#e5e7eb',
                    color: '#6b7280',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  i
                  {/* Tooltip */}
                  {showTooltip === card.label && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        backgroundColor: '#1f2937',
                        color: 'white',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        width: '200px',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      {card.description}
                    </div>
                  )}
                </button>
              </div>

              {/* Top Performers List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                }}
              >
                {card.topPerformers.length === 0 ? (
                  <div
                    style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      color: '#9ca3af',
                      fontSize: '0.875rem',
                    }}
                  >
                    Nu sunt date disponibile
                  </div>
                ) : (
                  card.topPerformers.slice(0, 5).map((performer, idx) => (
                    <div
                      key={`${performer.entityId}-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        padding: '0.625rem',
                        backgroundColor: idx === 0 ? '#f0f9ff' : '#f9fafb',
                        borderRadius: '6px',
                        border: idx === 0 ? `1px solid ${card.color}` : '1px solid #e5e7eb',
                      }}
                    >
                      {/* Rank */}
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: idx === 0 ? card.color : '#6b7280',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>

                      {/* Entity Icon */}
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                        {getEntityIcon(performer.entityType)}
                      </span>

                      {/* Entity Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: '#1f2937',
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            lineHeight: '1.3',
                          }}
                        >
                          {performer.entityName}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            color: card.color,
                            marginTop: '0.25rem',
                          }}
                        >
                          {card.valueFormatter(performer.value)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
