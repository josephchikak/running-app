export function InstallHelp () {
  return (
    <section aria-labelledby='install-settings-title' className='settings-section settings-section--install'>
      <div className='settings-section__heading'>
        <p>03</p>
        <div><h2 id='install-settings-title'>Install on iPhone</h2><span>Keep it one tap from your next run</span></div>
      </div>
      <ol className='install-steps'>
        <li><span>1</span><p>Open this page in Safari.</p></li>
        <li><span>2</span><p>Tap Share, then Add to Home Screen.</p></li>
        <li><span>3</span><p>Open Running Coach from the new Home Screen icon.</p></li>
      </ol>
      <p>During a tracked run, keep the app visible so iOS can continue foreground GPS and screen wake lock.</p>
    </section>
  )
}
