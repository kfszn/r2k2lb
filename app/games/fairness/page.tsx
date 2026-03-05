'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ArrowLeft, CheckCircle } from 'lucide-react'
import { GiveawayCounter } from '@/components/giveaway-counter'
import { Header } from '@/components/header'
import crypto from 'crypto'

function verifyResult(serverSeed: string, clientSeed: string, nonce: number) {
  const hmac = crypto.createHmac('sha256', serverSeed)
  hmac.update(`${clientSeed}:${nonce}`)
  const hex = hmac.digest('hex')
  const raw = parseInt(hex.slice(0, 8), 16)
  const float = (raw % 10000) / 100

  // Keno draw simulation
  const pool = Array.from({ length: 30 }, (_, i) => i + 1)
  for (let i = pool.length - 1; i > 0; i--) {
    const h = crypto.createHmac('sha256', serverSeed)
    h.update(`${clientSeed}:${nonce}:${i}`)
    const hx = h.digest('hex')
    const rand = parseInt(hx.slice(0, 8), 16)
    const j = rand % (i + 1)
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const kenoDraw = pool.slice(0, 10).sort((a, b) => a - b)

  // Plinko slot
  let slot = 0
  for (let row = 0; row < 16; row++) {
    const h = crypto.createHmac('sha256', serverSeed)
    h.update(`${clientSeed}:${nonce}:plinko:${row}`)
    const hx = h.digest('hex')
    slot += parseInt(hx.slice(0, 8), 16) % 2
  }

  const serverHash = crypto.createHash('sha256').update(serverSeed).digest('hex')

  return { float, kenoDraw, plinkoSlot: slot, serverHash, hex }
}

export default function FairnessPage() {
  const [serverSeed, setServerSeed] = useState('')
  const [clientSeed, setClientSeed] = useState('')
  const [nonce, setNonce] = useState('')
  const [result, setResult] = useState<ReturnType<typeof verifyResult> | null>(null)

  const verify = () => {
    if (!serverSeed || !clientSeed) return
    const r = verifyResult(serverSeed, clientSeed, parseInt(nonce) || 0)
    setResult(r)
  }

  return (
    <main className="min-h-screen bg-background">
      <GiveawayCounter />
      <Header />

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/games">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Games
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-400" />
            <h1 className="text-2xl font-bold">Provably Fair</h1>
          </div>
        </div>

        {/* How it works */}
        <Card className="border-border/40 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              Every game result is generated using <strong className="text-foreground">HMAC-SHA256</strong> — a cryptographic function that cannot be manipulated. The process:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Before your bet, we show you the <strong className="text-foreground">SHA-256 hash</strong> of the server seed. The real seed is hidden.</li>
              <li>You supply a <strong className="text-foreground">client seed</strong> (default is random, you can change it).</li>
              <li>A <strong className="text-foreground">nonce</strong> increments by 1 each bet — every bet has a unique result.</li>
              <li>Result is <code className="bg-muted rounded px-1 text-xs">HMAC-SHA256(serverSeed, "{'{'}clientSeed{'}'}{':'}{'{'}{nonce}{'}'}")</code></li>
              <li>When you rotate seeds, the real server seed is <strong className="text-foreground">revealed</strong> — you can hash it yourself to confirm it matches what was shown before.</li>
            </ol>

            <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs space-y-1">
              <p className="text-muted-foreground">// Verify yourself with Node.js:</p>
              <p>{'const crypto = require(\'crypto\')'}</p>
              <p>{'const hmac = crypto.createHmac(\'sha256\', SERVER_SEED)'}</p>
              <p>{'hmac.update(`${CLIENT_SEED}:${NONCE}`)'}</p>
              <p>{'const hex = hmac.digest(\'hex\')'}</p>
              <p>{'const float = (parseInt(hex.slice(0, 8), 16) % 10000) / 100'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Verification tool */}
        <Card className="border-border/40">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              Verify a Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Server Seed (revealed after rotation)</Label>
                <Input
                  placeholder="Enter the revealed server seed"
                  value={serverSeed}
                  onChange={e => setServerSeed(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Client Seed</Label>
                <Input
                  placeholder="Enter client seed"
                  value={clientSeed}
                  onChange={e => setClientSeed(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nonce</Label>
                <Input
                  placeholder="0"
                  value={nonce}
                  onChange={e => setNonce(e.target.value)}
                  className="font-mono text-xs w-32"
                  type="number"
                  min={0}
                />
              </div>
            </div>

            <Button onClick={verify} disabled={!serverSeed || !clientSeed} className="w-full">
              Verify Result
            </Button>

            {result && (
              <div className="space-y-4 border-t border-border/40 pt-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Server Seed Hash</p>
                  <code className="block break-all bg-muted rounded px-3 py-2 text-xs">{result.serverHash}</code>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Float Result</p>
                    <p className="text-xl font-bold text-primary">{result.float.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Plinko Slot</p>
                    <p className="text-xl font-bold text-primary">{result.plinkoSlot}</p>
                    <p className="text-xs text-muted-foreground">(of 16)</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-2 text-center">Keno Draw</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {result.kenoDraw.map(n => (
                        <Badge key={n} variant="secondary" className="text-xs px-1.5 py-0">{n}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
