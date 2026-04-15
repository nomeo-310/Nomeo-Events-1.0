'use client'

import Image from 'next/image'
import { useState } from 'react'

interface UserAvatarProps {
  userName: string
  userAvatar?: string | null
  context?: string
  className?: string
}

export const UserAvatar = ({ userName, userAvatar, context = 'default', className = '' }: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false)
  
  const getAvatarText = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  
  if (userAvatar && !imageError) {
    return (
      <div className={`relative ${className}`}>
        <Image 
          src={userAvatar} 
          alt={userName} 
          fill 
          className="rounded-full object-cover" 
          onError={() => setImageError(true)} 
          sizes="(max-width: 768px) 32px, 48px" 
        />
      </div>
    )
  }
  
  return (
    <div className={`bg-indigo-600 ${className} flex items-center justify-center rounded-full`}>
      <span className="text-white font-bold text-sm">{getAvatarText(userName)}</span>
    </div>
  )
}