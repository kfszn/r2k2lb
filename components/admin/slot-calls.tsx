'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Plus, Check, Trash2 } from 'lucide-react';

interface SlotCall {
  id: string;
  username: string;
  slot: string;
  buy_amount: number;
  buy_result: number | null;
  status: 'pending' | 'completed';
  created_at: string;
}

export function SlotCalls() {
  const [pendingCalls, setPendingCalls] = useState<SlotCall[]>([]);
  const [completedCalls, setCompletedCalls] = useState<SlotCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    slot: '',
    buy_amount: '',
  });
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [resultValues, setResultValues] = useState<Record<string, string>>({});

  const supabase = createClient();

  // Fetch slot calls
  useEffect(() => {
    fetchSlotCalls();
  }, []);

  const fetchSlotCalls = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('slot_calls')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setPendingCalls(data.filter(c => c.status === 'pending'));
        setCompletedCalls(data.filter(c => c.status === 'completed'));
      }
    } catch (error) {
      console.error('Error fetching slot calls:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNewSlotCall = async () => {
    if (!formData.username || !formData.slot || !formData.buy_amount) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase.from('slot_calls').insert({
        username: formData.username,
        slot: formData.slot,
        buy_amount: parseFloat(formData.buy_amount),
        buy_result: 0,
        status: 'pending',
      });

      if (error) throw error;

      setFormData({ username: '', slot: '', buy_amount: '' });
      setShowNewForm(false);
      fetchSlotCalls();
    } catch (error) {
      console.error('Error adding slot call:', error);
      alert('Error adding slot call: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const updateSlotResult = async (id: string, resultValue: string) => {
    if (!resultValue) {
      alert('Please enter a result');
      return;
    }

    try {
      const { error } = await supabase
        .from('slot_calls')
        .update({
          buy_result: parseFloat(resultValue),
          status: 'completed',
        })
        .eq('id', id);

      if (error) throw error;

      setEditingResultId(null);
      setResultValues({});
      fetchSlotCalls();
    } catch (error) {
      console.error('Error updating slot result:', error);
      alert('Error updating result: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
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
      {/* Pending Section */}
      <Card className="border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Slot Calls</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowNewForm(!showNewForm)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Slot Call
          </Button>
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
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Slot</label>
                  <Input
                    placeholder="Slot"
                    value={formData.slot}
                    onChange={(e) =>
                      setFormData({ ...formData, slot: e.target.value })
                    }
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Buy Amount</label>
                  <Input
                    placeholder="Buy Amount"
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

          {pendingCalls.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No pending slot calls
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-7 gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground">
                <div>Username</div>
                <div>Slot</div>
                <div>Buy Amount</div>
                <div>Result</div>
                <div>Multiplier</div>
                <div></div>
                <div></div>
              </div>

              {/* Data Rows */}
              {pendingCalls.map((call) => {
                const currentResult = resultValues[call.id] !== undefined ? resultValues[call.id] : (call.buy_result || 0).toString();
                const resultNum = parseFloat(currentResult) || 0;
                const multiplier = call.buy_amount > 0 ? (resultNum / call.buy_amount).toFixed(2) : '0';
                
                return (
                  <div
                    key={call.id}
                    className="grid grid-cols-7 gap-2 px-3 py-3 items-center bg-background/50 border border-primary/10 rounded-lg"
                  >
                    <div className="font-medium">{call.username}</div>
                    <div className="text-sm">{call.slot}</div>
                    <div>${call.buy_amount.toFixed(2)}</div>

                    {editingResultId === call.id ? (
                      <Input
                        type="number"
                        placeholder="Enter result"
                        value={currentResult}
                        onChange={(e) => setResultValues({ ...resultValues, [call.id]: e.target.value })}
                        className="h-8"
                      />
                    ) : (
                      <div 
                        className="text-muted-foreground cursor-pointer hover:text-primary"
                        onClick={() => {
                          setEditingResultId(call.id);
                          setResultValues({ ...resultValues, [call.id]: (call.buy_result || 0).toString() });
                        }}
                      >
                        {call.buy_result !== null && call.buy_result !== 0 ? `$${call.buy_result.toFixed(2)}` : '-'}
                      </div>
                    )}

                    <div className="font-semibold">{multiplier}x</div>

                    {editingResultId === call.id ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateSlotResult(call.id, currentResult)}
                        className="h-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingResultId(call.id);
                          setResultValues({ ...resultValues, [call.id]: (call.buy_result || 0).toString() });
                        }}
                        className="h-8"
                      >
                        Edit
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSlotCall(call.id)}
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Completed Slot Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {completedCalls.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No completed slot calls
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-6 gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground">
                <div>Username</div>
                <div>Slot</div>
                <div>Buy Amount</div>
                <div>Result</div>
                <div>Multiplier</div>
                <div></div>
              </div>

              {/* Data Rows */}
              {completedCalls.map((call) => {
                const multiplier = call.buy_amount > 0 && call.buy_result ? (call.buy_result / call.buy_amount).toFixed(2) : '0';
                return (
                  <div
                    key={call.id}
                    className="grid grid-cols-6 gap-2 px-3 py-3 items-center bg-background/50 border border-primary/10 rounded-lg"
                  >
                    <div className="font-medium">{call.username}</div>
                    <div className="text-sm">{call.slot}</div>
                    <div>${call.buy_amount.toFixed(2)}</div>
                    <div className="text-green-500 font-medium">
                      ${call.buy_result?.toFixed(2) || '-'}
                    </div>
                    <div className="font-semibold">
                      {multiplier}x
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSlotCall(call.id)}
                      className="h-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
