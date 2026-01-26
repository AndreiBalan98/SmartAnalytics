/**
 * MetricsCards Component
 * 7 metric cards: 4 on row 1, 3 on row 2 (same width)
 */

'use client'

import { useState } from 'react'

interface MetricData {
  label: string
  value: string | number
  icon: string
  color: string
  topEntity?: {
    type: string
    name: string
    value: string
  }
  description: string
}

interface MetricsCardsProps {
  metrics: {
    totalSpend: number
    impressions: number
    clicks: number
    reach: number
    ctr: number
    cpc: number
    cpm: number
  }
  topPerformers?: {
    totalSpend?: { type: string; name: string; value: number }
    impressions?: { type: string; name: string; value: number }
    clicks?: { type: string; name: string; value: number }
    reach?: { type: string; name: string; value: number }
    ctr?: { type: string; name: string; value: number }
    cpc?: { type: string; name: string; value: number }
    cpm?: { type: string; name: string; value: number }
  }
}

export default function MetricsCards({ metrics, topPerformers }: MetricsCardsProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
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
    Impressions: 'De câte ori au fost afișate anunțurile',
    Clicks: 'Numărul total de click-uri pe anunțuri',
    Reach: 'Numărul de persoane unice care au văzut anunțurile',
    CTR: 'Click-Through Rate - procentul de impresii care au generat click-uri',
    CPC: 'Cost Per Click - costul mediu per click',
    CPM: 'Cost Per Mille - costul per 1000 de impresii',
  }

  const cardsData: MetricData[] = [
    {
      label: 'Total Spend',
      value: `$${metrics.totalSpend.toFixed(2)}`,
      icon: '💰',
      color: '#3b82f6',
      topEntity: topPerformers?.totalSpend
        ? {
            type: topPerformers.totalSpend.type,
            name: topPerformers.totalSpend.name,
            value: `$${topPerformers.totalSpend.value.toFixed(2)}`,
          }
        : undefined,
      description: metricDescriptions['Total Spend'],
    },
    {
      label: 'Impressions',
      value: metrics.impressions.toLocaleString(),
      icon: '👁️',
      color: '#10b981',
      topEntity: topPerformers?.impressions
        ? {
            type: topPerformers.impressions.type,
            name: topPerformers.impressions.name,
            value: topPerformers.impressions.value.toLocaleString(),
          }
        : undefined,
      description: metricDescriptions['Impressions'],
    },
    {
      label: 'Clicks',
      value: metrics.clicks.toLocaleString(),
      icon: '🖱️',
      color: '#f59e0b',
      topEntity: topPerformers?.clicks
        ? {
            type: topPerformers.clicks.type,
            name: topPerformers.clicks.name,
            value: topPerformers.clicks.value.toLocaleString(),
          }
        : undefined,
      description: metricDescriptions['Clicks'],
    },
    {
      label: 'Reach',
      value: metrics.reach.toLocaleString(),
      icon: '📢',
      color: '#8b5cf6',
      topEntity: topPerformers?.reach
        ? {
            type: topPerformers.reach.type,
            name: topPerformers.reach.name,
            value: topPerformers.reach.value.toLocaleString(),
          }
        : undefined,
      description: metricDescriptions['Reach'],
    },
    {
      label: 'CTR',
      value: `${metrics.ctr.toFixed(2)}%`,
      icon: '📈',
      color: '#06b6d4',
      topEntity: topPerformers?.ctr
        ? {
            type: topPerformers.ctr.type,
            name: topPerformers.ctr.name,
            value: `${topPerformers.ctr.value.toFixed(2)}%`,
          }
        : undefined,
      description: metricDescriptions['CTR'],
    },
    {
      label: 'CPC',
      value: `$${metrics.cpc.toFixed(2)}`,
      icon: '💵',
      color: '#ec4899',
      topEntity: topPerformers?.cpc
        ? {
            type: topPerformers.cpc.type,
            name: topPerformers.cpc.name,
            value: `$${topPerformers.cpc.value.toFixed(2)}`,
          }
        : undefined,
      description: metricDescriptions['CPC'],
    },
    {
      label: 'CPM',
      value: `$${metrics.cpm.toFixed(2)}`,
      icon: '📊',
      color: '#6366f1',
      topEntity: topPerformers?.cpm
        ? {
            type: topPerformers.cpm.type,
            name: topPerformers.cpm.name,
            value: `$${topPerformers.cpm.value.toFixed(2)}`,
          }
        : undefined,
      description: metricDescriptions['CPM'],
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
          const isHovered = hoveredCard === card.label

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
                boxShadow: isHovered ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
                borderColor: isHovered ? card.color : '#e5e7eb',
              }}
              onMouseEnter={() => setHoveredCard(card.label)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Header cu Icon și Info Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {card.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{card.icon}</span>
                  {/* Info Button */}
                  <button
                    onMouseEnter={() => setShowTooltip(card.label)}
                    onMouseLeave={() => setShowTooltip(null)}
                    style={{
                      width: '18px',
                      height: '18px',
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
              </div>

              {/* Value */}
              <div
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  color: card.color,
                  marginBottom: '0.5rem',
                }}
              >
                {card.value}
              </div>

              {/* Top Performer */}
              {card.topEntity && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    padding: '0.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <span>{getEntityIcon(card.topEntity.type)}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {card.topEntity.name}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.6875rem' }}>
                      {card.topEntity.value}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
