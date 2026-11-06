import banks from './moduleQuestionBanks.json'

/** Expand legacy banks without changing saved questions, answers, or settings.
 * Both student delivery and grading use this same deterministic expansion.
 */
export function expandModuleBank<T extends { questions: Array<{ id: string; text: string }> }>(
  config: T | null, moduleId: string, kind: 'pretest' | 'quiz',
): T | null {
  if (!config) return null
  const bank = banks[moduleId as keyof typeof banks]
  const target = kind === 'pretest' ? 8 : 10
  if (!bank || config.questions.length >= target) return config
  const questions = [...config.questions]
  const texts = new Set(questions.map(q => q.text.trim().toLowerCase()))
  for (const [index, question] of bank[kind].entries()) {
    if (questions.length >= target) break
    if (texts.has(question.text.trim().toLowerCase())) continue
    const id = `expanded-${kind}-${moduleId}-${index}`
    if (questions.some(q => q.id === id)) continue
    const choices = question.choices.map((c, i) => ({ ...c, id: `${id}-choice-${i}` }))
    const added = {
      ...question, id, choices, order: questions.length + 1,
      correctChoiceId: choices[question.choices.findIndex(c => c.id === question.correctChoiceId)].id,
    }
    questions.push(added)
    texts.add(question.text.trim().toLowerCase())
  }
  return { ...config, questions } as T
}

