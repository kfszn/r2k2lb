'use client'

import { useSyncExternalStore } from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { ShieldAlert } from 'lucide-react'

const COOKIE_NAME = 'r2k2_age_ok'
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const AGE_CHANGE_EVENT = 'r2k2:age-confirmed'
const LEAVE_URL = 'https://www.google.com'

function hasConfirmedAge() {
  return document.cookie.split('; ').some((entry) => entry === `${COOKIE_NAME}=1`)
}

function subscribe(onChange: () => void) {
  window.addEventListener(AGE_CHANGE_EVENT, onChange)
  return () => window.removeEventListener(AGE_CHANGE_EVENT, onChange)
}

function confirmAge() {
  // The preview renders the site in a cross-site iframe, where Lax cookies are dropped.
  const inFrame = window.self !== window.top
  const sameSite = inFrame ? 'SameSite=None; Secure' : 'SameSite=Lax'
  document.cookie = `${COOKIE_NAME}=1; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; ${sameSite}`
  window.dispatchEvent(new Event(AGE_CHANGE_EVENT))
}

export default function AgeGate() {
  // Server snapshot is `false`, so first paint is gated until the cookie is read on the client.
  const confirmed = useSyncExternalStore(subscribe, hasConfirmedAge, () => false)

  return (
    <AlertDialogPrimitive.Root open={!confirmed}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[10000] bg-background/95 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
          onEscapeKeyDown={(event) => event.preventDefault()}
          className="fixed left-1/2 top-1/2 z-[10001] flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-6 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-center shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:p-8"
        >
          <img
            src="/assets/logo.png"
            alt="R2K2 logo"
            className="h-16 w-16 object-contain"
            decoding="async"
          />

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-primary">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-semibold uppercase tracking-widest">
                Age restricted
              </span>
            </div>
            <AlertDialogPrimitive.Title className="text-balance text-2xl font-bold text-foreground">
              Are you 18 or older?
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="text-pretty text-sm leading-relaxed text-muted-foreground">
              This site is about online gambling, leaderboards and rewards. You must be at least 18
              years old, or the legal gambling age where you live, to enter. Please gamble
              responsibly.
            </AlertDialogPrimitive.Description>
          </div>

          <div className="flex w-full flex-col gap-3">
            <AlertDialogPrimitive.Action
              onClick={confirmAge}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              I am 18 or older
            </AlertDialogPrimitive.Action>
            <AlertDialogPrimitive.Cancel
              onClick={() => window.location.assign(LEAVE_URL)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-border bg-transparent px-4 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              I am under 18
            </AlertDialogPrimitive.Cancel>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}
