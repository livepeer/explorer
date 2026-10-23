import { paginate, querySubgraph } from "./client";

/* ── Gateways (the subgraph's `Broadcaster`) ─────────────────────────────── */

const DAY = 86400;

type RawBroadcaster = {
  id: string;
  deposit: string;
  reserve: string;
  thirtyDayVolumeETH: string;
  ninetyDayVolumeETH: string;
  totalVolumeETH: string;
  firstActiveDay: number;
  lastActiveDay: number;
  broadcasterDays: { date: number; volumeETH: string }[] | null;
};

export type GatewayDay = { date: number; volumeETH: number };

export type Gateway = {
  id: string;
  /** Pays for tickets; withdrawable after an unlock period. */
  deposit: number;
  /** Backs tickets once the deposit runs out, split between orchestrators. */
  reserve: number;
  thirtyDayVolumeETH: number;
  ninetyDayVolumeETH: number;
  totalVolumeETH: number;
  firstActiveDay: number;
  lastActiveDay: number;
  /** Days with fees, oldest first. Days without fees are absent. */
  days: GatewayDay[];
};

const GATEWAY_FIELDS = /* GraphQL */ `
  id
  deposit
  reserve
  thirtyDayVolumeETH
  ninetyDayVolumeETH
  totalVolumeETH
  firstActiveDay
  lastActiveDay
`;

function toGateway(b: RawBroadcaster): Gateway {
  return {
    id: b.id,
    deposit: Number(b.deposit),
    reserve: Number(b.reserve),
    thirtyDayVolumeETH: Number(b.thirtyDayVolumeETH),
    ninetyDayVolumeETH: Number(b.ninetyDayVolumeETH),
    totalVolumeETH: Number(b.totalVolumeETH),
    firstActiveDay: Number(b.firstActiveDay),
    lastActiveDay: Number(b.lastActiveDay),
    days: (b.broadcasterDays ?? [])
      .map((d) => ({ date: Number(d.date), volumeETH: Number(d.volumeETH) }))
      .sort((a, b) => a.date - b.date),
  };
}

/** ETH paid per day over the trailing `days`, gaps filled with zero. */
export function dailyFees(
  days: GatewayDay[],
  span: number,
  nowSec = Date.now() / 1000
): GatewayDay[] {
  const today = Math.floor(nowSec / DAY) * DAY;
  const byDate = new Map(days.map((d) => [d.date, d.volumeETH]));
  return Array.from({ length: span }, (_, i) => {
    const date = today - (span - 1 - i) * DAY;
    return { date, volumeETH: byDate.get(date) ?? 0 };
  });
}

/**
 * Days the deposit lasts at the last 30 days' pace. Null when it paid
 * nothing in that time, since there's no pace to measure.
 */
export function depositRunway(g: Gateway): number | null {
  const perDay = g.thirtyDayVolumeETH / 30;
  return perDay > 0 ? g.deposit / perDay : null;
}

const GATEWAYS = /* GraphQL */ `
  query Gateways($minActiveDay: Int!) {
    broadcasters(
      first: 500
      orderBy: ninetyDayVolumeETH
      orderDirection: desc
      where: {
        or: [
          { ninetyDayVolumeETH_gt: "0" }
          { firstActiveDay_gte: $minActiveDay }
        ]
      }
    ) {
      ${GATEWAY_FIELDS}
      broadcasterDays(first: 90, orderBy: date, orderDirection: desc) {
        date
        volumeETH
      }
    }
  }
`;

/**
 * Gateways that paid fees in the last 90 days or started in the last year,
 * the same set the previous explorer listed.
 */
export async function fetchGateways(
  nowSec = Math.floor(Date.now() / 1000)
): Promise<Gateway[]> {
  const { broadcasters } = await querySubgraph<{
    broadcasters: RawBroadcaster[];
  }>(GATEWAYS, { minActiveDay: nowSec - 365 * DAY });
  return broadcasters.map(toGateway);
}

const GATEWAY = /* GraphQL */ `
  query Gateway($id: ID!) {
    broadcaster(id: $id) {
      ${GATEWAY_FIELDS}
      broadcasterDays(first: 365, orderBy: date, orderDirection: desc) {
        date
        volumeETH
      }
    }
  }
`;

/** One gateway, or null when the address has never funded a deposit. */
export async function fetchGateway(id: string): Promise<Gateway | null> {
  const { broadcaster } = await querySubgraph<{
    broadcaster: RawBroadcaster | null;
  }>(GATEWAY, { id: id.toLowerCase() });
  return broadcaster ? toGateway(broadcaster) : null;
}

/* ── Who a gateway pays ──────────────────────────────────────────────────── */

