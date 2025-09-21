
import { TeamData, SleeperUser, SleeperRoster, TradedPick, Player, DraftPick, PlayerMap } from '../types';

const NFL_STATE_URL = 'https://api.sleeper.app/v1/state/nfl';
const DRAFT_YEARS = ['2025', '2026', '2027'];

let playerCache: PlayerMap | null = null;

interface SleeperDraft {
  draft_id: string;
  season: string;
  status: string;
}

interface SleeperDraftPick {
  player_id: string;
  round: number;
}

async function fetchJson<T,>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function getPlayerMap(): Promise<PlayerMap> {
  if (playerCache) {
    return playerCache;
  }
  const players = await fetchJson<PlayerMap>('https://api.sleeper.app/v1/players/nfl');
  playerCache = players;
  return players;
}

export async function fetchLeagueData(leagueId: string): Promise<TeamData[]> {
  if (!leagueId.trim()) {
    throw new Error("League ID cannot be empty.");
  }
  
  const leagueUrl = `https://api.sleeper.app/v1/league/${leagueId}`;
  const usersUrl = `https://api.sleeper.app/v1/league/${leagueId}/users`;
  const rostersUrl = `https://api.sleeper.app/v1/league/${leagueId}/rosters`;
  const tradedPicksUrl = `https://api.sleeper.app/v1/league/${leagueId}/traded_picks`;
  const draftsUrl = `https://api.sleeper.app/v1/league/${leagueId}/drafts`;

  const [league, users, rosters, tradedPicks, playerMap, drafts] = await Promise.all([
    fetchJson<{ total_rosters: number, season: string }>(leagueUrl),
    fetchJson<SleeperUser[]>(usersUrl),
    fetchJson<SleeperRoster[]>(rostersUrl),
    fetchJson<TradedPick[]>(tradedPicksUrl),
    getPlayerMap(),
    fetchJson<SleeperDraft[]>(draftsUrl),
  ]);

  const draft = drafts.find(d => d.status === 'complete');
  const draftPlayerRounds = new Map<string, number>();

  if (draft) {
    const draftPicksUrl = `https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`;
    const draftPicks = await fetchJson<SleeperDraftPick[]>(draftPicksUrl);
    draftPicks.forEach(pick => {
      if (pick.player_id) {
        draftPlayerRounds.set(pick.player_id, pick.round);
      }
    });
  }

  const userMap = new Map(users.map(user => [user.user_id, user]));
  const rosterMap = new Map(rosters.map(roster => [roster.roster_id, roster]));

  // Initialize draft picks for every team
  const picksByOwner = new Map<number, DraftPick[]>();
  rosters.forEach(roster => {
    const initialPicks: DraftPick[] = [];
    DRAFT_YEARS.forEach(year => {
      for (let round = 1; round <= (league.total_rosters > 12 ? 4 : 5) ; round++) { // Basic round estimation
        initialPicks.push({ year, round, original_owner_id: roster.roster_id });
      }
    });
    picksByOwner.set(roster.roster_id, initialPicks);
  });

  // Adjust picks based on trades
  tradedPicks.forEach(trade => {
    const currentOwnerPicks = picksByOwner.get(trade.owner_id);
    const previousOwnerPicks = picksByOwner.get(trade.previous_owner_id);

    if (currentOwnerPicks && previousOwnerPicks) {
      const pickIndex = previousOwnerPicks.findIndex(
        p => p.year === trade.season && p.round === trade.round && p.original_owner_id === trade.roster_id
      );
      
      if (pickIndex > -1) {
        const [movedPick] = previousOwnerPicks.splice(pickIndex, 1);
        currentOwnerPicks.push(movedPick);
      }
    }
  });

  const teams: TeamData[] = rosters.map(roster => {
    const players: Player[] = (roster.players || [])
      .map((playerId): Player | null => {
        const playerData = playerMap[playerId];
        return playerData ? {
          id: playerId,
          name: playerData.full_name || 'Unknown Player',
          position: playerData.position || 'N/A',
          team: playerData.team || 'FA',
          draftRound: draftPlayerRounds.get(playerId),
        } : null;
      })
      .filter((p): p is Player => p !== null)
      .sort((a, b) => { // Sort players by position
        const posOrder = ['QB', 'RB', 'WR', 'TE'];
        const aPos = posOrder.indexOf(a.position);
        const bPos = posOrder.indexOf(b.position);
        if (aPos === -1) return 1;
        if (bPos === -1) return -1;
        if (aPos === bPos) return a.name.localeCompare(b.name);
        return aPos - bPos;
      });

    const ownedPicks = picksByOwner.get(roster.roster_id) || [];
    ownedPicks.sort((a, b) => {
        if (a.year !== b.year) return a.year.localeCompare(b.year);
        return a.round - b.round;
    });

    return {
      id: roster.roster_id,
      owner: userMap.get(roster.owner_id) || null,
      roster: players,
      draft_picks: ownedPicks,
    };
  });
  
  return teams;
}
