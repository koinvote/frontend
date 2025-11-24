// src/pages/comingSoon/index.tsx 之類的路徑

const ComingSoon = () => {
    return (
      <main className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl bg-neutral-950/80 px-6 py-8 shadow-lg">
          <h1 className="mb-3 text-center text-4xl font-semibold text-white">
            Coming Soon
          </h1>
          <p className="text-center text-sm leading-relaxed text-neutral-300">
          A forum powered by Bitcoin holders
            <br />
            Your Bitcoin balance amplifies your voice
          </p>
  
          {/* MailerLite HTML form（改成 JSX + Tailwind） */}
          <form
            className="mt-6 flex flex-col gap-3 sm:flex-row"
            action="https://assets.mailerlite.com/jsonp/1940062/forms/171914483564807238/subscribe"
            method="post"
            target="_blank"
          >
            <input
              aria-label="Email"
              aria-required="true"
              type="email"
              name="fields[email]"
              required
              autoComplete="email"
              placeholder="Enter your email address..."
              className="w-full flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400"
            />
  
            <input type="hidden" name="ml-submit" value="1" />
            <input type="hidden" name="anticsrf" value="true" />
  
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-amber-400 sm:w-auto"
            >
              Subscribe
            </button>
          </form>
  
          <p className="mt-3 text-center text-[11px] text-neutral-500">
            We&apos;ll only email you about KoinVote launch updates.
          </p>
        </div>
      </main>
    )
  }
  
  export default ComingSoon
  