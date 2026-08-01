// Shared ticket-numbering logic used by BOTH the public raffle page and the
// admin draw panel so that ticket numbers — and the winning ticket picked by
// RNG — resolve to the exact same person on every screen.
//
// Tickets are distributed sequentially: users are placed in a deterministic
// order and each is assigned a contiguous block of ticket numbers. The first
// user holds tickets #1..#N, the next continues from #N+1, and so on — i.e.
// numbers are handed out in order as members accumulate wager.

export interface TicketUser {
  username: string;
  wager_amount: number;
  tickets: number;
}

export interface TicketHolder extends TicketUser {
  startTicket: number; // 1-based, inclusive
  endTicket: number; // inclusive
}

// Canonical, deterministic ordering shared by admin + public.
// Highest wager first (they earned their tickets first), username as a stable
// tiebreaker so both screens produce byte-for-byte identical assignments.
function canonicalSort(users: TicketUser[]): TicketUser[] {
  return [...users].sort((a, b) => {
    if (b.wager_amount !== a.wager_amount) return b.wager_amount - a.wager_amount;
    return a.username.localeCompare(b.username);
  });
}

// Assign each user a contiguous range of sequential ticket numbers.
export function assignTicketNumbers(users: TicketUser[]): {
  holders: TicketHolder[];
  total: number;
} {
  const sorted = canonicalSort(users);
  let cursor = 1;
  const holders: TicketHolder[] = sorted.map((u) => {
    const tickets = Math.max(0, Math.floor(u.tickets));
    const startTicket = cursor;
    const endTicket = cursor + tickets - 1;
    cursor = endTicket + 1;
    return { ...u, tickets, startTicket, endTicket };
  });
  return { holders, total: cursor - 1 };
}

// Find which holder owns a given ticket number.
export function findTicketOwner(
  holders: TicketHolder[],
  ticketNumber: number,
): TicketHolder | null {
  return (
    holders.find((h) => ticketNumber >= h.startTicket && ticketNumber <= h.endTicket) ?? null
  );
}

// Pick a random winning ticket number (1..total) and resolve its owner.
export function pickWinningTicket(
  holders: TicketHolder[],
  total: number,
): { ticketNumber: number; holder: TicketHolder } | null {
  if (total <= 0 || holders.length === 0) return null;
  const ticketNumber = Math.floor(Math.random() * total) + 1;
  const holder = findTicketOwner(holders, ticketNumber);
  if (!holder) return null;
  return { ticketNumber, holder };
}
