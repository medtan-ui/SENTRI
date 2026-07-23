import React from 'react'
import styles from './URLInspector.module.css'

/**
 * URLInspector
 * Module 4's signature teaching device (and the same idea Module 2's
 * address bar taught informally): given any URL string, breaks it into
 * protocol / domain / path with the domain visually dominant and
 * everything else dimmed, plus a one-line caption naming the domain as
 * the only part that determines who you're actually talking to.
 *
 * Pure and presentational — no engine imports, no scenario logic. Used
 * two ways by scenes: as what a focused address bar reveals, and again
 * inside feedback callouts to re-show the URL that mattered.
 */
function parseUrl(urlString) {
  const match = /^([a-z][a-z0-9+.-]*:\/\/)?([^/?#]+)(.*)?$/i.exec(urlString || '')
  if (!match) return { protocol: '', domain: urlString || '', path: '' }
  const [, protocol = '', domain = '', path = ''] = match
  return { protocol, domain, path }
}

export default function URLInspector({ url, className = '' }) {
  const { protocol, domain, path } = parseUrl(url)

  return (
    <div className={`${styles.wrap} ${className}`}>
      <div className={styles.urlLine}>
        {protocol && <span className={styles.dim}>{protocol}</span>}
        <span className={styles.domain}>{domain}</span>
        {path && <span className={styles.dim}>{path}</span>}
      </div>
      <p className={styles.caption}>
        The domain is the only part of this address that determines who you're actually talking to.
      </p>
    </div>
  )
}
