import React, { useState } from 'react'
import BrowserChrome from '../../frames/BrowserChrome'
import URLInspector from '../../frames/URLInspector'
import InteractiveTarget from '../../engine/InteractiveTarget'
import styles from './ResearchSearchScene.module.css'

const SPONSORED_URL = 'papers-free-download.xyz'
const REPOSITORY_URL = 'repository.tip.edu.ph'
const BLOG_URL = 'thesis-vault-blog.info/complete-thesis'

function findChoiceId(scenario, targetName) {
  return scenario.choices.find((c) => c.target === targetName)?.scenario_choice_id
}

/**
 * ResearchSearchScene — Module 4, Scenario 1
 * A search results page for research sources. Three real elements map
 * to choices: a sponsored result promising a mass download (risky), an
 * exact-title-match blog result (risky), and the university's own
 * institutional repository, further down the page (safe). Hovering any
 * result reveals its full URL in the status bar — free information.
 */
export default function ResearchSearchScene({ scenario, interactive, phase, onResolve }) {
  const [hoveredUrl, setHoveredUrl] = useState(null)
  const showCallouts = phase === 'feedback'

  function handleChoice(targetName) {
    if (!interactive) return
    const choiceId = findChoiceId(scenario, targetName)
    if (choiceId) onResolve(choiceId)
  }

  return (
    <div className={styles.scene}>
      <BrowserChrome url="searchweb.com/search?q=research+paper+sources">
        <div className={styles.page}>
          <div className={`${styles.searchBar} ${styles.decorative}`}>
            <span aria-hidden="true">🔍</span>
            <span className={styles.searchQuery}>research paper sources</span>
          </div>
          <div className={`${styles.filterTabs} ${styles.decorative}`}>
            <span className={styles.filterActive}>All</span>
            <span className={styles.filter}>Scholar</span>
            <span className={styles.filter}>News</span>
          </div>

          <div className={styles.resultsColumn}>
            <div
              className={styles.resultGroup}
              onMouseEnter={() => setHoveredUrl(SPONSORED_URL)}
              onMouseLeave={() => setHoveredUrl(null)}
            >
              <InteractiveTarget
                targetId="sponsored-result"
                label="Sponsored result: Download 10,000 Research Papers Free"
                onActivate={() => handleChoice('sponsored-result')}
                disabled={!interactive}
                className={styles.resultWrap}
              >
                <div className={styles.resultCard}>
                  <span className={styles.adTag}>Ad</span>
                  <span className={styles.resultUrl}>{SPONSORED_URL}</span>
                  <span className={styles.resultTitle}>Download 10,000 Research Papers FREE</span>
                  <span className={styles.resultSnippet}>
                    Instant access to a massive archive of academic papers. No sign-up required, download now.
                  </span>
                </div>
              </InteractiveTarget>
              {showCallouts && (
                <URLInspector url={`https://${SPONSORED_URL}`} className={styles.calloutInspector} />
              )}
            </div>

            <div
              className={styles.resultGroup}
              onMouseEnter={() => setHoveredUrl(BLOG_URL)}
              onMouseLeave={() => setHoveredUrl(null)}
            >
              <InteractiveTarget
                targetId="blog-result"
                label="Blog result: Complete Thesis, exact title match"
                onActivate={() => handleChoice('blog-result')}
                disabled={!interactive}
                className={styles.resultWrap}
              >
                <div className={styles.resultCard}>
                  <span className={styles.resultUrl}>{BLOG_URL}</span>
                  <span className={styles.resultTitle}>Complete Thesis — [exact title match]</span>
                  <span className={styles.resultSnippet}>
                    Full text available for download. Matches your search exactly.
                  </span>
                </div>
              </InteractiveTarget>
              {showCallouts && (
                <URLInspector url={`https://${BLOG_URL}`} className={styles.calloutInspector} />
              )}
            </div>

            <div
              className={styles.resultGroup}
              onMouseEnter={() => setHoveredUrl(REPOSITORY_URL)}
              onMouseLeave={() => setHoveredUrl(null)}
            >
              <InteractiveTarget
                targetId="repository-result"
                label="TIP Manila Institutional Repository"
                onActivate={() => handleChoice('repository-result')}
                disabled={!interactive}
                className={styles.resultWrap}
              >
                <div className={styles.resultCard}>
                  <span className={styles.resultUrl}>{REPOSITORY_URL}</span>
                  <span className={styles.resultTitle}>TIP Manila Institutional Repository</span>
                  <span className={styles.resultSnippet}>
                    Official archive of theses, dissertations, and faculty research.
                  </span>
                </div>
              </InteractiveTarget>
            </div>

            <div className={`${styles.pagination} ${styles.decorative}`}>
              <span>‹ Previous</span>
              <span className={styles.pageNumberActive}>1</span>
              <span>2</span>
              <span>Next ›</span>
            </div>
          </div>
        </div>

        {hoveredUrl && <div className={styles.statusBar}>{hoveredUrl}</div>}
      </BrowserChrome>
    </div>
  )
}
