import React from 'react'
import ModulePickerGrid from '../../../components/ModulePickerGrid/ModulePickerGrid'

/**
 * ScenarioManagerPage — /admin/scenarios
 * Pick a module, then configure its scenario in ModuleConfigurationPage's
 * Scenario tab (the real editor is ScenarioConfigTab, already there — this
 * page is just the entry point).
 */
export default function ScenarioManagerPage() {
  return (
    <ModulePickerGrid
      title="Scenario Configuration"
      subtitle="Choose a module to configure its Scenario Engine simulation."
      tab="scenario"
      actionLabel="Configure Scenario →"
    />
  )
}