type RawTicket = {
  id: string;
  timestamp: number;
  faceValue: string;
  recipient: { id: string } | null;
};

const TICKET_FIELDS = /* GraphQL */ `
  id
  timestamp
  faceValue
  recipient {
    id
  }
`;

/** Newest first, strictly before `before`. */
const GATEWAY_TICKETS_BEFORE = /* GraphQL */ `
  query GatewayTicketsBefore(
    $sender: String!
    $since: Int!
    $before: Int!
    $first: Int!
  ) {
    winningTicketRedeemedEvents(
      first: $first
      orderBy: timestamp
      orderDirection: desc
      where: { sender: $sender, timestamp_gte: $since, timestamp_lt: $before }
    ) {
      ${TICKET_FIELDS}
    }
  }
`;

/** Every ticket at exactly one timestamp, paged by id. */
const GATEWAY_TICKETS_AT = /* GraphQL */ `
  query GatewayTicketsAt(
    $sender: String!
    $at: Int!
    $first: Int!
    $lastId: String!
  ) {
    winningTicketRedeemedEvents(
      first: $first
      orderBy: id
      where: { sender: $sender, timestamp: $at, id_gt: $lastId }
    ) {
      ${TICKET_FIELDS}
    }
  }
`;

const TICKET_PAGE = 1000;

export type GatewayRecipient = {
  id: string;
  fees: number;
  tickets: number;
  lastPaid: number;
  /** The gateway paying itself: the recipient is its own address. */
  self: boolean;
};

export type GatewayPayouts = {
  since: number;
  total: number;
  recipients: GatewayRecipient[];
  /** Share of `total` the gateway paid to its own orchestrator. */
  selfShare: number;
  /** True when the ticket cap was hit, so totals undercount. */
  truncated: boolean;
};

const TICKET_CAP = 10_000;

/** Winning tickets the gateway paid out since `since`, grouped by orchestrator. */
export async function fetchGatewayPayouts(
  id: string,
  since: number
): Promise<GatewayPayouts> {
  const sender = id.toLowerCase();
  const { rows, truncated } = await newestTickets(sender, since, TICKET_CAP);
  return summarizePayouts(sender, since, rows, truncated);
}

/**
 * The gateway's most recent tickets since `since`, up to `cap`, newest
 * first. Ids are hashes, so paging by id gave an arbitrary sample once the
 * cap was hit; this pages by time instead. A redemption batch shares one
 * timestamp, so each page's oldest timestamp is read in full by id before
 * moving past it, and nothing at a boundary is skipped or repeated.
 * `truncated` is true only if a ticket past the cap actually exists.
 */
export async function newestTickets(
  sender: string,
  since: number,
  cap: number
): Promise<{ rows: RawTicket[]; truncated: boolean }> {
  const seen = new Set<string>();
  const rows: RawTicket[] = [];
  const add = (page: RawTicket[]) => {
    for (const r of page) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      rows.push(r);
    }
  };
  let before = 2 ** 31 - 1;
  while (rows.length <= cap) {
    const { winningTicketRedeemedEvents: page } = await querySubgraph<{
      winningTicketRedeemedEvents: RawTicket[];
    }>(GATEWAY_TICKETS_BEFORE, { sender, since, before, first: TICKET_PAGE });
    add(page);
    if (page.length < TICKET_PAGE) break;
    // The page may end partway through its oldest timestamp: read all of it.
    const at = Number(page[page.length - 1].timestamp);
    add(
      await paginate<RawTicket>(
        GATEWAY_TICKETS_AT,
        "winningTicketRedeemedEvents",
        { sender, at },
        { max: cap + 1, partial: true }
      )
    );
    before = at;
  }
  rows.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  return { rows: rows.slice(0, cap), truncated: rows.length > cap };
}

export function summarizePayouts(
  sender: string,
  since: number,
  rows: RawTicket[],
  truncated = false
): GatewayPayouts {
  const by = new Map<string, GatewayRecipient>();
  let total = 0;
  for (const t of rows) {
    const to = t.recipient?.id;
    if (!to) continue;
    const fee = Number(t.faceValue);
    total += fee;
    const r = by.get(to) ?? {
      id: to,
      fees: 0,
      tickets: 0,
      lastPaid: 0,
      self: to === sender,
    };
    r.fees += fee;
    r.tickets += 1;
    r.lastPaid = Math.max(r.lastPaid, Number(t.timestamp));
    by.set(to, r);
  }
  const recipients = [...by.values()].sort((a, b) => b.fees - a.fees);
  const self = recipients.find((r) => r.self)?.fees ?? 0;
  return {
    since,
    total,
    recipients,
    selfShare: total > 0 ? self / total : 0,
    truncated,
  };
}
