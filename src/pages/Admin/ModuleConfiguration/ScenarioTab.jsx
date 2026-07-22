import React from 'react'
import ScenarioConfigTab from '../../../features/admin/scenario-config/components/ScenarioConfigTab'

/**
 * ScenarioTab
 * Thin wrapper delegating to the Scenario Configuration feature — kept
 * as its own file so ModuleConfigurationPage's tab wiring doesn't need
 * to change beyond this file's contents.
 */
export default function ScenarioTab({ moduleId, moduleName, scenario }) {
  return <ScenarioConfigTab moduleId={moduleId} moduleName={moduleName} overview={scenario} />
}
