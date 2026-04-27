import React, { useState, useRef } from 'react'
import Upload from './components/Upload.jsx'
import Result from './components/Result.jsx'
import { uploadFile, analyzeDocument } from './api.js'

export default function App() {
  const [file, setFile] = useState(null)
  const [documentId, setDocumentId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const resultRef = useRef(null)

  function handleFileSelect(selectedFile) {
    setFile(selectedFile)
    setError('')
    setResult(null)
    setDocumentId(null)
  }

  async function handleAnalyze() {
    if (!file) {
      setError('Please select a file first.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      setLoadingText('Uploading document...')
      const uploadResult = await uploadFile(file)

      if (!uploadResult.document_id) {
        throw new Error('Upload failed — no document ID returned.')
      }

      setDocumentId(uploadResult.document_id)

      setLoadingText('Analyzing document with AI...')
      const analysisResult = await analyzeDocument(
        uploadResult.document_id,
        'Analyze this legal document fully'
      )

      setResult(analysisResult)

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Something went wrong. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
      setLoadingText('')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 0%, #1e1e2f, #0a0a0f)',
      color: '#ffffff',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '48px 24px 80px'
      }}>
        <header style={{ textAlign: 'center', marginBottom: '40px', animation: 'fadeInDown 0.6s ease' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #8c7ae6, #9c88ff)',
            marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(140, 122, 230, 0.4)'
          }}>
            <span style={{ fontSize: '32px' }}>⚖️</span>
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 12px 0',
            letterSpacing: '-0.5px'
          }}>
            AI Legal Analyzer
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#a4b0be',
            margin: 0,
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6
          }}>
            Upload a legal document or screenshot. Our AI instantly extracts the text, identifies risks, and provides a plain English summary.
          </p>
        </header>

        <div style={{ animation: 'fadeInUp 0.7s ease' }}>
          <Upload
            onFileSelect={handleFileSelect}
            selectedFile={file}
            loading={loading}
            loadingText={loadingText}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px', animation: 'fadeInUp 0.8s ease' }}>
          <button
            id="analyze-button"
            onClick={handleAnalyze}
            disabled={!file || loading}
            style={{
              background: !file || loading
                ? 'rgba(255, 255, 255, 0.1)'
                : 'linear-gradient(135deg, #8c7ae6, #9c88ff)',
              color: !file || loading ? '#747d8c' : '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 48px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: !file || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: !file || loading
                ? 'none'
                : '0 8px 24px rgba(140, 122, 230, 0.3)',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (file && !loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(140, 122, 230, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = file && !loading
                ? '0 8px 24px rgba(140, 122, 230, 0.3)'
                : 'none'
            }}
          >
            {loading ? '⏳ Processing...' : '🔍 Analyze Content'}
          </button>
        </div>

        {error && (
          <div id="error-banner" style={{
            background: 'rgba(231, 76, 60, 0.1)',
            color: '#ff7675',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid rgba(231, 76, 60, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <span>❌</span> {error}
          </div>
        )}

        <div ref={resultRef}>
          <Result result={result} />
        </div>

        <footer style={{
          textAlign: 'center',
          marginTop: '64px',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <p style={{
            fontSize: '13px',
            color: '#57606f',
            margin: 0,
            letterSpacing: '0.5px'
          }}>
            Powered by Gemini AI · Built with FastAPI & React
          </p>
        </footer>
      </div>
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
