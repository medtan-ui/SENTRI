import {it,expect,vi,afterEach} from 'vitest'
import {renderHook,act} from '@testing-library/react'
import {useScenarioEngine} from '../src/features/scenario/engine/useScenarioEngine'
import {SCENARIO_CONFIG_REGISTRY} from '../src/features/scenario/configs'
vi.mock('../src/features/scenario/services/scenarioDecisionService',()=>({recordDecision:vi.fn().mockResolvedValue('decision'),markFeedbackViewed:vi.fn()}))
afterEach(()=>{vi.useRealTimers();sessionStorage.clear()})
for(const config of Object.values(SCENARIO_CONFIG_REGISTRY)) {
 it(`${config.moduleId}: returning after risky feedback allows another choice`,()=>{
  vi.useFakeTimers();sessionStorage.clear()
  const setup=()=>useScenarioEngine(config,'resume-test')
  let hook=renderHook(setup)
  act(()=>vi.advanceTimersByTime(300))
  act(()=>hook.result.current.actions.startScenario())
  const risk=config.scenarios[0].choices.find(c=>!c.isSafeChoice)
  act(()=>hook.result.current.actions.selectChoice(risk.scenarioChoiceId))
  act(()=>vi.advanceTimersByTime(250))
  hook.unmount();hook=renderHook(setup)
  expect(hook.result.current.state).toBe('loading')
  expect(hook.result.current.introWatched).toBe(true)
  expect(hook.result.current.attemptCount).toBe(1)
  expect(hook.result.current.canGoNext).toBe(false)
  act(()=>vi.advanceTimersByTime(300))
  act(()=>hook.result.current.actions.startScenario())
  expect(hook.result.current.state).toBe('paused_interactive')
  const safe=config.scenarios[0].choices.find(c=>c.isSafeChoice)
  act(()=>hook.result.current.actions.selectChoice(safe.scenarioChoiceId))
  act(()=>vi.advanceTimersByTime(250))
  expect(hook.result.current.state).toBe('feedback')
  act(()=>hook.result.current.actions.continueToNext())
  expect(hook.result.current.cleanCalls).toBe(0)
 })
}
