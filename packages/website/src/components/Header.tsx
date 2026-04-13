import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900">
          Paget
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
            首页
          </Link>
          <Link to="/demo" className="text-sm text-gray-600 hover:text-gray-900">
            演示
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            GitHub
          </a>
        </div>
      </nav>
    </header>
  )
}
