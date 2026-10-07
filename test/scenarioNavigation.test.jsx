import React from 'react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderHook } from '@testing-library/react'
import { useScenarioEngine } from '../src/features/scenario/engine/useScenarioEngine'
import ScenarioProgress from '../src/features/scenario/engine/ScenarioProgress'
import ScenarioEngine from '../src/features/scenario/engine/ScenarioEngine'
import ScenarioPlayer from '../src/features/scenario/engine/ScenarioPlayer'

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}))

const mockConfig = {
  moduleId: 'test-module',
  moduleTitle: 'Test Module',
  scenarios: [
    {
      scenarioId: 'scene-1',
      scenarioTitle: 'Scene One',
      scene: 'password-prompt',
      videoAvailable: true,
      materialUrl: '/videos/test-scene-1.mp4',
      choices: [
        { scenarioChoiceId: 'c1-safe', isSafeChoice: true, outcomeTitle: 'Safe One' },
        { scenarioChoiceId: 'c1-risk', isSafeChoice: false, outcomeTitle: 'Risky One' },
      ],
    },
    {
      scenarioId: 'scene-2',
      scenarioTitle: 'Scene Two',
      scene: 'account-security',
      videoAvailable: true,
      materialUrl: '/videos/test-scene-2.mp4',
      choices: [
        { scenarioChoiceId: 'c2-safe', isSafeChoice: true, outcomeTitle: 'Safe Two' },
        { scenarioChoiceId: 'c2-risk', isSafeChoice: false, outcomeTitle: 'Risky Two' },
      ],
    },
    {
      scenarioId: 'scene-3',
      scenarioTitle: 'Scene Three',
      scene: 'two-factor',
      videoAvailable: false,
      materialUrl: null,
      choices: [
        { scenarioChoiceId: 'c3-safe', isSafeChoice: true, outcomeTitle: 'Safe Three' },
        { scenarioChoiceId: 'c3-risk', isSafeChoice: false, outcomeTitle: 'Risky Three' },
      ],
    },
  ],
}

describe('Scenario incremental navigation & video playback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('useScenarioEngine transitions through loading and playing on navigation so videos play', () => {
    const { result } = renderHook(() => useScenarioEngine(mockConfig, 'user-1'))

    // Fast-forward initial loading beat into playing
    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current.scenarioIndex).toBe(0)
    expect(result.current.state).toBe('playing')
    expect(result.current.hasIntroClip).toBe(true)

    // User starts scenario
    act(() => {
      result.current.actions.startScenario()
    })
    expect(result.current.state).toBe('paused_interactive')

    // Select safe choice in Scene 1
    act(() => {
      result.current.actions.selectChoice('c1-safe')
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    // Advance to Scene 2
    act(() => {
      result.current.actions.continueToNext()
    })
    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(result.current.scenarioIndex).toBe(1)
    expect(result.current.completedScenarioIds).toContain('scene-1')

    // Go incrementally backwards to Scene 1
    act(() => {
      result.current.actions.goToPrevious()
    })

    expect(result.current.scenarioIndex).toBe(0)
    // It enters loading state so Scene 1 video player will load and play
    expect(result.current.state).toBe('loading')

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current.state).toBe('playing')

    // Go forward to Scene 2
    act(() => {
      result.current.actions.goToNext()
    })

    expect(result.current.scenarioIndex).toBe(1)
    expect(result.current.state).toBe('loading')

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current.state).toBe('playing')
  })

  it('deduplicates cleanCalls when moving back and re-solving scenes', () => {
    const { result } = renderHook(() => useScenarioEngine(mockConfig, 'user-1'))

    act(() => {
      vi.advanceTimersByTime(400)
    })
    act(() => {
      result.current.actions.startScenario()
    })

    // Scene 1 clean
    act(() => {
      result.current.actions.selectChoice('c1-safe')
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    act(() => {
      result.current.actions.continueToNext()
    })
    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(result.current.scenarioIndex).toBe(1)
    expect(result.current.cleanCalls).toBe(1)

    // Go back to Scene 1
    act(() => {
      result.current.actions.goToPrevious()
    })
    act(() => {
      vi.advanceTimersByTime(400)
    })
    act(() => {
      result.current.actions.startScenario()
    })
    expect(result.current.scenarioIndex).toBe(0)

    // Re-resolve Scene 1
    act(() => {
      result.current.actions.selectChoice('c1-safe')
    })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    act(() => {
      result.current.actions.continueToNext()
    })
    act(() => {
      vi.advanceTimersByTime(700)
    })

    // cleanCalls must still be 1, not 2
    expect(result.current.cleanCalls).toBe(1)
  })

  it('ScenarioPlayer video is unmuted by default', () => {
    vi.useRealTimers()
    const { container } = render(
      <ScenarioPlayer
        videoAvailable={true}
        materialUrl="/videos/test-scene.mp4"
        scenarioTitle="Test Scene"
        onStart={vi.fn()}
      />
    )

    const videoEl = container.querySelector('video')
    expect(videoEl).toBeInTheDocument()
    // Should NOT have the muted attribute
    expect(videoEl.hasAttribute('muted')).toBe(false)
    expect(videoEl.muted).toBe(false)
  })

  it('ScenarioProgress renders clickable steps when onSelectScene is provided', async () => {
    vi.useRealTimers()
    const onSelectScene = vi.fn()
    render(
      <ScenarioProgress
        total={3}
        currentIndex={1}
        completedCount={2}
        cleanCalls={1}
        onSelectScene={onSelectScene}
      />
    )

    const sceneButtons = screen.getAllByRole('button', { name: /Scene/i })
    expect(sceneButtons).toHaveLength(3)

    // Click Scene 1 (index 0) to jump back
    await userEvent.click(sceneButtons[0])
    expect(onSelectScene).toHaveBeenCalledWith(0)
  })
})
