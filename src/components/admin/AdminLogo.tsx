import Image from 'next/image'
import React from 'react'

const AdminLogo: React.FC = () => {
  return (
    <span
      className="admin-logo"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontWeight: 600,
        fontSize: '1rem',
        color: 'var(--theme-text)',
        whiteSpace: 'nowrap',
      }}
    >
      <Image
        alt="NABI"
        src="/favicon.svg"
        width={24}
        height={24}
        style={{ flexShrink: 0 }}
      />
      <span>NABI Labs</span>
    </span>
  )
}

export default AdminLogo
