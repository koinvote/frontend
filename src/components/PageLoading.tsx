import { Loading } from '.'

export function PageLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Loading className="w-10 h-10" />
    </div>
  )
}
