import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xl font-bold">Tradegenius</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                Sign in
              </Link>
              <Link href="/builder" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                Try Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-400 text-sm mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Strategy Generation
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
            Turn Ideas Into
            <br />
            <span className="text-blue-500">Trading Strategies</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Describe your strategy in plain English. Get production-ready Pine Script code.
            Backtest instantly. No coding required.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/builder" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-lg transition-colors">
              Start Building
            </Link>
            <a href="#features" className="px-8 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg font-medium text-lg transition-colors">
              Learn More
            </a>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Natural Language Input</h3>
              <p className="text-gray-400">Describe your strategy in plain English. Our AI understands trading concepts and converts them to code.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-600/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Backtesting</h3>
              <p className="text-gray-400">Test your strategies against historical data. See win rate, profit factor, drawdown, and more.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-600/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Production Ready</h3>
              <p className="text-gray-400">Get clean, documented Pine Script v6 code ready to paste into TradingView. Edit and customize as needed.</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="pb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">$0<span className="text-sm text-gray-400">/mo</span></p>
              <ul className="space-y-2 text-gray-400 text-sm mb-6">
                <li>3 strategies per day</li>
                <li>5 backtests per day</li>
                <li>Basic indicators</li>
              </ul>
              <Link href="/builder" className="block w-full text-center px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">
                Get Started
              </Link>
            </div>

            <div className="bg-gray-900 border border-blue-600 rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">Popular</div>
              <h3 className="text-lg font-semibold mb-2">Trader</h3>
              <p className="text-3xl font-bold mb-4">$99<span className="text-sm text-gray-400">/mo</span></p>
              <ul className="space-y-2 text-gray-400 text-sm mb-6">
                <li>50 strategies per day</li>
                <li>100 backtests per day</li>
                <li>All indicators</li>
                <li>Strategy library</li>
              </ul>
              <Link href="/builder" className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                Start Free Trial
              </Link>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Pro</h3>
              <p className="text-3xl font-bold mb-4">$299<span className="text-sm text-gray-400">/mo</span></p>
              <ul className="space-y-2 text-gray-400 text-sm mb-6">
                <li>Unlimited strategies</li>
                <li>Unlimited backtests</li>
                <li>API access</li>
                <li>White-label</li>
              </ul>
              <Link href="/builder" className="block w-full text-center px-4 py-2 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 Tradegenius. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
