/**
 * 字幕控制组件
 * 用于在主应用中控制字幕窗口的显示和样式
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  Subtitles, 
  Settings, 
  Move, 
  Lock, 
  RotateCcw, 
  Palette,
  Type,
  Maximize2,
  X,
  Sun
} from 'lucide-react'
import { useTranscriptStore } from '../stores/transcriptStore'

// 字幕样式接口
interface CaptionStyle {
  fontSize: number
  fontFamily: string
  textColor: string
  backgroundColor: string
  textShadow: boolean
  maxLines: number
}

// 预设颜色
const presetColors = [
  { name: '白色', value: '#ffffff' },
  { name: '黄色', value: '#ffd700' },
  { name: '绿色', value: '#00ff00' },
  { name: '青色', value: '#00ffff' },
  { name: '粉色', value: '#ff69b4' },
]

// 预设背景
const presetBackgrounds = [
  { name: '半透明黑', value: 'rgba(0, 0, 0, 0.7)' },
  { name: '深色', value: 'rgba(0, 0, 0, 0.9)' },
  { name: '透明', value: 'rgba(0, 0, 0, 0)' },
  { name: '半透明蓝', value: 'rgba(0, 0, 100, 0.7)' },
  { name: '半透明紫', value: 'rgba(75, 0, 130, 0.7)' },
]

// 预设字体
const presetFonts = [
  { name: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
  { name: '黑体', value: 'SimHei, sans-serif' },
  { name: '宋体', value: 'SimSun, serif' },
  { name: '楷体', value: 'KaiTi, serif' },
  { name: '等宽', value: 'Consolas, monospace' },
]

interface CaptionControlsProps {
  className?: string
}

export function CaptionControls({ className = '' }: CaptionControlsProps) {
  const { t } = useTranscriptStore()
  const [isEnabled, setIsEnabled] = useState(false)
  const [isDraggable, setIsDraggable] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [style, setStyle] = useState<CaptionStyle>({
    fontSize: 24,
    fontFamily: 'Microsoft YaHei, sans-serif',
    textColor: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textShadow: true,
    maxLines: 2,
  })

  // 获取初始状态
  useEffect(() => {
    if (!window.electronAPI?.captionGetStatus) return

    window.electronAPI.captionGetStatus().then((status) => {
      setIsEnabled(status.enabled)
      setIsDraggable(status.draggable)
      setStyle(status.style)
    })
  }, [])

  // 监听字幕状态变化
  useEffect(() => {
    if (!window.electronAPI?.onCaptionStatusChanged) return

    const cleanup = window.electronAPI.onCaptionStatusChanged((enabled) => {
      setIsEnabled(enabled)
    })

    return cleanup
  }, [])

  // 切换字幕显示
  const handleToggle = useCallback(async () => {
    if (!window.electronAPI?.captionToggle) return
    const newState = await window.electronAPI.captionToggle()
    setIsEnabled(newState)
  }, [])

  // 切换拖拽模式
  const handleToggleDraggable = useCallback(async () => {
    if (!window.electronAPI?.captionToggleDraggable) return
    const newState = await window.electronAPI.captionToggleDraggable()
    setIsDraggable(newState)
  }, [])

  // 重置位置
  const handleResetPosition = useCallback(async () => {
    if (!window.electronAPI?.captionResetPosition) return
    await window.electronAPI.captionResetPosition()
  }, [])

  // 更新样式
  const handleStyleChange = useCallback(async (newStyle: Partial<CaptionStyle>) => {
    if (!window.electronAPI?.captionUpdateStyle) return
    const updatedStyle = await window.electronAPI.captionUpdateStyle(newStyle)
    setStyle(updatedStyle)
  }, [])

  // 如果不在 Electron 环境，不渲染
  if (!window.electronAPI?.captionToggle) {
    return null
  }

  return (
    <div className={`relative ${className}`}>
      {/* 主按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
            transition-all duration-200
            ${isEnabled 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'bg-muted text-muted-foreground hover:bg-accent'
            }
          `}
          title={isEnabled ? t.caption?.disable : t.caption?.enable}
        >
          <Subtitles className="w-4 h-4" />
          <span>{isEnabled ? t.caption?.hideCaption : t.caption?.showCaption}</span>
        </button>

        {/* 字幕已启用时显示的额外控制 */}
        {isEnabled && (
          <>
            {/* 拖拽模式切换 */}
            <button
              onClick={handleToggleDraggable}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${isDraggable 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-accent'
                }
              `}
              title={isDraggable ? t.caption?.lockPosition : t.caption?.adjustPosition}
            >
              {isDraggable ? <Lock className="w-4 h-4" /> : <Move className="w-4 h-4" />}
            </button>

            {/* 重置位置 */}
            <button
              onClick={handleResetPosition}
              className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-accent transition-all duration-200"
              title={t.caption?.resetPosition}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* 设置按钮 */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`
                p-2 rounded-lg transition-all duration-200
                ${showSettings 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-accent'
                }
              `}
              title={t.caption?.settings}
            >
              <Settings className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 设置面板 - 模态框形式 */}
      {showSettings && isEnabled && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowSettings(false)}
        >
          {/* 背景遮罩 */}
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
            }} 
          />
          
          {/* 设置面板内容 */}
          <div 
            className="relative w-[420px] max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{
              backgroundColor: 'var(--card, #1c1c1e)',
              border: '1px solid var(--border, rgba(255,255,255,0.1))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div 
              className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
              style={{
                backgroundColor: 'var(--card, #1c1c1e)',
                borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))',
              }}
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Subtitles className="w-5 h-5 text-primary" />
                {t.caption?.styleSettings || '字幕样式设置'}
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容区域 */}
            <div className="p-6 space-y-6">
              {/* 字幕预览 */}
              <div 
                className="p-4 rounded-xl"
                style={{
                  backgroundColor: style.backgroundColor,
                  border: '1px solid var(--border, rgba(255,255,255,0.1))',
                }}
              >
                <p
                  style={{
                    fontFamily: style.fontFamily,
                    fontSize: `${Math.min(style.fontSize, 32)}px`,
                    color: style.textColor,
                    textShadow: style.textShadow 
                      ? '2px 2px 4px rgba(0, 0, 0, 0.8)' 
                      : 'none',
                    textAlign: 'center',
                    lineHeight: 1.5,
                  }}
                >
                  字幕预览效果
                </p>
              </div>

              {/* 字体大小 */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  <span>{t.caption?.fontSize || '字体大小'}</span>
                  <span className="ml-auto text-green-500 font-mono font-bold">{style.fontSize}px</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="16"
                    max="72"
                    value={style.fontSize}
                    onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #22c55e 0%, #22c55e ${((style.fontSize - 16) / (72 - 16)) * 100}%, rgba(128, 128, 128, 0.3) ${((style.fontSize - 16) / (72 - 16)) * 100}%, rgba(128, 128, 128, 0.3) 100%)`,
                    }}
                  />
                  <style>{`
                    input[type="range"]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      width: 24px;
                      height: 24px;
                      background: #22c55e;
                      border-radius: 50%;
                      cursor: pointer;
                      box-shadow: 0 0 10px rgba(34, 197, 94, 0.5), 0 2px 6px rgba(0,0,0,0.3);
                      border: 3px solid white;
                    }
                  `}</style>
                </div>
              </div>

              {/* 最大行数 */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-muted-foreground" />
                  <span>{t.caption?.maxLines || '最大行数'}</span>
                  <span className="ml-auto text-green-500 font-mono font-bold">{style.maxLines} 行</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleStyleChange({ maxLines: num })}
                      className={`
                        flex-1 py-2 rounded-lg font-medium text-sm transition-all
                        ${style.maxLines === num 
                          ? 'bg-green-500 text-white border-2 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]' 
                          : 'bg-muted hover:bg-accent border-2 border-transparent'
                        }
                      `}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* 字体选择 */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  {t.caption?.fontFamily || '字体'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {presetFonts.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => handleStyleChange({ fontFamily: font.value })}
                      className={`
                        px-3 py-2 text-sm rounded-lg transition-all text-left
                        ${style.fontFamily === font.value 
                          ? 'bg-green-500 text-white border-2 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.5)]' 
                          : 'bg-muted hover:bg-accent border-2 border-transparent'
                        }
                      `}
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 文字颜色 */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <span>{t.caption?.textColor || '文字颜色'}</span>
                </label>
                <div className="flex gap-3 justify-center">
                  {presetColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleStyleChange({ textColor: color.value })}
                      className={`
                        w-12 h-12 rounded-full transition-all
                        ${style.textColor === color.value 
                          ? 'ring-4 ring-green-500 ring-offset-2 ring-offset-background scale-110 shadow-[0_0_16px_rgba(34,197,94,0.6)]' 
                          : 'hover:scale-105 shadow-md'
                        }
                      `}
                      style={{ 
                        backgroundColor: color.value,
                        border: color.value === '#ffffff' ? '2px solid rgba(0,0,0,0.2)' : 'none',
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* 背景颜色 */}
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  {t.caption?.backgroundColor || '背景颜色'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {presetBackgrounds.map((bg) => (
                    <button
                      key={bg.value}
                      onClick={() => handleStyleChange({ backgroundColor: bg.value })}
                      className={`
                        px-3 py-2 text-sm rounded-lg transition-all
                        ${style.backgroundColor === bg.value 
                          ? 'ring-2 ring-green-500 ring-offset-1 ring-offset-background shadow-[0_0_12px_rgba(34,197,94,0.5)]' 
                          : ''
                        }
                      `}
                      style={{ 
                        backgroundColor: bg.value,
                        color: bg.value.includes('0, 0, 0, 0)') ? 'inherit' : '#fff',
                        border: bg.value.includes('0, 0, 0, 0)') ? '1px dashed var(--border)' : 'none',
                      }}
                    >
                      {bg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 文字阴影 */}
              <div 
                className={`
                  flex items-center justify-between p-4 rounded-xl transition-all
                  ${style.textShadow 
                    ? 'border-2 border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' 
                    : 'border-2 border-gray-600'
                  }
                `}
                style={{ backgroundColor: 'var(--muted, rgba(255,255,255,0.05))' }}
              >
                <label className="text-sm font-medium flex items-center gap-2">
                  <Sun className={`w-4 h-4 ${style.textShadow ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span>{t.caption?.textShadow || '文字阴影'}</span>
                </label>
                <button
                  onClick={() => handleStyleChange({ textShadow: !style.textShadow })}
                  className={`
                    relative inline-flex h-8 w-16 items-center rounded-full transition-all
                    ${style.textShadow 
                      ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                      : 'bg-gray-600'
                    }
                  `}
                >
                  <span
                    className={`
                      inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform
                      ${style.textShadow ? 'translate-x-9' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CaptionControls
