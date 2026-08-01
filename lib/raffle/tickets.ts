// Shared ticket-numbering logic used by BOTH the public raffle page and the
// admin draw panel so that ticket numbers — and the winning ticket picked by
// RNG — resolve to the exact same person on every screen.
//
// Tickets are minted in THRESHOLD ROUNDS, not contiguous per-player blocks.
// A player earns their k-th ticket once they have wagered k × (wager-per-ticket),
// so ticket #1 goes to whoever crossed the first threshold, #2 to the next, and
// so on. We model this by distributing tickets round-robin across rounds:
//   round 1 → every player's 1st ticket
//   round 2 → every player with >= 2 tickets gets their 2nd ticket
//   ...
// This interleaves a big wagerer's tickets throughout the pool instead of
// clustering them all at the front, matching how tickets are actually accrued.
//
// NOTE: platform APIs only expose each player's CUMULATIVE wager, not a
// timestamped history, so exact real-world ordering within a single round is
// unknowable. Within a round we fall back to a deterministic order (highest
// total wager first, username tiebreak) so both screens agree byte-for-byte.
// Draw odds are identical regardless of ordering — this only affects which
// number a player holds, not their probability of winning.

export interface TicketUser {
  username: string;
  wager_amount: number;
  tickets: number;
}

export interface TicketHolder extends TicketUser {
  ticketNumbers: number[]; // actual global ticket numbers this user holds, ascending
}

// Canonical, deterministic ordering shared by admin + public.
function canonicalSort(users: TicketUser[]): TicketUser[] {
  return [...users].sort((a, b) => {
    if (b.wager_amount !== a.wager_amount) return b.wager_amount - a.wager_amount;
    return a.username.localeCompare(b.username);
  });
}

// Assign ticket numbers by threshold rounds (see file header).
export function assignTicketNumbers(users: TicketUser[]): {
  holders: TicketHolder[];
  total: number;
  ownerByTicket: Map<number, TicketHolder>;
} {
  const sorted = canonicalSort(users).map<TicketHolder>((u) => ({
    ...u,
    tickets: Math.max(0, Math.floor(u.tickets)),
    ticketNumbers: [],
  }));

  const maxTickets = sorted.reduce((m, u) => Math.max(m, u.tickets), 0);
  const ownerByTicket = new Map<number, TicketHolder>();
  let cursor = 1;

  // Round-robin: everyone's 1st ticket, then everyone's 2nd, etc.
  for (let round = 0; round < maxTickets; round++) {
    for (const holder of sorted) {
      if (holder.tickets > round) {
        holder.ticketNumbers.push(cursor);
        ownerByTicket.set(cursor, holder);
        cursor++;
      }
    }
  }

  return { holders: sorted, total: cursor - 1, ownerByTicket };
}

// Find which holder owns a given ticket number.
export function findTicketOwner(
  holders: TicketHolder[],
  ticketNumber: number,
): TicketHolder | null {
  return holders.find((h) => h.ticketNumbers.includes(ticketNumber)) ?? null;
}

// Pick a random winning ticket number (1..total) and resolve its owner.
export function pickWinningTicket(
  holders: TicketHolder[],
  total: number,
  ownerByTicket?: Map<number, TicketHolder>,
): { ticketNumber: number; holder: TicketHolder } | null {
  if (total <= 0 || holders.length === 0) return null;
  const ticketNumber = Math.floor(Math.random() * total) + 1;
  const holder = ownerByTicket?.get(ticketNumber) ?? findTicketOwner(holders, ticketNumber);
  if (!holder) return null;
  return { ticketNumber, holder };
}
