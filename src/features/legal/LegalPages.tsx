interface LegalPageProps {
  type: 'privacy' | 'terms'
}

export function LegalPage ({ type }: LegalPageProps) {
  if (type === 'privacy') {
    return (
      <article className='page-surface legal-page'>
        <p className='page-kicker'>Last updated 27 September 2026</p>
        <h1>Privacy</h1>
        <h2>Your data stays with you</h2>
        <p>Your plan, settings, active checkpoint, and workout summaries are stored only on this device in IndexedDB. There is no account, cloud sync, advertising, or third-party analytics.</p>
        <h2>Location</h2>
        <p>Location is read only while a run is active and visible. Raw GPS coordinates are discarded when the run ends; only distance, duration, pace, and completion details are saved.</p>
        <h2>Cookies and local storage</h2>
        <p>The app uses no tracking cookies. Local storage remembers whether you dismissed the storage notice, and IndexedDB holds your training data.</p>
        <h2>Backups and contact</h2>
        <p>Exported backups are files you control. Questions can be sent to <a href='mailto:raytheboffin@gmail.com'>raytheboffin@gmail.com</a>.</p>
      </article>
    )
  }

  return (
    <article className='page-surface legal-page'>
      <p className='page-kicker'>Personal-use software</p>
      <h1>Terms</h1>
      <h2>Training guidance</h2>
      <p>This app provides a fixed personal running and strength plan. It is not medical advice, diagnosis, coaching certification, or a promise of a particular result.</p>
      <h2>Use it safely</h2>
      <p>Run by effort when heat, terrain, fatigue, or GPS makes pace unreliable. Stop for sharp, worsening, or unusual pain and seek qualified help when appropriate.</p>
      <h2>Technical limits</h2>
      <p>iOS may pause browser location when the app is backgrounded or the screen is locked. Keep the installed app visible during tracked runs and maintain your own backups.</p>
      <h2>Contact</h2>
      <p>Questions: <a href='mailto:raytheboffin@gmail.com'>raytheboffin@gmail.com</a>.</p>
    </article>
  )
}
