'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react'

interface LossbackClaim {
  username: string
  monthlyWagers: number
  netLoss: number
  tier: number
  percentage: number
  claimAmount: number
  claimDate: string
  status: 'pending' | 'approved' | 'paid'
  previousClaimAmount: number
  requiredMinimumLoss: number
}

export function LossbackManagement() {
  const [username, setUsername] = useState('')
  const [monthlyWagers, setMonthlyWagers] = useState('')
  const [netLoss, setNetLoss] = useState('')
  const [claims, setClaims] = useState<LossbackClaim[]>([])
  const [selectedClaim, setSelectedClaim] = useState<LossbackClaim | null>(null)

  // Calculate tier based on monthly wagers
  const calculateTier = (wagers: number): { tier: number; percentage: number } => {
    if (wagers <= 100000) return { tier: 1, percentage: 5 }
    if (wagers <= 499999) return { tier: 2, percentage: 10 }
    return { tier: 3, percentage: 15 }
  }

  // Calculate loss-back amount
  const calculateLossback = (netLoss: number, percentage: number): number => {
    const calculated = Math.abs(netLoss) * (percentage / 100)
    return Math.min(calculated, 250) // Cap at $250
  }

  // Get required minimum loss for next claim
  const getRequiredMinimumLoss = (previousClaim: LossbackClaim): number => {
    return previousClaim.requiredMinimumLoss + 300
  }

  const handleVerifyAndCreate = () => {
    if (!username || !monthlyWagers || !netLoss) {
      alert('Please fill in all fields')
      return
    }

    const wagers = parseFloat(monthlyWagers)
    const loss = parseFloat(netLoss)

    // Validation checks
    if (Math.abs(loss) < 300) {
      alert('Minimum net loss of $300 required')
      return
    }

    const { tier, percentage } = calculateTier(wagers)
    const claimAmount = calculateLossback(loss, percentage)

    // Check for existing claims and progressive requirement
    const existingClaims = claims.filter(c => c.username.toLowerCase() === username.toLowerCase())
    if (existingClaims.length > 0) {
      const lastClaim = existingClaims[existingClaims.length - 1]
      const requiredMinimum = getRequiredMinimumLoss(lastClaim)
      
      if (Math.abs(loss) < requiredMinimum) {
        alert(
          `Progressive claim requirement not met. Last claim was at -$${lastClaim.requiredMinimumLoss.toFixed(2)}.\n` +
          `Next claim requires minimum -$${requiredMinimum.toFixed(2)} net loss.`
        )
        return
      }
    }

    const newClaim: LossbackClaim = {
      username,
      monthlyWagers: wagers,
      netLoss: loss,
      tier,
      percentage,
      claimAmount,
      claimDate: new Date().toLocaleDateString(),
      status: 'pending',
      previousClaimAmount: existingClaims.length > 0 ? existingClaims[existingClaims.length - 1].claimAmount : 0,
      requiredMinimumLoss: Math.abs(loss),
    }

    setClaims([...claims, newClaim])
    setSelectedClaim(newClaim)
    setUsername('')
    setMonthlyWagers('')
    setNetLoss('')
  }

  const updateClaimStatus = (index: number, status: 'approved' | 'paid') => {
    const updated = [...claims]
    updated[index].status = status
    setClaims(updated)
  }

  const getTierLabel = (tier: number): string => {
    switch (tier) {
      case 1: return 'Tier 1 ($1 - $100k)'
      case 2: return 'Tier 2 ($100k - $500k)'
      case 3: return 'Tier 3 ($500k+)'
      default: return 'Unknown'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
      case 'approved': return 'bg-blue-500/20 text-blue-700 border-blue-500/30'
      case 'paid': return 'bg-green-500/20 text-green-700 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Create Loss-back Claim
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Acebet Username</Label>
              <Input
                id="username"
                placeholder="e.g., player123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wagers">Monthly Wagers ($)</Label>
              <Input
                id="wagers"
                type="number"
                placeholder="e.g., 250000"
                value={monthlyWagers}
                onChange={(e) => setMonthlyWagers(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="netloss">Net Loss ($)</Label>
              <Input
                id="netloss"
                type="number"
                placeholder="e.g., -2500"
                value={netLoss}
                onChange={(e) => setNetLoss(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleVerifyAndCreate} size="lg" className="w-full">
            Verify & Create Claim
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {selectedClaim && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Tier</div>
              <div className="text-2xl font-bold text-primary">{selectedClaim.percentage}%</div>
              <div className="text-xs text-muted-foreground mt-2">{getTierLabel(selectedClaim.tier)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Net Loss</div>
              <div className="text-2xl font-bold">-${Math.abs(selectedClaim.netLoss).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-2">Verified loss</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Loss-back</div>
              <div className="text-2xl font-bold text-green-600">${selectedClaim.claimAmount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-2">Max $250/month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Status</div>
              <Badge className={getStatusColor(selectedClaim.status)}>
                {selectedClaim.status.charAt(0).toUpperCase() + selectedClaim.status.slice(1)}
              </Badge>
              <div className="text-xs text-muted-foreground mt-3">{selectedClaim.claimDate}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Claims History */}
      {claims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Loss-back Claims History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {claims.map((claim, idx) => (
                <div key={idx} className="border border-border/50 rounded-lg p-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{claim.username}</p>
                      <p className="text-xs text-muted-foreground">{claim.claimDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(claim.status)}>
                        {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-5 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Wagers</p>
                      <p className="font-semibold">${claim.monthlyWagers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tier</p>
                      <p className="font-semibold">{getTierLabel(claim.tier)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Net Loss</p>
                      <p className="font-semibold text-red-600">-${Math.abs(claim.netLoss).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Loss-back Rate</p>
                      <p className="font-semibold text-primary">{claim.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Claim Amount</p>
                      <p className="font-semibold text-green-600">${claim.claimAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Progressive Info */}
                  {claim.previousClaimAmount > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mb-3">
                      <p className="text-xs text-muted-foreground">
                        Previous claim: ${claim.previousClaimAmount.toFixed(2)} | Next minimum: -${(claim.requiredMinimumLoss + 300).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {claim.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateClaimStatus(idx, 'approved')}
                        className="flex-1"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateClaimStatus(idx, 'paid')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Mark Paid
                      </Button>
                    </div>
                  )}
                  {claim.status === 'approved' && (
                    <Button
                      size="sm"
                      onClick={() => updateClaimStatus(idx, 'paid')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="pt-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Loss-back Verification Notes</p>
            <ul className="space-y-1 text-xs">
              <li>• Minimum $300 net loss required per claim</li>
              <li>• Monthly cap of $250 per player (from R2K2 pocket)</li>
              <li>• Progressive claims: each subsequent claim requires +$300 from previous</li>
              <li>• Tiers reset monthly based on calendar month wagers</li>
              <li>• Staff manually verifies PnL screenshots before approving</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
