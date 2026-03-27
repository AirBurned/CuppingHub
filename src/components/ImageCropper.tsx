'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface ImageCropperProps {
  file: File
  aspectRatio?: number // width/height, e.g. 16/9 = 1.78
  onCrop: (croppedBlob: Blob) => void
  onCancel: () => void
}

export default function ImageCropper({ file, aspectRatio = 4 / 3, onCrop, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [imgSrc, setImgSrc] = useState('')
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgSrc(url)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
      // Initial crop: centered, max size fitting aspect ratio
      const imgAspect = img.naturalWidth / img.naturalHeight
      let cropW: number, cropH: number
      if (imgAspect > aspectRatio) {
        cropH = img.naturalHeight
        cropW = cropH * aspectRatio
      } else {
        cropW = img.naturalWidth
        cropH = cropW / aspectRatio
      }
      setCropArea({
        x: (img.naturalWidth - cropW) / 2,
        y: (img.naturalHeight - cropH) / 2,
        w: cropW,
        h: cropH,
      })
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file, aspectRatio])

  // Scale factor: displayed size vs natural size
  const getScale = useCallback(() => {
    if (!containerRef.current || !imgSize.w) return 1
    return containerRef.current.clientWidth / imgSize.w
  }, [imgSize.w])

  function handlePointerDown(e: React.PointerEvent) {
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const scale = getScale()
    const dx = (e.clientX - dragStart.x) / scale
    const dy = (e.clientY - dragStart.y) / scale
    setDragStart({ x: e.clientX, y: e.clientY })
    setCropArea((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(imgSize.w - prev.w, prev.x + dx)),
      y: Math.max(0, Math.min(imgSize.h - prev.h, prev.y + dy)),
    }))
  }

  function handlePointerUp() {
    setDragging(false)
  }

  function handleCrop() {
    if (!imgRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const outputW = 800
    const outputH = outputW / aspectRatio
    canvas.width = outputW
    canvas.height = outputH
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(imgRef.current, cropArea.x, cropArea.y, cropArea.w, cropArea.h, 0, 0, outputW, outputH)
    canvas.toBlob((blob) => {
      if (blob) onCrop(blob)
    }, 'image/jpeg', 0.85)
  }

  const scale = imgSize.w ? (containerRef.current?.clientWidth || 300) / imgSize.w : 1

  return (
    <div className="space-y-3">
      <p className="text-xs text-warm-500">Перетащите рамку для выбора области</p>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg border border-warm-200 select-none"
        style={{ touchAction: 'none' }}
      >
        {imgSrc && (
          <>
            <img src={imgSrc} alt="Crop" className="w-full" draggable={false} />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />
            {/* Crop window */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{
                left: cropArea.x * scale,
                top: cropArea.y * scale,
                width: cropArea.w * scale,
                height: cropArea.h * scale,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Clear area inside crop */}
              <div className="w-full h-full overflow-hidden">
                <img
                  src={imgSrc}
                  alt=""
                  draggable={false}
                  className="max-w-none"
                  style={{
                    width: imgSize.w * scale,
                    height: imgSize.h * scale,
                    marginLeft: -cropArea.x * scale,
                    marginTop: -cropArea.y * scale,
                  }}
                />
              </div>
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
              </div>
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={handleCrop}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-dark font-medium rounded-lg text-sm transition-colors">
          Обрезать и загрузить
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 bg-warm-100 text-warm-700 hover:bg-warm-200 rounded-lg text-sm transition-colors">
          Отмена
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
