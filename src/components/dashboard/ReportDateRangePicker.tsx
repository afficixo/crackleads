'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import '@/styles/daterangepicker-bs3.css'

export type ReportDatePreset = {
  label: string
  days: number | 'month' | 'last-month'
  span?: number
}

type ReportDateRangePickerProps = {
  startDate: string
  endDate: string
  presetLabel: string
  presets: readonly ReportDatePreset[]
  anchorRef?: React.RefObject<HTMLElement | null>
  onApply: (start: string, end: string, presetLabel: string) => void
  onCancel: () => void
}

type CalendarCell = {
  day: number
  iso: string
  off: boolean
  disabled: boolean
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

function parseIso(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0, 0)
}

function toIso(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatMini(iso: string) {
  const date = parseIso(iso)
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}.${m}.${date.getFullYear()}`
}

function parseMini(value: string) {
  const matched = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim())
  if (!matched) return null
  const day = Number(matched[1])
  const month = Number(matched[2])
  const year = Number(matched[3])
  const date = new Date(year, month - 1, day, 12, 0, 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return toIso(date)
}

function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })
}

function shiftMonth(year: number, monthIndex: number, delta: number) {
  const date = new Date(year, monthIndex + delta, 1, 12, 0, 0, 0)
  return { year: date.getFullYear(), monthIndex: date.getMonth() }
}

function buildMonthCells(year: number, monthIndex: number): CalendarCell[][] {
  const first = new Date(year, monthIndex, 1, 12, 0, 0, 0)
  const startOffset = first.getDay()
  const gridStart = new Date(year, monthIndex, 1 - startOffset, 12, 0, 0, 0)
  const rows: CalendarCell[][] = []
  for (let week = 0; week < 6; week += 1) {
    const row: CalendarCell[] = []
    for (let day = 0; day < 7; day += 1) {
      const cellDate = new Date(gridStart)
      cellDate.setDate(gridStart.getDate() + week * 7 + day)
      row.push({
        day: cellDate.getDate(),
        iso: toIso(cellDate),
        off: cellDate.getMonth() !== monthIndex,
        disabled: false,
      })
    }
    rows.push(row)
  }
  return rows
}

function rangeFromPreset(preset: ReportDatePreset) {
  const end = new Date()
  end.setHours(12, 0, 0, 0)
  const start = new Date(end)

  if (preset.days === 'month') {
    start.setDate(1)
  } else if (preset.days === 'last-month') {
    start.setMonth(start.getMonth() - 1, 1)
    end.setDate(0)
  } else if (preset.label === 'Yesterday') {
    start.setDate(start.getDate() - 1)
    end.setDate(end.getDate() - 1)
  } else {
    start.setDate(start.getDate() - preset.days)
  }

  return { start: toIso(start), end: toIso(end) }
}

export default function ReportDateRangePicker({
  startDate,
  endDate,
  presetLabel,
  presets,
  anchorRef,
  onApply,
  onCancel,
}: ReportDateRangePickerProps) {
  const [draftStart, setDraftStart] = useState(startDate)
  const [draftEnd, setDraftEnd] = useState(endDate)
  const [activePreset, setActivePreset] = useState(presetLabel)
  const [pickingEnd, setPickingEnd] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState({ top: 97, right: 20 })
  const startMonth = parseIso(startDate)
  const endMonth = parseIso(endDate)
  const [leftMonth, setLeftMonth] = useState({ year: startMonth.getFullYear(), monthIndex: startMonth.getMonth() })
  const [rightMonth, setRightMonth] = useState({ year: endMonth.getFullYear(), monthIndex: endMonth.getMonth() })

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    const updatePosition = () => {
      const anchor = anchorRef?.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      setPosition({
        top: Math.round(rect.bottom + window.scrollY),
        right: Math.max(8, Math.round(window.innerWidth - rect.right)),
      })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [anchorRef])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      const picker = document.querySelector('.daterangepicker')
      const anchor = anchorRef?.current
      if (picker?.contains(target) || anchor?.contains(target)) return
      onCancel()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchend', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchend', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [anchorRef, onCancel])

  useEffect(() => {
    setDraftStart(startDate)
    setDraftEnd(endDate)
    setActivePreset(presetLabel)
    setPickingEnd(false)
    const start = parseIso(startDate)
    const end = parseIso(endDate)
    setLeftMonth({ year: start.getFullYear(), monthIndex: start.getMonth() })
    setRightMonth({ year: end.getFullYear(), monthIndex: end.getMonth() })
  }, [startDate, endDate, presetLabel])

  const leftCells = useMemo(() => buildMonthCells(leftMonth.year, leftMonth.monthIndex), [leftMonth])
  const rightCells = useMemo(() => buildMonthCells(rightMonth.year, rightMonth.monthIndex), [rightMonth])

  const startMs = parseIso(draftStart).getTime()
  const endMs = parseIso(draftEnd).getTime()

  const cellClass = (cell: CalendarCell) => {
    const classes = ['available']
    if (cell.off) classes.push('off')
    if (cell.disabled) classes.push('disabled')
    const ms = parseIso(cell.iso).getTime()
    const isStart = cell.iso === draftStart
    const isEnd = cell.iso === draftEnd
    if (isStart) classes.push('active', 'start-date')
    if (isEnd) classes.push('active', 'end-date')
    if (!isStart && !isEnd && ms > startMs && ms < endMs) classes.push('in-range')
    return classes.join(' ')
  }

  const selectDay = (iso: string) => {
    setActivePreset('Custom Range')
    if (!pickingEnd) {
      setDraftStart(iso)
      setDraftEnd(iso)
      setPickingEnd(true)
      return
    }
    if (parseIso(iso).getTime() < parseIso(draftStart).getTime()) {
      setDraftStart(iso)
      setDraftEnd(draftStart)
    } else {
      setDraftEnd(iso)
    }
    setPickingEnd(false)
  }

  const onPresetClick = (preset: ReportDatePreset | { label: 'Custom Range' }) => {
    if (preset.label === 'Custom Range') {
      setActivePreset('Custom Range')
      return
    }
    const next = rangeFromPreset(preset as ReportDatePreset)
    onApply(next.start, next.end, preset.label)
  }

  const commitMini = (which: 'start' | 'end', value: string) => {
    const parsed = parseMini(value)
    if (!parsed) return
    setActivePreset('Custom Range')
    if (which === 'start') {
      if (parseIso(parsed).getTime() > parseIso(draftEnd).getTime()) {
        setDraftStart(parsed)
        setDraftEnd(parsed)
      } else {
        setDraftStart(parsed)
      }
      const date = parseIso(parsed)
      setLeftMonth({ year: date.getFullYear(), monthIndex: date.getMonth() })
    } else {
      if (parseIso(parsed).getTime() < parseIso(draftStart).getTime()) {
        setDraftStart(parsed)
        setDraftEnd(parsed)
      } else {
        setDraftEnd(parsed)
      }
      const date = parseIso(parsed)
      setRightMonth({ year: date.getFullYear(), monthIndex: date.getMonth() })
    }
  }

  const renderCalendar = (
    side: 'left' | 'right',
    month: { year: number; monthIndex: number },
    cells: CalendarCell[][],
  ) => (
    <div className={`calendar ${side === 'left' ? 'first left' : 'second right'}`}>
      <div className="calendar-date">
        <table className="table-condensed">
          <thead>
            <tr>
              {side === 'left' ? (
                <th
                  className="prev available"
                  onClick={() => setLeftMonth((current) => shiftMonth(current.year, current.monthIndex, -1))}
                >
                  <i className="fa fa-arrow-left" aria-hidden="true" />
                </th>
              ) : (
                <th />
              )}
              <th colSpan={5} className="month">
                {monthLabel(month.year, month.monthIndex)}
              </th>
              <th
                className="next available"
                onClick={() => {
                  if (side === 'left') setLeftMonth((current) => shiftMonth(current.year, current.monthIndex, 1))
                  else setRightMonth((current) => shiftMonth(current.year, current.monthIndex, 1))
                }}
              >
                <i className="fa fa-arrow-right" aria-hidden="true" />
              </th>
            </tr>
            <tr>
              {WEEKDAYS.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cells.map((row, rowIndex) => (
              <tr key={`${side}-r${rowIndex}`}>
                {row.map((cell, colIndex) => (
                  <td
                    key={`${side}-r${rowIndex}c${colIndex}`}
                    className={cellClass(cell)}
                    data-title={`r${rowIndex}c${colIndex}`}
                    onClick={() => {
                      if (cell.disabled) return
                      selectDay(cell.iso)
                    }}
                  >
                    {cell.day}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  if (!mounted) return null

  return createPortal(
    <div
      className="daterangepicker dropdown-menu opensleft show-calendar"
      style={{ display: 'block', top: position.top, right: position.right, left: 'auto' }}
      role="dialog"
      aria-label="Select report date range"
    >
      {renderCalendar('left', leftMonth, leftCells)}
      {renderCalendar('right', rightMonth, rightCells)}
      <div className="ranges">
        <ul>
          {presets.map((preset) => (
            <li
              key={preset.label}
              className={activePreset === preset.label ? 'active' : undefined}
              onClick={() => onPresetClick(preset)}
            >
              {preset.label}
            </li>
          ))}
          <li
            className={activePreset === 'Custom Range' ? 'active' : undefined}
            onClick={() => onPresetClick({ label: 'Custom Range' })}
          >
            Custom Range
          </li>
        </ul>
        <div className="range_inputs">
          <div className="daterangepicker_start_input">
            <label htmlFor="daterangepicker_start">From</label>
            <input
              id="daterangepicker_start"
              className="input-mini"
              type="text"
              name="daterangepicker_start"
              key={`start-${draftStart}`}
              defaultValue={formatMini(draftStart)}
              onBlur={(event) => {
                const next = parseMini(event.target.value)
                if (!next) {
                  event.target.value = formatMini(draftStart)
                  return
                }
                commitMini('start', event.target.value)
              }}
            />
          </div>
          <div className="daterangepicker_end_input">
            <label htmlFor="daterangepicker_end">To</label>
            <input
              id="daterangepicker_end"
              className="input-mini"
              type="text"
              name="daterangepicker_end"
              key={`end-${draftEnd}`}
              defaultValue={formatMini(draftEnd)}
              onBlur={(event) => {
                const next = parseMini(event.target.value)
                if (!next) {
                  event.target.value = formatMini(draftEnd)
                  return
                }
                commitMini('end', event.target.value)
              }}
            />
          </div>
          <button
            type="button"
            className="applyBtn btn btn-sm btn-small btn-primary"
            onClick={() => onApply(draftStart, draftEnd, activePreset === 'Custom Range' ? 'Custom Range' : activePreset)}
          >
            Apply
          </button>
          &nbsp;
          <button type="button" className="cancelBtn btn btn-sm btn-small btn-primary btn-white" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
