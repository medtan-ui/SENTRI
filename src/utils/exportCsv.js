/**
 * exportCsv.js
 * Turns already-computed analytics into a file an instructor can hand in,
 * open in Excel, or attach to the capstone documentation.
 *
 * Two deliberate constraints:
 *
 *   No library. A CSV writer is about thirty lines of escaping, and adding
 *   a dependency to the bundle for it would cost more than it saves.
 *
 *   No computation. Every value written here comes from a server-computed
 *   aggregate document, unchanged. The moment an export recalculated
 *   anything, the exported figure and the on-screen figure would be two
 *   derivations of the same statistic, free to disagree.
 */

/**
 * RFC 4180 escaping. A field is quoted whenever it contains a comma,
 * quote, or newline — a module title like "Phishing, and how to spot it"
 * would otherwise silently split into two columns.
 */
function escapeField(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/**
 * Serializes rows (arrays of cells) into CSV text.
 * @param {Array<Array<unknown>>} rows
 * @returns {string}
 */
export function toCsv(rows) {
  return rows.map((row) => row.map(escapeField).join(',')).join('\r\n')
}

/**
 * Triggers a browser download of `rows` as a .csv file.
 *
 * The leading BOM is what makes Excel on Windows read the file as UTF-8
 * rather than the local codepage — without it, a name with an accent in it
 * arrives mangled, which is exactly the kind of thing nobody notices until
 * the report is already printed.
 *
 * @param {string} filename base name, with or without the .csv extension
 * @param {Array<Array<unknown>>} rows
 */
export function downloadCsv(filename, rows) {
  const name = filename.endsWith('.csv') ? filename : `${filename}.csv`
  const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Freed on the next tick rather than immediately: revoking synchronously
  // races the download in some browsers and produces an empty file.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * A filename-safe stamp so repeated exports don't overwrite each other in
 * the downloads folder, and so a printed report can be dated.
 * @param {Date} [date]
 * @returns {string} e.g. "2026-08-03"
 */
export function isoDateStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

