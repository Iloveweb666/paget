/**
 * 功能特性区组件
 * Features section component
 */
export function FeaturesSection() {
  const features = [
    {
      title: '先反思后行动',
      description: '每一步操作前，AI 都会评估上一步结果、记忆关键信息、明确下一个目标。',
    },
    {
      title: '批量操作支持',
      description: '多个操作可以在一步中批量执行，大幅提升自动化效率。',
    },
    {
      title: '意图分流',
      description: '智能识别用户意图，自动切换对话模式和自动化模式。',
    },
    {
      title: '无需浏览器插件',
      description: '通过 Bookmarklet 注入，在任何网页上即可使用。',
    },
  ]

  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 text-center">
          核心特性
        </h2>
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
