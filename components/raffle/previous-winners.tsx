'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Winner {
  id: string;
  username: string;
  prize_amount: number;
  won_date: string;
  raffle_type: string;
}

interface PreviousWinnersProps {
  winners: Winner[];
}

export function PreviousWinners({ winners }: PreviousWinnersProps) {
  return (
    <Card className="border-primary/20 w-full">
      <CardHeader>
        <CardTitle>Previous Winners</CardTitle>
      </CardHeader>
      <CardContent>
        {winners.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No winners yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Prize</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {winners.map((winner) => (
                <TableRow key={winner.id}>
                  <TableCell>{new Date(winner.won_date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{winner.username}</TableCell>
                  <TableCell className="text-green-500 font-semibold">${winner.prize_amount.toFixed(2)}</TableCell>
                  <TableCell>{winner.raffle_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
