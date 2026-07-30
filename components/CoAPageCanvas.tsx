"use client"

import { useEffect, useRef, useState } from "react"

declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string }
      getDocument: (src: string) => { promise: Promise<PdfDocument> }
    }
  }
}

interface PdfViewport {
  width: number
  height: number
}

interface PdfPage {
  getViewport: (options: { scale: number }) => PdfViewport
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }) => { promise: Promise<void> }
}

interface PdfDocument {
  getPage: (pageNumber: number) => Promise<PdfPage>
}

const PDFJS_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
const PDFJS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

let pdfJsLoader: Promise<void> | null = null

function loadPdfJs() {
  if (typeof window === "undefined") return Promise.reject(new Error("Window is not available."))
  if (window.pdfjsLib) return Promise.resolve()
  if (pdfJsLoader) return pdfJsLoader

  pdfJsLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = PDFJS_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Unable to load PDF viewer."))
    document.head.appendChild(script)
  })

  return pdfJsLoader
}

interface CoAPageCanvasProps {
  pdfPath: string
  pageNumber: number
  title: string
}

export function CoAPageCanvas({ pdfPath, pageNumber, title }: CoAPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function renderPage() {
      try {
        setStatus("loading")
        setError("")
        await loadPdfJs()
        if (!window.pdfjsLib) {
          throw new Error("PDF viewer is unavailable.")
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC
        const pdf = await window.pdfjsLib.getDocument(pdfPath).promise
        const page = await pdf.getPage(pageNumber)
        const baseViewport = page.getViewport({ scale: 1 })
        const frameWidth = frameRef.current?.clientWidth ?? 960
        const horizontalPadding = 32
        const targetWidth = Math.max(320, frameWidth - horizontalPadding)
        const scale = targetWidth / baseViewport.width
        const viewport = page.getViewport({ scale })
        const devicePixelRatio = window.devicePixelRatio || 1
        const canvas = canvasRef.current

        if (!canvas) return

        const context = canvas.getContext("2d")
        if (!context) {
          throw new Error("Canvas context is unavailable.")
        }

        canvas.width = Math.floor(viewport.width * devicePixelRatio)
        canvas.height = Math.floor(viewport.height * devicePixelRatio)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`
        context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

        await page.render({
          canvasContext: context,
          viewport,
        }).promise

        if (!cancelled) {
          setStatus("ready")
        }
      } catch (renderError) {
        if (!cancelled) {
          setStatus("error")
          setError(renderError instanceof Error ? renderError.message : "Unable to display this CoA.")
        }
      }
    }

    void renderPage()
    return () => {
      cancelled = true
    }
  }, [pageNumber, pdfPath])

  return (
    <div
      ref={frameRef}
      className="card"
      style={{
        padding: "20px",
        minHeight: "78vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(245,248,252,0.96))",
        overflow: "hidden",
      }}
    >
      {status === "loading" ? (
        <div style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Loading certificate page...</div>
      ) : null}

      {status === "error" ? (
        <div style={{ display: "grid", gap: "12px", justifyItems: "center", textAlign: "center", maxWidth: "560px" }}>
          <div style={{ fontSize: "18px", fontWeight: 600 }}>{title}</div>
          <div style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {error || "This certificate could not be displayed as a single page right now."}
          </div>
          <a href={pdfPath} className="fm-btn-outline" target="_blank" rel="noopener noreferrer">
            Open Source PDF
          </a>
        </div>
      ) : null}

      <canvas
        ref={canvasRef}
        aria-label={title}
        style={{
          display: status === "ready" ? "block" : "none",
          maxWidth: "100%",
          height: "auto",
          borderRadius: "12px",
          boxShadow: "0 24px 60px rgba(10, 22, 42, 0.12)",
          background: "#fff",
        }}
      />
    </div>
  )
}
