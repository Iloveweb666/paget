/**
 * 英雄区组件
 * Hero section component
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          让 AI 帮你操控网页
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          Paget 是一款基于"先反思后行动"架构的 AI 页面自动化助手，
          通过自然语言指令完成复杂的网页操作任务。
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="/demo"
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            立即体验
          </a>
          <a href="#features" className="text-sm font-semibold leading-6 text-gray-900">
            了解更多 <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
