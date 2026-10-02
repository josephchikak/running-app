import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { useTraining } from '../../app/TrainingContext'
import { InstallHelp } from '../../components/InstallHelp'
import { exportBackup } from '../../storage/backup'

export function SettingsPage () {
  const { isLoading } = useTraining()

  if (isLoading) {
    return <p className='route-loading' role='status'>Opening settings…</p>
  }

  return <SettingsForm />
}

function SettingsForm () {
  const {
    repository,
    settings,
    saveSettings,
    restoreBackup,
    eraseAllData
  } = useTraining()
  const [baseline, setBaseline] = useState(formatFiveKilometreTime(settings.currentFiveKilometreSeconds))
  const [speechEnabled, setSpeechEnabled] = useState(settings.speechEnabled)
  const [vibrationEnabled, setVibrationEnabled] = useState(settings.vibrationEnabled)
  const [message, setMessage] = useState<string | null>(null)
  const [isConfirmingErase, setIsConfirmingErase] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const handleBaselineChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setBaseline(event.target.value), [])
  const handleSpeechChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setSpeechEnabled(event.target.checked), [])
  const handleVibrationChange = useCallback((event: ChangeEvent<HTMLInputElement>) => setVibrationEnabled(event.target.checked), [])
  const handleSave = useCallback(async () => {
    const seconds = parseFiveKilometreTime(baseline)
    if (seconds === null) {
      setMessage('Use minutes and seconds, for example 30:00.')
      return
    }
    await saveSettings({
      units: 'metric',
      currentFiveKilometreSeconds: seconds,
      speechEnabled,
      vibrationEnabled
    })
    setMessage('Settings saved on this phone.')
  }, [baseline, saveSettings, speechEnabled, vibrationEnabled])
  const handleExport = useCallback(async () => {
    try {
      const json = await exportBackup(repository)
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'running-coach-backup.json'
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage('Backup downloaded.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Backup could not be exported.')
    }
  }, [repository])
  const handleImportClick = useCallback(() => fileInput.current?.click(), [])
  const handleImport = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await restoreBackup(await file.text())
      setMessage('Backup restored.')
    } catch {
      setMessage('That backup is invalid or unsupported.')
    }
    event.target.value = ''
  }, [restoreBackup])
  const handleAskErase = useCallback(() => setIsConfirmingErase(true), [])
  const handleCancelErase = useCallback(() => setIsConfirmingErase(false), [])
  const handleErase = useCallback(async () => {
    await eraseAllData()
    setIsConfirmingErase(false)
    setMessage('All local training data was erased.')
  }, [eraseAllData])

  return (
    <section className='page-surface settings-page'>
      <header className='feature-header'><div><p className='page-kicker'>On this phone</p><h1>Settings</h1></div></header>
      <section aria-labelledby='training-settings-title' className='settings-section'>
        <div className='settings-section__heading'>
          <p>01</p>
          <div><h2 id='training-settings-title'>Training</h2><span>Personal pace and coaching cues</span></div>
        </div>
        <label className='settings-field'>
          <span>Current 5K time</span>
          <input aria-describedby='baseline-help' inputMode='numeric' onChange={handleBaselineChange} value={baseline} />
        </label>
        <p className='settings-help' id='baseline-help'>Used only to calculate pace guidance. Effort always wins.</p>
        <div className='settings-control-list'>
          <label className='toggle-row'><span><strong>Spoken cues</strong><small>Hear each step while you run</small></span><input checked={speechEnabled} onChange={handleSpeechChange} role='switch' type='checkbox' /></label>
          <label className='toggle-row'><span><strong>Vibration fallback</strong><small>Feel transitions when audio is unavailable</small></span><input checked={vibrationEnabled} onChange={handleVibrationChange} role='switch' type='checkbox' /></label>
        </div>
        <button className='section-action' onClick={handleSave} type='button'>Save settings</button>
      </section>
      <section aria-labelledby='backup-settings-title' className='settings-section'>
        <div className='settings-section__heading'>
          <p>02</p>
          <div><h2 id='backup-settings-title'>Backup</h2><span>Your plan stays under your control</span></div>
        </div>
        <p>Move your plan and summaries with one versioned JSON file. Raw routes are never included.</p>
        <div className='button-pair'>
          <button onClick={handleExport} type='button'>Export backup</button>
          <button onClick={handleImportClick} type='button'>Import backup</button>
        </div>
        <input accept='application/json' className='visually-hidden' onChange={handleImport} ref={fileInput} type='file' />
      </section>
      <InstallHelp />
      <section aria-labelledby='about-settings-title' className='settings-section'>
        <div className='settings-section__heading'>
          <p>04</p>
          <div><h2 id='about-settings-title'>About</h2><span>Running Coach · private by design</span></div>
        </div>
        <p>Your workouts and history stay in this browser unless you export a backup.</p>
        <nav aria-label='Legal' className='legal-links'>
          <a href='#/privacy'>Privacy</a>
          <a href='#/terms'>Terms</a>
          <a href='mailto:raytheboffin@gmail.com'>Contact</a>
        </nav>
      </section>
      <section aria-labelledby='erase-settings-title' className='settings-section settings-section--danger'>
        <div className='settings-section__heading'>
          <p>05</p>
          <div><h2 id='erase-settings-title'>Erase data</h2><span>Remove everything stored on this phone</span></div>
        </div>
        {!isConfirmingErase && <button onClick={handleAskErase} type='button'>Erase local data</button>}
        {isConfirmingErase && (
          <div role='alert'>
            <p>This removes your plan and history from this phone. It cannot be undone without a backup.</p>
            <div className='button-pair'>
              <button onClick={handleErase} type='button'>Yes, erase everything</button>
              <button onClick={handleCancelErase} type='button'>Cancel</button>
            </div>
          </div>
        )}
      </section>
      {message && <p className='status-message' role='status'>{message}</p>}
    </section>
  )
}

function formatFiveKilometreTime (seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

function parseFiveKilometreTime (value: string) {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(value.trim())
  if (!match) return null
  const seconds = Number(match[1]) * 60 + Number(match[2])
  return seconds >= 600 && seconds <= 10800 ? seconds : null
}
