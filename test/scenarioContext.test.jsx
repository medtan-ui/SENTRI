import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ScenarioEngine from '../src/features/scenario/engine/ScenarioEngine'
import ScenarioContextPopup from '../src/features/scenario/engine/ScenarioContextPopup'
import { SCENARIO_CONFIG_REGISTRY } from '../src/features/scenario/configs'
import { recordDecision } from '../src/features/scenario/services/scenarioDecisionService'

vi.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'context-test' } }) }))
vi.mock('../src/features/scenario/services/scenarioDecisionService', () => ({
  recordDecision: vi.fn().mockResolvedValue('decision'), markFeedbackViewed: vi.fn(),
}))

beforeEach(() => {
  sessionStorage.clear()
  recordDecision.mockResolvedValue('decision')
  vi.useFakeTimers()
  // jsdom does not implement the native dialog's top-layer behavior.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.open = true } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.open = false } })
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const scenarios = Object.values(SCENARIO_CONFIG_REGISTRY).flatMap(config =>
  config.scenarios.map(scenario => ({ config, scenario })))

describe('Context for all six modules', () => {
  it.each(scenarios)('$scenario.scenarioId shows its setup only at the interactive and closes without a decision', ({ config, scenario }) => {
    expect(scenario.contextPopup.title).toBeTruthy()
    expect(scenario.contextPopup.narrative).toMatch(/\?$/)
    const single = { ...config, scenarios: [{ ...scenario, videoAvailable: false, materialUrl: null }] }
    render(<ScenarioEngine config={single} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(300))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1300))
    expect(screen.getByRole('dialog', { name: scenario.contextPopup.title })).toHaveTextContent(scenario.contextPopup.narrative)
    fireEvent.click(screen.getByRole('button', { name: /Got it/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(recordDecision).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Continue to Quiz/ })).toBeDisabled()
  })

  it('blocks choices while open, then preserves risky feedback, retry and completion', () => {
    const config = SCENARIO_CONFIG_REGISTRY['data-privacy']
    render(<ScenarioEngine config={{ ...config, scenarios: [config.scenarios[0]] }} />)
    act(() => vi.advanceTimersByTime(300))
    act(() => vi.advanceTimersByTime(1300))
    fireEvent.click(document.querySelector('[data-target-id="join-link"]'))
    expect(recordDecision).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Got it/ }))
    fireEvent.click(document.querySelector('[data-target-id="join-link"]'))
    act(() => vi.advanceTimersByTime(250))
    expect(recordDecision).toHaveBeenCalledWith(expect.objectContaining({ isSafe: false, attemptNumber: 1 }))
    for (let i = 0; i < 5; i++) act(() => vi.advanceTimersByTime(1000))
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(document.querySelector('[data-target-id="post-more"]'))
    fireEvent.click(document.querySelector('[data-target-id="dismiss-post"]'))
    act(() => vi.advanceTimersByTime(250))
    expect(recordDecision).toHaveBeenLastCalledWith(expect.objectContaining({ isSafe: true, attemptNumber: 2 }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    act(() => vi.advanceTimersByTime(600))
    expect(screen.getByText('Simulation complete')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue to Quiz/ })).toBeEnabled()
  })

  it('waits for Start Scenario with a video and does not repeat after replaying it', () => {
    const config = SCENARIO_CONFIG_REGISTRY['phishing-awareness']
    render(<ScenarioEngine config={{ ...config, scenarios: [{ ...config.scenarios[0], videoAvailable: true, materialUrl: '/test.mp4' }] }} />)
    act(() => vi.advanceTimersByTime(300))
    act(() => vi.advanceTimersByTime(10000))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.ended(document.querySelector('video'))
    fireEvent.click(screen.getByRole('button', { name: /Start Scenario/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Close scenario context/ }))
    fireEvent.click(screen.getByRole('button', { name: /Replay Video/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.ended(document.querySelector('video'))
    fireEvent.click(screen.getByRole('button', { name: /Start Scenario/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('introduces each newly visited scene and remembers dismissed scenes on navigation', () => {
    const config = SCENARIO_CONFIG_REGISTRY['data-privacy']
    render(<ScenarioEngine config={config} />)
    act(() => vi.advanceTimersByTime(300))
    act(() => vi.advanceTimersByTime(1300))
    fireEvent.click(screen.getByRole('button', { name: /Got it/ }))
    fireEvent.click(document.querySelector('[data-target-id="post-more"]'))
    fireEvent.click(document.querySelector('[data-target-id="dismiss-post"]'))
    act(() => vi.advanceTimersByTime(250))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    act(() => vi.advanceTimersByTime(600))
    act(() => vi.advanceTimersByTime(300))
    act(() => vi.advanceTimersByTime(1300))
    expect(screen.getByRole('dialog', { name: config.scenarios[1].contextPopup.title })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Got it/ }))
    fireEvent.click(screen.getByRole('button', { name: /Previous Scene/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Context dialog dismissal', () => {
  it('supports Escape cancellation and backdrop clicks without dismissing on its text', () => {
    const onClose = vi.fn()
    render(<ScenarioContextPopup open title="Context" narrative="Read this first." onClose={onClose} />)
    fireEvent.click(screen.getByText('Read this first.'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false, cancelable: true }))
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
