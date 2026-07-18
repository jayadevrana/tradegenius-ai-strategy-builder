'use client'

import { useStrategies } from '@/hooks/useStrategies'
import Link from 'next/link'

export default function StrategiesPage() {
  const { strategies, loading, deleteStrategy } = useStrategies()

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xl font-bold">Tradegenius</span>
              </Link>
              <span className="text-gray-600">|</span>
              <span className="text-gray-400">My Strategies</span>
            </div>
            <Link
              href="/builder"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              New Strategy
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && strategies.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No strategies yet</h3>
            <p className="text-gray-500 mb-4">Create your first AI-powered trading strategy</p>
            <Link
              href="/builder"
              className="inline-flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Strategy
            </Link>
          </div>
        )}

        {!loading && strategies.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-white truncate">{strategy.name}</h3>
                  <button
                    onClick={() => deleteStrategy(strategy.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors ml-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {strategy.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{strategy.description}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{strategy.pineScript.split('\n').length} lines</span>
                  <span>·</span>
                  <span>{new Date(strategy.updatedAt).toLocaleDateString()}</span>
                </div>

                {strategy.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {strategy.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/builder?id=${strategy.id}`}
                    className="flex-1 text-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => navigator.clipboard.writeText(strategy.pineScript)}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
