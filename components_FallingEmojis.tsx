import React, { useEffect, useState } from 'react'

interface Emoji {
  id: number
  x: number
  y: number
  rotation: number
  scale: number
}

export function FallingEmojis() {
  const [emojis, setEmojis] = useState<Emoji[]>([])

  useEffect(() => {
    const emojiCount = 20
    const newEmojis: Emoji[] = []

    for (let i = 0; i < emojiCount; i++) {
      newEmojis.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -50 - Math.random() * 100,
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      })
    }

    setEmojis(newEmojis)

    const animationInterval = setInterval(() => {
      setEmojis((prevEmojis) =>
        prevEmojis.map((emoji) => ({
          ...emoji,
          y: emoji.y + 5,
          rotation: emoji.rotation + 5,
        }))
      )
    }, 50)

    return () => clearInterval(animationInterval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {emojis.map((emoji) => (
        <div
          key={emoji.id}
          className="absolute text-4xl"
          style={{
            left: `${emoji.x}px`,
            top: `${emoji.y}px`,
            transform: `rotate(${emoji.rotation}deg) scale(${emoji.scale})`,
          }}
        >
          😠
        </div>
      ))}
    </div>
  )
}