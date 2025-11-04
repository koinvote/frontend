import LoadingFailIcon from '@/assets/icons/loading-fail.svg'
import { Button } from '@/components/base'

export function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col gap-y-1 items-center mb-4">
        <LoadingFailIcon />
        <h1 className="t-bold">Loading Failed</h1>
        <p className="t-sm text-secondary">Please reload the page and try again</p>
      </div>
      <Button type="secondary" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </div>
  )
}
