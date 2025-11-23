'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'

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
  const messagesContainerRef = useRef<HTMLDivElement>(null)

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages.length])

  return (
    <div className="flex flex-col h-80 sm:h-96 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            <p className="text-sm">No messages yet. Say hello to get started.</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isCurrentUser = msg.fromUserId === currentUserId
              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    isCurrentUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white rounded-br-none dark:bg-blue-500'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-bl-none'
                    }`}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs font-medium mb-1 text-slate-500 dark:text-slate-400">
                        {msg.fromUser.name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser
                          ? 'text-blue-100'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={2}
            className="flex-1 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 resize-none"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={sending || !message.trim()}
            variant="primary"
            size="sm"
            className="self-end"
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  )
}

