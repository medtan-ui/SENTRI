import { gradeQuiz } from '../../src/modules/quiz/service'
import { QuizConfig } from '../../src/modules/quiz/models'

function makeQuiz(): QuizConfig {
  return {
    moduleId: 'password-security',
    title: 'Password Security Knowledge Check',
    settings: { passingScore: 80, timeLimitMinutes: 15, instructions: '', available: true },
    questions: [
      {
        id: 'q1',
        order: 1,
        text: 'Q1',
        choices: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }],
        correctChoiceId: 'a',
        explanation: 'because',
        difficulty: 'Easy',
      },
      {
        id: 'q2',
        order: 2,
        text: 'Q2',
        choices: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }],
        correctChoiceId: 'b',
        explanation: 'because',
        difficulty: 'Easy',
      },
      {
        id: 'q3',
        order: 3,
        text: 'Q3',
        choices: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }],
        correctChoiceId: 'a',
        explanation: 'because',
        difficulty: 'Medium',
      },
      {
        id: 'q4',
        order: 4,
        text: 'Q4',
        choices: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }],
        correctChoiceId: 'b',
        explanation: 'because',
        difficulty: 'Medium',
      },
      {
        id: 'q5',
        order: 5,
        text: 'Q5',
        choices: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }],
        correctChoiceId: 'a',
        explanation: 'because',
        difficulty: 'Hard',
      },
    ],
  }
}

describe('modules/quiz/service gradeQuiz', () => {
  it('scores 100% and marks every question correct when every answer matches', () => {
    const quiz = makeQuiz()
    const answers = { q1: 'a', q2: 'b', q3: 'a', q4: 'b', q5: 'a' }
    const result = gradeQuiz(quiz, answers)
    expect(result.score).toBe(100)
    expect(result.correctCount).toBe(5)
    expect(result.total).toBe(5)
    expect(result.perQuestionResults.every((r) => r.correct)).toBe(true)
  })

  it('rounds a partial score and reports which questions were wrong', () => {
    const quiz = makeQuiz()
    // 4 of 5 correct = 80%
    const answers = { q1: 'a', q2: 'b', q3: 'a', q4: 'b', q5: 'b' }
    const result = gradeQuiz(quiz, answers)
    expect(result.score).toBe(80)
    expect(result.correctCount).toBe(4)
    const q5Result = result.perQuestionResults.find((r) => r.questionId === 'q5')
    expect(q5Result?.correct).toBe(false)
    expect(q5Result?.correctChoiceId).toBe('a')
  })

  it('treats an unanswered question as incorrect rather than throwing', () => {
    const quiz = makeQuiz()
    const answers = { q1: 'a' }
    const result = gradeQuiz(quiz, answers)
    expect(result.correctCount).toBe(1)
    expect(result.score).toBe(20)
    const unanswered = result.perQuestionResults.find((r) => r.questionId === 'q2')
    expect(unanswered?.selectedChoiceId).toBeNull()
    expect(unanswered?.correct).toBe(false)
  })

  it('scores 0 for an empty question list without dividing by zero', () => {
    const quiz = makeQuiz()
    quiz.questions = []
    const result = gradeQuiz(quiz, {})
    expect(result.total).toBe(0)
    expect(result.score).toBe(0)
  })
})

describe('pass/fail threshold', () => {
  it('passes at exactly the passing score and fails one point below it', () => {
    const quiz = makeQuiz()
    quiz.settings.passingScore = 80
    const passingAnswers = { q1: 'a', q2: 'b', q3: 'a', q4: 'b', q5: 'b' } // 80%
    const failingAnswers = { q1: 'a', q2: 'b', q3: 'a', q4: 'a', q5: 'b' } // 60%
    expect(gradeQuiz(quiz, passingAnswers).score >= quiz.settings.passingScore).toBe(true)
    expect(gradeQuiz(quiz, failingAnswers).score >= quiz.settings.passingScore).toBe(false)
  })
})
