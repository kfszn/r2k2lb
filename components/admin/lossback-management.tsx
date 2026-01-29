'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, DollarSign, Loader2 } from 'lucide-react'
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
  id?: string
}

interface WagerBonusClaim {
  id?: string
  username: string
  claimAmount: number
  dateClaimed: string
  amountPaid: number
  status: 'pending' | 'approved' | 'paid'
}

export function LossbackManagement() {
  // Loss-back state
  const [username, setUsername] = useState('')
  const [monthlyWagers, setMonthlyWagers] = useState('')
  const [netLoss, setNetLoss] = useState('')
  const [claims, setClaims] = useState<LossbackClaim[]>([])
  const [selectedClaim, setSelectedClaim] = useState<LossbackClaim | null>(null)
  
  // Wager bonus state
  const [wagerClaims, setWagerClaims] = useState<WagerBonusClaim[]>([])
  const [wagerUsername, setWagerUsername] = useState('')
  const [wagerClaimAmount, setWagerClaimAmount] = useState('')
  const [wagerDateClaimed, setWagerDateClaimed] = useState('')
  const [wagerAmountPaid, setWagerAmountPaid] = useState('')
  
  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  // Load claims on mount
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
          id: item.id,
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
        }))
        
        setClaims(loadedClaims)

        // Load wager bonus claims
        const { data: wbData, error: wbError } = await supabase
          .from('wager_bonus_claims')
          .select('*')
          .order('created_at', { ascending: false })

        if (wbError) throw wbError

        const loadedWagerClaims: WagerBonusClaim[] = wbData.map((item: any) => ({
          id: item.id,
          username: item.username,
          claimAmount: item.claim_amount,
          dateClaimed: new Date(item.date_claimed).toLocaleDateString(),
          amountPaid: item.amount_paid,
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

  // Verify and create loss-back claim
  const handleVerifyAndCreate = async () => {
    if (!username || !monthlyWagers || !netLoss) {
      alert('Please fill in all fields')
      return
    }

    setSaving(true)
    try {
      const monthlyWagersNum = parseFloat(monthlyWagers)
      const netLossNum = parseFloat(netLoss)
      
      const { error } = await supabase
        .from('lossback_claims')
        .insert({
          acebet_username: username,
          monthly_wagers: monthlyWagersNum,
          net_loss: netLossNum,
          tier: 1,
          percentage: 10,
          claim_amount: Math.abs(netLossNum) * 0.1,
          status: 'pending',
          claim_date: new Date().toISOString(),
        })

      if (error) throw error

      setUsername('')
      setMonthlyWagers('')
      setNetLoss('')
      
      // Reload claims
      const { data } = await supabase
        .from('lossback_claims')
        .select('*')
        .order('claim_date', { ascending: false })

      if (data) {
        const loadedClaims: LossbackClaim[] = data.map((item: any) => ({
          id: item.id,
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
        }))
        setClaims(loadedClaims)
      }
    } catch (error) {
      console.error('Failed to save claim:', error)
      alert('Failed to save claim. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Create wager bonus claim
  const handleCreateWagerClaim = async () => {
    if (!wagerUsername || !wagerClaimAmount || !wagerDateClaimed || !wagerAmountPaid) {
      alert('Please fill in all fields')
      return
    }

    setSaving(true)
    try {
      const newClaim: WagerBonusClaim = {
        username: wagerUsername,
        claimAmount: parseFloat(wagerClaimAmount),
        dateClaimed: wagerDateClaimed,
        amountPaid: parseFloat(wagerAmountPaid),
        status: 'pending',
      }

      const { data, error } = await supabase
        .from('wager_bonus_claims')
        .insert({
          username: newClaim.username,
          claim_amount: newClaim.claimAmount,
          date_claimed: newClaim.dateClaimed,
          amount_paid: newClaim.amountPaid,
          status: newClaim.status,
          created_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      // Add the new claim to the top of the list immediately
      if (data && data.length > 0) {
        const savedClaim: WagerBonusClaim = {
          id: data[0].id,
          username: data[0].username,
          claimAmount: data[0].claim_amount,
          dateClaimed: new Date(data[0].date_claimed).toLocaleDateString(),
          amountPaid: data[0].amount_paid,
          status: data[0].status,
        }
        setWagerClaims([savedClaim, ...wagerClaims])
      }

      // Reset form
      setWagerUsername('')
      setWagerClaimAmount('')
      setWagerDateClaimed('')
      setWagerAmountPaid('')
    } catch (error) {
      console.error('Failed to save wager claim:', error)
      alert('Failed to save wager claim. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Update claim status
  const updateClaimStatus = async (index: number, status: 'approved' | 'paid') => {
    const claim = claims[index]
    try {
      const { error } = await supabase
        .from('lossback_claims')
        .update({ 
          status: status,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
          paid_at: status === 'paid' ? new Date().toISOString() : null,
        })
        .eq('id', claim.id)

      if (error) throw error

      const updated = [...claims]
      updated[index].status = status
      setClaims(updated)
    } catch (error) {
      console.error('Failed to update claim:', error)
      alert('Failed to update claim status.')
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      setWagerClaims(prev => prev.map(claim => 
        claim.id === id ? { ...claim, status: newStatus as any } : claim
      ))
    } catch (error) {
      console.error('Failed to update wager claim:', error)
      alert('Failed to update claim status.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
      case 'approved':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30'
      case 'paid':
        return 'bg-green-500/20 text-green-700 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30'
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
                  <Label htmlFor="monthly-wagers">Monthly Wagers ($)</Label>
                  <Input
                    id="monthly-wagers"
                    type="number"
                    placeholder="e.g., 250000"
                    value={monthlyWagers}
                    onChange={(e) => setMonthlyWagers(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="net-loss">Net Loss ($)</Label>
                  <Input
                    id="net-loss"
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

          {/* Results Section */}
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
                <CardTitle>Processed Claims ({claims.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {claims.map((claim, idx) => (
                    <div key={idx} className="border border-border/50 rounded-lg p-4 bg-card/50 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Player</p>
                        <p className="font-bold text-lg text-primary truncate">{claim.username}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Tier</p>
                        <p className="text-primary font-bold text-lg">{claim.tier}%</p>
                        <p className="text-xs text-muted-foreground">Tier {claim.tier} ({claim.monthlyWagers.toLocaleString()}&minus;$500k)</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Net Loss</p>
                        <p className="font-semibold">${Math.abs(claim.netLoss).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Verified loss</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Loss-back</p>
                        <p className="text-green-600 font-bold text-lg">${claim.claimAmount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Max $250/month</p>
                      </div>

                      <div className="pt-2 border-t border-border/30">
                        <p className="text-xs text-muted-foreground mb-2">{claim.claimDate}</p>
                        <Badge className={getStatusColor(claim.status)} variant="secondary">
                          {claim.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                          {claim.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {claim.status === 'paid' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </Badge>
                      </div>

                      {claim.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateClaimStatus(idx, 'approved')}
                            className="flex-1 text-xs h-8"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateClaimStatus(idx, 'paid')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                          >
                            Paid
                          </Button>
                        </div>
                      )}
                      {claim.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => updateClaimStatus(idx, 'paid')}
                          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs h-8"
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
        </TabsContent>

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
                  <Label htmlFor="wager-username">Acebet Username</Label>
                  <Input
                    id="wager-username"
                    placeholder="e.g., player123"
                    value={wagerUsername}
                    onChange={(e) => setWagerUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wager-claim-amount">Wager Claim Amount ($)</Label>
                  <Input
                    id="wager-claim-amount"
                    type="number"
                    placeholder="e.g., 100"
                    value={wagerClaimAmount}
                    onChange={(e) => setWagerClaimAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wager-date-claimed">Date Claimed</Label>
                  <Input
                    id="wager-date-claimed"
                    type="date"
                    value={wagerDateClaimed}
                    onChange={(e) => setWagerDateClaimed(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wager-amount-paid">Amount Paid ($)</Label>
                  <Input
                    id="wager-amount-paid"
                    type="number"
                    placeholder="e.g., 100"
                    value={wagerAmountPaid}
                    onChange={(e) => setWagerAmountPaid(e.target.value)}
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
                Verify & Create Claim
              </Button>
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
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {wagerClaims.map((claim, idx) => (
                    <div key={idx} className="border border-border/50 rounded-lg p-4 bg-card/50 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Username</p>
                        <p className="font-semibold text-sm truncate">{claim.username}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Wager Claim Amount</p>
                        <p className="text-primary font-bold text-lg">${claim.claimAmount.toFixed(2)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Date Claimed</p>
                        <p className="font-semibold text-sm">{claim.dateClaimed}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Amount Paid</p>
                        <p className="text-green-600 font-bold text-lg">${claim.amountPaid.toFixed(2)}</p>
                      </div>

                      <div className="pt-2 border-t border-border/30">
                        <Badge className={getStatusColor(claim.status)} variant="secondary">
                          {claim.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                          {claim.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {claim.status === 'paid' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </Badge>
                      </div>

                      {claim.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWagerClaimStatus(claim.id, 'approved')}
                            className="flex-1 text-xs h-8"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateWagerClaimStatus(claim.id, 'paid')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                          >
                            Paid
                          </Button>
                        </div>
                      )}
                      {claim.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => updateWagerClaimStatus(claim.id, 'paid')}
                          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-xs h-8"
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
