import { useCallback, useRef } from 'react'
import { Moon, Sun } from 'lucide-react'
import { flushSync } from 'react-dom'
import { useTranscriptStore } from '../stores/transcriptStore'

interface AnimatedThemeTogglerProps {
  className?: string
  duration?: number
}

export const AnimatedThemeToggler = ({
  className = '',
  duration = 400,
}: AnimatedThemeTogglerProps) => {
  const { resolvedTheme, setTheme } = useTranscriptStore()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return

    const isDark = resolvedTheme === 'dark'
    const newTheme = isDark ? 'light' : 'dark'

    // 检查浏览器是否支持 View Transitions API
    if (!document.startViewTransition) {
      // 不支持时直接切换，无动画
      setTheme(newTheme)
      return
    }

    // 使用 View Transitions API 实现圆形扩散动画
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme)
      })
    })

    await transition.ready

    // 计算按钮中心点位置
    const { top, left, width, height } = buttonRef.current.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2

    // 计算从按钮中心到屏幕四角的最大距离
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    // 执行圆形扩散动画
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    )
  }, [resolvedTheme, setTheme, duration])

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={`
        flex items-center justify-center p-2 rounded-lg transition-colors
        text-zinc-600 hover:bg-surface-100
        dark:text-zinc-400 dark:hover:bg-surface-800
        ${className}
      `}
      aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
      title={isDark ? '切换到浅色模式' : '切换到深色模式'}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  )
}
