import Image from 'next/image'
import React from 'react'

const AdminIcon: React.FC = () => {
  return (
    <Image
      alt="NABI"
      src="/favicon.svg"
      width={24}
      height={24}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}

export default AdminIcon
