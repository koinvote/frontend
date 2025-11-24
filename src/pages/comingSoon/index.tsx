import { useState } from 'react'
import EmailIcon from '@/assets/icons/email.svg?react'
import Logo from '@/assets/logo/logo.svg?react'

const ComingSoon = () => {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [email, setEmail] = useState('')

  const handleSubmit = () => {
    setStatus('submitting')

    setTimeout(() => {
      setStatus('success')
      setEmail('')
    }, 1000)
  }

  const isSubmitting = status === 'submitting'
  const isSuccess = status === 'success'

  return (
    <main className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center px-4">
      <div className="absolute left-1/2 top-6 -translate-x-1/2 flex items-center gap-2">
        <Logo className="h-8 w-auto" />
        <span className="text-xl font-bold text-white">Koinvote</span>
      </div>
      <iframe
        name="ml-subscribe-frame"
        style={{ display: 'none' }}
        title="MailerLite subscribe"
      />

      <div className="w-full max-w-md rounded-xl bg-neutral-950/80 px-6 py-8 shadow-lg">
        <h1 className="mb-3 text-center text-2xl lg:tx-36 font-semibold text-white">
          Coming Soon
        </h1>
        <p className="text-center text--base lg:tx-20 leading-relaxed text-neutral-300">
          A forum powered by Bitcoin holders
          <br />
          Your Bitcoin balance amplifies your voice
        </p>

        {!isSuccess ? (
          <>
            <form
              className="mt-6 flex flex-col gap-3"
              action="https://assets.mailerlite.com/jsonp/1940062/forms/171914483564807238/subscribe"
              method="post"
              target="ml-subscribe-frame"
              onSubmit={handleSubmit}
            >
              <div className="relative w-full">
                <EmailIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <input
                  aria-label="Email"
                  aria-required="true"
                  type="email"
                  name="fields[email]"
                  required
                  autoComplete="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-11 pr-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
                />
              </div>

              <input type="hidden" name="ml-submit" value="1" />
              <input type="hidden" name="anticsrf" value="true" />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#4A5565] px-6 py-3 text-base font-semibold 
                text-[#171717] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
            
          </>
        ) : (
          <div className="mt-6 text-center">
            <h2 className="text-xl font-semibold text-white">Thank you!</h2>
            <p className="mt-2 text-sm text-neutral-300">
              You have successfully joined our subscriber list.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

export default ComingSoon
