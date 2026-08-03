import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AssessmentGate from '../src/components/AssessmentGate/AssessmentGate'

/**
 * AssessmentGate is the single form behind both the pre-test and the
 * post-test, so a regression here breaks both ends of the pre/post
 * measurement at once. The behaviours worth pinning are the ones a
 * reviewer can't see by reading the JSX: that submit stays locked until
 * every item is answered, that per-question durations are actually
 * measured and sent, and that the post-test's before/after panel only
 * appears when there is a real pre-test score to compare against.
 */
const assessment = {
  title: 'Password Security — Pre-Test',
  questions: [
    {
      id: 'q1',
      text: 'What makes a password stronger?',
      choices: [
        { id: 'q1c1', text: 'Being long and unique' },
        { id: 'q1c2', text: 'Adding a symbol' },
      ],
    },
    {
      id: 'q2',
      text: 'Is reuse safe?',
      choices: [
        { id: 'q2c1', text: 'Yes' },
        { id: 'q2c2', text: 'No' },
      ],
    },
  ],
}

function renderGate(props = {}) {
  const onSubmit = props.onSubmit || vi.fn().mockResolvedValue({ score: 100, correctCount: 2, total: 2 })
  const onContinue = props.onContinue || vi.fn()
  render(
    <AssessmentGate
      status="success"
      errorMessage=""
      retry={vi.fn()}
      assessment={assessment}
      submitting={false}
      {...props}
      onSubmit={onSubmit}
      onContinue={onContinue}
    />,
  )
  return { onSubmit, onContinue }
}

describe('AssessmentGate', () => {
  it('shows a loading state without rendering questions', () => {
    renderGate({ status: 'loading' })
    expect(screen.queryByText(assessment.questions[0].text)).not.toBeInTheDocument()
  })

  it('surfaces a load failure with a retry affordance', () => {
    const retry = vi.fn()
    render(
      <AssessmentGate
        status="error"
        errorMessage="Network error."
        retry={retry}
        assessment={null}
        submitting={false}
        onSubmit={vi.fn()}
        onContinue={vi.fn()}
      />,
    )
    expect(screen.getByText('Network error.')).toBeInTheDocument()
  })

  it('lets a student continue when no assessment is configured', async () => {
    const { onContinue } = renderGate({ assessment: null })
    await userEvent.click(screen.getByRole('button', { name: /continue to lesson/i }))
    expect(onContinue).toHaveBeenCalled()
  })

  it('keeps submit disabled until every question is answered', async () => {
    renderGate()
    const submit = screen.getByRole('button', { name: /submit pre-test/i })
    expect(submit).toBeDisabled()

    await userEvent.click(screen.getByLabelText('Being long and unique'))
    expect(submit).toBeDisabled()
    expect(screen.getByText('1 of 2 answered')).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('No'))
    expect(submit).toBeEnabled()
  })

  it('submits the selected answers keyed by question id', async () => {
    const { onSubmit } = renderGate()
    await userEvent.click(screen.getByLabelText('Being long and unique'))
    await userEvent.click(screen.getByLabelText('No'))
    await userEvent.click(screen.getByRole('button', { name: /submit pre-test/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const [answers] = onSubmit.mock.calls[0]
    expect(answers).toEqual({ q1: 'q1c1', q2: 'q2c2' })
  })

  it('sends a measured duration for every answered question', async () => {
    // These durations are what the time-to-answer and fast-wrong/
    // slow-wrong diagnostics are built from — if they silently stop being
    // sent, the metric quietly becomes "no data" rather than failing.
    const { onSubmit } = renderGate()
    await userEvent.click(screen.getByLabelText('Being long and unique'))
    await userEvent.click(screen.getByLabelText('No'))
    await userEvent.click(screen.getByRole('button', { name: /submit pre-test/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const [, durations] = onSubmit.mock.calls[0]
    expect(Object.keys(durations).sort()).toEqual(['q1', 'q2'])
    expect(durations.q1).toBeGreaterThanOrEqual(0)
  })

  it('shows the result instead of the form once submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ score: 50, correctCount: 1, total: 2 })
    renderGate({ onSubmit })
    await userEvent.click(screen.getByLabelText('Adding a symbol'))
    await userEvent.click(screen.getByLabelText('No'))
    await userEvent.click(screen.getByRole('button', { name: /submit pre-test/i }))

    expect(await screen.findByText('Pre-Test Complete')).toBeInTheDocument()
    expect(screen.getByText(/You answered 1 of 2 correctly \(50%\)/)).toBeInTheDocument()
    expect(screen.queryByText(assessment.questions[0].text)).not.toBeInTheDocument()
  })

  it('keeps the form on screen when submitting fails, so answers are not lost', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error.'))
    renderGate({ onSubmit })
    await userEvent.click(screen.getByLabelText('Being long and unique'))
    await userEvent.click(screen.getByLabelText('No'))
    await userEvent.click(screen.getByRole('button', { name: /submit pre-test/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Network error.')
    expect(screen.getByText(assessment.questions[0].text)).toBeInTheDocument()
  })

  it('uses post-test wording in the post-test variant', () => {
    renderGate({ variant: 'posttest' })
    expect(screen.getByRole('button', { name: /submit post-test/i })).toBeInTheDocument()
    expect(screen.getByText(/same 2 questions you answered before the lesson/i)).toBeInTheDocument()
  })

  it('shows the before/after comparison on a post-test result', async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValue({ score: 80, correctCount: 4, total: 5, preTestScore: 40, normalizedGain: 0.67 })
    renderGate({ variant: 'posttest', onSubmit })
    await userEvent.click(screen.getByLabelText('Being long and unique'))
    await userEvent.click(screen.getByLabelText('No'))
    await userEvent.click(screen.getByRole('button', { name: /submit post-test/i }))

    expect(await screen.findByText('Post-Test Complete')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText(/40 percentage points better/)).toBeInTheDocument()
  })

  it('omits the comparison when there is no pre-test score to compare against', async () => {
    // A student who somehow reached the post-test without a pre-test must
    // not be shown a fabricated "before" figure.
    const onSubmit = vi.fn().mockResolvedValue({ score: 80, correctCount: 4, total: 5, preTestScore: null })
    renderGate({ variant: 'posttest', onSubmit })
    await userEvent.click(screen.getByLabelText('Being long and unique'))
    await userEvent.click(screen.getByLabelText('No'))
    await userEvent.click(screen.getByRole('button', { name: /submit post-test/i }))

    expect(await screen.findByText('Post-Test Complete')).toBeInTheDocument()
    expect(screen.queryByText('Before')).not.toBeInTheDocument()
  })
})
