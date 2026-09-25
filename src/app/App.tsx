import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { TrainingProvider } from './TrainingContext'

export function App () {
  return (
    <TrainingProvider>
      <RouterProvider router={router} />
    </TrainingProvider>
  )
}
