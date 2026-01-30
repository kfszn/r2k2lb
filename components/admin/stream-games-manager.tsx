'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GuessTheBalance } from '@/components/admin/guess-the-balance';
import { Gamepad2 } from 'lucide-react';

export function StreamGamesManager() {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Gamepad2 className="h-6 w-6 text-primary" />
          <CardTitle>Stream Games</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="guess-balance" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="guess-balance">Guess The Balance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guess-balance" className="mt-6">
            <GuessTheBalance />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
