'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

interface ExchangeRate {
  pair: string
  rate: number
  timestamp: string
  change?: number
  error?: string
}

const CURRENCY_PAIRS = [
  { from: 'EUR', to: 'USD', display: 'EUR/USD' },
  { from: 'GBP', to: 'USD', display: 'GBP/USD' },
  { from: 'USD', to: 'JPY', display: 'USD/JPY' },
  { from: 'USD', to: 'CHF', display: 'USD/CHF' },
  { from: 'AUD', to: 'USD', display: 'AUD/USD' },
  { from: 'USD', to: 'CAD', display: 'USD/CAD' },
]

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [rates, setRates] = useState<ExchangeRate[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchRates = async () => {
    if (!apiKey) {
      alert('Please enter your Alpha Vantage API key')
      return
    }

    setLoading(true)
    const newRates: ExchangeRate[] = []

    for (const pair of CURRENCY_PAIRS) {
      try {
        const response = await fetch(
          `/api/exchange-rate?from=${pair.from}&to=${pair.to}&apiKey=${apiKey}`
        )
        const data = await response.json()

        if (data.error) {
          newRates.push({
            pair: pair.display,
            rate: 0,
            timestamp: new Date().toISOString(),
            error: data.error,
          })
        } else {
          const oldRate = rates.find(r => r.pair === pair.display)
          const change = oldRate ? data.rate - oldRate.rate : 0

          newRates.push({
            pair: pair.display,
            rate: data.rate,
            timestamp: data.timestamp,
            change,
          })
        }
      } catch (error) {
        newRates.push({
          pair: pair.display,
          rate: 0,
          timestamp: new Date().toISOString(),
          error: 'Network error',
        })
      }

      // Alpha Vantage free tier: 5 calls per minute
      await new Promise(resolve => setTimeout(resolve, 12000))
    }

    setRates(newRates)
    setLastUpdate(new Date().toLocaleString())
    setLoading(false)
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh && apiKey) {
      interval = setInterval(() => {
        fetchRates()
      }, 90000) // Refresh every 90 seconds (to stay within API limits)
    }
    return () => clearInterval(interval)
  }, [autoRefresh, apiKey])

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>📊 Forex Scanner</h1>
        <p className={styles.subtitle}>Live Currency Exchange Rates</p>

        <div className={styles.apiKeySection}>
          <input
            type="text"
            placeholder="Enter Alpha Vantage API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={styles.input}
          />
          <a
            href="https://www.alphavantage.co/support/#api-key"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Get Free API Key
          </a>
        </div>

        <div className={styles.controls}>
          <button
            onClick={fetchRates}
            disabled={loading || !apiKey}
            className={styles.button}
          >
            {loading ? 'Fetching...' : 'Scan Now'}
          </button>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              disabled={!apiKey}
            />
            Auto-refresh (90s)
          </label>
        </div>

        {lastUpdate && (
          <p className={styles.lastUpdate}>Last updated: {lastUpdate}</p>
        )}

        {loading && rates.length === 0 && (
          <div className={styles.loadingMessage}>
            <p>Fetching rates... This may take up to 90 seconds due to API rate limits.</p>
          </div>
        )}

        <div className={styles.ratesGrid}>
          {rates.map((rate) => (
            <div key={rate.pair} className={styles.rateCard}>
              <h3 className={styles.pairName}>{rate.pair}</h3>
              {rate.error ? (
                <p className={styles.error}>{rate.error}</p>
              ) : (
                <>
                  <p className={styles.rate}>{rate.rate.toFixed(4)}</p>
                  {rate.change !== undefined && rate.change !== 0 && (
                    <p
                      className={`${styles.change} ${
                        rate.change > 0 ? styles.positive : styles.negative
                      }`}
                    >
                      {rate.change > 0 ? '▲' : '▼'}{' '}
                      {Math.abs(rate.change).toFixed(4)}
                    </p>
                  )}
                  <p className={styles.timestamp}>
                    {new Date(rate.timestamp).toLocaleTimeString()}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className={styles.info}>
          <p>💡 Using Alpha Vantage Free API (5 calls/minute limit)</p>
          <p>⚠️ Scanning all pairs takes ~90 seconds</p>
        </div>
      </div>
    </main>
  )
}
