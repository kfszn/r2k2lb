'use client';

import { useState, useEffect } from 'react';
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
import { Plus, CheckCircle, Trash2, Clock, Trophy, Settings } from 'lucide-react';
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
          .order('username', { ascending: true })
          .order('created_at', { ascending: false }),
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
    if (pendingCalls.length === 0) {
      toast({
        title: 'No calls to clear',
        description: 'There are no pending slot calls.',
        duration: 3000,
      });
      return;
    }

    if (!confirm(`Are you sure you want to clear all ${pendingCalls.length} pending slot calls? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('slot_calls')
        .delete()
        .eq('status', 'pending');

      if (error) throw error;

      setPendingCalls([]);
      toast({
        title: 'Cleared All',
        description: `Successfully cleared ${pendingCalls.length} pending slot calls.`,
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
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Slot Calls</CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                checked={isOpen}
                onCheckedChange={(checked) => toggleGameStatus(checked)}
                id="slot-calls-toggle"
              />
              <label
                htmlFor="slot-calls-toggle"
                className={`text-xs font-semibold cursor-pointer ${isOpen ? 'text-green-400' : 'text-muted-foreground'}`}
              >
                {isOpen ? 'Accepting Requests' : 'Closed'}
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={openSettingsModal}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              size="sm"
              onClick={() => setShowNewForm(!showNewForm)}
              className="gap-2"
              disabled={!isOpen}
            >
              <Plus className="h-4 w-4" />
              New Slot Call
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New Slot Call Form */}
          {showNewForm && (
            <div className="p-4 border border-primary/20 rounded-lg bg-background/50">
              <div className="flex gap-2 items-end flex-wrap">
                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Username</label>
                  <Input
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Slot Name</label>
                  <Input
                    placeholder="Slot Name"
                    value={formData.slot_name}
                    onChange={(e) => setFormData({ ...formData, slot_name: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="h-8 px-2 rounded border border-input bg-background text-sm w-full"
                  >
                    <option value="call">Call</option>
                    <option value="bonus">Bonus</option>
                    <option value="hunt">Hunt</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buy Amount (optional)</label>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={formData.buy_amount}
                    onChange={(e) => setFormData({ ...formData, buy_amount: e.target.value })}
                    className="h-8"
                  />
                </div>
                <Button size="sm" onClick={addNewSlotCall}>Add</Button>
                <Button size="sm" variant="outline" onClick={() => setShowNewForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Open Calls Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <h3 className="text-sm font-semibold text-foreground">Open Calls</h3>
                <Badge variant="outline" className="text-xs">{pendingCalls.length}</Badge>
              </div>
              {pendingCalls.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAllPendingCalls}
                  className="h-7 gap-1 text-xs text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear All
                </Button>
              )}
            </div>

            {isLoading ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
            ) : pendingCalls.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center border border-dashed border-primary/10 rounded-lg">
                No open calls in queue
              </p>
            ) : (
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-[2fr_3fr_1fr_auto] gap-3 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <div>Username</div>
                  <div>Slot Name</div>
                  <div>Type</div>
                  <div className="w-24"></div>
                </div>
                {pendingCalls.map((call) => (
                  <div
                    key={call.id}
                    className="grid grid-cols-[2fr_3fr_1fr_auto] gap-3 px-3 py-3 items-center bg-background/50 border border-yellow-500/20 rounded-lg"
                  >
                    <div className="font-medium text-sm">{call.username}</div>
                    <div className="text-sm text-muted-foreground">{call.slot_name}</div>
                    <div>
                      <Badge variant="outline" className="text-xs">{call.type}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => openCompleteModal(call)}
                        className="h-7 gap-1 text-xs"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSlotCall(call.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Calls Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-semibold text-foreground">Completed Calls</h3>
              <Badge variant="outline" className="text-xs">{completedCalls.length}</Badge>
            </div>

            {isLoading ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
            ) : completedCalls.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center border border-dashed border-primary/10 rounded-lg">
                No completed calls yet
              </p>
            ) : (
              <div className="space-y-1">
                {/* Header */}
                <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr_2fr_auto] gap-3 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <div>Username</div>
                  <div>Slot Name</div>
                  <div>Type</div>
                  <div>Buy</div>
                  <div>Result</div>
                  <div>Multi</div>
                  <div className="w-8"></div>
                </div>
                {completedCalls.map((call) => {
                  const multi = formatMultiplier(call.buy_amount, call.buy_result);
                  return (
                    <div
                      key={call.id}
                      className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr_2fr_auto] gap-3 px-3 py-3 items-center bg-background/50 border border-green-500/20 rounded-lg"
                    >
                      <div className="font-medium text-sm">{call.username}</div>
                      <div className="text-sm text-muted-foreground">{call.slot_name}</div>
                      <div>
                        <Badge variant="outline" className="text-xs">{call.type}</Badge>
                      </div>
                      <div className="text-sm">{formatCurrency(call.buy_amount)}</div>
                      <div className="text-sm text-green-400">{formatCurrency(call.buy_result)}</div>
                      <div className="text-sm font-semibold">
                        {multi ? (
                          <span className="text-muted-foreground font-normal">
                            {formatCurrency(call.buy_amount)} / {formatCurrency(call.buy_result)}{' '}
                            = <span className="text-foreground font-semibold">{multi}x</span>
                          </span>
                        ) : (
                          '-'
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSlotCall(call.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complete Modal */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Slot Call</DialogTitle>
          </DialogHeader>

          {completingCall && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <p className="text-sm font-medium">{completingCall.username}</p>
                <p className="text-sm text-muted-foreground">{completingCall.slot_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buy Amount ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={completeForm.buy_amount}
                    onChange={(e) => setCompleteForm({ ...completeForm, buy_amount: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Result ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={completeForm.buy_result}
                    onChange={(e) => setCompleteForm({ ...completeForm, buy_result: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {modalMulti && (
                <div className="p-3 bg-muted/40 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Multiplier</p>
                  <p className="text-sm font-mono">
                    ${parseFloat(completeForm.buy_amount || '0').toFixed(2)} / ${parseFloat(completeForm.buy_result || '0').toFixed(2)}{' '}
                    = <span className="font-bold text-foreground text-base">{modalMulti}x</span>
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={isSaving} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Mark Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal - Request Limits */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Settings - Request Limits</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add New Limit */}
            <div className="p-4 border border-primary/20 rounded-lg bg-background/50 space-y-3">
              <h3 className="text-sm font-semibold">Add Request Limit</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Username</label>
                  <Input
                    placeholder="Enter username"
                    value={newLimitForm.username}
                    onChange={(e) => setNewLimitForm({ ...newLimitForm, username: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Per Hour</label>
                  <Input
                    type="number"
                    placeholder="10"
                    value={newLimitForm.max_requests_per_hour}
                    onChange={(e) => setNewLimitForm({ ...newLimitForm, max_requests_per_hour: e.target.value })}
                    min="1"
                    className="h-8"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Per Day</label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={newLimitForm.max_requests_per_day}
                    onChange={(e) => setNewLimitForm({ ...newLimitForm, max_requests_per_day: e.target.value })}
                    min="1"
                    className="h-8"
                  />
                </div>
                <div className="flex items-end">
                  <Button size="sm" onClick={addRequestLimit} className="w-full">
                    Add Limit
                  </Button>
                </div>
              </div>
            </div>

            {/* List of Limits */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                User Request Limits
                <Badge variant="outline" className="text-xs">{requestLimits.length}</Badge>
              </h3>

              {isLoadingLimits ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
              ) : requestLimits.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center border border-dashed border-primary/10 rounded-lg">
                  No request limits set
                </p>
              ) : (
                <div className="space-y-1">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    <div>Username</div>
                    <div>Per Hour</div>
                    <div>Per Day</div>
                    <div className="w-16"></div>
                  </div>

                  {requestLimits.map((limit) => (
                    <div
                      key={limit.id}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 px-3 py-3 items-center bg-background/50 border border-primary/20 rounded-lg"
                    >
                      <div className="font-medium text-sm">{limit.username}</div>
                      <div className="text-sm text-muted-foreground">{limit.max_requests_per_hour}</div>
                      <div className="text-sm text-muted-foreground">{limit.max_requests_per_day}</div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRequestLimit(limit.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive ml-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setSettingsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
