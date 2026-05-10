import { useRef, useEffect, useState } from 'react'
import { Camera, ImagePlus } from 'lucide-react'

interface Props {
  captured: boolean
  onCapture: () => void
}

export default function QuestCamera({ captured, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stopped = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraReady(true)
      })
      .catch(() => setError('カメラへのアクセスが許可されていません'))

    return () => {
      stopped = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.85))
    streamRef.current?.getTracks().forEach(t => t.stop())
    onCapture()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCapturedImage(url)
    streamRef.current?.getTracks().forEach(t => t.stop())
    onCapture()
  }

  const viewHeight = 'calc(100dvh - 10rem)'

  return (
    <div className="bg-black min-h-screen text-white flex flex-col">
      <div className="flex-1 relative bg-slate-900" style={{ minHeight: viewHeight }}>
        {error ? (
          <div className="flex items-center justify-center text-center p-8" style={{ minHeight: viewHeight }}>
            <div>
              <Camera size={48} className="mx-auto mb-4 opacity-40" />
              <p className="text-sm text-slate-400">{error}</p>
              <p className="text-xs text-slate-500 mt-2">ブラウザの設定でカメラを許可してください</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold px-5 py-3 rounded-2xl transition-colors mx-auto"
              >
                <ImagePlus size={18} /> ライブラリから選択
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <img src={capturedImage} alt="撮影した写真" className="w-full object-cover" style={{ minHeight: viewHeight }} />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full object-cover" style={{ minHeight: viewHeight }} />
        )}
        <canvas ref={canvasRef} className="hidden" />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        {!capturedImage && !error && (
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8">
            <div className="border-2 border-white/30 rounded-2xl flex-1" />
            <p className="text-center text-xs text-white/60 mt-4">
              ゴミを収集している様子を撮影してください
            </p>
          </div>
        )}
      </div>

      <div className="h-40 bg-black flex items-center justify-center gap-8 shrink-0">
        {captured ? (
          <p className="text-cyan-400 font-bold animate-pulse">記録中...</p>
        ) : (
          <>
            {/* ライブラリから選択 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <ImagePlus size={22} />
              </div>
              <span className="text-[10px]">ライブラリ</span>
            </button>

            {/* シャッターボタン */}
            <button
              onClick={handleCapture}
              disabled={!cameraReady || !!error}
              className="w-20 h-20 bg-white rounded-full border-4 border-slate-400 disabled:opacity-40 active:scale-95 transition-transform"
            />

            {/* スペーサー（対称用） */}
            <div className="w-12" />
          </>
        )}
      </div>
    </div>
  )
}
