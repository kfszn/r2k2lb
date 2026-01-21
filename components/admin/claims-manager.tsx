"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createBrowserClient } from '@/lib/supabase/client'
import { Check, X, Loader2, Clock, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Claim {
  id: string
  user_id: string
  acebet_username: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  user_email?: string
}

export function ClaimsManager() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createBrowserClient()

  useEffect(() => {
    fetchClaims()
  }, [])

  async function fetchClaims() {
    try {
      const { data, error } = await supabase
        .from('user_claims')
        .select(`
          *,
          user_email:auth.users!user_id(email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClaims(data || [])
    } catch (error) {
      console.error('[v0] Error fetching claims:', error)
      toast({
        title: 'Error',
        description: 'Failed to load claims',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateClaimStatus(claimId: string, status: 'approved' | 'rejected') {
    setProcessing(claimId)
    try {
      const { error } = await supabase
        .from('user_claims')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', claimId)

      if (error) throw error

      toast({
        title: status === 'approved' ? 'Claim Approved' : 'Claim Rejected',
        description: `Username claim has been ${status}`,
      })

      await fetchClaims()
    } catch (error) {
      console.error('[v0] Error updating claim:', error)
      toast({
        title: 'Error',
        description: 'Failed to update claim',
        variant: 'destructive'
      })
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  const pendingClaims = claims.filter(c => c.status === 'pending')
  const reviewedClaims = claims.filter(c => c.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Pending Claims */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Pending Claims ({pendingClaims.length})
          </CardTitle>
          <CardDescription>
            Review and approve username claims from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingClaims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pending claims</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-lg">{claim.acebet_username}</p>
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested {new Date(claim.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30"
                      onClick={() => updateClaimStatus(claim.id, 'approved')}
                      disabled={processing === claim.id}
                    >
                      {processing === claim.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                      onClick={() => updateClaimStatus(claim.id, 'rejected')}
                      disabled={processing === claim.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviewed Claims */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Previously reviewed claims
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewedClaims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No reviewed claims yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reviewedClaims.slice(0, 10).map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/30"
                >
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{claim.acebet_username}</p>
                    <Badge
                      variant={claim.status === 'approved' ? 'default' : 'secondary'}
                      className={
                        claim.status === 'approved'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }
                    >
                      {claim.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(claim.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
