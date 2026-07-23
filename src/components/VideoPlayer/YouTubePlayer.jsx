import React from 'react'
import styles from './YouTubePlayer.module.css'

/**
 * parseYouTubeId
 * Accepts a full YouTube URL (watch?v=, youtu.be/, shorts/, embed/) or a
 * bare 11-character video id and returns just the id, or '' if nothing
 * recognizable was found. Lets an admin/dev paste whatever they copied
 * from their browser's address bar without needing to format it first.
 * @param {string} input
 * @returns {string}
 */
export function parseYouTubeId(input) {
  const value = (input || '').trim()
  if (!value) return ''
  if (/^[\w-]{11}$/.test(value)) return value

  try {
    const url = new URL(value)
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1)
    }
    if (url.hostname.includes('youtube.com')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v')
      const match = url.pathname.match(/\/(embed|shorts)\/([\w-]{11})/)
      if (match) return match[2]
    }
  } catch {
    // Not a valid URL — fall through to returning ''.
  }
  return ''
}

/**
 * YouTubePlayer
 * A responsive, fullscreen-capable YouTube embed with a real placeholder
 * state — used everywhere a lesson or scenario video slot exists but no
 * real video has been recorded yet. Never renders a broken iframe: with
 * no usable id, it shows a clean "coming soon" card instead.
 *
 * @param {{ videoId?: string, url?: string, title?: string }} props
 *   Pass either `videoId` (bare id) or `url` (any YouTube URL) — `url` is
 *   parsed via parseYouTubeId if `videoId` isn't given directly.
 */
export default function YouTubePlayer({ videoId, url, title = 'Video' }) {
  const id = videoId || parseYouTubeId(url)

  if (!id) {
    return (
      <div className={styles.placeholder} role="img" aria-label="Video coming soon">
        <span className={styles.placeholderIcon} aria-hidden="true">🎬</span>
        <p className={styles.placeholderLabel}>Video coming soon</p>
      </div>
    )
  }

  return (
    <div className={styles.frame}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        className={styles.iframe}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
