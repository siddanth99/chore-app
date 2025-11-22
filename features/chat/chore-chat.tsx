'use client'

import { useState, useEffect, useRef } from 'react'

interface ChoreChatProps {
  choreId: string
  currentUserId: string
}

interface Message {
  id: string
  content: string
  fromUserId: string
  toUserId: string
  createdAt: string
  fromUser: {
    id: string
    name: string
    email: string
  }
}

/**
 * Chat component for a chore conversation
 */
export default function ChoreChat({ choreId, currentUserId }: ChoreChatProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages
  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${choreId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Initial load
  useEffect(() => {
    loadMessages()
  }, [choreId])

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages()
    }, 2000)

    return () => clearInterval(interval)
  }, [choreId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sending) return

    setSending(true)
    const messageContent = message.trim()
    setMessage('')

    try {
      const response = await fetch(`/api/chat/${choreId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageContent }),
      })

      if (response.ok) {
        const data = await response.json()
        // Add the new message to the list
        setMessages((prev) => [...prev, data.message])
        // Reload to ensure consistency
        await loadMessages()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send message')
        // Restore message if send failed
        setMessage(messageContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
      setMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-96 border border-gray-200 rounded-lg bg-white">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.fromUserId === currentUserId ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.fromUserId === currentUserId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {msg.fromUserId !== currentUserId && (
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {msg.fromUser.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.fromUserId === currentUserId
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={2}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}

