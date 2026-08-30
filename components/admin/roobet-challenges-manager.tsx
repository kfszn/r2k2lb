'use client'

import { useState, useRef } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  X,
  Check,
  ImagePlus,
  Trophy,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Challenge = {
  id: string
  title: string
  description: string
  prize: string
  image_url: string | null
  active: boolean
  sort_order: number
  created_at: string
}

const EMPTY_FORM = {
  title: '',
  description: '',
  prize: '',
  image_url: null as string | null,
  active: true,
  sort_order: 0,
}

export function RoobetChallengesManager() {
  const { data, mutate } = useSWR<{ challenges: Challenge[] }>(
    '/api/admin/roobet-challenges',
    fetcher
  )
  const challenges = data?.challenges ?? []

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setImgPreview(null)
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  const openEdit = (c: Challenge) => {
    setForm({
      title: c.title,
      description: c.description,
      prize: c.prize,
      image_url: c.image_url,
      active: c.active,
      sort_order: c.sort_order,
    })
    setImgPreview(c.image_url)
    setEditingId(c.id)
    setShowForm(true)
    setError(null)
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/challenges/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload failed')
      setForm((f) => ({ ...f, image_url: json.url }))
      setImgPreview(json.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingImg(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.prize.trim()) {
      setError('Title, description, and prize are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const url = editingId
        ? `/api/admin/roobet-challenges/${editingId}`
        : '/api/admin/roobet-challenges'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      mutate()
      resetForm()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/admin/roobet-challenges/${id}`, { method: 'DELETE' })
      mutate()
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (c: Challenge) => {
    await fetch(`/api/admin/roobet-challenges/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !c.active }),
    })
    mutate()
  }

  const handleReorder = async (c: Challenge, direction: 'up' | 'down') => {
    const idx = challenges.findIndex((ch) => ch.id === c.id)
    const swapWith = direction === 'up' ? challenges[idx - 1] : challenges[idx + 1]
    if (!swapWith) return
    await Promise.all([
      fetch(`/api/admin/roobet-challenges/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: swapWith.sort_order }),
      }),
      fetch(`/api/admin/roobet-challenges/${swapWith.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: c.sort_order }),
      }),
    ])
    mutate()
  }

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Roobet Challenges
        </CardTitle>
        {!showForm && (
          <Button size="sm" onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setImgPreview(null) }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Challenge
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Create / Edit Form */}
        {showForm && (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{editingId ? 'Edit Challenge' : 'New Challenge'}</p>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Challenge Image</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative cursor-pointer group flex items-center justify-center rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors overflow-hidden"
                style={{ minHeight: 140 }}
              >
                {imgPreview ? (
                  <>
                    <Image
                      src={imgPreview}
                      alt="Challenge preview"
                      fill
                      className="object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                      <ImagePlus className="h-6 w-6 text-white" />
                      <p className="text-xs text-white font-semibold">Replace image</p>
                    </div>
                  </>
                ) : uploadingImg ? (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Uploading…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                    <p className="text-xs text-muted-foreground/60">PNG, JPG, WebP — max 5 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Hit 500x on Any Slot"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Prize</Label>
                <Input
                  placeholder="e.g. $50 cash"
                  value={form.prize}
                  onChange={(e) => setForm((f) => ({ ...f, prize: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the challenge requirements, how to enter, any rules…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))}
                  id="roobet-challenge-active"
                />
                <Label htmlFor="roobet-challenge-active" className="cursor-pointer">Active (visible on site)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Sort order</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm} size="sm">Cancel</Button>
              <Button onClick={handleSave} disabled={saving || uploadingImg} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
                {editingId ? 'Save Changes' : 'Create Challenge'}
              </Button>
            </div>
          </div>
        )}

        {/* Challenge list */}
        {!data ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No challenges yet. Click &ldquo;Add Challenge&rdquo; to create one.
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((c, idx) => (
              <div
                key={c.id}
                className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
                  c.active ? 'border-border/40 bg-card/40' : 'border-border/20 bg-muted/10 opacity-60'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted/40 border border-border/30">
                  {c.image_url ? (
                    <Image src={c.image_url} alt={c.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Trophy className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground truncate">{c.title}</p>
                    <Badge variant={c.active ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                      {c.active ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  <p className="text-xs font-semibold text-emerald-400">Prize: {c.prize}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleReorder(c, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleReorder(c, 'down')}
                      disabled={idx === challenges.length - 1}
                      className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Switch
                    checked={c.active}
                    onCheckedChange={() => handleToggleActive(c)}
                    className="scale-75"
                  />

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                  >
                    {deleting === c.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
