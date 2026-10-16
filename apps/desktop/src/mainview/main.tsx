import './index.css'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'

import App from '~/App'
import { Toaster } from '~/components/ui/sonner'
import { Spinner } from '~/components/ui/spinner'
import { TooltipProvider } from '~/components/ui/tooltip'

const rootElement = document.querySelector('#root')

if (!rootElement) {
  throw new Error('Root element not found')
}

document.addEventListener('contextmenu', event => event.preventDefault())

createRoot(rootElement).render(
  <StrictMode>
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="text-muted-foreground size-6" />
        </div>
      }
    >
      <TooltipProvider>
        <App />
      </TooltipProvider>
    </Suspense>
    <Toaster position="bottom-center" />
  </StrictMode>
)
