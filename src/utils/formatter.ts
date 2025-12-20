/** BTC -> sats*/
export const btcToSats = (value: string) => {
   const num = Number(value)
   if (!Number.isFinite(num) || num <= 0) return 0
   return Math.round(num * 1e8)
}
