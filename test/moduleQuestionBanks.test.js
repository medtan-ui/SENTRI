import {describe,it,expect} from 'vitest'
import {MODULE_PRETESTS} from '../src/data/modulePretestContent'
import {getDefaultQuizConfig} from '../src/features/admin/quiz-config/services/quizConfigService'
import banks from '../functions/src/shared/moduleQuestionBanks.json'
import {expandModuleBank} from '../functions/src/shared/expandModuleBank'

describe.each(Object.keys(MODULE_PRETESTS))('%s question banks', moduleId => {
  it.each(['pretest','quiz'])('%s expands legacy questions and preserves authored answers', kind => {
    const full = kind === 'pretest' ? MODULE_PRETESTS[moduleId] : getDefaultQuizConfig(moduleId)
    const count = kind === 'pretest' ? 8 : 10
    expect(full.questions).toHaveLength(count)
    expect(banks[moduleId][kind]).toEqual(full.questions)
    const legacy = {...full, questions: full.questions.slice(0,5)}
    const expanded = expandModuleBank(legacy,moduleId,kind)
    expect(expanded.questions).toHaveLength(count)
    expect(expanded.questions.slice(0,5)).toEqual(legacy.questions)
    expect(legacy.questions).toHaveLength(5)
    expect(new Set(expanded.questions.map(q=>q.id)).size).toBe(count)
    expect(new Set(expanded.questions.map(q=>q.text)).size).toBe(count)
    for(const q of expanded.questions){
      expect(q.choices).toHaveLength(4)
      expect(q.choices.filter(c=>c.id===q.correctChoiceId)).toHaveLength(1)
      expect(q.explanation).toBeTruthy()
      expect(q.topic).toBeTruthy()
    }
    expect(expandModuleBank(expanded,moduleId,kind)).toEqual(expanded)
    expect(expandModuleBank(full,moduleId,kind)).toEqual(full)
  })
})
