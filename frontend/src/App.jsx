import React, { useState, useRef, useCallback } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'

const STYLES = [
  { key: 'cyberpunk', label: 'Cyberpunk' },
  { key: 'anime', label: 'Anime' },
  { key: 'watercolor', label: 'Watercolor' },
  { key: 'oil_painting', label: 'Oil Painting' },
  { key: '3d_render', label: '3D Render' },
  { key: 'pixel_art', label: 'Pixel Art' },
  { key: 'concept_art', label: 'Concept Art' },
  { key: 'minimalist', label: 'Minimalist' },
]

// 空字符串 = 相对路径，前端和后端同源，兼容 JupyterLab proxy
const BACKEND_URL = ''

export default function App() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState('cyberpunk')
  const [strength, setStrength] = useState(0.8)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('img2img') // 'img2img' or 'text2img'
  const [textPrompt, setTextPrompt] = useState('')

  // 从 Excalidraw 导出画布为 PNG
  const exportCanvasAsPNG = useCallback(async () => {
    if (!excalidrawAPI) return null
    const elements = excalidrawAPI.getSceneElements()
    if (!elements || elements.length === 0) {
      throw new Error('Canvas is empty! Draw something first.')
    }
    const appState = excalidrawAPI.getAppState()
    const files = excalidrawAPI.getFiles()

    const { exportToBlob } = await import('@excalidraw/excalidraw')
    const blob = await exportToBlob({
      elements,
      appState: { ...appState, exportBackground: true },
      files,
      mimeType: 'image/png',
      quality: 1.0,
    })
    return blob
  }, [excalidrawAPI])

  // 图生图
  const handleGenerateImg2Img = useCallback(async () => {
    setError(null)
    setIsGenerating(true)
    setGeneratedImage(null)
    try {
      const blob = await exportCanvasAsPNG()
      if (!blob) throw new Error('Failed to export canvas')

      const formData = new FormData()
      formData.append('file', blob, 'canvas.png')
      formData.append('style', selectedStyle)
      formData.append('strength', strength.toString())

      const resp = await fetch(`${BACKEND_URL}/api/generate/img2img`, {
        method: 'POST',
        body: formData,
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || 'Generation failed')
      }
      const data = await resp.json()
      setGeneratedImage(data.image)
    } catch (e) {
      setError(e.message)
    } finally {
      setIsGenerating(false)
    }
  }, [exportCanvasAsPNG, selectedStyle, strength])

  // 文生图
  const handleGenerateText2Img = useCallback(async () => {
    setError(null)
    setIsGenerating(true)
    setGeneratedImage(null)
    try {
      if (!textPrompt.trim()) throw new Error('Please enter a prompt')

      const resp = await fetch(`${BACKEND_URL}/api/generate/text2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textPrompt,
          style: selectedStyle,
        }),
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || 'Generation failed')
      }
      const data = await resp.json()
      setGeneratedImage(data.image)
    } catch (e) {
      setError(e.message)
    } finally {
      setIsGenerating(false)
    }
  }, [textPrompt, selectedStyle])

  // 下载生成的图片
  const handleDownload = useCallback(() => {
    if (!generatedImage) return
    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `ai-canvas-${selectedStyle}-${Date.now()}.png`
    link.click()
  }, [generatedImage, selectedStyle])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* 左侧:画布区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0' }}>
        {/* 顶部工具栏 */}
        <div style={{
          padding: '12px 20px',
          background: '#1a1a2e',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 700 }}>AI Canvas</h1>
            <span style={{ fontSize: '12px', opacity: 0.6 }}>AMD Radeon GPU + Flux schnell</span>
          </div>
          {/* 模式切换 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setMode('img2img')}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: mode === 'img2img' ? '#e94560' : '#333',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Sketch → Art (img2img)
            </button>
            <button
              onClick={() => setMode('text2img')}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: mode === 'text2img' ? '#e94560' : '#333',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Text → Art (text2img)
            </button>
          </div>
        </div>

        {/* 画布或文生图输入 */}
        <div style={{ flex: 1, position: 'relative' }}>
          {mode === 'img2img' ? (
            <div style={{ width: '100%', height: '100%' }}>
              <Excalidraw
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                UIOptions={{
                  canvasActions: {
                    loadScene: true,
                    saveToActiveFile: true,
                    export: { saveFileToDisk: true },
                    toggleTheme: true,
                  },
                }}
              />
            </div>
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: '#fafafa', padding: '40px',
            }}>
              <h2 style={{ marginBottom: '20px', color: '#333' }}>Describe what you want to create</h2>
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="e.g., a majestic dragon flying over a medieval castle at dawn..."
                style={{
                  width: '100%', maxWidth: '600px',
                  minHeight: '120px',
                  padding: '16px', fontSize: '15px',
                  borderRadius: '8px', border: '2px solid #e94560',
                  resize: 'vertical', outline: 'none',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 右侧:控制面板 + 结果展示 */}
      <div style={{
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8f9fa',
        flexShrink: 0,
      }}>
        {/* 风格选择 */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>STYLE PRESET</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setSelectedStyle(s.key)}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: selectedStyle === s.key ? '2px solid #e94560' : '2px solid #ddd',
                  background: selectedStyle === s.key ? '#fff0f3' : '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: selectedStyle === s.key ? 600 : 400,
                  color: '#333',
                  transition: 'all 0.2s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 风格化强度(img2img 模式) */}
        {mode === 'img2img' && (
          <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>
              STRENGTH: {strength.toFixed(1)}
            </h3>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={strength}
              onChange={(e) => setStrength(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#e94560' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999', marginTop: '4px' }}>
              <span>Preserve sketch</span>
              <span>Full restyle</span>
            </div>
          </div>
        )}

        {/* 生成按钮 */}
        <div style={{ padding: '20px' }}>
          <button
            onClick={mode === 'img2img' ? handleGenerateImg2Img : handleGenerateText2Img}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: isGenerating ? '#ccc' : '#e94560',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isGenerating ? 'Generating on AMD GPU...' : 'Generate'}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            margin: '0 20px 20px',
            padding: '12px 16px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '6px',
            color: '#c33',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {/* 生成结果 */}
        <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '14px', color: '#555' }}>RESULT</h3>
          {generatedImage ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <img
                src={generatedImage}
                alt="Generated"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}
              />
              <button
                onClick={handleDownload}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '2px solid #e94560',
                  background: '#fff',
                  color: '#e94560',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Download PNG
              </button>
            </div>
          ) : (
            <div style={{
              width: '100%', height: '200px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed #ddd', borderRadius: '8px',
              color: '#aaa', fontSize: '13px',
            }}>
              {isGenerating ? 'Flux is generating...' : 'Generated image will appear here'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
