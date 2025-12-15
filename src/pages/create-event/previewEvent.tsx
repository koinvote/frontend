import { Link, useLocation, useNavigate } from 'react-router'
import { useMemo, useState } from 'react'
import CircleLeftIcon from '@/assets/icons/circle-left.svg?react'
import { Button } from '@/components/base/Button'
import type { EventType } from '@/api/types'

const FREE_HOURS = 24 // 先用常數，之後從 Admin 設定帶進來

// sessionStorage.removeItem(CREATE_EVENT_DRAFT_KEY)


type PreviewEventState = {
  title: string
  description: string
  hashtag: string
  eventType: EventType            // 'open' | 'single_choice'
  isRewarded: boolean
  rewardBtc?: string
  maxRecipient?: number
  durationHours: number
  refundAddress: string
  options?: string[]
  enablePreheat: boolean
  preheatHours?: number
}

function formatDuration(hours: number): string {
  if (!hours || hours <= 0) return '--'
  if (hours % 24 === 0) {
    const days = hours / 24
    return days === 1 ? '1 day' : `${days} days`
  }
  return `${hours} hours`
}

export default function PreviewEvent() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as PreviewEventState | undefined

  const [agree, setAgree] = useState(false)

  // 如果 user 直接打網址進來，沒有 state，就導回 create-event
  if (!state) {
    return (
      <div className="flex-col flex items-center justify-center w-full">
        <div className="h-[50px] w-full relative">
          <button
            type="button"
            className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
            onClick={() => navigate(-1)}
          >
            <CircleLeftIcon className="w-8 h-8 fill-current" />
          </button>
        </div>
        <div className="w-full max-w-3xl rounded-3xl border border-admin-bg bg-bg px-4 py-6 md:px-8 md:py-8">
          <p className="tx-14 lh-20 text-primary">
            No event data to preview. Please create an event first.
          </p>
          <div className="mt-4">
            <Button
              appearance="solid"
              tone="primary"
              text="sm"
              onClick={() => navigate('/create-event')}
            >
              Back to Create Event
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const {
    title,
    description,
    hashtag,
    eventType,
    isRewarded,
    rewardBtc,
    maxRecipient,
    durationHours,
    refundAddress,
    options = [],
    enablePreheat,
    preheatHours = 0,
  } = state

  // ----- FREE / PAID 判斷 -----
  const { isFree, primaryButtonLabel, headerSubTitle, platformFeeText, preheatFeeText } =
    useMemo(() => {
      const hasPreheat = enablePreheat && preheatHours > 0
      const isDurationWithinFree = !isRewarded && durationHours <= FREE_HOURS

      const free =
        !isRewarded && // 無獎金
        !hasPreheat && // 沒預熱
        isDurationWithinFree // 時數在 FREE_HOURS 內

      const primaryLabel = free ? 'Confirm & Sign' : 'Confirm & Pay'
      const subTitle = free
        ? 'Please review and confirm your event.'
        : 'Please complete your payment'

      // 平台費：現在先用 UI 區分，實際金額之後接後端
      const platformFee = free ? '0' : '--'
      // 預熱費：之後用 API 回傳，先留佔位
      const preheatFee = hasPreheat ? '--' : undefined

      return {
        isFree: free,
        primaryButtonLabel: primaryLabel,
        headerSubTitle: subTitle,
        platformFeeText: platformFee,
        preheatFeeText: preheatFee,
      }
    }, [enablePreheat, preheatHours, isRewarded, durationHours])

  const handlePrimaryClick = () => {
    if (!agree) return

    if (isFree) {
      // TODO: FREE flow → 簽名流程
      // 1. 建立暫存事件 / 簽名 message
      // 2. 要求 user 簽名
      // 3. 送到後端建立事件
      console.log('FREE event → go to signature flow (TODO)')
    } else {
      // TODO: PAID flow → 進付款頁
      // navigate('/payment', { state: {...state, ...金額資訊} })
      console.log('PAID event → go to payment page (TODO)')
    }
  }

  return (
    <div className="flex-col flex items-center justify-center w-full">
      <div className="h-[50px] w-full relative">
        <button
          type="button"
          className="text-black dark:text-white hover:text-admin-text-sub cursor-pointer absolute left-0"
          onClick={() => navigate(-1)}
        >
          <CircleLeftIcon className="w-8 h-8 fill-current" />
        </button>
      </div>

      <div className="w-full max-w-3xl rounded-3xl border border-admin-bg bg-bg px-4 py-6 md:px-8 md:py-8">
        <h1 className="tx-20 lh-24 fw-m text-(--color-orange-500)">Preview Your Event</h1>
        <p className="mt-1 tx-14 lh-20 text-secondary">{headerSubTitle}</p>

        <div className="mt-6 space-y-4">
          {/* Title */}
          <Field label="Title">{title || '--'}</Field>

          {/* Description */}
          <Field label="Description">{description || '--'}</Field>

          {/* Response type */}
          <Field label="Response type">
            {eventType === 'open' ? 'Open-ended' : 'Single choice'}
          </Field>

          {/* Hashtag */}
          <Field label="Hashtag">{hashtag || '--'}</Field>

          {/* Event type / Reward type */}
          <Field label="Event type">{isRewarded ? 'Reward event' : 'No reward'}</Field>

          {/* Reward BTC & Max Recipient（有獎金時才顯示） */}
          {isRewarded && (
            <>
              <Field label="Reward (BTC)">{rewardBtc ? `${rewardBtc} BTC` : '--'}</Field>
              <Field label="Max Recipient">
                {typeof maxRecipient === 'number' ? maxRecipient : '--'}
              </Field>
            </>
          )}

          {/* Single choice options */}
          {eventType === 'single_choice' && options.length > 0 && (
            <Field label="Options">
              <ol className="list-decimal pl-5 space-y-1">
                {options.map((opt, idx) => (
                  <li key={idx} className="tx-14 lh-20 text-primary">
                    {opt || '--'}
                  </li>
                ))}
              </ol>
            </Field>
          )}

          {/* Duration */}
          <Field label="Duration of this event">
            {formatDuration(durationHours)}
          </Field>

          {/* Refund address */}
          <Field label="Refund address">{refundAddress || '--'}</Field>

          {/* Platform fee（只有無獎金事件顯示） */}
          {!isRewarded && (
            <Field label="Platform fee">
              {platformFeeText}
            </Field>
          )}

          {/* Preheat + Preheat fee（有開啟 Preheat 才顯示） */}
          {enablePreheat && preheatHours > 0 && (
            <>
              <Field label="Preheat">{`${preheatHours} hours`}</Field>
              <Field label="Preheat fee">
                {preheatFeeText ?? '--'}
              </Field>
            </>
          )}
          {/* Refund address */}
          <Field label="Refund address">{refundAddress || '--'}</Field>
        </div>

        {/* 同意條款 */}
        <div className="mt-6 pt-4 border-t border-border">
          <label className="flex items-start gap-2 tx-12 lh-18 text-secondary">
            <input
              type="checkbox"
              className="mt-[2px] accent-(--color-orange-500)"
              checked={agree}
              onChange={e => setAgree(e.target.checked)}
            />
            <span>
              By proceeding, you agree to the{' '}
              <Link to="/charges-refunds" className="text-(--color-orange-500) underline">
                Charges and Refund
              </Link>
              ,{' '}
              <Link to="/terms" className="text-(--color-orange-500) underline">
                Terms of Service
              </Link>
              , and{' '}
              <Link to="/privacy" className="text-(--color-orange-500) underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </div>

        {/* 按鈕區塊 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            appearance="outline"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            onClick={() => navigate(-1)}
          >
            Edit Event
          </Button>
          <Button
            type="button"
            appearance="solid"
            tone="primary"
            text="sm"
            className="sm:w-[160px]"
            disabled={!agree}
            onClick={handlePrimaryClick}
          >
            {primaryButtonLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="tx-12 lh-18 text-secondary">{label}</div>
      <div className="tx-14 lh-20 text-primary break-words">{children}</div>
    </div>
  )
}
