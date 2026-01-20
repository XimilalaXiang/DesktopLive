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
  X
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

      {/* 设置面板 */}
      {showSettings && isEnabled && (
        <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-card border border-border rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t.caption?.styleSettings}
            </h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 字体大小 */}
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                <Type className="w-3 h-3" />
                {t.caption?.fontSize}: {style.fontSize}px
              </label>
              <input
                type="range"
                min="16"
                max="72"
                value={style.fontSize}
                onChange={(e) => handleStyleChange({ fontSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                         [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* 字体选择 */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                {t.caption?.fontFamily}
              </label>
              <div className="flex flex-wrap gap-1">
                {presetFonts.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => handleStyleChange({ fontFamily: font.value })}
                    className={`
                      px-2 py-1 text-xs rounded transition-all
                      ${style.fontFamily === font.value 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted hover:bg-accent'
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
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                <Palette className="w-3 h-3" />
                {t.caption?.textColor}
              </label>
              <div className="flex gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleStyleChange({ textColor: color.value })}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all
                      ${style.textColor === color.value 
                        ? 'border-primary scale-110' 
                        : 'border-transparent hover:scale-105'
                      }
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* 背景颜色 */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                {t.caption?.backgroundColor}
              </label>
              <div className="flex flex-wrap gap-1">
                {presetBackgrounds.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => handleStyleChange({ backgroundColor: bg.value })}
                    className={`
                      px-2 py-1 text-xs rounded transition-all
                      ${style.backgroundColor === bg.value 
                        ? 'ring-2 ring-primary' 
                        : ''
                      }
                    `}
                    style={{ 
                      backgroundColor: bg.value,
                      color: bg.value.includes('0, 0, 0, 0)') ? 'inherit' : '#fff',
                    }}
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 文字阴影 */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                {t.caption?.textShadow}
              </label>
              <button
                onClick={() => handleStyleChange({ textShadow: !style.textShadow })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${style.textShadow ? 'bg-primary' : 'bg-muted'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
                    ${style.textShadow ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* 最大行数 */}
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2">
                <Maximize2 className="w-3 h-3" />
                {t.caption?.maxLines}: {style.maxLines}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={style.maxLines}
                onChange={(e) => handleStyleChange({ maxLines: parseInt(e.target.value) })}
                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                         [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CaptionControls
