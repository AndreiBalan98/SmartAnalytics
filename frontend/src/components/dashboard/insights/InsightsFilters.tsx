/**
 * InsightsFilters Component - NEW BUTTON-BASED UI
 * 4 buttons that open menus with custom time ranges for each entity
 */

'use client'

import { useState, useEffect, useRef } from 'react'

interface SelectedEntity {
  id: string
  name: string
  customStartDate?: string
  customEndDate?: string
}

interface InsightsFiltersProps {
  accounts: Array<{ id: string; name: string }>
  campaigns: Array<{ id: string; name: string }>
  adsets: Array<{ id: string; name: string }>
  ads: Array<{ id: string; name: string }>
  selectedAccounts: SelectedEntity[]
  selectedCampaigns: SelectedEntity[]
  selectedAdSets: SelectedEntity[]
  selectedAds: SelectedEntity[]
  onSelectAccounts: (entities: SelectedEntity[]) => void
  onSelectCampaigns: (entities: SelectedEntity[]) => void
  onSelectAdSets: (entities: SelectedEntity[]) => void
  onSelectAds: (entities: SelectedEntity[]) => void
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onGenerate: () => void
  loading: boolean
}

export default function InsightsFilters({
  accounts,
  campaigns,
  adsets,
  ads,
  selectedAccounts,
  selectedCampaigns,
  selectedAdSets,
  selectedAds,
  onSelectAccounts,
  onSelectCampaigns,
  onSelectAdSets,
  onSelectAds,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onGenerate,
  loading,
}: InsightsFiltersProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Calculate number of days in general time range
  const daysDiff =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0

  const SelectionButton = ({
    label,
    icon,
    name,
    options,
    selectedEntities,
    onSelect,
  }: {
    label: string
    icon: string
    name: string
    options: Array<{ id: string; name: string }>
    selectedEntities: SelectedEntity[]
    onSelect: (entities: SelectedEntity[]) => void
  }) => {
    const isOpen = openMenu === name
    const count = selectedEntities.length

    const toggleEntity = (option: { id: string; name: string }) => {
      const exists = selectedEntities.find((e) => e.id === option.id)
      if (exists) {
        onSelect(selectedEntities.filter((e) => e.id !== option.id))
      } else {
        onSelect([...selectedEntities, { id: option.id, name: option.name }])
      }
    }

    const updateCustomTimeRange = (
      entityId: string,
      customStartDate: string,
      customEndDate: string
    ) => {
      onSelect(
        selectedEntities.map((e) =>
          e.id === entityId
            ? { ...e, customStartDate, customEndDate }
            : e
        )
      )
    }

    const clearCustomTimeRange = (entityId: string) => {
      onSelect(
        selectedEntities.map((e) =>
          e.id === entityId
            ? { id: e.id, name: e.name }
            : e
        )
      )
    }

    // Calculate date range for custom picker based on general range length
    const calculateCustomEndDate = (customStart: string): string => {
      if (!daysDiff || !customStart) return ''
      const startDate = new Date(customStart)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + daysDiff - 1)
      return endDate.toISOString().split('T')[0]
    }

    return (
      <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
        <button
          onClick={() => setOpenMenu(isOpen ? null : name)}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: count > 0 ? '#eff6ff' : 'white',
            border: count > 0 ? '2px solid #3b82f6' : '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
          onMouseEnter={(e) => {
            if (count === 0) {
              e.currentTarget.style.backgroundColor = '#f9fafb'
              e.currentTarget.style.borderColor = '#9ca3af'
            }
          }}
          onMouseLeave={(e) => {
            if (count === 0) {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.borderColor = '#d1d5db'
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <span
              style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#1f2937',
                flex: 1,
              }}
            >
              {label}
            </span>
            {count > 0 && (
              <span
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {count > 0 ? `${count} selectat${count > 1 ? 'e' : ''}` : 'Click pentru a selecta'}
          </div>
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              maxHeight: '500px',
              overflowY: 'auto',
              zIndex: 50,
            }}
          >
            {options.length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                }}
              >
                Nu sunt opțiuni disponibile
              </div>
            ) : (
              options.map((option) => {
                const selectedEntity = selectedEntities.find((e) => e.id === option.id)
                const isSelected = !!selectedEntity

                return (
                  <div
                    key={option.id}
                    style={{
                      padding: '0.875rem',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: isSelected ? '#f0f9ff' : 'white',
                    }}
                  >
                    {/* Entity selection checkbox */}
                    <div
                      onClick={() => toggleEntity(option)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        marginBottom: isSelected ? '0.75rem' : 0,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#3b82f6',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.875rem',
                          color: '#1f2937',
                          fontWeight: isSelected ? 600 : 400,
                          flex: 1,
                        }}
                        title={option.name}
                      >
                        {option.name}
                      </span>
                    </div>

                    {/* Custom time range selector */}
                    {isSelected && (
                      <div
                        style={{
                          marginLeft: '1.625rem',
                          padding: '0.75rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#374151',
                            marginBottom: '0.5rem',
                          }}
                        >
                          Interval personalizat (opțional)
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            type="date"
                            value={selectedEntity.customStartDate || ''}
                            onChange={(e) => {
                              const customStart = e.target.value
                              const customEnd = calculateCustomEndDate(customStart)
                              updateCustomTimeRange(option.id, customStart, customEnd)
                            }}
                            style={{
                              padding: '0.375rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: '#1f2937',
                            }}
                          />
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>→</span>
                          <input
                            type="date"
                            value={selectedEntity.customEndDate || ''}
                            readOnly
                            disabled
                            style={{
                              padding: '0.375rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              backgroundColor: '#f3f4f6',
                              cursor: 'not-allowed',
                            }}
                          />
                          {selectedEntity.customStartDate && (
                            <>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: '#6b7280',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#e0e7ff',
                                  borderRadius: '8px',
                                  fontWeight: 600,
                                }}
                              >
                                {daysDiff} zile
                              </span>
                              <button
                                onClick={() => clearCustomTimeRange(option.id)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.7rem',
                                  backgroundColor: '#fee2e2',
                                  color: '#991b1b',
                                  border: '1px solid #fecaca',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              >
                                Șterge
                              </button>
                            </>
                          )}
                        </div>
                        {!selectedEntity.customStartDate && (
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.375rem' }}>
                            Folosește interval general: {startDate} → {endDate}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    )
  }

  const hasSelections =
    selectedAccounts.length > 0 ||
    selectedCampaigns.length > 0 ||
    selectedAdSets.length > 0 ||
    selectedAds.length > 0

  const canGenerate = hasSelections && startDate && endDate && !loading

  return (
    <div
      ref={menuRef}
      style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {/* General Time Range */}
      <div
        style={{
          marginBottom: '1rem',
          padding: '0.875rem',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
        }}
      >
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '0.625rem',
          }}
        >
          Interval General
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8125rem', color: '#6b7280' }}>De la:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                color: '#1f2937',
                fontWeight: 500,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Până la:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                color: '#1f2937',
                fontWeight: 500,
              }}
            />
          </div>

          {daysDiff > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#1e40af',
                padding: '0.375rem 0.75rem',
                backgroundColor: '#e0e7ff',
                borderRadius: '12px',
                fontWeight: 600,
              }}
            >
              {daysDiff} zile
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
          Toate intervalele personalizate vor avea aceeași lungime ({daysDiff} zile)
        </div>
      </div>

      {/* Selection Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <SelectionButton
          label="Conturi"
          icon="📊"
          name="accounts"
          options={accounts}
          selectedEntities={selectedAccounts}
          onSelect={onSelectAccounts}
        />
        <SelectionButton
          label="Campanii"
          icon="🎯"
          name="campaigns"
          options={campaigns}
          selectedEntities={selectedCampaigns}
          onSelect={onSelectCampaigns}
        />
        <SelectionButton
          label="Ad Sets"
          icon="📢"
          name="adsets"
          options={adsets}
          selectedEntities={selectedAdSets}
          onSelect={onSelectAdSets}
        />
        <SelectionButton
          label="Ads"
          icon="🎨"
          name="ads"
          options={ads}
          selectedEntities={selectedAds}
          onSelect={onSelectAds}
        />
      </div>

      {/* Generate Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: canGenerate ? '#3b82f6' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            fontSize: '0.9375rem',
            fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: canGenerate ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (canGenerate) {
              e.currentTarget.style.backgroundColor = '#2563eb'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (canGenerate) {
              e.currentTarget.style.backgroundColor = '#3b82f6'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)'
            }
          }}
        >
          {loading ? 'Se încarcă...' : 'Generează Insights'}
        </button>
      </div>
    </div>
  )
}
