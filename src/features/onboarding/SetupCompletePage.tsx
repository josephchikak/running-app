import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTraining } from '../../app/TrainingContext'
import { workoutCatalog } from '../../data/plans/catalog'

export function SetupCompletePage () {
  const { schedule } = useTraining()
  const navigate = useNavigate()
  const firstSession = useMemo(() => schedule.find(entry => entry.workoutId), [schedule])
  const workout = firstSession?.workoutId ? workoutCatalog[firstSession.workoutId] : undefined
  const handleStart = useCallback(() => {
    navigate(firstSession ? `/workout/${firstSession.id}` : '/')
  }, [firstSession, navigate])
  const handleToday = useCallback(() => navigate('/'), [navigate])

  return (
    <section className='setup-complete page-surface'>
      <p className='page-kicker'>17 weeks · saved on this phone</p>
      <h1>Plan ready</h1>
      <p className='setup-complete__next'>Monday · Easy run</p>
      <h2>{workout?.title ?? 'Easy run · week 1'}</h2>
      <p>{workout?.description ?? 'Start gently and rebuild your rhythm.'}</p>
      <button className='primary-action' onClick={handleStart} type='button'>Start workout</button>
      <button className='text-action' onClick={handleToday} type='button'>Back to Today</button>
    </section>
  )
}
