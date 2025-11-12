import { Button } from '@/components/base'
import { useNavigate } from 'react-router'

export function ErrorPage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="flex flex-col gap-y-1 items-center mb-4">
        <h1 className="t-bold">Loading Failed</h1>
        <p className="t-sm text-secondary">Please reload the page and try again</p>
      </div>
      <Button appearance="outline" tone="white" 
      onClick={() => navigate('/')}>
        Back To Home
      </Button>
    </div>
  )
}
