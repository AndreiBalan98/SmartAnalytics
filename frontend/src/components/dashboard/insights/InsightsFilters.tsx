/**
 * InsightsFilters Component
 * 4 multi-select dropdowns + time range selector for insights
 */

'use client'

import { useState } from 'react'

interface InsightsFiltersProps {
  accounts: Array<{ id: string; name: string }>
  campaigns: Array<{ id: string; name: string }>
  adsets: Array<{ id: string; name: string }>
  ads: Array<{ id: string; name: string }>
  selectedAccounts: string[]
  selectedCampaigns: string[]
  selectedAdSets: string[]
  selectedAds: string[]
  onSelectAccounts: (ids: string[]) => void
  onSelectCampaigns: (ids: string[]) => void
  onSelectAdSets: (ids: string[]) => void
  onSelectAds: (ids: string[]) => void
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  compareMode: boolean
  onCompareModeChange: (enabled: boolean) => void
  compareStartDate: string
  compareEndDate: string
  onCompareStartDateChange: (date: string) => void
  onCompareEndDateChange: (date: string) => void
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
  compareMode,
  onCompareModeChange,
  compareStartDate,
  compareEndDate,
  onCompareStartDateChange,
  onCompareEndDateChange,
}: InsightsFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  const MultiSelectDropdown = ({
    label,
    name,
    options,
    selectedIds,
    onSelect,
    disabled,
  }: {
    label: string
    name: string
    options: Array<{ id: string; name: string }>
    selectedIds: string[]
    onSelect: (ids: string[]) => void
    disabled?: boolean
  }) => {
    const isOpen = openDropdown === name

    const toggleItem = (id: string) => {
      if (selectedIds.includes(id)) {
        onSelect(selectedIds.filter((x) => x !== id))
      } else {
        onSelect([...selectedIds, id])
      }
    }

    const selectAll = () => {
      onSelect(options.map((o) => o.id))
    }

    const clearAll = () => {
      onSelect([])
    }

    return (
      <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
        <button
          onClick={() => !disabled && toggleDropdown(name)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            backgroundColor: disabled ? '#f3f4f6' : 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            textAlign: 'left',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <span style={{ color: selectedIds.length > 0 ? '#1f2937' : '#9ca3af' }}>
            {selectedIds.length > 0
              ? `${label} (${selectedIds.length})`
              : `Selectează ${label}`}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>▼</span>
        </button>

        {isOpen && !disabled && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.25rem',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 50,
            }}
          >
            {/* Header cu Select All / Clear All */}
            <div
              style={{
                padding: '0.5rem 0.75rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
              }}
            >
              <button
                onClick={selectAll}
                style={{
                  color: '#3b82f6',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Selectează Tot
              </button>
              <button
                onClick={clearAll}
                style={{
                  color: '#ef4444',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                Șterge Tot
              </button>
            </div>

            {/* Lista de opțiuni */}
            {options.length === 0 ? (
              <div
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                }}
              >
                Nu sunt opțiuni disponibile
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selectedIds.includes(option.id)
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleItem(option.id)}
                    style={{
                      padding: '0.625rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#eff6ff' : 'white',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'white'
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: '#3b82f6',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: '#1f2937',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.name}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    )
  }

  // Calculare număr zile pentru period
  const daysDiff =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      : 0

  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {/* Dropdowns Row */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <MultiSelectDropdown
          label="Ad Accounts"
          name="accounts"
          options={accounts}
          selectedIds={selectedAccounts}
          onSelect={onSelectAccounts}
        />
        <MultiSelectDropdown
          label="Campaigns"
          name="campaigns"
          options={campaigns}
          selectedIds={selectedCampaigns}
          onSelect={onSelectCampaigns}
          disabled={selectedAccounts.length === 0}
        />
        <MultiSelectDropdown
          label="Ad Sets"
          name="adsets"
          options={adsets}
          selectedIds={selectedAdSets}
          onSelect={onSelectAdSets}
          disabled={selectedCampaigns.length === 0}
        />
        <MultiSelectDropdown
          label="Ads"
          name="ads"
          options={ads}
          selectedIds={selectedAds}
          onSelect={onSelectAds}
          disabled={selectedAdSets.length === 0}
        />
      </div>

      {/* Time Range Row */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label
            style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}
          >
            Start:
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label
            style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}
          >
            End:
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {daysDiff > 0 && (
          <span
            style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              padding: '0.375rem 0.75rem',
              backgroundColor: '#e0e7ff',
              borderRadius: '12px',
              fontWeight: 600,
            }}
          >
            {daysDiff} zile
          </span>
        )}

        {/* Compare Mode Toggle */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => onCompareModeChange(e.target.checked)}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
                accentColor: '#3b82f6',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>
              Compară cu altă perioadă
            </span>
          </label>
        </div>
      </div>

      {/* Compare Period Row */}
      {compareMode && (
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <span
            style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontWeight: 600,
            }}
          >
            Perioadă de comparație:
          </span>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label
              style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}
            >
              Start:
            </label>
            <input
              type="date"
              value={compareStartDate}
              onChange={(e) => onCompareStartDateChange(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label
              style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}
            >
              End:
            </label>
            <input
              type="date"
              value={compareEndDate}
              onChange={(e) => onCompareEndDateChange(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
