'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';

interface SlotCall {
  id: string;
  username: string;
  slot_name: string;
  type: string;
  timestamp: string;
  buy_amount: number | null;
  buy_result: number | null;
  multiplier?: number;
}

export default function AdminSlotCallsPage() {
  const [slotCalls, setSlotCalls] = useState<SlotCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { buy_amount: string; buy_result: string }>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCall, setNewCall] = useState({ username: '', slot_name: '', type: 'call' });

  const supabase = createClient();

  const fetchAllCalls = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('slot_calls')
        .select('*')
        .order('timestamp', { ascending: false });

      if (data) {
        const withMultiplier = data.map((call) => ({
          ...call,
          multiplier:
            call.buy_amount && call.buy_result
              ? (call.buy_result / call.buy_amount).toFixed(3)
              : null,
        }));
        setSlotCalls(withMultiplier);
      }
    } catch (error) {
      console.error('Error fetching slot calls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCalls();
  }, []);

  const handleAddCall = async () => {
    if (!newCall.username || !newCall.slot_name) {
      alert('Please fill in username and slot name');
      return;
    }

    try {
      const { error } = await supabase.from('slot_calls').insert({
        username: newCall.username,
        slot_name: newCall.slot_name,
        slot: newCall.slot_name,
        type: newCall.type,
        timestamp: new Date().toISOString(),
        buy_amount: null,
        buy_result: null,
        status: 'pending',
      });

      if (error) throw error;

      setNewCall({ username: '', slot_name: '', type: 'call' });
      setShowNewForm(false);
      fetchAllCalls();
    } catch (error) {
      console.error('Error adding slot call:', error);
      alert('Error adding slot call');
    }
  };

  const handleUpdate = async (id: string) => {
    const values = editValues[id];
    if (!values) return;

    const buyAmount = parseFloat(values.buy_amount) || null;
    const buyResult = parseFloat(values.buy_result) || null;
    const multiplier = buyAmount && buyResult && buyAmount > 0 ? buyResult / buyAmount : null;

    try {
      const { error } = await supabase
        .from('slot_calls')
        .update({
          buy_amount: buyAmount,
          buy_result: buyResult,
          multiplier,
        })
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditValues({});
      fetchAllCalls();
    } catch (error) {
      console.error('Error updating slot call:', error);
      alert('Error updating slot call');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const { error } = await supabase.from('slot_calls').delete().eq('id', id);
      if (error) throw error;
      fetchAllCalls();
    } catch (error) {
      console.error('Error deleting slot call:', error);
      alert('Error deleting slot call');
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin - Slot Calls</h1>
          <Button onClick={() => setShowNewForm(!showNewForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Slot Call
          </Button>
        </div>

        {showNewForm && (
          <Card className="border-primary/20 bg-background/50">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input
                  placeholder="Username"
                  value={newCall.username}
                  onChange={(e) => setNewCall({ ...newCall, username: e.target.value })}
                />
                <Input
                  placeholder="Slot Name"
                  value={newCall.slot_name}
                  onChange={(e) => setNewCall({ ...newCall, slot_name: e.target.value })}
                />
                <select
                  value={newCall.type}
                  onChange={(e) => setNewCall({ ...newCall, type: e.target.value })}
                  className="px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="call">Call</option>
                  <option value="bonus">Bonus</option>
                  <option value="hunt">Hunt</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddCall}>Add</Button>
                <Button variant="outline" onClick={() => setShowNewForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>All Slot Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : slotCalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No slot calls yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="text-left px-4 py-3 font-semibold">ID</th>
                      <th className="text-left px-4 py-3 font-semibold">Username</th>
                      <th className="text-left px-4 py-3 font-semibold">Slot Name</th>
                      <th className="text-left px-4 py-3 font-semibold">Type</th>
                      <th className="text-left px-4 py-3 font-semibold">Timestamp</th>
                      <th className="text-left px-4 py-3 font-semibold">Buy Amount</th>
                      <th className="text-left px-4 py-3 font-semibold">Buy Result</th>
                      <th className="text-left px-4 py-3 font-semibold">Multiplier</th>
                      <th className="text-left px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotCalls.map((call) => (
                      <tr key={call.id} className="border-b border-primary/10 hover:bg-background/50">
                        <td className="px-4 py-3 font-mono text-xs">{call.id.slice(0, 8)}</td>
                        <td className="px-4 py-3">{call.username}</td>
                        <td className="px-4 py-3">{call.slot_name}</td>
                        <td className="px-4 py-3 capitalize">{call.type}</td>
                        <td className="px-4 py-3 text-xs">
                          {new Date(call.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === call.id ? (
                            <Input
                              type="number"
                              value={editValues[call.id]?.buy_amount || ''}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  [call.id]: { ...editValues[call.id], buy_amount: e.target.value },
                                })
                              }
                              className="h-8 w-24"
                            />
                          ) : (
                            call.buy_amount ? `$${call.buy_amount.toFixed(2)}` : '-'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === call.id ? (
                            <Input
                              type="number"
                              value={editValues[call.id]?.buy_result || ''}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  [call.id]: { ...editValues[call.id], buy_result: e.target.value },
                                })
                              }
                              className="h-8 w-24"
                            />
                          ) : (
                            call.buy_result ? `$${call.buy_result.toFixed(2)}` : '-'
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {call.multiplier ? `${call.multiplier}x` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          {editingId === call.id ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleUpdate(call.id)}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleStartEdit(call)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(call.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
