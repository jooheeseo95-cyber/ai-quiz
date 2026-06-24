import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function Layout({ children, className = '' }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-600 text-white py-3 px-4 shadow">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <h1 className="text-lg font-bold">AI 퀴즈</h1>
        </div>
      </header>
      <main className={`flex-1 max-w-2xl w-full mx-auto p-4 ${className}`}>
        {children}
      </main>
    </div>
  )
}
