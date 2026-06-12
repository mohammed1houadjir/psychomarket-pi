'use client'

import { useEffect, useRef, useState } from 'react'

interface MarketData {
  buy: number
  sell: number
  wait: number
  total: number
}

interface Vote {
  id: number
  piUsername: string
  action: string
  createdAt: string
}

declare global {
  interface Window {
    Pi?: {
      init: (config: { version: string; sandbox: boolean }) => Promise<void>
      authenticate: (
        scopes: string[],
        onIncomplete: () => void
      ) => Promise<{ user: { username: string } }>
    }
  }
}

export default function EagleEyeApp() {
  const [userName, setUserName] = useState<string | null>(null)
  const [userError, setUserError] = useState('')
  const [market, setMarket] = useState<MarketData | null>(null)
  const [userVotes, setUserVotes] = useState<Vote[]>([])
  const [btcPrice, setBtcPrice] = useState<string | null>(null)
  const [voteStatus, setVoteStatus] = useState('')
  const [isVoting, setIsVoting] = useState(false)
  const votingLock = useRef(false)

  // Init Pi SDK
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://sdk.minepi.com/pi-sdk.js'
    script.async = true
    script.onload = () => initPi()
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  async function initPi() {
    try {
      if (!window.Pi) {
        setUserError('افتح التطبيق داخل Pi Browser')
        return
      }
      await window.Pi.init({ version: '2.0', sandbox: false })
      const auth = await window.Pi.authenticate(['username'], () => {})
      setUserName(auth.user.username)
      fetchUserVotes(auth.user.username)
    } catch {
      setUserError('افتح التطبيق داخل Pi Browser')
    }
  }

  async function loadMarket() {
    try {
      const res = await fetch('/api/market')
      const data: MarketData = await res.json()
      setMarket(data)
    } catch {
      // silent
    }
  }

  async function loadPrice() {
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      )
      const data = await res.json()
      setBtcPrice('$' + data.bitcoin.usd.toLocaleString())
    } catch {
      setBtcPrice('—')
    }
  }

  async function fetchUserVotes(username: string) {
    try {
      const res = await fetch(`/api/votes?username=${encodeURIComponent(username)}`)
      const data: Vote[] = await res.json()
      setUserVotes(data)
    } catch {
      // silent
    }
  }

  async function vote(action: 'buy' | 'sell' | 'wait') {
    if (!userName) {
      setVoteStatus('يجب تسجيل الدخول عبر Pi')
      return
    }
    if (votingLock.current) return
    votingLock.current = true
    setIsVoting(true)
    setVoteStatus('جارٍ إرسال القرار...')

    try {
      const res = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userName, action }),
      })
      if (res.ok) {
        setVoteStatus('تم تسجيل: ' + action.toUpperCase())
        await loadMarket()
        await fetchUserVotes(userName)
      } else {
        setVoteStatus('خطأ في الإرسال')
      }
    } catch {
      setVoteStatus('خطأ في الاتصال')
    }

    setIsVoting(false)
    setTimeout(() => { votingLock.current = false }, 1000)
  }

  // Polling
  useEffect(() => {
    loadMarket()
    loadPrice()
    const marketInterval = setInterval(loadMarket, 5000)
    const priceInterval = setInterval(loadPrice, 10000)
    return () => {
      clearInterval(marketInterval)
      clearInterval(priceInterval)
    }
  }, [])

  const actionLabel: Record<string, string> = {
    buy: 'شراء',
    sell: 'بيع',
    wait: 'انتظار',
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background font-sans flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-lg flex flex-col gap-4">

        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">EagleEye Protocol</h1>
          <p className="text-sm text-muted mt-1">AI + Web3 Market Intelligence Engine</p>
        </div>

        {/* User Card */}
        <div className="card">
          {userName ? (
            <p className="text-accent font-semibold">المستخدم: {userName}</p>
          ) : userError ? (
            <p className="text-error text-sm">{userError}</p>
          ) : (
            <p className="text-muted text-sm">جارٍ الاتصال بـ Pi Network...</p>
          )}
        </div>

        {/* Market Intelligence */}
        <div className="card">
          <h2 className="section-title">Market Intelligence</h2>
          {market ? (
            <div className="flex flex-col gap-3 mt-3">
              <BarRow label="BUY" value={market.buy} color="var(--buy)" />
              <BarRow label="SELL" value={market.sell} color="var(--sell)" />
              <BarRow label="WAIT" value={market.wait} color="var(--wait)" />
              <p className="text-xs text-muted text-center mt-1">
                إجمالي التصويتات: {market.total}
              </p>
            </div>
          ) : (
            <p className="text-muted text-sm mt-2">تحميل...</p>
          )}
        </div>

        {/* Decision Engine */}
        <div className="card">
          <h2 className="section-title">Decision Engine</h2>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={() => vote('buy')}
              disabled={isVoting || !userName}
              className="vote-btn buy-btn"
            >
              BUY
            </button>
            <button
              onClick={() => vote('sell')}
              disabled={isVoting || !userName}
              className="vote-btn sell-btn"
            >
              SELL
            </button>
            <button
              onClick={() => vote('wait')}
              disabled={isVoting || !userName}
              className="vote-btn wait-btn"
            >
              WAIT
            </button>
          </div>
          {voteStatus && (
            <p className="text-sm text-center mt-3 text-accent">{voteStatus}</p>
          )}
        </div>

        {/* Live BTC Price */}
        <div className="card">
          <h2 className="section-title">Live Data Feed</h2>
          <p className="text-2xl font-bold text-accent text-center mt-2">
            BTC {btcPrice ?? '...'}
          </p>
        </div>

        {/* User Vote History */}
        {userVotes.length > 0 && (
          <div className="card">
            <h2 className="section-title">سجل قراراتك</h2>
            <ul className="flex flex-col gap-2 mt-3">
              {userVotes.slice(0, 5).map((v) => (
                <li key={v.id} className="flex justify-between items-center text-sm">
                  <span
                    className={
                      v.action === 'buy'
                        ? 'text-buy font-semibold'
                        : v.action === 'sell'
                        ? 'text-sell font-semibold'
                        : 'text-wait font-semibold'
                    }
                  >
                    {actionLabel[v.action] ?? v.action}
                  </span>
                  <span className="text-muted text-xs">
                    {new Date(v.createdAt).toLocaleDateString('ar-DZ', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Placeholder */}
        <div className="card opacity-60">
          <h2 className="section-title">AI Layer</h2>
          <p className="text-sm text-muted mt-2 text-center">
            سيتم تفعيل التحليل الذكي قريباً
          </p>
        </div>

      </div>
    </div>
  )
}

function BarRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>
        {label}
      </span>
      <div className="flex-1 bg-surface rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-muted w-8 text-left">{value}%</span>
    </div>
  )
}
