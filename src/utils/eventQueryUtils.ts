
import {
    type EventSummary,
    type HomeSortField,
    type HomeSortOrder,
  } from '@/pages/home/types/index'
  
  const normalize = (s: string) => s.toLowerCase().trim()
  
  export function applySearchFilter(events: EventSummary[], search?: string) {
    if (!search?.trim()) return events
    const q = normalize(search)
  
    return events.filter((ev) => {
      const title = normalize(ev.title)
      const desc = normalize(ev.description)
      const id = ev.event_id.toLowerCase()
      const hashtags = ev.hashtags.map((h) => normalize(h))
  
      const inText = title.includes(q) || desc.includes(q)
      const inId = id.startsWith(q)
      const inHashtag = hashtags.some(
        (h) => h === q || h.replace('#', '') === q.replace('#', ''),
      )
  
      // 之後如果有 event_id / btcAddress 專門欄位可以再擴充
      return inText || inId || inHashtag
    })
  }
  
  export function applyHashtagFilter(
    events: EventSummary[],
    hashtag?: string | null,
  ) {
    if (!hashtag) return events
    const key = normalize(hashtag)
  
    return events.filter((ev) =>
      ev.hashtags.some(
        (h) =>
          normalize(h) === key ||
          normalize(h.replace('#', '')) === key.replace('#', ''),
      ),
    )
  }
  
  export function applySort(
    events: EventSummary[],
    field: HomeSortField = 'time',
    order: HomeSortOrder = 'asc',
  ) {
    const dir = order === 'asc' ? 1 : -1
  
    return [...events].sort((a, b) => {
      if (field === 'bounty') {
        const av = parseFloat(a.total_reward_btc)
        const bv = parseFloat(b.total_reward_btc)
        return (av - bv) * dir
      }
  
      if (field === 'participation') {
        const av = parseFloat(a.total_stake_btc)
        const bv = parseFloat(b.total_stake_btc)
        return (av - bv) * dir
      }
  
      // field === 'time'
      const at = Date.parse(a.deadline_at || a.ended_at || a.created_at)
      const bt = Date.parse(b.deadline_at || b.ended_at || b.created_at)
      return (at - bt) * dir
    })
  }
  