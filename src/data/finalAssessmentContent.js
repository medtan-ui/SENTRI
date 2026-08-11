/**
 * finalAssessmentContent.js
 * The authored seed for SENTRI's single end-of-curriculum assessment —
 * the one test a student takes after finishing all six modules.
 *
 * ── Why this replaced six post-tests ─────────────────────────────────
 * Every module used to end with its own post-test that re-administered
 * that module's pre-test items minutes after its quiz. Six modules meant
 * eighteen separate assessments, three of them per module, two of them
 * identical. This is one test at the end instead, which is both far less
 * testing and a better measure: recall a week later says more about
 * whether something was learned than recall five minutes after reading it.
 *
 * ── Why the questions are not written from scratch ───────────────────
 * The item bank is assembled from the six modules' existing pre-test
 * banks (src/data/modulePretestContent.js) rather than authored fresh.
 * That is what keeps the normalized-gain claim honest: the "after" score
 * is computed from the same questions as the six "before" scores, so
 * Hake's g compares one instrument against itself rather than two
 * different tests. Every item also carries `sourceModuleId`, so per-module
 * and per-topic analysis survives even though the assessment itself is no
 * longer per-module.
 *
 * An admin can freely edit, reorder, or replace these questions in the
 * Final Assessment editor, exactly like a module quiz. Doing so weakens
 * the same-instrument guarantee above, which is why each student's gain
 * is computed and stored once at submit time and never recomputed on read.
 *
 * This is the lazy-seed value src/services/finalAssessmentService.js
 * writes into finalAssessment/config on first read; once seeded, that
 * document is authoritative and this file is never read again.
 */
import { MODULE_PRETESTS } from './modulePretestContent'

/** Curriculum order, so the assembled bank reads in the order studied. */
const MODULE_ORDER = [
  'password-security',
  'phishing-awareness',
  'malware-awareness',
  'safe-browsing',
  'data-privacy',
  'online-safety',
]

/**
 * How many items each module contributes. The pre-test banks hold 5 items
 * each; taking 3 keeps the final assessment at 18 questions — long enough
 * to cover all six modules, short enough that a student actually finishes
 * it in one sitting.
 */
const ITEMS_PER_MODULE = 3

/**
 * A pre-test item, re-shaped into the quiz-style question the final
 * assessment editor and grader expect. The `difficulty` field exists
 * because the admin editor renders it for every question; pre-test items
 * were never tagged with one, so they default to Medium rather than
 * inventing a per-item guess.
 */
function toFinalQuestion(pretestQuestion, moduleId, order) {
  return {
    id: `final-${pretestQuestion.id}`,
    order,
    text: pretestQuestion.text,
    // Deep-copied so an edit to the final assessment can never mutate the
    // pre-test bank this was seeded from — they must stay independent
    // once seeded, or a gain would compare against shifting items.
    choices: pretestQuestion.choices.map((c) => ({ id: `final-${c.id}`, text: c.text })),
    correctChoiceId: `final-${pretestQuestion.correctChoiceId}`,
    explanation: pretestQuestion.explanation,
    difficulty: 'Medium',
    topic: pretestQuestion.topic,
    sourceModuleId: moduleId,
  }
}

function buildQuestions() {
  const questions = []
  MODULE_ORDER.forEach((moduleId) => {
    const bank = MODULE_PRETESTS[moduleId]
    if (!bank) return
    bank.questions.slice(0, ITEMS_PER_MODULE).forEach((q) => {
      questions.push(toFinalQuestion(q, moduleId, questions.length + 1))
    })
  })
  return questions
}

const FINAL_ASSESSMENT_SEED = {
  title: 'SENTRI Final Assessment',
  settings: {
    passingScore: 75,
    // No time limit. There used to be one stored here, but nothing ever
    // enforced it, and an untimed assessment is the right call anyway:
    // this measures retention, not speed.
    instructions:
      'This covers all six modules you have completed. Answer every question to the best of your ability — ' +
      'take your time, there is no rush.',
    available: true,
    attemptsAllowed: 2,
  },
  questions: buildQuestions(),
}

/**
 * getDefaultFinalAssessment
 * The authored seed, never mutated — deep-copied on every call so a
 * caller editing the result can't corrupt it for the next one.
 * @returns {{title:string, settings:object, questions:Array}}
 */
export function getDefaultFinalAssessment() {
  return JSON.parse(JSON.stringify(FINAL_ASSESSMENT_SEED))
}
