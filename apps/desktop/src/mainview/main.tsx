import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

import App from '~/App'
import { Toaster } from '~/components/ui/sonner'
import { Spinner } from '~/components/ui/spinner'

import './index.css'

const rootElement = document.querySelector('#root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="text-muted-foreground size-6" />
        </div>
      }
    >
      <App />
    </Suspense>
    <Toaster position="bottom-center" />
  </StrictMode>
)
