'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';

export function SlotCalls() {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Phone className="h-6 w-6 text-primary" />
          <CardTitle>Slot Calls</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>Slot Calls game panel - Coming Soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
