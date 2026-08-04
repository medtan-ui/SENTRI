import React from 'react'
import Icon from '../Icon/Icon'
import styles from './StreakTrack.module.css'

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * StreakTrack
 * The last seven days as dots, with today at the right.
 *
 * The server stores a streak as two numbers and a date — `currentStreak`
 * and `lastActiveDate` — not a calendar. That is enough: an unbroken run
 * of N days ending on `lastActiveDate` is exactly which days were active,
 * so the week is derived here rather than shipping seven booleans that
 * would only ever restate the same two fields.
 *
 * Days are Asia/Manila days, matching the server's boundary. A student
 * checking in at 11pm and again at 1am should not be told they missed a
 * day because a UTC date rolled over in between.
 *
 * @param {{ currentStreak?: number, longestStreak?: number,
 *   lastActiveDate?: string|null, variant?: 'light'|'dark' }} props
 */
export default function StreakTrack({
  currentStreak = 0,
  longestStreak = 0,
  lastActiveDate = null,
  variant = 'light',
}) {
  const today = manilaDate(new Date())
  const days = lastSevenDays(today)
  const activeDays = activeDaySet(lastActiveDate, currentStreak)
  const activeToday = activeDays.has(today)

  return (
    <div className={styles.track} data-variant={variant}>
      <div className={styles.headline}>
        <span className={styles.flame} data-live={currentStreak > 0 || undefined}>
          <Icon name="flame" size={18} filled={currentStreak > 0} />
        </span>
        <span className={styles.count}>{currentStreak}</span>
        <span className={styles.unit}>{currentStreak === 1 ? 'day streak' : 'day streak'}</span>
      </div>

      <div className={styles.dots}>
        {days.map((date) => {
          const active = activeDays.has(date)
          const isToday = date === today
          return (
            <span key={date} className={styles.day}>
              <span
                className={styles.dot}
                data-active={active || undefined}
                data-today={isToday || undefined}
                title={`${date}${active ? ' · trained' : ''}`}
              />
              <span className={styles.dayLabel}>{DAY_INITIALS[new Date(`${date}T00:00:00Z`).getUTCDay()]}</span>
            </span>
          )
        })}
      </div>

      <p className={styles.caption}>
        {currentStreak === 0
          ? 'Do anything today and your streak starts.'
          : activeToday
            ? `Today is counted. Best run so far: ${longestStreak} ${longestStreak === 1 ? 'day' : 'days'}.`
            : 'Come back today to keep it going.'}
      </p>
    </div>
  )
}

/** `YYYY-MM-DD` in Asia/Manila (fixed UTC+8, no daylight saving since 1978). */
function manilaDate(at) {
  return new Date(at.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function shiftDays(isoDate, delta) {
  const base = new Date(`${isoDate}T00:00:00.000Z`)
  return new Date(base.getTime() + delta * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function lastSevenDays(today) {
  return Array.from({ length: 7 }, (_, i) => shiftDays(today, i - 6))
}

function activeDaySet(lastActiveDate, currentStreak) {
  const days = new Set()
  if (!lastActiveDate || currentStreak <= 0) return days
  for (let i = 0; i < currentStreak; i += 1) {
    days.add(shiftDays(lastActiveDate, -i))
  }
  return days
}
