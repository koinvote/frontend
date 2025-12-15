import { Button } from '@/components/base/Button'
import Logo from '@/assets/logo/logo.svg?react'

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
            <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" fill="none" />
            <rect x="4" y="4" width="11" height="11" rx="2" stroke="currentColor" fill="none" />
        </svg>
    )
}

export default function AdminLogin() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-admin-bg">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] px-10 py-8">
                <div className="text-center flex items-center justify-center gap-2">
                    <div><Logo className="h-8 w-8" /></div>
                    <div>
                        <div className="tx-20 text-admin-text-main fw-m">Koinvote Admin</div>
                        <div className="tx-14 text-admin-text-sub">Admin Login Interface</div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Bitcoin Address */}
                    <div className="space-y-1">
                        <label className="tx-14 text-admin-text-sub">Bitcoin Address</label>
                        <div className="flex items-center gap-2 bg-admin-surface rounded-[6px] px-3 py-2">
                            <input
                                className="flex-1 bg-transparent border-0 outline-none tx-14"
                                value=""
                            />
                            <button
                                type="button"
                                className="text-admin-text-sub hover:text-admin-text-main"
                            >
                                <CopyIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="tx-14 text-admin-text-sub">Hash Key</label>
                        <div className="flex items-center gap-2 bg-admin-surface rounded-[6px] px-3 py-2">
                            <input
                                className="flex-1 bg-transparent border-0 outline-none tx-14"
                                value=""
                            />
                            <button
                                type="button"
                                className="text-admin-text-sub hover:text-admin-text-main"
                            >
                                <CopyIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* 貼上 Hash Key */}
                    <div className="space-y-1">
                        <label className="tx-14 text-admin-text-sub">Hash Key</label>
                        <input
                            className="w-full border border-admin-border rounded-[6px] px-3 py-2 tx-14"
                            placeholder="Paste Hash Key"
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            block
                            size="lg"
                            text="md"
                            tone="orange"
                            className="w-full"
                        >
                            Log in
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
