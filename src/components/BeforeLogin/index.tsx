import React from 'react'

const BeforeLogin: React.FC = () => {
  return (
    <div>
      <p>
        <b>Welcome to your dashboard!</b>
        {' Admin access uses BetterAuth. Sign in from the /account page, then open /admin.'}
      </p>
    </div>
  )
}

export default BeforeLogin
