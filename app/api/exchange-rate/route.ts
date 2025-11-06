import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const apiKey = searchParams.get('apiKey')

  if (!from || !to || !apiKey) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    )
  }

  try {
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data['Error Message']) {
      return NextResponse.json(
        { error: 'Invalid API request' },
        { status: 400 }
      )
    }

    if (data['Note']) {
      return NextResponse.json(
        { error: 'API call frequency exceeded' },
        { status: 429 }
      )
    }

    const exchangeRate = data['Realtime Currency Exchange Rate']

    if (!exchangeRate) {
      return NextResponse.json(
        { error: 'Invalid API key or rate limit exceeded' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      pair: `${from}/${to}`,
      rate: parseFloat(exchangeRate['5. Exchange Rate']),
      timestamp: exchangeRate['6. Last Refreshed'],
      fromCurrency: exchangeRate['1. From_Currency Code'],
      toCurrency: exchangeRate['3. To_Currency Code'],
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate' },
      { status: 500 }
    )
  }
}
