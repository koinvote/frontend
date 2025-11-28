import { Button } from '@/components/base/Button'

export default function AdminRewardRulesPage() {
  return (
    <div>
      {/* 頂部標題區保持白色 */}
      <div className="bg-white border-admin-border h-20 px-6 py-4 flex items-center justify-between">
        <h1 className="tx-18 fw-m">獎金與派獎規則</h1>
      </div>

      <main className="px-6 py-4">

        <div className="h-20 flex items-center justify-end gap-2">
          <Button size="md" text="sm" tone="white" appearance="solid">
            恢復
          </Button>
          <Button size="md" text="sm" tone="orange">
            儲存
          </Button>
          <Button size="md" text="sm" tone="transparent" appearance="solid">
            取消
          </Button>
        </div>

        <div className="space-y-6">
          {/* 1. 最低發起獎金金額 */}
          <section className="space-y-2 p-4 rounded bg-white ">
            <h2 className="fw-m tx-16">1. 最低發起獎金金額</h2>
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 max-w-xl">
              <label className="tx-14 text-admin-text-sub">最低發起獎金金額</label>
              <input
                className="border border-admin-border rounded-[4px] px-3 py-2 bg-white tx-14"
                placeholder="輸入"
              />
              <span className="tx-14">BTC</span>
            </div>
          </section>

          {/* 2. 中獎地址數 / 獎金金額比例 */}
          <section className="space-y-2 p-4 rounded bg-white ">
            <h2 className="fw-m tx-16">2. 中獎地址數 / 獎金金額比例</h2>
            <div className="flex flex-wrap items-center gap-3 max-w-xl tx-14">
              <span>每</span>
              <input className="w-24 border border-admin-border rounded-[4px] px-3 py-2 bg-white" />
              <span>BTC 對應 1 地址</span>
            </div>
          </section>

          {/* 3. 活動最長存續時間 / 獎金金額比例 */}
          <section className="space-y-2 p-4 rounded bg-white ">
            <h2 className="fw-m tx-16">3. 活動最長存續時間 / 獎金金額比例</h2>
            <div className="flex flex-wrap items-center gap-3 max-w-xl tx-14">
              <span>每</span>
              <input className="w-24 border border-admin-border rounded-[4px] px-3 py-2 bg-white" />
              <span>BTC 對應 1 小時</span>
            </div>
          </section>

          {/* 4. 設定平台服務費比例 */}
          <section className="space-y-2 p-4 rounded bg-white ">
            <h2 className="fw-m tx-16">4. 設定平台服務費比例</h2>
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 max-w-xl">
              <label className="tx-14 text-admin-text-sub">服務費比例</label>
              <input
                className="border border-admin-border rounded-[4px] px-3 py-2 bg-white tx-14"
                placeholder="輸入"
              />
              <span className="tx-14">%</span>
            </div>
          </section>

          {/* 5. 最低派獎門檻 */}
          <section className="space-y-2 p-4 rounded bg-white ">
            <h2 className="fw-m tx-16">5. 最低派獎門檻（Dust Rule）</h2>
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 max-w-xl">
              <label className="tx-14 text-admin-text-sub">最低派獎門檻</label>
              <input
                className="border border-admin-border rounded-[4px] px-3 py-2 bg-white tx-14"
                placeholder="輸入"
              />
              <span className="tx-14">sats</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
