import { X, Download, Calendar, Clock, FileText } from 'lucide-react'
import type { TranscriptSession } from '../types'
import { exportToTxt } from '../utils/storage'

interface PreviewModalProps {
  session: TranscriptSession | null
  onClose: () => void
}

export function PreviewModal({ session, onClose }: PreviewModalProps) {
  if (!session) return null

  const handleExport = () => {
    exportToTxt(session)
  }

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-surface-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-850">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                {session.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {session.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {session.time}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {session.transcript ? (
            <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap">
              {session.transcript}
            </p>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 py-12">
              <FileText className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">此记录没有转录内容</p>
            </div>
          )}
        </div>

        {/* 底部信息和操作 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-850">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            共 {session.transcript?.length || 0} 个字符
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300
                       hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
            >
              关闭
            </button>
            {session.transcript && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                         bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                导出 TXT
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
