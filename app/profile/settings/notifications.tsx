'use client'

import React, { useEffect, useState } from 'react'
import Button from '@/components/ui/button'
import Card from '@/components/ui/Card'

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState(true)
  const [sms, setSms] = useState(false)
  const [whatsapp, setWhatsapp] = useState(false)
  const [preferred, setPreferred] = useState<'any' | 'email' | 'sms' | 'whatsapp'>('any')
  const [muteFrom, setMuteFrom] = useState<number | ''>('')
  const [muteTo, setMuteTo] = useState<number | ''>('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/notifications/preferences')
        if (res.ok) {
          const json = await res.json()
          setEmail(!!json.email)
          setSms(!!json.sms)
          setWhatsapp(!!json.whatsapp)
          setPreferred(json.preferred || 'any')
          setMuteFrom(json.muteFrom ?? '')
          setMuteTo(json.muteTo ?? '')
        }
      } catch (error) {
        console.error('Error loading preferences:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          sms,
          whatsapp,
          preferred,
          muteFrom: muteFrom === '' ? null : Number(muteFrom),
          muteTo: muteTo === '' ? null : Number(muteTo),
        }),
      })
      if (res.ok) {
        setMessage('Preferences saved successfully!')
      } else {
        setMessage('Failed to save preferences')
      }
    } catch (error) {
      setMessage('Error saving preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-slate-500 dark:text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-50">
        Notification Preferences
      </h1>
      <Card>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Delivery Channels
            </h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={email}
                  onChange={(e) => setEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Email</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={sms}
                  onChange={(e) => setSms(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">SMS</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">WhatsApp</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Preferred channel
            </label>
            <select
              value={preferred}
              onChange={(e) => setPreferred(e.target.value as any)}
              className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="any">Auto (email → whatsapp → sms)</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
              Quiet Hours (Optional)
            </h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Set hours when you don't want to receive external notifications (0-23)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mute from (hour 0-23)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={muteFrom}
                  onChange={(e) =>
                    setMuteFrom(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mute to (hour 0-23)
                </label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={muteTo}
                  onChange={(e) =>
                    setMuteTo(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.includes('success')
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              }`}
            >
              {message}
            </div>
          )}

          <div>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Preferences'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

