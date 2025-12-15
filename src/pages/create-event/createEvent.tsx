import { Link, useNavigate } from 'react-router'
import { type FormEvent, useState, useEffect, type ChangeEvent } from 'react'
import { Tooltip } from 'antd';
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/base/Button'
import CircleLeftIcon from '@/assets/icons/circle-left.svg?react'
import MinusIcon from '@/assets/icons/minus.svg?react'
import PlusIcon from '@/assets/icons/plus.svg?react'
import { cn } from '@/utils/style'

import { API } from '@/api'
import type { CreateEventReq } from '@/api/request'
import type { EventType } from '@/api/types'

import { useTranslation } from 'react-i18next'

type PreviewEventState = {
  creatorAddress: string
  title: string
  description: string
  hashtag: string
  eventType: EventType            // 'open' | 'single_choice'
  isRewarded: boolean
  rewardBtc?: string
  maxRecipient?: number
  durationHours: number
  options?: string[]
  enablePreheat: boolean
  preheatHours?: number
}

type CreateEventDraft = {
  creatorAddress: string
  title: string
  description: string
  hashtags: string
  eventType: EventType
  isRewarded: boolean
  rewardBtc: string
  options: string[]
  durationHours: string
  enablePreheat: boolean
  preheatHours: string
  agree: boolean
}

const CREATE_EVENT_DRAFT_KEY = 'koinvote:create-event-draft'



