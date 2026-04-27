import React from 'react'

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '20px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease'
}

export default function Result({ result }) {
  if (!result) {
    return (
      <div id="no-results" style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#57606f',
        fontSize: '15px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📑</div>
        <p style={{ margin: 0, letterSpacing: '0.5px' }}>No analysis yet. Upload a document or screenshot to get started.</p>
      </div>
    )
  }

  return (
    <div id="analysis-results" style={{ animation: 'fadeInUp 0.6s ease' }}>
      <div
        id="summary-card"
        style={cardStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
        }}
      >
        <h2 style={{
          fontWeight: 700,
          fontSize: '20px',
          marginTop: 0,
          marginBottom: '16px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📋 Summary
        </h2>
        <p style={{
          margin: 0,
          lineHeight: 1.8,
          color: '#dcdde1',
          fontSize: '15px'
        }}>
          {result.summary}
        </p>
      </div>

      <div
        id="risks-card"
        style={{
          ...cardStyle,
          borderLeft: '4px solid #ff7675'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 118, 117, 0.15)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
        }}
      >
        <h2 style={{
          fontWeight: 700,
          fontSize: '20px',
          marginTop: 0,
          marginBottom: '16px',
          color: '#ff7675',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          ⚠️ Risks Identified
        </h2>
        {result.risks && result.risks.length > 0 ? (
          <ul style={{
            margin: 0,
            paddingLeft: '0',
            listStyle: 'none'
          }}>
            {result.risks.map((risk, index) => (
              <li key={index} style={{
                padding: '12px 0',
                fontSize: '15px',
                color: '#dcdde1',
                lineHeight: 1.7,
                borderBottom: index < result.risks.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <span style={{ color: '#ff7675', flexShrink: 0, marginTop: '2px' }}>❗</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{
            margin: 0,
            color: '#1dd1a1',
            fontSize: '15px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✅ No significant risks found.
          </p>
        )}
      </div>

      <div
        id="explanation-card"
        style={{
          ...cardStyle,
          borderLeft: '4px solid #8c7ae6'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(140, 122, 230, 0.15)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
        }}
      >
        <h2 style={{
          fontWeight: 700,
          fontSize: '20px',
          marginTop: 0,
          marginBottom: '16px',
          color: '#8c7ae6',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          💬 Plain English Explanation
        </h2>
        <p style={{
          margin: 0,
          lineHeight: 1.8,
          color: '#dcdde1',
          fontSize: '15px'
        }}>
          {result.explanation}
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
