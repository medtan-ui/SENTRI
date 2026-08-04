import React from 'react'
import Icon from '../../../../components/Icon/Icon'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../../../../components/Layout/DashboardLayout'
import Card from '../../../../components/Card/Card'
import Button from '../../../../components/Button/Button'
import ModuleAccessGuard from '../../../../components/ModuleAccessGuard/ModuleAccessGuard'
import AssessmentGate from '../../../../components/AssessmentGate/AssessmentGate'
import { useModuleAssessment } from '../../../../hooks/useModuleAssessment'
import styles from './StudentPostTestPage.module.css'

/**
 * StudentPostTestPage — /student/modules/:moduleId/post-test
 *
 * The other half of the pre-test. A student answers the same items again
 * after finishing the module's quiz, and the difference between the two
 * is what makes "did awareness actually improve?" a measurable claim
 * rather than an assumption. Without this page there is no post
 * measurement, and no normalized gain to report.
 *
 * Not a gate in the blocking sense: the module is already complete by the
 * time a student arrives here (submitting the quiz completes it), so this
 * is a final, optional-feeling step reached from the quiz result screen
 * and from the progress page. Reusing AssessmentGate keeps it visually
 * identical to the pre-test, which matters — the two measurements should
 * feel like the same instrument, because they are.
 */
export default function StudentPostTestPage() {
  const { moduleId } = useParams()
  const navigate = useNavigate()
  const { status, errorMessage, retry, assessment, completed, eligible, submitting, submit } =
    useModuleAssessment(moduleId, 'posttest')

  function renderContent() {
    if (status === 'success' && !eligible) {
      return (
        <Card className={styles.stateCard}>
          <span className={styles.stateIcon} data-tone="locked" aria-hidden="true"><Icon name="lock" size={26} strokeWidth={1.6} /></span>
          <h1 className={styles.stateTitle}>Post-Test Not Available Yet</h1>
          <p className={styles.stateText}>
            The post-test opens once you've submitted this module's quiz.
          </p>
          <Button variant="primary" onClick={() => navigate(`/student/modules/${moduleId}/quiz`)}>
            Go to the Quiz
          </Button>
        </Card>
      )
    }

    if (status === 'success' && completed) {
      return (
        <Card className={styles.stateCard}>
          <span className={styles.stateIcon} data-tone="done" aria-hidden="true"><Icon name="check" size={26} strokeWidth={1.6} /></span>
          <h1 className={styles.stateTitle}>Post-Test Already Completed</h1>
          <p className={styles.stateText}>
            You've already taken this module's post-test. It's a one-time measurement, and your
            before-and-after comparison is on your Progress page.
          </p>
          <div className={styles.actions}>
            <Button variant="ghost" onClick={() => navigate('/student/progress')}>View My Progress</Button>
            <Button variant="primary" onClick={() => navigate('/student/dashboard')}>Return to Dashboard</Button>
          </div>
        </Card>
      )
    }

    return (
      <AssessmentGate
        variant="posttest"
        status={status}
        errorMessage={errorMessage}
        retry={retry}
        assessment={assessment}
        submitting={submitting}
        onSubmit={submit}
        onContinue={() => navigate('/student/dashboard')}
      />
    )
  }

  return (
    <DashboardLayout role="student">
      <div className={styles.page}>
        <ModuleAccessGuard moduleId={moduleId} require="quiz">
          {renderContent()}
        </ModuleAccessGuard>
      </div>
    </DashboardLayout>
  )
}
