import React from 'react'
import Icon from '../Icon/Icon'
import styles from './YouTubePlayer.module.css'

const API_SRC = 'https://www.youtube.com/iframe_api'
const API_TIMEOUT_MS = 6000

/** Shared across every tracked player on the page — YouTube's API is a
    single global script that can only be loaded once. */
let apiPromise = null

/**
 * loadYouTubeApi
 * Resolves with window.YT once YouTube's IFrame Player API is ready.
 * Rejects if the script is blocked (an extension, a filtered network) or
 * simply never answers, which is what lets callers fall back instead of
 * trapping a student behind a clip that can never report itself finished.
 * @returns {Promise<object>}
 */
function loadYouTubeApi() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('No DOM available'))
  }
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('YouTube player API timed out')), API_TIMEOUT_MS)
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous()
      clearTimeout(timer)
      resolve(window.YT)
    }
    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const script = document.createElement('script')
      script.src = API_SRC
      script.async = true
      script.onerror = () => {
        clearTimeout(timer)
        reject(new Error('YouTube player API blocked'))
      }
      document.head.appendChild(script)
    }
  })

  // A failure shouldn't poison every later attempt — the next mount gets
  // a fresh try (the script tag itself is only ever added once).
  apiPromise.catch(() => {
    apiPromise = null
  })
  return apiPromise
}

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
 * @param {{ videoId?: string, url?: string, title?: string, autoplay?: boolean,
 *   onEnded?: () => void, onTrackingUnavailable?: () => void }} props
 *   Pass either `videoId` (bare id) or `url` (any YouTube URL) — `url` is
 *   parsed via parseYouTubeId if `videoId` isn't given directly.
 *
 *   `autoplay` asks YouTube to start on its own. Browsers may refuse:
 *   Chrome allows it once the page has real user interaction behind it
 *   (which a scenario always does, the student clicked in to get here),
 *   iOS Safari refuses unmuted autoplay outright. Deliberately NOT muted
 *   to force it through — a narrated clip playing silently is worse than
 *   one waiting on a play press, and the caller pairs this with a visible
 *   "watch this first" line for exactly that case.
 *
 *   Passing `onEnded` switches this to YouTube's IFrame Player API, which
 *   is the only way to know a clip actually finished rather than guessing
 *   with a timer. If that API can't load, or the video itself errors,
 *   `onTrackingUnavailable` fires once and the caller is expected to stop
 *   waiting on a signal that will never come — a student must never be
 *   stuck behind an unplayable clip.
 */
export default function YouTubePlayer({
  videoId,
  url,
  title = 'Video',
  autoplay = false,
  onEnded,
  onTrackingUnavailable,
}) {
  const id = videoId || parseYouTubeId(url)
  const tracked = Boolean(onEnded)
  const hostRef = React.useRef(null)

  // Held in refs so a caller re-rendering (a countdown ticking, say) never
  // tears down and rebuilds the player mid-playback.
  const endedRef = React.useRef(onEnded)
  const unavailableRef = React.useRef(onTrackingUnavailable)
  endedRef.current = onEnded
  unavailableRef.current = onTrackingUnavailable

  React.useEffect(() => {
    if (!tracked || !id) return undefined
    let player = null
    let cancelled = false

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return
        player = new YT.Player(hostRef.current, {
          videoId: id,
          host: 'https://www.youtube-nocookie.com',
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.ENDED) endedRef.current?.()
            },
            // A private, deleted or region-blocked video would otherwise
            // hold the student behind a clip that can never end.
            onError: () => unavailableRef.current?.(),
          },
        })
      })
      .catch(() => {
        if (!cancelled) unavailableRef.current?.()
      })

    return () => {
      cancelled = true
      try {
        player?.destroy()
      } catch {
        // Destroying an iframe that has already gone is not worth a throw.
      }
    }
  }, [tracked, id, autoplay])

  if (!id) {
    return (
      <div className={styles.placeholder} role="img" aria-label="Video coming soon">
        <span className={styles.placeholderIcon} aria-hidden="true"><Icon name="play" size={26} strokeWidth={1.6} /></span>
        <p className={styles.placeholderLabel}>Video coming soon</p>
      </div>
    )
  }

  // The API replaces this host node with its own iframe, which `.frame
  // iframe` in the stylesheet sizes the same way as the plain embed below.
  if (tracked) {
    return (
      <div className={styles.frame}>
        <div ref={hostRef} />
      </div>
    )
  }

  return (
    <div className={styles.frame}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}${autoplay ? '?autoplay=1&playsinline=1&rel=0' : ''}`}
        title={title}
        className={styles.iframe}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
