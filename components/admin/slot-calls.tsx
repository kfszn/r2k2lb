'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, CheckCircle, Trash2, Clock, Trophy, Settings, Dices } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RequestLimit {
  id: string;
  username: string;
  max_requests_per_hour: number;
  max_requests_per_day: number;
}

interface SlotCall {
  id: string;
  username: string;
  slot_name: string;
  type: string;
  timestamp: string;
  created_at: string;
  completed_at: string | null;
  buy_amount: number | null;
  buy_result: number | null;
  status: string;
}

export function SlotCalls() {
  const [pendingCalls, setPendingCalls] = useState<SlotCall[]>([]);
  const [completedCalls, setCompletedCalls] = useState<SlotCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    slot_name: '',
    type: 'call',
    buy_amount: '',
  });
  const [isOpen, setIsOpen] = useState(false);

  // Complete modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completingCall, setCompletingCall] = useState<SlotCall | null>(null);
  const [completeForm, setCompleteForm] = useState({
    buy_amount: '',
    buy_result: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Wheel state
  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelWinner, setWheelWinner] = useState<SlotCall | null>(null);
  const wheelCanvasRef = useRef<HTMLCanvasElement>(null);
  const wheelAngleRef = useRef(0);
  const wheelAnimFrameRef = useRef<number | null>(null);

  // Settings modal state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [requestLimits, setRequestLimits] = useState<RequestLimit[]>([]);
  const [newLimitForm, setNewLimitForm] = useState({
    username: '',
    max_requests_per_hour: '10',
    max_requests_per_day: '50',
  });
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);

  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchSlotCalls();
    fetchGameStatus();

    const channel = supabase
      .channel('slot_calls_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_calls' }, () => {
        fetchSlotCalls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSlotCalls = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, completedRes] = await Promise.all([
        supabase
          .from('slot_calls')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true }),
        supabase
          .from('slot_calls')
          .select('*')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false }),
      ]);

      if (pendingRes.data) {
        // Keep only the most recent pending call per user
        const seen = new Set<string>();
        const deduped = pendingRes.data.filter((call) => {
          if (seen.has(call.username)) return false;
          seen.add(call.username);
          return true;
        });
        setPendingCalls(deduped);
      }
      if (completedRes.data) setCompletedCalls(completedRes.data);
    } catch (error) {
      console.error('Error fetching slot calls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGameStatus = async () => {
    try {
      const { data } = await supabase
        .from('stream_games_config')
        .select('is_open')
        .eq('game_name', 'slot_calls')
        .single();

      if (data) {
        setIsOpen(data.is_open);
      }
    } catch (error) {
      console.error('Error fetching game status:', error);
    }
  };

  const toggleGameStatus = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('stream_games_config')
        .upsert(
          { game_name: 'slot_calls', is_open: checked, updated_at: new Date().toISOString() },
          { onConflict: 'game_name' }
        );

      if (error) throw error;

      setIsOpen(checked);
      toast({
        title: checked ? 'Slot Calls Open' : 'Slot Calls Closed',
        description: checked
          ? 'Users can now submit slot call requests.'
          : 'No new requests will be accepted.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error toggling game status:', error);
      toast({
        title: 'Error',
        description: 'Failed to save toggle state. Please try again.',
        variant: 'destructive',
        duration: 4000,
      });
    }
  };

  const addNewSlotCall = async () => {
    if (!isOpen) {
      alert('Slot calls are currently closed. Please enable them with the toggle.');
      return;
    }

    if (!formData.username || !formData.slot_name) {
      alert('Please fill in username and slot name');
      return;
    }

    try {
      const { error } = await supabase.from('slot_calls').insert({
        username: formData.username,
        slot_name: formData.slot_name,
        type: formData.type,
        timestamp: new Date().toISOString(),
        buy_amount: formData.buy_amount ? parseFloat(formData.buy_amount) : 0,
        buy_result: null,
        status: 'pending',
      });

      if (error) throw error;

      setFormData({ username: '', slot_name: '', type: 'call', buy_amount: '' });
      setShowNewForm(false);
      fetchSlotCalls();
    } catch (error) {
      console.error('Error adding slot call:', error);
      alert('Error adding slot call: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const openCompleteModal = (call: SlotCall) => {
    setCompletingCall(call);
    setCompleteForm({
      buy_amount: call.buy_amount != null && call.buy_amount > 0 ? call.buy_amount.toString() : '',
      buy_result: call.buy_result != null ? call.buy_result.toString() : '',
    });
    setCompleteModalOpen(true);
  };

  const handleComplete = async () => {
    if (!completingCall) return;
    if (!completeForm.buy_amount || !completeForm.buy_result) {
      alert('Please fill in buy amount and result');
      return;
    }

    setIsSaving(true);
    try {
      const buyAmount = parseFloat(completeForm.buy_amount);
      const buyResult = parseFloat(completeForm.buy_result);

      const { error } = await supabase
        .from('slot_calls')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          buy_amount: buyAmount,
          buy_result: buyResult,
        })
        .eq('id', completingCall.id);

      if (error) throw error;

      // Directly update state for immediate UI feedback
      setPendingCalls(prev => prev.filter(call => call.id !== completingCall.id));
      const completedCall = {
        ...completingCall,
        status: 'completed',
        completed_at: new Date().toISOString(),
        buy_amount: buyAmount,
        buy_result: buyResult,
      };
      setCompletedCalls(prev => [completedCall, ...prev]);

      setCompleteModalOpen(false);
      setCompletingCall(null);
    } catch (error) {
      console.error('Error completing slot call:', error);
      alert('Error completing slot call: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSlotCall = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slot call?')) return;

    try {
      const { error } = await supabase.from('slot_calls').delete().eq('id', id);
      if (error) throw error;
      await fetchSlotCalls();
    } catch (error) {
      console.error('Error deleting slot call:', error);
      alert('Error deleting slot call: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const clearAllPendingCalls = async () => {
    const totalCalls = pendingCalls.length + completedCalls.length;
    
    if (totalCalls === 0) {
      toast({
        title: 'No calls to clear',
        description: 'There are no slot calls to clear.',
        duration: 3000,
      });
      return;
    }

    if (!confirm(`Are you sure you want to clear all ${totalCalls} slot calls (${pendingCalls.length} pending, ${completedCalls.length} completed)? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('slot_calls')
        .delete()
        .in('status', ['pending', 'completed']);

      if (error) throw error;

      setPendingCalls([]);
      setCompletedCalls([]);
      toast({
        title: 'Cleared All',
        description: `Successfully cleared ${totalCalls} slot calls.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error clearing slot calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear slot calls. Please try again.',
        variant: 'destructive',
        duration: 4000,
      });
    }
  };

  // Request Limits Functions
  const fetchRequestLimits = async () => {
    setIsLoadingLimits(true);
    try {
      const { data, error } = await supabase
        .from('slot_call_request_limits')
        .select('*')
        .order('username', { ascending: true });

      if (error) throw error;
      setRequestLimits(data || []);
    } catch (error) {
      console.error('Error fetching request limits:', error);
    } finally {
      setIsLoadingLimits(false);
    }
  };

  const openSettingsModal = () => {
    fetchRequestLimits();
    setSettingsModalOpen(true);
  };

  const addRequestLimit = async () => {
    if (!newLimitForm.username) {
      alert('Please enter a username');
      return;
    }

    try {
      const hourlyLimit = parseInt(newLimitForm.max_requests_per_hour) || 10;
      const dailyLimit = parseInt(newLimitForm.max_requests_per_day) || 50;

      const { error } = await supabase.from('slot_call_request_limits').upsert({
        username: newLimitForm.username.toLowerCase(),
        max_requests_per_hour: hourlyLimit,
        max_requests_per_day: dailyLimit,
      });

      if (error) throw error;

      setNewLimitForm({ username: '', max_requests_per_hour: '10', max_requests_per_day: '50' });
      await fetchRequestLimits();
    } catch (error) {
      console.error('Error adding request limit:', error);
      alert('Error saving request limit: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const deleteRequestLimit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request limit?')) return;

    try {
      const { error } = await supabase.from('slot_call_request_limits').delete().eq('id', id);
      if (error) throw error;
      await fetchRequestLimits();
    } catch (error) {
      console.error('Error deleting request limit:', error);
    }
  };

  // ── Wheel helpers ───────────────────────────────────────────────────────────

  const WHEEL_COLORS = [
    '#7c3aed', '#2563eb', '#0891b2', '#059669',
    '#d97706', '#dc2626', '#db2777', '#7c3aed',
  ];

  const drawWheel = useCallback((angle: number, calls: SlotCall[], winner: SlotCall | null) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = Math.min(cx, cy) - 8;

    ctx.clearRect(0, 0, W, H);

    if (calls.length === 0) return;

    const slice = (2 * Math.PI) / calls.length;

    calls.forEach((call, i) => {
      const start = angle + i * slice;
      const end = start + slice;
      const isWinner = winner && call.id === winner.id;

      // Segment
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = isWinner ? '#f59e0b' : WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.min(13, Math.max(9, 200 / calls.length))}px sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      const label = call.slot_name.length > 14 ? call.slot_name.slice(0, 13) + '…' : call.slot_name;
      ctx.fillText(label, radius - 10, 4);
      ctx.restore();
    });

    // Center cap
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pointer (top center)
    ctx.save();
    ctx.translate(cx, 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -18);
    ctx.lineTo(10, -18);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.restore();
  }, []);

  const spinWheel = useCallback(() => {
    if (wheelSpinning || pendingCalls.length === 0) return;

    setWheelWinner(null);
    setWheelSpinning(true);

    const calls = pendingCalls;
    const slice = (2 * Math.PI) / calls.length;

    // Pick a random winner index
    const winnerIndex = Math.floor(Math.random() * calls.length);

    // Total spin: many full rotations + land exactly on winner
    const totalRotations = 6 + Math.random() * 4;
    const targetAngle =
      totalRotations * 2 * Math.PI +
      // Position wheel so winner is under the top pointer (angle = -π/2)
      (-(winnerIndex * slice + slice / 2) - Math.PI / 2 - (wheelAngleRef.current % (2 * Math.PI)));

    const startAngle = wheelAngleRef.current;
    const startTime = performance.now();
    const duration = 4000 + Math.random() * 1500;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);

      wheelAngleRef.current = startAngle + eased * targetAngle;
      drawWheel(wheelAngleRef.current, calls, null);

      if (progress < 1) {
        wheelAnimFrameRef.current = requestAnimationFrame(animate);
      } else {
        wheelAngleRef.current = startAngle + targetAngle;
        const winner = calls[winnerIndex];
        setWheelWinner(winner);
        setWheelSpinning(false);
        drawWheel(wheelAngleRef.current, calls, winner);
      }
    };

    wheelAnimFrameRef.current = requestAnimationFrame(animate);
  }, [wheelSpinning, pendingCalls, drawWheel]);

  // Redraw when modal opens or calls change (not spinning)
  useEffect(() => {
    if (wheelModalOpen && !wheelSpinning) {
      // Small delay to let canvas mount
      const t = setTimeout(() => {
        drawWheel(wheelAngleRef.current, pendingCalls, wheelWinner);
      }, 50);
      return () => clearTimeout(t);
    }
  }, [wheelModalOpen, pendingCalls, wheelWinner, wheelSpinning, drawWheel]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (wheelAnimFrameRef.current) cancelAnimationFrame(wheelAnimFrameRef.current);
    };
  }, []);

  // ── Format helpers ───────────────────────────────────────────────────────────

  const formatMultiplier = (buyAmount: number | null, buyResult: number | null) => {
    if (!buyAmount || !buyResult || buyAmount === 0) return null;
    return (buyResult / buyAmount).toFixed(2);
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return '-';
    return `$${value.toFixed(2)}`;
  };

  // Derived multi for the complete modal preview
  const modalMulti = (() => {
    const a = parseFloat(completeForm.buy_amount);
    const r = parseFloat(completeForm.buy_result);
    if (a > 0 && r > 0) return (r / a).toFixed(2);
    return null;
  })();

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        {/* Header */}
        <CardHeader className="pb-4 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold">Slot Calls</CardTitle>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Switch
                checked={isOpen}
                onCheckedChange={toggleGameStatus}
                id="slot-calls-toggle"
              />
              <label
                htmlFor="slot-calls-toggle"
                className={`text-xs font-medium cursor-pointer transition-colors ${isOpen ? 'text-green-400' : 'text-muted-foreground'}`}
              >
                {isOpen ? 'Open' : 'Closed'}
              </label>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={openSettingsModal}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewForm(!showNewForm)}
              className="h-8 gap-1.5 text-xs"
              disabled={!isOpen}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Call
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-0">
          {/* Add Call Form */}
          {showNewForm && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3">
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-[110px]">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block uppercase tracking-wide">Username</label>
                  <Input
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block uppercase tracking-wide">Slot Name</label>
                  <Input
                    placeholder="slot name"
                    value={formData.slot_name}
                    onChange={(e) => setFormData({ ...formData, slot_name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="w-24">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block uppercase tracking-wide">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="h-8 px-2 rounded-md border border-input bg-background text-sm w-full"
                  >
                    <option value="call">Call</option>
                    <option value="bonus">Bonus</option>
                    <option value="hunt">Hunt</option>
                  </select>
                </div>
                <div className="w-28">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block uppercase tracking-wide">Buy (opt.)</label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={formData.buy_amount}
                    onChange={(e) => setFormData({ ...formData, buy_amount: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-1.5 pb-0.5">
                  <Button size="sm" className="h-8 px-4 text-xs" onClick={addNewSlotCall}>Add</Button>
                  <Button size="sm" variant="ghost" className="h-8 px-3 text-xs" onClick={() => setShowNewForm(false)}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {/* Open Calls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-yellow-500/80" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open</span>
                {pendingCalls.length > 0 && (
                  <span className="text-xs font-semibold tabular-nums bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded px-1.5 py-0.5 leading-none">
                    {pendingCalls.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {pendingCalls.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setWheelWinner(null); setWheelModalOpen(true); }}
                    className="h-7 gap-1.5 text-xs border-primary/30 hover:border-primary/60 hover:bg-primary/10 text-primary"
                  >
                    <Dices className="h-3.5 w-3.5" />
                    Roll Random
                  </Button>
                )}
                {(pendingCalls.length > 0 || completedCalls.length > 0) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAllPendingCalls}
                    className="h-7 gap-1 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading...</div>
            ) : pendingCalls.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg">
                No open calls in queue
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <div className="grid grid-cols-[2fr_3fr_1fr_auto] gap-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 border-b border-border/40">
                  <div>User</div>
                  <div>Slot</div>
                  <div>Type</div>
                  <div className="w-[88px]" />
                </div>
                {pendingCalls.map((call, idx) => (
                  <div
                    key={call.id}
                    className={`grid grid-cols-[2fr_3fr_1fr_auto] gap-0 px-3 py-2.5 items-center transition-colors hover:bg-muted/20 ${idx < pendingCalls.length - 1 ? 'border-b border-border/30' : ''}`}
                  >
                    <div className="text-sm font-medium">{call.username}</div>
                    <div className="text-sm text-muted-foreground truncate pr-2">{call.slot_name}</div>
                    <div>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded border border-border/50 bg-muted/30 text-muted-foreground capitalize">{call.type}</span>
                    </div>
                    <div className="flex items-center gap-1 w-[88px] justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCompleteModal(call)}
                        className="h-7 gap-1 text-xs px-2 border-green-500/30 hover:border-green-500/60 hover:bg-green-500/10 text-green-400 hover:text-green-400"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSlotCall(call.id)}
                        className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Calls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5 text-green-500/80" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completed</span>
              {completedCalls.length > 0 && (
                <span className="text-xs font-semibold tabular-nums bg-green-500/10 text-green-400 border border-green-500/20 rounded px-1.5 py-0.5 leading-none">
                  {completedCalls.length}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Loading...</div>
            ) : completedCalls.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg">
                No completed calls yet
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr_2fr_auto] gap-0 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 border-b border-border/40">
                  <div>User</div>
                  <div>Slot</div>
                  <div>Type</div>
                  <div>Buy</div>
                  <div>Result</div>
                  <div>Multi</div>
                  <div className="w-7" />
                </div>
                {completedCalls.map((call, idx) => {
                  const multi = formatMultiplier(call.buy_amount, call.buy_result);
                  return (
                    <div
                      key={call.id}
                      className={`grid grid-cols-[2fr_3fr_1fr_1fr_1fr_2fr_auto] gap-0 px-3 py-2.5 items-center transition-colors hover:bg-muted/20 ${idx < completedCalls.length - 1 ? 'border-b border-border/30' : ''}`}
                    >
                      <div className="text-sm font-medium">{call.username}</div>
                      <div className="text-sm text-muted-foreground truncate pr-2">{call.slot_name}</div>
                      <div>
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded border border-border/50 bg-muted/30 text-muted-foreground capitalize">{call.type}</span>
                      </div>
                      <div className="text-sm tabular-nums">{formatCurrency(call.buy_amount)}</div>
                      <div className="text-sm tabular-nums text-green-400">{formatCurrency(call.buy_result)}</div>
                      <div className="text-sm">
                        {multi ? (
                          <span className="font-semibold text-foreground">{multi}x</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSlotCall(call.id)}
                        className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Wheel Modal */}
      <Dialog
        open={wheelModalOpen}
        onOpenChange={(open) => {
          if (!wheelSpinning) {
            setWheelModalOpen(open);
            if (!open && wheelAnimFrameRef.current) cancelAnimationFrame(wheelAnimFrameRef.current);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Dices className="h-4 w-4 text-primary" />
              Roll Random
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {pendingCalls.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No open calls to spin.</p>
            ) : (
              <>
                <div className="flex items-center justify-center p-2">
                  <canvas
                    ref={wheelCanvasRef}
                    width={360}
                    height={360}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>

                {wheelWinner && !wheelSpinning && (
                  <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-400 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wide">Selected</span>
                    </div>
                    <p className="text-base font-semibold text-foreground">{wheelWinner.slot_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">by {wheelWinner.username}</p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setWheelModalOpen(false)} disabled={wheelSpinning}>
              Close
            </Button>
            {pendingCalls.length > 0 && (
              <Button size="sm" onClick={spinWheel} disabled={wheelSpinning} className="gap-1.5">
                <Dices className="h-3.5 w-3.5" />
                {wheelSpinning ? 'Spinning...' : wheelWinner ? 'Spin Again' : 'Spin'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Modal */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Complete Slot Call</DialogTitle>
          </DialogHeader>

          {completingCall && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                <p className="text-sm font-medium">{completingCall.username}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{completingCall.slot_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Buy ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={completeForm.buy_amount}
                    onChange={(e) => setCompleteForm({ ...completeForm, buy_amount: e.target.value })}
                    min="0"
                    step="0.01"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Result ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={completeForm.buy_result}
                    onChange={(e) => setCompleteForm({ ...completeForm, buy_result: e.target.value })}
                    min="0"
                    step="0.01"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {modalMulti && (
                <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Multiplier</span>
                  <span className="text-sm font-bold text-foreground">{modalMulti}x</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setCompleteModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleComplete} disabled={isSaving} className="gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" />
              {isSaving ? 'Saving...' : 'Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Request Limits</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Add New Limit */}
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add Limit</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Username</label>
                  <Input
                    placeholder="username"
                    value={newLimitForm.username}
                    onChange={(e) => setNewLimitForm({ ...newLimitForm, username: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Per Hour</label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={newLimitForm.max_requests_per_hour}
                    onChange={(e) => setNewLimitForm({ ...newLimitForm, max_requests_per_hour: e.target.value })}
                    min="1"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Per Day</label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={newLimitForm.max_requests_per_day}
                    onChange={(e) => setNewLimitForm({ ...newLimitForm, max_requests_per_day: e.target.value })}
                    min="1"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <Button size="sm" onClick={addRequestLimit} className="w-full h-8 text-xs">
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Limits List */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">User Limits</span>
                {requestLimits.length > 0 && (
                  <span className="text-xs font-semibold tabular-nums bg-muted/50 text-muted-foreground border border-border/50 rounded px-1.5 py-0.5 leading-none">
                    {requestLimits.length}
                  </span>
                )}
              </div>

              {isLoadingLimits ? (
                <div className="py-6 text-center text-xs text-muted-foreground">Loading...</div>
              ) : requestLimits.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg">
                  No request limits set
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 border-b border-border/40">
                    <div>Username</div>
                    <div>Per Hour</div>
                    <div>Per Day</div>
                    <div className="w-7" />
                  </div>
                  {requestLimits.map((limit, idx) => (
                    <div
                      key={limit.id}
                      className={`grid grid-cols-[1fr_1fr_1fr_auto] px-3 py-2.5 items-center hover:bg-muted/20 transition-colors ${idx < requestLimits.length - 1 ? 'border-b border-border/30' : ''}`}
                    >
                      <div className="text-sm font-medium">{limit.username}</div>
                      <div className="text-sm text-muted-foreground tabular-nums">{limit.max_requests_per_hour}</div>
                      <div className="text-sm text-muted-foreground tabular-nums">{limit.max_requests_per_day}</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRequestLimit(limit.id)}
                        className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setSettingsModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