export default function CreateEvent() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  /** 同意條款 */
  const [agree, setAgree] = useState(false)

  /** 基本文字欄位 */
  const [creatorAddress, setCreatorAddress] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hashtags, setHashtags] = useState('') // 目前 API 還沒用到，先存起來

  /** Minimum duration hours */
  const [minimumDurationHours, setMinimumDurationHours] = useState<number>()

  /** 回覆類型：open / single_choice */
  const [eventType, setEventType] = useState<EventType>('open')

  /** 是否有獎金 */
  const [isRewarded, setIsRewarded] = useState(false)
  const [rewardBtc, setRewardBtc] = useState('') // 使用者輸入的 BTC 字串

  /** 單選題選項 */
  const [options, setOptions] = useState<string[]>([''])

  /** Duration + Preheat */
  const [durationHours, setDurationHours] = useState('') // 用字串綁 input，比較好處理空值
  const [enablePreheat, setEnablePreheat] = useState(false)
  const [preheatHours, setPreheatHours] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem(CREATE_EVENT_DRAFT_KEY)
    if (!saved) return

    try {
      const draft: CreateEventDraft = JSON.parse(saved)

      setCreatorAddress(draft.creatorAddress ?? '')
      setTitle(draft.title ?? '')
      setDescription(draft.description ?? '')
      setHashtags(draft.hashtags ?? '')
      setEventType(draft.eventType ?? 'open')
      setIsRewarded(draft.isRewarded ?? false)
      setRewardBtc(draft.rewardBtc ?? '')
      setOptions(draft.options && draft.options.length ? draft.options : [''])
      setDurationHours(draft.durationHours ?? '')
      setEnablePreheat(draft.enablePreheat ?? false)
      setPreheatHours(draft.preheatHours ?? '')
      setAgree(draft.agree ?? false)
    } catch (e) {
      console.error('Failed to parse create-event draft', e)
    }
  }, [])
  // -------- Creator address handlers --------
  const handleCreatorAddressChange = (e: ChangeEvent<HTMLInputElement>) => {

    //todo when user finish input, check if it is a valid btc address
    //and call Get API to check if there any free ongoing event by this address
    //so if yes, we change minumum duration hour above 25 hours
    setCreatorAddress(e.target.value)
  }

  /** -------- Options handlers -------- */
  const handleOptionChange = (index: number, value: string) => {
    setOptions(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleAddOption = () => {
    setOptions(prev => [...prev, ''])
  }

  const handleRemoveOption = (index: number) => {
    setOptions(prev => prev.filter((_, i) => i !== index))
  }

  /** BTC -> sats 小工具 */
  const btcToSats = (value: string) => {
    const num = Number(value)
    if (!Number.isFinite(num) || num <= 0) return 0
    return Math.round(num * 1e8)
  }

  /** -------- React Query mutation：Create Event -------- */
  // const createEventMutation = useMutation({
  //   mutationFn: (payload: CreateEventReq) => API.createEvent(payload),
  //   onSuccess: res => {
  //     // 之後可以改成導到 Preview / Event Detail 等
  //     console.log('Create event success', res)
  //     navigate(`/preview-event`)

  //     // TODO: 根據實際 flow 改導向位置
  //     // 例如 navigate(`/events/${res.data.event_id}`)
  //   },
  //   onError: error => {
  //     console.error('Create event failed', error)
  //     // TODO: 接 toast 系統顯示錯誤訊息
  //     alert('Failed to create event, please try again.')
  //   },
  // })

  /** -------- Submit handler -------- */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!agree) return

    const duration = Number(durationHours || 0)
    if (!duration || duration <= 0) {
      alert('Please enter a valid duration.')
      return
    }

    const preheat = Number(preheatHours || 0)

    // 單選題的 options，先過濾空白
    let cleanedOptions: string[] | undefined
    if (eventType === 'single_choice') {
      const list = options.map(o => o.trim()).filter(Boolean)
      if (list.length) cleanedOptions = list
    }

    const previewData: PreviewEventState = {
      creatorAddress,
      title: title.trim(),
      description: description.trim(),
      hashtag: hashtags.trim(),
      eventType,
      isRewarded,
      rewardBtc: isRewarded ? rewardBtc : undefined,
      maxRecipient: undefined, // TODO: 之後由後端 or 前端計算
      durationHours: duration,
      options: cleanedOptions,
      enablePreheat,
      preheatHours: enablePreheat && preheat > 0 ? preheat : undefined,
    }

    console.log('PreviewEventState →', previewData)

    navigate('/preview-event', { state: previewData })

    // const initialRewardSatoshi = isRewarded ? btcToSats(rewardBtc) : 0

    // const payload: CreateEventReq = {
    //   title: title.trim(),
    //   description: description.trim(),
    //   event_type: eventType,
    //   event_reward_type: isRewarded ? 'rewarded' : 'non_reward',
    //   initial_reward_satoshi: initialRewardSatoshi,
    //   duration_hours: duration,
    //   // ⚠️ 暫時先用固定值測試，之後會從 Payment Page 的 refund address 帶入
    //   refund_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    // }

    // // 單選題才帶 options，順便過濾空字串
    // if (eventType === 'single_choice') {
    //   const cleanedOptions = options.map(o => o.trim()).filter(Boolean)
    //   if (cleanedOptions.length) {
    //     payload.options = cleanedOptions
    //   }
    // }

    // // 有開啟 Preheat 且有填值才帶上去
    // const preheat = Number(preheatHours || 0)
    // if (enablePreheat && preheat > 0) {
    //   payload.preheat_hours = preheat
    // }

    // console.log('CreateEvent payload:', payload)
    // createEventMutation.mutate(payload)
  }

  // const isSubmitting = createEventMutation.isPending
  const isSubmitting = false

  useEffect(() => {
    const draft: CreateEventDraft = {
      creatorAddress,
      title,
      description,
      hashtags,
      eventType,
      isRewarded,
      rewardBtc,
      options,
      durationHours,
      enablePreheat,
      preheatHours,
      agree,
    }

    sessionStorage.setItem(CREATE_EVENT_DRAFT_KEY, JSON.stringify(draft))
  }, [
    title,
    description,
    hashtags,
    eventType,
    isRewarded,
    rewardBtc,
    options,
    durationHours,
    enablePreheat,
    preheatHours,
    agree,
  ])

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
        <h1 className="tx-20 lh-24 fw-m text-(--color-orange-500) mb-6">{t('createEvent.formTitle')}</h1>

        {/* onSubmit 綁定 handleSubmit */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Creator address */}
          <div>
            <div className="flex items-center">
              <label className="block tx-14 lh-20 fw-m text-primary mb-1 mr-1">
                {t('createEvent.creatorAddress')}
              </label>
              <Tooltip
                placement="topLeft"
                title={t('createEvent.creatorAddressTooltip')}
                color="white"

              >
                <span className="tx-14 text-admin-text-main dark:text-white">ⓘ</span>
              </Tooltip>
              <span className={`text-(--color-orange-500) ml-1`}>*</span>
            </div>
            <input
              type="text"
              value={creatorAddress}
              onChange={handleCreatorAddressChange}
              placeholder={t('createEvent.creatorAddressPlaceholder')}
              className={`w-full rounded-xl border border-border bg-white px-3 py-2
                         tx-14 lh-20 text-black placeholder:text-secondary
                         focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)
                         ${creatorAddress.length >= 34 ? 'border-red-500' : ''}
                         ${creatorAddress.length >= 34 ? 'focus:ring-red-500' : ''}
                         `}
            />
          </div>
          {/* Title */}
          <div>
            <label className="block tx-14 lh-20 fw-m text-primary mb-1">
              {t('createEvent.title')} <span className="text-(--color-orange-500)">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('createEvent.titlePlaceholder')}
              className="w-full rounded-xl border border-border bg-white px-3 py-2
                         tx-14 lh-20 text-black placeholder:text-secondary
                         focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)"
            />
            <span className={`tx-12 lh-18  block text-right 
              ${title.length >= 120 ? 'text-red-500' : 'text-secondary'}`}>
              {120 - title.length} {t('createEvent.characterLeft')}
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block tx-14 lh-20 fw-m text-primary mb-1">
              {t('createEvent.description')}
              <span className="text-(--color-orange-500)">*</span>
            </label>
            <textarea
              required
              maxLength={500}
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('createEvent.descriptionPlaceholder')}
              className={`w-full rounded-xl border border-border bg-white px-3 py-2
                         tx-14 lh-20 text-black placeholder:text-secondary
                         focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)
                         resize-none h-auto min-h-[100px]
                         ${description.length >= 500 ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            <span className={`tx-12 lh-18  block text-right 
              ${description.length >= 500 ? 'text-red-500' : 'text-secondary'}`}>
              {500 - description.length} {t('createEvent.characterLeft')}
            </span>
          </div>

          {/* Hashtags（現在先只是 UI，之後可以接成陣列） */}
          <div>
            <label className="block tx-14 lh-20 fw-m text-primary mb-1">
              {t('createEvent.hashtags')}
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
              placeholder={t('createEvent.hashtagsPlaceholder')}
              className={`w-full rounded-xl border border-border bg-white px-3 py-2
                         tx-14 lh-20 text-black placeholder:text-secondary
                         focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)
                         ${hashtags.length >= 50 ? 'border-red-500 focus:ring-red-500' : ''}
                         ${hashtags.length >= 50 ? ' border-red-500' : ''}
                         `}
            />
            <span className={`tx-12 lh-18  block text-right 
              ${hashtags.length >= 50 ? 'text-red-500' : 'text-secondary'}`}>
              {50 - hashtags.length} {t('createEvent.characterLeft')}
            </span>
          </div>

          {/* Response type */}
          <div>
            <p className="tx-14 lh-20 fw-m text-primary mb-2">
              {t('createEvent.responseType')}
              <span className="text-(--color-orange-500)">*</span>
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 tx-14 lh-20 text-primary">
                <input
                  className="radio-orange"
                  type="radio"
                  name="responseType"
                  checked={eventType === 'open'}
                  onChange={() => setEventType('open')}
                />
                <span>{t('createEvent.responseTypeOptions.0.label')}</span>
              </label>
              <label className="flex items-center gap-2 tx-14 lh-20 text-primary">
                <input
                  type="radio"
                  name="responseType"
                  className="radio-orange"
                  checked={eventType === 'single_choice'}
                  onChange={() => setEventType('single_choice')}
                />
                <span>{t('createEvent.responseTypeOptions.1.label')}</span>
              </label>
            </div>
          </div>

          {/* Options（只有 single_choice 時顯示） */}
          {eventType === 'single_choice' && (
            <div>
              <label className="block tx-14 lh-20 fw-m text-primary mb-1">
                {t('createEvent.options')}
                <span className="text-(--color-orange-500)">*</span>
              </label>

              <div className="space-y-2">
                {options.map((opt, index) => {
                  const isLast = index === options.length - 1
                  const canRemove = options.length > 1

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handleOptionChange(index, e.target.value)}
                        placeholder={t('createEvent.optionsPlaceholder')}
                        className="w-full rounded-xl border border-border bg-white px-3 py-2
                         tx-14 lh-20 text-black placeholder:text-secondary
                         focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)"
                      />

                      {/* 減號：有兩個以上 option 才顯示 */}
                      {canRemove && (
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl border border-border bg-white flex items-center justify-center cursor-pointer'
                          )}
                          onClick={() => handleRemoveOption(index)}
                        >
                          <MinusIcon />
                        </div>
                      )}

                      {/* 加號：只在最後一列顯示 */}
                      {isLast && (
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl border border-border bg-white flex items-center justify-center cursor-pointer'
                          )}
                          onClick={handleAddOption}
                        >
                          <PlusIcon />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Reward type */}
          <div>
            <p className="tx-14 lh-20 fw-m text-primary mb-2">
              {t('createEvent.rewardType')}
              <span className="text-(--color-orange-500)">*</span>
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 tx-14 lh-20 text-primary">
                <input
                  type="radio"
                  name="rewardType"
                  className="radio-orange"
                  checked={isRewarded}
                  onChange={() => setIsRewarded(true)}
                />
                <span>{t('createEvent.rewarded')}</span>
              </label>
              <label className="flex items-center gap-2 tx-14 lh-20 text-primary">
                <input
                  type="radio"
                  name="rewardType"
                  className="radio-orange"
                  checked={!isRewarded}
                  onChange={() => setIsRewarded(false)}
                />
                <span>{t('createEvent.nonRewarded')}</span>
              </label>
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="tx-14 lh-20 fw-m text-primary">
                {t('createEvent.durationOfEvent')} 
                <span className="text-(--color-orange-500)">*</span>
              </label>
              <button
                type="button"
                className="tx-12 lh-16 text-(--color-orange-500) fw-m"
                onClick={() => {
                  // TODO: 之後根據 FREE_HOURS 和 Max Active Hours 來決定
                  // 目前先示意：把 duration 填一個預設值
                  if (!durationHours) setDurationHours('24')
                }}
              >
                123
              </button>
            </div>
            <input
              type="number"
              value={durationHours}
              onChange={e => setDurationHours(e.target.value)}
              placeholder="Enter hours"
              className="w-full rounded-xl border border-border bg-white px-3 py-2
                         tx-14 lh-20 text-black placeholder:text-secondary
                         focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)"
            />
          </div>

          {/* Reward (BTC) */}
          {isRewarded && (
            <div>
              <label className="block tx-14 lh-20 fw-m text-primary mb-1">
                {t('createEvent.rewardBtc')} <span className="text-(--color-orange-500)">*</span>
              </label>
              <input
                type="number"
                step="0.00000001"
                min="0"
                value={rewardBtc}
                onChange={e => setRewardBtc(e.target.value)}
                placeholder={t('createEvent.rewardBtcPlaceholder')}
                className="w-full rounded-xl border border-border bg-white px-3 py-2
                         tx-14 lh-20 text-black placeholder:text-secondary
                         focus:outline-none focus:ring-2 focus:ring-(--color-orange-500)"
              />
            </div>
          )}

          {/* Number of recipients（之後看後端計算，再來補） */}
          {isRewarded && (
            <div>
              <p className="tx-14 lh-20 fw-m text-primary mb-1">{t('createEvent.numberOfRecipients')}</p>
              <p className="tx-12 lh-18 text-secondary">
                -- {/* TODO: calculate from reward/threshold */}
              </p>
            </div>
          )}

          

          {/* Platform fee（只有 no reward 時顯示，之後接 FREE_HOURS 邏輯） */}
          {!isRewarded && (
            <div>
              <p className="tx-14 lh-20 fw-m text-primary mb-1">Platform fee:</p>
              <p className="tx-12 lh-18 text-secondary">--</p>
            </div>
          )}

          {/* Preheat */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 tx-14 lh-20 text-primary">
              <input
                type="checkbox"
                className="accent-(--color-orange-500)"
                checked={enablePreheat}
                onChange={e => setEnablePreheat(e.target.checked)}
              />
              <span>
                Enable Preheat
                <span className="ml-1 tx-14 text-admin-text-main dark:text-white">ⓘ</span>
              </span>
            </label>
            <input
              type="number"
              value={preheatHours}
              onChange={e => setPreheatHours(e.target.value)}
              placeholder="Enter hours (max 720)"
              className="w-full rounded-xl border border-border bg-[color-mix(in_oklab,var(--color-white)_10%,transparent)]
                         px-3 py-2 tx-14 lh-20 text-black placeholder:text-secondary
                         focus:outline-none focus:ring-2 focus:ring-(--color-orange-500) disabled:opacity-60"
              disabled={!enablePreheat}
            />
          </div>

          {/* Preheat fee */}
          <div>
            <p className="tx-14 lh-20 fw-m text-primary mb-1">Preheat fee:</p>
            <p className="tx-12 lh-18 text-secondary">--</p>
          </div>

          {/* Terms checkbox */}
          <div className="pt-2 border-t border-border">
            <label className="flex items-start gap-2 tx-12 lh-18 text-secondary">
              <input
                type="checkbox"
                className="mt-[2px] accent-(--color-orange-500)"
                checked={agree}
                onChange={e => setAgree(e.target.checked)}
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" className="text-(--color-orange-500) underline">
                  Terms of Service
                </Link>
                ,{' '}
                <Link to="/privacy" className="text-(--color-orange-500) underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link to="/charges-refunds" className="text-(--color-orange-500) underline">
                  Charges &amp; Refunds
                </Link>
                .
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              appearance="outline"
              tone="primary"
              text="sm"
              className="sm:w-[160px]"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              appearance="solid"
              tone="primary"
              text="sm"
              className="sm:w-[160px]"
              disabled={!agree || isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Preview'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
