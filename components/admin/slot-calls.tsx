'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Plus, Check, Trash2, Power } from 'lucide-react';

interface SlotCall {
  id: string;
  username: string;
  slot_name: string;
  type: string;
  timestamp: string;
  buy_amount: number | null;
  buy_result: number | null;
}

export function SlotCalls() {
  const [slotCalls, setSlotCalls] = useState<SlotCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    slot_name: '',
    type: 'call',
    buy_amount: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { buy_amount: string; buy_result: string }>>({});

  const supabase = createClient();

  // Fetch slot calls and game status
  useEffect(() => {
    fetchSlotCalls();
    fetchGameStatus();
  }, []);

  const fetchSlotCalls = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('slot_calls')
        .select('*')
        .order('timestamp', { ascending: false });

      if (data) {
        setSlotCalls(data);
      }
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

  const toggleGameStatus = async () => {
    try {
      const newStatus = !isOpen;
      const { error } = await supabase
        .from('stream_games_config')
        .update({ is_open: newStatus })
        .eq('game_name', 'slot_calls');

      if (error) throw error;

      setIsOpen(newStatus);
    } catch (error) {
      console.error('Error toggling game status:', error);
      alert('Error toggling status');
    }
  };

  const addNewSlotCall = async () => {
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
        buy_amount: formData.buy_amount ? parseFloat(formData.buy_amount) : null,
        buy_result: null,
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

  const handleUpdate = async (id: string) => {
    const values = editValues[id];
    if (!values) return;

    const buyAmount = values.buy_amount ? parseFloat(values.buy_amount) : null;
    const buyResult = values.buy_result ? parseFloat(values.buy_result) : null;

    try {
      const { error } = await supabase
        .from('slot_calls')
        .update({
          buy_amount: buyAmount,
          buy_result: buyResult,
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditValues({});
      fetchSlotCalls();
    } catch (error) {
      console.error('Error updating slot call:', error);
      alert('Error updating result: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleStartEdit = (call: SlotCall) => {
    setEditingId(call.id);
    setEditValues({
      [call.id]: {
        buy_amount: (call.buy_amount || '').toString(),
        buy_result: (call.buy_result || '').toString(),
      },
    });
  };

  const deleteSlotCall = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slot call?')) return;

    try {
      const { error } = await supabase.from('slot_calls').delete().eq('id', id);
      if (error) throw error;
      fetchSlotCalls();
    } catch (error) {
      console.error('Error deleting slot call:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Slot Calls</CardTitle>
            <Badge variant={isOpen ? 'default' : 'secondary'}>
              {isOpen ? 'OPEN' : 'CLOSED'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isOpen ? 'destructive' : 'default'}
              onClick={toggleGameStatus}
              className="gap-2"
            >
              <Power className="h-4 w-4" />
              {isOpen ? 'Close' : 'Open'}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowNewForm(!showNewForm)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Slot Call
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showNewForm && (
            <div className="p-4 border border-primary/20 rounded-lg bg-background/50">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Username</label>
                  <Input
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Slot Name</label>
                  <Input
                    placeholder="Slot Name"
                    value={formData.slot_name}
                    onChange={(e) =>
                      setFormData({ ...formData, slot_name: e.target.value })
                    }
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="h-8 px-2 rounded border border-input bg-background text-sm w-full"
                  >
                    <option value="call">Call</option>
                    <option value="bonus">Bonus</option>
                    <option value="hunt">Hunt</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buy Amount</label>
                  <Input
                    placeholder="Buy Amount (optional)"
                    type="number"
                    value={formData.buy_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, buy_amount: e.target.value })
                    }
                    className="h-8"
                  />
                </div>
                <Button size="sm" onClick={addNewSlotCall}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {slotCalls.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No slot calls
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground">
                <div>ID</div>
                <div>Username</div>
                <div>Slot Name</div>
                <div>Type</div>
                <div>Buy Amount</div>
                <div>Result</div>
                <div>Multiplier</div>
                <div></div>
              </div>

              {/* Data Rows */}
              {slotCalls.map((call) => {
                const values = editValues[call.id] || { buy_amount: (call.buy_amount || '').toString(), buy_result: (call.buy_result || '').toString() };
                const buyAmount = values.buy_amount ? parseFloat(values.buy_amount) : 0;
                const buyResult = values.buy_result ? parseFloat(values.buy_result) : 0;
                const multiplier = buyAmount > 0 && buyResult > 0 ? (buyResult / buyAmount).toFixed(3) : '-';
                
                return (
                  <div
                    key={call.id}
                    className="grid grid-cols-8 gap-2 px-3 py-3 items-center bg-background/50 border border-primary/10 rounded-lg"
                  >
                    <div className="text-xs font-mono">{call.id.slice(0, 8)}</div>
                    <div className="font-medium text-sm">{call.username}</div>
                    <div className="text-sm">{call.slot_name}</div>
                    <div className="text-xs"><Badge variant="outline">{call.type}</Badge></div>
                    
                    {editingId === call.id ? (
                      <Input
                        type="number"
                        placeholder="Buy Amount"
                        value={values.buy_amount}
                        onChange={(e) => setEditValues({ ...editValues, [call.id]: { ...values, buy_amount: e.target.value } })}
                        className="h-8"
                      />
                    ) : (
                      <div className="text-sm">{call.buy_amount ? `$${call.buy_amount.toFixed(2)}` : '-'}</div>
                    )}

                    {editingId === call.id ? (
                      <Input
                        type="number"
                        placeholder="Result"
                        value={values.buy_result}
                        onChange={(e) => setEditValues({ ...editValues, [call.id]: { ...values, buy_result: e.target.value } })}
                        className="h-8"
                      />
                    ) : (
                      <div 
                        className="text-sm text-green-500 cursor-pointer hover:text-green-600"
                        onClick={() => handleStartEdit(call)}
                      >
                        {call.buy_result ? `$${call.buy_result.toFixed(2)}` : '-'}
                      </div>
                    )}

                    <div className="font-semibold text-sm">{multiplier}x</div>

                    {editingId === call.id ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleUpdate(call.id)}
                        className="h-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSlotCall(call.id)}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
