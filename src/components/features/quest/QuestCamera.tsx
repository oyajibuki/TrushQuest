import { Image as ImageIcon } from 'lucide-react'

interface Props {
  captured: boolean
  onCapture: () => void
}

export default function QuestCamera({ captured, onCapture }: Props) {
  return (
    <div className="bg-black min-h-screen text-white flex flex-col">
      <div className="flex-1 bg-slate-800 flex items-center justify-center relative">
        {captured ? (
          <img
            src="https://images.unsplash.com/photo-1618477461853-cf6ed80fbfc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Captured"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center text-slate-500">
            <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
            <p>カメラ起動中（モック）</p>
          </div>
        )}
      </div>
      <div className="h-40 bg-black flex items-center justify-center">
        {!captured ? (
          <button onClick={onCapture} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300" />
        ) : (
          <p className="text-cyan-400 font-bold">送信中...</p>
        )}
      </div>
    </div>
  )
}
