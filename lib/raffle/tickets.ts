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

// Highest Multi Raffle: a player qualifies once their highest single-bet
// multiplier during the period hits the threshold, earning 1 ticket per
// full multiple of the threshold they clear (e.g. threshold 200x: a 200x
// win = 1 ticket, a 600x win = 3 tickets, a 450x win = 2 tickets).
export function computeMultiplierTickets(highestMultiplier: number, threshold: number): number {
  if (threshold <= 0 || highestMultiplier < threshold) return 0;
  return Math.max(1, Math.floor(highestMultiplier / threshold));
}

// Parses raw rows from /api/roobet/affiliates (Roobet's Affiliate Stats API)
// into eligible Highest Multi Raffle entries. Roobet sends `highestMultiplier`
// as either a nested object { multiplier, wagered, payout, gameId, gameTitle }
// or occasionally a bare number — handle both. `wagered` on that object is the
// stake of the specific qualifying winning bet (the "min bet size" check).
export function parseMultiplierEligibility(
  rows: any[],
  threshold: number,
  minBetSize: number,
): TicketUser[] {
  const eligible: TicketUser[] = [];
  for (const row of rows ?? []) {
    const username = row?.username;
    if (!username) continue;

    const hm = row?.highestMultiplier;
    const multiplier =
      hm && typeof hm === 'object' ? Number(hm.multiplier) : Number(hm);
    const betSize = hm && typeof hm === 'object' ? Number(hm.wagered) : NaN;

    if (!Number.isFinite(multiplier) || multiplier < threshold) continue;
    if (!Number.isFinite(betSize) || betSize < minBetSize) continue;

    const tickets = computeMultiplierTickets(multiplier, threshold);
    if (tickets <= 0) continue;

    eligible.push({ username, wager_amount: multiplier, tickets });
  }
  return eligible;
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
