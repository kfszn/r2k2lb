'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, DollarSign, Loader2, Download, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

interface WagerBonusClaim {
  id?: string
  username: string
  platform: string
  tierName: string
  wagerAmount: number
  rewardAmount: number
  periodStart: string
  periodEnd: string
  claimDate: string
  status: 'pending' | 'approved' | 'paid'
}

export function LossbackManagement() {
  const [username, setUsername] = useState('')
  const [monthlyWagers, setMonthlyWagers] = useState('')
  const [netLoss, setNetLoss] = useState('')
  const [claims, setClaims] = useState<LossbackClaim[]>([])
  const [wagerClaims, setWagerClaims] = useState<WagerBonusClaim[]>([])
  const [selectedClaim, setSelectedClaim] = useState<LossbackClaim | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  
  // Wager bonus manual entry state
  const [wagerUsername, setWagerUsername] = useState('')
  const [wagerPlatform, setWagerPlatform] = useState('packdraw')
  const [wagerTier, setWagerTier] = useState('')
  const [wagerAmount, setWagerAmount] = useState('')
  const [rewardAmount, setRewardAmount] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  
  const supabase = createClient()

  // Load existing claims from database on mount
  useEffect(() => {
    const loadClaims = async () => {
      try {
        // Load lossback claims
        const { data: lbData, error: lbError } = await supabase
          .from('lossback_claims')
          .select('*')
          .order('claim_date', { ascending: false })

        if (lbError) throw lbError
        
        const loadedClaims: LossbackClaim[] = lbData.map((item: any) => ({
          username: item.acebet_username,
          monthlyWagers: item.monthly_wagers,
          netLoss: item.net_loss,
          tier: item.tier,
          percentage: item.percentage,
          claimAmount: item.claim_amount,
          claimDate: new Date(item.claim_date).toLocaleDateString(),
          status: item.status,
          previousClaimAmount: 0,
          requiredMinimumLoss: Math.abs(item.net_loss),
          id: item.id,
        }))
        
        setClaims(loadedClaims)

        // Load wager bonus claims
        const { data: wbData, error: wbError } = await supabase
          .from('wager_bonus_claims')
          .select('*')
          .order('claim_date', { ascending: false })

        if (wbError) throw wbError

        const loadedWagerClaims: WagerBonusClaim[] = wbData.map((item: any) => ({
          id: item.id,
          username: item.username,
          platform: item.platform,
          tierName: item.tier_name,
          wagerAmount: item.wager_amount,
          rewardAmount: item.reward_amount,
          periodStart: new Date(item.period_start).toLocaleDateString(),
          periodEnd: new Date(item.period_end).toLocaleDateString(),
          claimDate: new Date(item.claim_date).toLocaleDateString(),
          status: item.status,
        }))

        setWagerClaims(loadedWagerClaims)
      } catch (error) {
        console.error('Failed to load claims:', error)
      } finally {
        setLoading(false)
      }
    }

    loadClaims()
  }, [supabase])

  // Save claim to database
  const saveClaim = async (claim: LossbackClaim) => {
    try {
      const { error } = await supabase
        .from('lossback_claims')
        .insert({
          acebet_username: claim.username,
          monthly_wagers: claim.monthlyWagers,
          net_loss: claim.netLoss,
          tier: claim.tier,
          percentage: claim.percentage,
          claim_amount: claim.claimAmount,
          status: claim.status,
          claim_date: new Date().toISOString(),
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to save claim:', error)
      return false
    }
  }

  // Create wager bonus claim from manual entry
  const handleCreateWagerClaim = async () => {
    if (!wagerUsername || !wagerTier || !wagerAmount || !rewardAmount || !periodStart || !periodEnd) {
      alert('Please fill in all fields')
      return
    }

    const newClaim: WagerBonusClaim = {
      username: wagerUsername,
      platform: wagerPlatform,
      tierName: wagerTier,
      wagerAmount: parseFloat(wagerAmount),
      rewardAmount: parseFloat(rewardAmount),
      periodStart,
      periodEnd,
      claimDate: new Date().toLocaleDateString(),
      status: 'pending',
    }

    setSaving(true)
    const saved = await saveWagerBonusClaim(newClaim)
    setSaving(false)

    if (saved) {
      setWagerClaims([newClaim, ...wagerClaims])
      // Reset form
      setWagerUsername('')
      setWagerPlatform('packdraw')
      setWagerTier('')
      setWagerAmount('')
      setRewardAmount('')
      setPeriodStart('')
      setPeriodEnd('')
    } else {
      alert('Failed to save claim. Please try again.')
    }
  }
    try {
      const { error } = await supabase
        .from('wager_bonus_claims')
        .insert({
          username: claim.username,
          platform: claim.platform,
          tier_name: claim.tierName,
          wager_amount: claim.wagerAmount,
          reward_amount: claim.rewardAmount,
          period_start: claim.periodStart,
          period_end: claim.periodEnd,
          status: claim.status,
          claim_date: new Date().toISOString(),
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to save wager bonus claim:', error)
      return false
    }
  }

  // Import wager bonus claims from CSV
  const handleImportWagerClaims = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const newClaims: WagerBonusClaim[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const claim: WagerBonusClaim = {
          username: values[headers.indexOf('username')] || '',
          platform: values[headers.indexOf('platform')] || 'packdraw',
          tierName: values[headers.indexOf('tier')] || values[headers.indexOf('tier_name')] || '',
          wagerAmount: parseFloat(values[headers.indexOf('wager')] || values[headers.indexOf('wager_amount')] || '0'),
          rewardAmount: parseFloat(values[headers.indexOf('reward')] || values[headers.indexOf('reward_amount')] || '0'),
          periodStart: values[headers.indexOf('period_start')] || values[headers.indexOf('start_date')] || '',
          periodEnd: values[headers.indexOf('period_end')] || values[headers.indexOf('end_date')] || '',
          claimDate: new Date().toLocaleDateString(),
          status: 'pending',
        }

        if (claim.username && claim.tierName) {
          newClaims.push(claim)
          await saveWagerBonusClaim(claim)
        }
      }

      setWagerClaims(prev => [...newClaims, ...prev])
      alert(`Successfully imported ${newClaims.length} wager bonus claims`)
      
      // Reset file input
      if (event.target) {
        event.target.value = ''
      }
    } catch (error) {
      console.error('Failed to import claims:', error)
      alert('Failed to import claims. Please check the CSV format.')
    } finally {
      setImporting(false)
    }
  }

  // Update wager claim status
  const updateWagerClaimStatus = async (id: string | undefined, newStatus: string) => {
    if (!id) return

    try {
      const { error } = await supabase
        .from('wager_bonus_claims')
        .update({ 
          status: newStatus,
          approved_at: newStatus === 'approved' ? new Date().toISOString() : null,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      setWagerClaims(prev => prev.map(claim => 
        claim.id === id ? { ...claim, status: newStatus as any } : claim
      ))
      
      return true
    } catch (error) {
      console.error('Failed to update wager claim:', error)
      return false
    }
  }

  const calculateTier = (wagers: number): { tier: number; percentage: number } => {
    if (wagers <= 100000) return { tier: 1, percentage: 5 }
    if (wagers <= 499999) return { tier: 2, percentage: 10 }
    return { tier: 3, percentage: 15 }
  }

  const calculateLossback = (netLoss: number, percentage: number): number => {
    const calculated = Math.abs(netLoss) * (percentage / 100)
    return Math.min(calculated, 250)
  }

  const getRequiredMinimumLoss = (previousClaim: LossbackClaim): number => {
    return previousClaim.requiredMinimumLoss + 300
  }

  const handleVerifyAndCreate = async () => {
    if (!username || !monthlyWagers || !netLoss) {
      alert('Please fill in all fields')
      return
    }

    const wagers = parseFloat(monthlyWagers)
    const loss = parseFloat(netLoss)

    if (Math.abs(loss) < 300) {
      alert('Minimum net loss of $300 required')
      return
    }

    const { tier, percentage } = calculateTier(wagers)
    const claimAmount = calculateLossback(loss, percentage)

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

    setSaving(true)
    const saved = await saveClaim(newClaim)
    setSaving(false)

    if (saved) {
      setClaims([newClaim, ...claims])
      setSelectedClaim(newClaim)
      setUsername('')
      setMonthlyWagers('')
      setNetLoss('')
    } else {
      alert('Failed to save claim. Please try again.')
    }
  }

  const updateClaimStatus = async (index: number, status: 'approved' | 'paid') => {
    const claim = claims[index]
    const success = await updateClaimStatusDb(claim.username, status)
    
    if (success) {
      const updated = [...claims]
      updated[index].status = status
      setClaims(updated)
    } else {
      alert('Failed to update claim status.')
    }
  }

  const updateClaimStatusDb = async (username: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('lossback_claims')
        .update({ 
          status: newStatus,
          approved_at: newStatus === 'approved' ? new Date().toISOString() : null,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
        })
        .eq('acebet_username', username)
        .order('claim_date', { ascending: false })
        .limit(1)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to update claim:', error)
      return false
    }
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
      <Tabs defaultValue="lossback" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lossback">Loss-back Claims</TabsTrigger>
          <TabsTrigger value="wager">Wager Bonus Claims ({wagerClaims.length})</TabsTrigger>
        </TabsList>

        {/* Loss-back Claims Tab */}
        <TabsContent value="lossback" className="space-y-6">
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

              <Button 
                onClick={handleVerifyAndCreate} 
                size="lg" 
                className="w-full"
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-muted-foreground">Loading claims...</p>
                </div>
              </CardContent>
            </Card>
          ) : claims.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Loss-back Claims History ({claims.length})</CardTitle>
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
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No loss-back claims yet</p>
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
        </TabsContent>

        {/* Wager Bonus Claims Tab */}
        <TabsContent value="wager" className="space-y-6">
          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Import Wager Bonus Claims
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm">
                <p className="text-muted-foreground mb-2">
                  <strong>CSV Format:</strong> username, platform, tier, wager_amount, reward_amount, period_start, period_end
                </p>
                <p className="text-xs text-muted-foreground">
                  Example: john_doe, packdraw, Gold, 20000, 100, 2024-01-01, 2024-01-31
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv-import">Upload CSV File</Label>
                <div className="flex gap-2">
                  <Input
                    id="csv-import"
                    type="file"
                    accept=".csv"
                    onChange={handleImportWagerClaims}
                    disabled={importing}
                  />
                  {importing && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Importing...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wager Claims History */}
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-muted-foreground">Loading claims...</p>
                </div>
              </CardContent>
            </Card>
          ) : wagerClaims.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Wager Bonus Claims History ({wagerClaims.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wagerClaims.map((claim, idx) => (
                    <div key={idx} className="border border-border/50 rounded-lg p-4 hover:bg-secondary/20 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{claim.username}</p>
                          <p className="text-xs text-muted-foreground">
                            Period: {claim.periodStart} - {claim.periodEnd}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(claim.status)}>
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-5 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Platform</p>
                          <p className="font-semibold capitalize">{claim.platform}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tier</p>
                          <p className="font-semibold">{claim.tierName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Wager Amount</p>
                          <p className="font-semibold">${claim.wagerAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Reward</p>
                          <p className="font-semibold text-green-600">${claim.rewardAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Imported</p>
                          <p className="font-semibold text-xs">{claim.claimDate}</p>
                        </div>
                      </div>

                      {claim.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWagerClaimStatus(claim.id, 'approved')}
                            className="flex-1"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateWagerClaimStatus(claim.id, 'paid')}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Mark Paid
                          </Button>
                        </div>
                      )}
                      {claim.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => updateWagerClaimStatus(claim.id, 'paid')}
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
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No wager bonus claims imported yet</p>
              </CardContent>
            </Card>
          )}

          {/* Info Box */}
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Wager Bonus Claims Management</p>
                <ul className="space-y-1 text-xs">
                  <li>• Import claims via CSV with platform, tier, wager, reward, and period dates</li>
                  <li>• All claims are auto-saved with import timestamp and period tracking</li>
                  <li>• Status workflow: Pending → Approved → Paid</li>
                  <li>• Each claim maintains full historical records for auditing</li>
                  <li>• Period dates are tracked automatically for monthly reporting</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        {/* Wager Bonus Claims Tab */}
        <TabsContent value="wager" className="space-y-6">
          {/* Manual Entry Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Create Wager Bonus Claim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wager-username">Username</Label>
                  <Input
                    id="wager-username"
                    placeholder="e.g., player123"
                    value={wagerUsername}
                    onChange={(e) => setWagerUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wager-platform">Platform</Label>
                  <select
                    id="wager-platform"
                    value={wagerPlatform}
                    onChange={(e) => setWagerPlatform(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="packdraw">Packdraw</option>
                    <option value="acebet">Acebet</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wager-tier">Tier Name</Label>
                  <Input
                    id="wager-tier"
                    placeholder="e.g., Gold, Silver"
                    value={wagerTier}
                    onChange={(e) => setWagerTier(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wager-amount">Wager Amount ($)</Label>
                  <Input
                    id="wager-amount"
                    type="number"
                    placeholder="e.g., 20000"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward-amount">Reward Amount ($)</Label>
                  <Input
                    id="reward-amount"
                    type="number"
                    placeholder="e.g., 100"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period-start">Period Start Date</Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period-end">Period End Date</Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreateWagerClaim} 
                size="lg" 
                className="w-full"
                disabled={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Claim
              </Button>
            </CardContent>
          </Card>

          {/* CSV Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Import Wager Bonus Claims
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">CSV Format:</span> username, platform, tier, wager_amount, reward_amount, period_start, period_end
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Example: john_doe, packdraw, Gold, 20000, 100, 2024-01-01, 2024-01-31
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csv-upload">Upload CSV File</Label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleImportWagerClaims}
                  disabled={importing}
                  className="block w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Wager Claims History */}
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-muted-foreground">Loading claims...</p>
                </div>
              </CardContent>
            </Card>
          ) : wagerClaims.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Wager Bonus Claims History ({wagerClaims.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wagerClaims.map((claim, idx) => (
                    <div key={idx} className="border border-border/50 rounded-lg p-4 hover:bg-secondary/20 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{claim.username}</p>
                          <p className="text-xs text-muted-foreground">Claimed: {claim.claimDate}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(claim.status)}>
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-5 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Platform</p>
                          <p className="font-semibold capitalize">{claim.platform}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tier</p>
                          <p className="font-semibold">{claim.tierName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Wager Amount</p>
                          <p className="font-semibold">${claim.wagerAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Period</p>
                          <p className="font-semibold text-xs">{claim.periodStart} to {claim.periodEnd}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Reward</p>
                          <p className="font-semibold text-green-600">${claim.rewardAmount.toFixed(2)}</p>
                        </div>
                      </div>

                      {claim.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWagerClaimStatus(claim.id, 'approved')}
                            className="flex-1"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateWagerClaimStatus(claim.id, 'paid')}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Mark Paid
                          </Button>
                        </div>
                      )}
                      {claim.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => updateWagerClaimStatus(claim.id, 'paid')}
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
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No wager bonus claims yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
