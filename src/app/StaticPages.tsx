export function TodayPage () {
  return (
    <section className='today-page'>
      <header className='page-header'>
        <p className='date-line'>Thursday, 25 September</p>
        <h1>Today</h1>
      </header>
      <div className='pace-rail' aria-hidden='true'>
        <span className='pace-rail__marker pace-rail__marker--active' />
        <span className='pace-rail__line' />
        <span className='pace-rail__marker' />
      </div>
      <div className='today-content'>
        <p className='session-state'>Your training starts here</p>
        <h2>Build back to your fastest 5K</h2>
        <p className='session-summary'>Four runs and two strength sessions each week, guided one step at a time.</p>
        <button className='primary-action' type='button'>Start plan</button>
      </div>
    </section>
  )
}

export function PlaceholderPage ({ title }: { title: string }) {
  return (
    <section className='placeholder-page'>
      <h1>{title}</h1>
    </section>
  )
}
