import { useState } from 'react'

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
    <main className="flex min-h-[calc(100dvh-200px)] items-center justify-center px-4">
      <iframe
        name="ml-subscribe-frame"
        style={{ display: 'none' }}
        title="MailerLite subscribe"
      />

      <div className="w-full max-w-md rounded-xl bg-neutral-950/80 px-6 py-8 shadow-lg">
        <h1 className="mb-3 text-center text-3xl font-semibold text-white">
          Coming Soon
        </h1>
        <p className="text-center text-sm leading-relaxed text-neutral-300">
          A forum powered by Bitcoin holders
          <br />
          Your Bitcoin balance amplifies your voice
        </p>

        {!isSuccess ? (
          <>
            <form
              className="mt-6 flex flex-col gap-3 sm:flex-row"
              action="https://assets.mailerlite.com/jsonp/1940062/forms/171914483564807238/subscribe"
              method="post"
              target="ml-subscribe-frame"
              onSubmit={handleSubmit}
            >
              <input
                aria-label="Email"
                aria-required="true"
                type="email"
                name="fields[email]"
                required
                autoComplete="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
              />

              <input type="hidden" name="ml-submit" value="1" />
              <input type="hidden" name="anticsrf" value="true" />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {isSubmitting ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>

            <p className="mt-3 text-center text-[11px] text-neutral-500">
              We&apos;ll only email you about KoinVote launch updates.
            </p>
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
