/**
 * validateQuizQuestion.js
 * Pure validation for one question / a whole quiz config. Kept separate
 * from useQuiz (src/hooks/useQuiz.js) so the rules can be reused or unit
 * tested without pulling in React.
 */

/**
 * @param {import('../types/quizConfigAdmin.types').QuizQuestion} question
 * @returns {import('../types/quizConfigAdmin.types').QuestionValidationResult}
 */
export function validateQuestion(question) {
  const issues = []

  if (!question.text || !question.text.trim()) {
    issues.push({ field: 'text', message: 'Question text is empty.' })
  }

  const filledChoices = question.choices.filter((c) => c.text && c.text.trim())
  if (filledChoices.length < 2) {
    issues.push({ field: 'choices', message: 'Less than two choices exist — at least two choices need text.' })
  }

  const correctChoice = question.choices.find((c) => c.id === question.correctChoiceId)
  if (!correctChoice || !correctChoice.text || !correctChoice.text.trim()) {
    issues.push({ field: 'correctChoiceId', message: 'No correct answer selected.' })
  }

  const seen = new Set()
  let hasDuplicate = false
  filledChoices.forEach((c) => {
    const normalized = c.text.trim().toLowerCase()
    if (seen.has(normalized)) hasDuplicate = true
    seen.add(normalized)
  })
  if (hasDuplicate) {
    issues.push({ field: 'choices', message: 'Duplicate choices exist — each choice must be unique.' })
  }

  if (!question.explanation || !question.explanation.trim()) {
    issues.push({ field: 'explanation', message: 'Explanation is empty.' })
  }

  return { questionId: question.id, isValid: issues.length === 0, issues }
}

/**
 * @param {import('../types/quizConfigAdmin.types').QuizConfig} config
 * @returns {import('../types/quizConfigAdmin.types').QuestionValidationResult[]}
 */
export function validateQuizConfig(config) {
  return config.questions.map(validateQuestion)
}
