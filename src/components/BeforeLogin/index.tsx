import React from 'react'

const BeforeLogin: React.FC = () => {
  return (
    <div
      style={{
        maxWidth: '28rem',
        margin: '0 auto 1.5rem',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--style-radius-xl)',
        border: '1px solid var(--theme-border-color)',
        backgroundColor: 'var(--theme-elevation-50)',
        boxShadow: '0 1px 3px rgb(0 0 0 / 0.06)',
        fontFamily: 'var(--font-body)',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: '0 0 0.5rem',
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--theme-text)',
          lineHeight: 1.4,
        }}
      >
        Welcome to the NABI admin
      </p>
      <p
        style={{
          margin: 0,
          fontSize: '0.875rem',
          color: 'var(--theme-elevation-600)',
          lineHeight: 1.6,
        }}
      >
        {'Sign in from the '}
        <a
          href="/account"
          style={{
            color: 'var(--nabi-primary)',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          /account
        </a>
        {' page, then return here to access the dashboard.'}
      </p>
    </div>
  )
}

export default BeforeLogin
