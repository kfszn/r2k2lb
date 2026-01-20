"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trophy } from "lucide-react";

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateTournamentDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTournamentDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxPlayers: "8",
    prizePool: "500",
    minWager: "0",
    wagerTimeframe: "all",
    requireActive: true,
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/tournament/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          maxPlayers: parseInt(formData.maxPlayers),
          prizePool: parseFloat(formData.prizePool),
          minWager: parseFloat(formData.minWager),
          wagerTimeframe: formData.wagerTimeframe,
          requireActive: formData.requireActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tournament");
      }

      onOpenChange(false);
      onCreated();
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        maxPlayers: "8",
        prizePool: "500",
        minWager: "0",
        wagerTimeframe: "all",
        requireActive: true,
      });
    } catch (error) {
      console.error("Error creating tournament:", error);
      alert("Failed to create tournament");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Create Tournament
          </DialogTitle>
          <DialogDescription>
            Set up a new slot tournament for your viewers
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tournament Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Friday Night Showdown"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional tournament description..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Max Players</Label>
              <Select
                value={formData.maxPlayers}
                onValueChange={(value) =>
                  setFormData({ ...formData, maxPlayers: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                  <SelectItem value="6">6 Players</SelectItem>
                  <SelectItem value="8">8 Players</SelectItem>
                  <SelectItem value="10">10 Players</SelectItem>
                  <SelectItem value="12">12 Players</SelectItem>
                  <SelectItem value="14">14 Players</SelectItem>
                  <SelectItem value="16">16 Players</SelectItem>
                  <SelectItem value="18">18 Players</SelectItem>
                  <SelectItem value="20">20 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizePool">Prize Pool ($)</Label>
              <Input
                id="prizePool"
                type="number"
                min="0"
                step="50"
                value={formData.prizePool}
                onChange={(e) =>
                  setFormData({ ...formData, prizePool: e.target.value })
                }
              />
            </div>
          </div>

          {/* Entry Requirements Section */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-4">
            <h4 className="font-medium text-foreground">Entry Requirements</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minWager">Minimum Wager ($)</Label>
                <Input
                  id="minWager"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0 = no requirement"
                  value={formData.minWager}
                  onChange={(e) =>
                    setFormData({ ...formData, minWager: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wagerTimeframe">Timeframe</Label>
                <Select
                  value={formData.wagerTimeframe}
                  onValueChange={(value) =>
                    setFormData({ ...formData, wagerTimeframe: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="14">Last 14 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Players must have wagered at least this amount under R2K2 within the selected timeframe
            </p>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requireActive">Require Active Under R2K2</Label>
                <p className="text-xs text-muted-foreground">
                  Players must be currently active under your code
                </p>
              </div>
              <Switch
                id="requireActive"
                checked={formData.requireActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requireActive: checked })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !formData.name}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="mr-2 h-4 w-4" />
            )}
            Create Tournament
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
