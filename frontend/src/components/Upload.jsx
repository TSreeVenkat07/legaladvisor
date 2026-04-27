import React, { useRef, useState } from 'react'

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.png', '.jpg', '.jpeg']
const MAX_SIZE = 10 * 1024 * 1024

export default function Upload({ onFileSelect, selectedFile, loading, loadingText }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileError, setFileError] = useState('')

  function validateFile(file) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('Only PDF, DOCX, PNG, or JPG files allowed.')
      return false
    }
    if (file.size > MAX_SIZE) {
      setFileError('File too large. Max 10MB.')
      return false
    }
    setFileError('')
    return true
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file && validateFile(file)) {
      onFileSelect(file)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) {
      onFileSelect(file)
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div
        id="upload-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        style={{
          border: dragOver ? '2px solid #8c7ae6' : '2px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: dragOver
            ? 'rgba(140, 122, 230, 0.1)'
            : 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          position: 'relative',
          opacity: loading ? 0.6 : 1,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          if (!loading && !dragOver) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.border = '2px dashed rgba(255, 255, 255, 0.4)'
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && !dragOver) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
            e.currentTarget.style.border = '2px dashed rgba(255, 255, 255, 0.2)'
          }
        }}
      >
        <input
          id="file-input"
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={loading}
        />
        <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.9 }}>📄</div>
        <p style={{
          fontSize: '16px',
          color: '#f1f2f6',
          margin: '0 0 8px 0',
          fontWeight: 500
        }}>
          {selectedFile
            ? selectedFile.name
            : 'Drag & drop your document or screenshot here'}
        </p>
        {!selectedFile && (
          <p style={{
            fontSize: '14px',
            color: '#a4b0be',
            margin: 0
          }}>
            or click to browse — PDF, DOCX, PNG, JPG (max 10MB)
          </p>
        )}
        {selectedFile && (
          <p style={{
            fontSize: '14px',
            color: '#8c7ae6',
            margin: '4px 0 0 0',
            fontWeight: 500
          }}>
            ✓ File selected — {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
        )}
      </div>

      {fileError && (
        <p id="file-error" style={{
          color: '#ff7675',
          fontSize: '14px',
          marginTop: '12px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          ⚠️ {fileError}
        </p>
      )}

      {loading && loadingText && (
        <div id="loading-indicator" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(140, 122, 230, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(140, 122, 230, 0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '3px solid rgba(140, 122, 230, 0.3)',
            borderTop: '3px solid #8c7ae6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span style={{
            fontSize: '14px',
            color: '#9c88ff',
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}>
            {loadingText}
          </span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
