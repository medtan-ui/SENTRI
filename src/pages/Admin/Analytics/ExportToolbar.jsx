import React from 'react'
import Button from '../../../components/Button/Button'
import { downloadCsv, isoDateStamp } from '../../../utils/exportCsv'
import {
  activityTrendRows,
  cohortSummaryRows,
  distractorRows,
  itemAnalysisRows,
  moduleBreakdownRows,
  topicMasteryRows,
} from './reportRows'
import styles from './AdminAnalyticsPage.module.css'

/**
 * ExportToolbar
 * The capstone defense needs figures on paper, not only on a screen that
 * might not be projecting. Two paths, both dependency-free:
 *
 *   CSV  — one file per table, from the aggregates already on screen. No
 *          library, no server round trip, and no recomputation, so an
 *          exported number and the number above it are the same number.
 *          One table per file rather than one big sheet, because these
 *          have genuinely different grains: a cohort summary is one row,
 *          item analysis is one row per question, and the distractor
 *          breakdown is one row per choice.
 *   PDF  — the browser's own print dialog against a print stylesheet
 *          (see AdminAnalyticsPage.module.css). "Save as PDF" is a
 *          destination in every modern print dialog, which makes this a
 *          real PDF export without shipping a PDF engine in the bundle.
 *
 * Exports are disabled until the cohort rollup exists, because every file
 * here would otherwise be a header row and nothing else — a blank export
 * that looks like a failed feature rather than like missing data.
 */
export default function ExportToolbar({ cohort, modules, summaries }) {
  const stamp = isoDateStamp()
  const ready = Boolean(cohort)

  function exportFile(name, rows) {
    downloadCsv(`sentri-${name}-${stamp}`, rows)
  }

  return (
    <div className={styles.exportBar} data-print-hide>
      <span className={styles.exportLabel}>Export</span>

      <Button
        size="sm"
        variant="ghost"
        disabled={!ready}
        onClick={() => exportFile('cohort-summary', cohortSummaryRows(cohort))}
      >
        Cohort Summary
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!ready}
        onClick={() => exportFile('module-breakdown', moduleBreakdownRows(cohort))}
      >
        Module Breakdown
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!ready}
        onClick={() => exportFile('topic-mastery', topicMasteryRows(cohort))}
      >
        Topic Mastery
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!ready}
        onClick={() => exportFile('item-analysis', itemAnalysisRows(modules, summaries))}
      >
        Item Analysis
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!ready}
        onClick={() => exportFile('distractor-analysis', distractorRows(modules, summaries))}
      >
        Distractor Analysis
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={!ready}
        onClick={() => exportFile('activity-trend', activityTrendRows(cohort))}
      >
        Activity Trend
      </Button>

      <Button size="sm" variant="primary" disabled={!ready} onClick={() => window.print()}>
        Print / Save as PDF
      </Button>

      {!ready && (
        <span className={styles.exportHint}>
          Refresh the cohort first. There is nothing to export until it has been aggregated.
        </span>
      )}
    </div>
  )
}
