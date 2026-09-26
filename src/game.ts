/** Filipino, no-joker practice mahjong: five melds and a pair, with 36 bonus tiles. */
export type Suit = "dots" | "bamboo" | "characters" | "bonus";
export interface Tile {
  id: string;
  suit: Suit;
  rank: number;
  label: string;
}
export interface Meld {
  id: string;
  kind: "chow" | "pung" | "kong";
  tiles: Tile[];
  fromPlayer: number | null;
  concealed: boolean;
}
export interface Player {
  id: number;
  name: string;
  hand: Tile[];
  flowers: Tile[];
  melds: Meld[];
  score: number;
}
export interface Discard {
  tile: Tile;
  playerId: number;
}
export type WinningPattern = "standard" | "siete-pares";
export type WinType = "self-draw" | "discard";
export interface RoundResult {
  winner: number;
  winType: WinType;
  winningTile: Tile;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  pattern: WinningPattern;
}
export interface GameState {
  id: string;
  seed: number;
  players: Player[];
  wall: Tile[];
  currentPlayer: number;
  dealer: number;
  phase: "discard" | "claim" | "draw" | "finished";
  lastDiscard: Discard | null;
  discards: Discard[];
  log: string[];
  drawnTileId: string | null;
  sietePares: boolean;
  winner: number | null;
  winType: WinType | null;
  endReason: "win" | "wall-exhausted" | null;
  result: RoundResult | null;
}
export type GameAction =
  | { type: "discard"; tileId: string }
  | { type: "draw" }
  | { type: "win" }
  | { type: "pass" }
  | { type: "chow"; tileIds: [string, string] }
  | { type: "pung" }
  | { type: "kong" }
  | { type: "concealed-kong"; tileIds: string[] }
  | { type: "added-kong"; meldIndex: number };
export interface GameOptions {
  seed?: number | string;
  dealer?: number;
  names?: string[];
  scores?: number[];
  sietePares?: boolean;
}

const SUITS: Suit[] = ["dots", "bamboo", "characters", "bonus"];
const BONUS_NAMES = [
  "East Wind",
  "South Wind",
  "West Wind",
  "North Wind",
  "Red Dragon",
  "Green Dragon",
  "White Dragon",
  "Plum",
  "Orchid",
  "Chrysanthemum",
  "Bamboo Flower",
  "Spring",
  "Summer",
  "Autumn",
  "Winter",
];
const tileIndex = (tile: Tile) => SUITS.indexOf(tile.suit) * 9 + tile.rank - 1;
const sameTile = (left: Tile, right: Tile) =>
  left.suit === right.suit && left.rank === right.rank;
const verb = (player: Player, base: string) =>
  player.name.toLowerCase() === "you" ? base : `${base}s`;
export const sortTiles = (tiles: readonly Tile[]): Tile[] =>
  [...tiles].sort(
    (a, b) => tileIndex(a) - tileIndex(b) || a.id.localeCompare(b.id),
  );

export function createTiles(): Tile[] {
  const tiles: Tile[] = [];
  for (const suit of SUITS.slice(0, 3)) {
    for (let rank = 1; rank <= 9; rank++) {
      for (let copy = 0; copy < 4; copy++)
        tiles.push({
          id: `${suit}-${rank}-${copy}`,
          suit,
          rank,
          label: `${rank} ${suit === "characters" ? "Characters" : suit === "bamboo" ? "Bamboo" : "Dots"}`,
        });
    }
  }
  BONUS_NAMES.forEach((label, index) => {
    for (let copy = 0; copy < (index < 7 ? 4 : 1); copy++)
      tiles.push({
        id: `bonus-${index + 1}-${copy}`,
        suit: "bonus",
        rank: index + 1,
        label,
      });
  });
  return tiles;
}

function seedNumber(seed: number | string | undefined): number {
  if (seed === undefined) return Math.floor(Math.random() * 0x100000000);
  if (typeof seed === "number") return seed >>> 0;
  let value = 2166136261;
  for (const char of seed)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}
function seededRandom(seed: number) {
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function appendLog(state: GameState, message: string) {
  state.log = [...state.log.slice(-79), message];
}
function endDraw(state: GameState) {
  state.phase = "finished";
  state.endReason = "wall-exhausted";
  state.drawnTileId = null;
  appendLog(
    state,
    "The wall is empty. The round is a draw; no points are awarded.",
  );
}

/** Bonus replacement always comes from the back, including replacement bonuses. */
function drawPlayable(
  state: GameState,
  playerId: number,
  fromBack = false,
  quiet = false,
): Tile | null {
  const player = state.players[playerId];
  while (state.wall.length > 0) {
    const tile = (fromBack ? state.wall.pop() : state.wall.shift())!;
    if (tile.suit === "bonus") {
      player.flowers.push(tile);
      if (!quiet)
        appendLog(
          state,
          `${player.name} ${verb(player, "bank")} ${tile.label} and ${verb(player, "take")} a replacement.`,
        );
      fromBack = true;
      continue;
    }
    player.hand = [...player.hand, tile];
    return tile;
  }
  endDraw(state);
  return null;
}

export function createGame(options: GameOptions = {}): GameState {
  const seed = seedNumber(options.seed);
  const random = seededRandom(seed);
  const wall = createTiles();
  for (let i = wall.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [wall[i], wall[j]] = [wall[j], wall[i]];
  }
  const dealer = Number.isInteger(options.dealer)
    ? ((options.dealer! % 4) + 4) % 4
    : 0;
  const names = ["You", "Mila", "Lito", "Rosa"];
  const state: GameState = {
    id: `round-${seed}-${dealer}`,
    seed,
    players: names.map((name, id) => ({
      id,
      name: options.names?.[id] || name,
      hand: [],
      flowers: [],
      melds: [],
      score: options.scores?.[id] ?? 0,
    })),
    wall,
    currentPlayer: dealer,
    dealer,
    phase: "discard",
    lastDiscard: null,
    discards: [],
    log: [],
    drawnTileId: null,
    sietePares: options.sietePares ?? true,
    winner: null,
    winType: null,
    endReason: null,
    result: null,
  };
  for (let round = 0; round < 16; round++) {
    for (let offset = 0; offset < 4; offset++)
      drawPlayable(state, (dealer + offset) % 4, false, true);
  }
  state.drawnTileId = drawPlayable(state, dealer, false, true)?.id ?? null;
  const dealerPlayer = state.players[dealer];
  appendLog(
    state,
    `${dealerPlayer.name} ${verb(dealerPlayer, "deal")} and ${verb(dealerPlayer, "start")} with 17 tiles. Everyone else starts with 16.`,
  );
  appendLog(
    state,
    "Winds, dragons, flowers and seasons are banked as bonus tiles. Build five melds and a pair.",
  );
  return state;
}

function countsFor(tiles: readonly Tile[]): number[] | null {
  const counts = Array<number>(27).fill(0);
  for (const tile of tiles) {
    if (
      tile.suit === "bonus" ||
      tile.rank < 1 ||
      tile.rank > 9 ||
      !Number.isInteger(tile.rank)
    )
      return null;
    const index = tileIndex(tile);
    if (index < 0 || index >= 27 || ++counts[index] > 4) return null;
  }
  return counts;
}
function allMelds(counts: number[]): boolean {
  const index = counts.findIndex((count) => count > 0);
  if (index === -1) return true;
  if (counts[index] >= 3) {
    counts[index] -= 3;
    const success = allMelds(counts);
    counts[index] += 3;
    if (success) return true;
  }
  if (index % 9 <= 6 && counts[index + 1] > 0 && counts[index + 2] > 0) {
    counts[index]--;
    counts[index + 1]--;
    counts[index + 2]--;
    const success = allMelds(counts);
    counts[index]++;
    counts[index + 1]++;
    counts[index + 2]++;
    if (success) return true;
  }
  return false;
}

export function getWinningPattern(
  tiles: readonly Tile[],
  melds: readonly Meld[] | number = [],
  sietePares = true,
): WinningPattern | null {
  const meldCount = typeof melds === "number" ? melds : melds.length;
  if (
    !Number.isInteger(meldCount) ||
    meldCount < 0 ||
    meldCount > 5 ||
    tiles.length !== 17 - meldCount * 3
  )
    return null;
  const counts = countsFor(tiles);
  if (!counts) return null;
  if (
    sietePares &&
    meldCount === 0 &&
    counts.filter((count) => count === 2).length === 7 &&
    counts.filter((count) => count === 3).length === 1
  )
    return "siete-pares";
  for (let index = 0; index < counts.length; index++) {
    if (counts[index] < 2) continue;
    counts[index] -= 2;
    const success = allMelds(counts);
    counts[index] += 2;
    if (success) return "standard";
  }
  return null;
}
export function isWinningHand(
  tiles: readonly Tile[],
  melds: readonly Meld[] | number = [],
  sietePares = true,
): boolean {
  return getWinningPattern(tiles, melds, sietePares) !== null;
}

function chowActions(hand: readonly Tile[], discard: Tile): GameAction[] {
  const actions: GameAction[] = [];
  for (let start = discard.rank - 2; start <= discard.rank; start++) {
    if (start < 1 || start > 7) continue;
    const partners = [start, start + 1, start + 2]
      .filter((rank) => rank !== discard.rank)
      .map((rank) =>
        hand.find((tile) => tile.suit === discard.suit && tile.rank === rank),
      );
    if (partners[0] && partners[1])
      actions.push({ type: "chow", tileIds: [partners[0].id, partners[1].id] });
  }
  return actions;
}

/** Legal choices for a seat. A claim window includes Pass only when that seat can claim. */
export function getActions(state: GameState, playerId = 0): GameAction[] {
  if (state.phase === "finished" || !state.players[playerId]) return [];
  const player = state.players[playerId];
  if (state.phase === "claim") {
    const discard = state.lastDiscard;
    if (!discard || discard.playerId === playerId) return [];
    const actions: GameAction[] = [];
    if (
      isWinningHand(
        [...player.hand, discard.tile],
        player.melds,
        state.sietePares,
      )
    )
      actions.push({ type: "win" });
    if (player.melds.length < 5) {
      const matches = player.hand.filter((tile) =>
        sameTile(tile, discard.tile),
      );
      if (matches.length >= 3 && state.wall.length > 0)
        actions.push({ type: "kong" });
      if (matches.length >= 2) actions.push({ type: "pung" });
      if (playerId === (discard.playerId + 1) % 4)
        actions.push(...chowActions(player.hand, discard.tile));
    }
    if (actions.length) actions.push({ type: "pass" });
    return actions;
  }
  if (state.currentPlayer !== playerId) return [];
  if (state.phase === "draw") return [{ type: "draw" }];
  const actions: GameAction[] = player.hand.map((tile) => ({
    type: "discard",
    tileId: tile.id,
  }));
  if (
    state.drawnTileId &&
    isWinningHand(player.hand, player.melds, state.sietePares)
  )
    actions.unshift({ type: "win" });
  if (state.drawnTileId && state.wall.length > 0) {
    if (player.melds.length < 5) {
      const groups = new Map<number, Tile[]>();
      for (const tile of player.hand)
        groups.set(tileIndex(tile), [
          ...(groups.get(tileIndex(tile)) ?? []),
          tile,
        ]);
      for (const tiles of groups.values())
        if (tiles.length === 4)
          actions.push({
            type: "concealed-kong",
            tileIds: tiles.map((tile) => tile.id),
          });
    }
    const drawn = player.hand.find((tile) => tile.id === state.drawnTileId);
    if (drawn)
      player.melds.forEach((meld, meldIndex) => {
        if (meld.kind === "pung" && sameTile(meld.tiles[0], drawn))
          actions.push({ type: "added-kong", meldIndex });
      });
  }
  return actions;
}

function actionsEqual(a: GameAction, b: GameAction): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "discard" && b.type === "discard")
    return a.tileId === b.tileId;
  if (a.type === "added-kong" && b.type === "added-kong")
    return a.meldIndex === b.meldIndex;
  if (
    (a.type === "chow" || a.type === "concealed-kong") &&
    (b.type === "chow" || b.type === "concealed-kong")
  )
    return [...a.tileIds].sort().join("|") === [...b.tileIds].sort().join("|");
  return true;
}
function clone(state: GameState): GameState {
  return {
    ...state,
    wall: [...state.wall],
    discards: [...state.discards],
    log: [...state.log],
    players: state.players.map((player) => ({
      ...player,
      hand: [...player.hand],
      flowers: [...player.flowers],
      melds: player.melds.map((meld) => ({ ...meld, tiles: [...meld.tiles] })),
    })),
  };
}

function finishWin(state: GameState, playerId: number, winType: WinType) {
  const player = state.players[playerId];
  const winningTile =
    winType === "discard"
      ? state.lastDiscard!.tile
      : (player.hand.find((tile) => tile.id === state.drawnTileId) ??
        player.hand[player.hand.length - 1]);
  if (winType === "discard") {
    player.hand = [...player.hand, winningTile];
    state.discards.pop();
  }
  const pattern = getWinningPattern(
    player.hand,
    player.melds,
    state.sietePares,
  )!;
  const bonusPoints = player.flowers.length;
  const totalPoints = (10 + bonusPoints) * (winType === "self-draw" ? 2 : 1);
  player.score += totalPoints;
  state.result = {
    winner: playerId,
    winType,
    winningTile,
    basePoints: 10,
    bonusPoints,
    totalPoints,
    pattern,
  };
  state.phase = "finished";
  state.winner = playerId;
  state.winType = winType;
  state.endReason = "win";
  state.currentPlayer = playerId;
  state.lastDiscard = null;
  appendLog(
    state,
    `${player.name} ${verb(player, "win")} ${winType === "self-draw" ? "by bunot (self-draw)" : "by todas (discard)"}${pattern === "siete-pares" ? " with siete pares" : ""}: +${totalPoints} practice points.`,
  );
}

/** Small exact grouping search guides the bots without inspecting other hands or the wall. */
function handValue(hand: readonly Tile[]): number {
  const counts = countsFor(hand);
  if (!counts) return -1000;
  let total = 0;
  for (let suit = 0; suit < 3; suit++) {
    const values = counts.slice(suit * 9, suit * 9 + 9);
    const memo = new Map<string, number>();
    const evaluate = (): number => {
      const key = values.join("");
      const known = memo.get(key);
      if (known !== undefined) return known;
      const index = values.findIndex((count) => count > 0);
      if (index < 0) return 0;
      values[index]--;
      let best = evaluate();
      if (values[index] >= 1) {
        values[index]--;
        best = Math.max(best, 3 + evaluate());
        values[index]++;
      }
      if (values[index] >= 2) {
        values[index] -= 2;
        best = Math.max(best, 9 + evaluate());
        values[index] += 2;
      }
      if (index <= 6 && values[index + 1] && values[index + 2]) {
        values[index + 1]--;
        values[index + 2]--;
        best = Math.max(best, 9 + evaluate());
        values[index + 1]++;
        values[index + 2]++;
      }
      for (const step of [1, 2]) {
        if (index + step < 9 && values[index + step]) {
          values[index + step]--;
          best = Math.max(
            best,
            (step === 1 && index > 0 && index < 7 ? 2.6 : 1.8) + evaluate(),
          );
          values[index + step]++;
        }
      }
      values[index]++;
      memo.set(key, best);
      return best;
    };
    total += evaluate();
  }
  // Keeping one prospective eye is valuable even when all current groups are complete.
  if (counts.some((count) => count === 2)) total += 0.3;
  return total;
}

export function suggestDiscard(
  hand: readonly Tile[],
  _openMelds: readonly Meld[] | number = [],
): Tile | null {
  if (!hand.length) return null;
  let best: Tile | null = null;
  let bestValue = -Infinity;
  const seen = new Set<number>();
  for (const tile of hand) {
    const index = tileIndex(tile);
    if (seen.has(index)) continue;
    seen.add(index);
    const value =
      handValue(hand.filter((candidate) => candidate.id !== tile.id)) +
      Math.abs(tile.rank - 5) * 0.001;
    if (value > bestValue) {
      bestValue = value;
      best = tile;
    }
  }
  return best;
}

function chosenBotClaim(state: GameState, playerId: number): GameAction | null {
  const actions = getActions(state, playerId);
  const win = actions.find((action) => action.type === "win");
  if (win) return win;
  const kong = actions.find((action) => action.type === "kong");
  if (kong) return kong;
  const player = state.players[playerId];
  let best: GameAction | null = null;
  let bestValue = handValue(player.hand) - 0.1;
  for (const action of actions) {
    if (action.type !== "pung" && action.type !== "chow") continue;
    const usedIds =
      action.type === "chow"
        ? action.tileIds
        : player.hand
            .filter((tile) => sameTile(tile, state.lastDiscard!.tile))
            .slice(0, 2)
            .map((tile) => tile.id);
    const remaining = player.hand.filter((tile) => !usedIds.includes(tile.id));
    const discard = suggestDiscard(remaining);
    const value =
      handValue(remaining.filter((tile) => tile.id !== discard?.id)) + 9;
    if (value > bestValue) {
      best = action;
      bestValue = value;
    }
  }
  return best;
}

function applyClaim(state: GameState, playerId: number, action: GameAction) {
  if (action.type === "win") {
    finishWin(state, playerId, "discard");
    return;
  }
  const discard = state.lastDiscard!;
  const player = state.players[playerId];
  const usedIds =
    action.type === "chow"
      ? action.tileIds
      : player.hand
          .filter((tile) => sameTile(tile, discard.tile))
          .slice(0, action.type === "kong" ? 3 : 2)
          .map((tile) => tile.id);
  const tiles = sortTiles([
    ...player.hand.filter((tile) => usedIds.includes(tile.id)),
    discard.tile,
  ]);
  player.hand = player.hand.filter((tile) => !usedIds.includes(tile.id));
  const kind = action.type as "chow" | "pung" | "kong";
  player.melds.push({
    id: `meld-${discard.tile.id}`,
    kind,
    tiles,
    fromPlayer: discard.playerId,
    concealed: false,
  });
  state.discards.pop();
  state.lastDiscard = null;
  state.currentPlayer = playerId;
  state.phase = "discard";
  state.drawnTileId = null;
  appendLog(
    state,
    `${player.name} ${verb(player, "call")} ${kind === "kong" ? "kang" : kind} on ${discard.tile.label}.`,
  );
  if (kind === "kong")
    state.drawnTileId = drawPlayable(state, playerId, true)?.id ?? null;
}

/** Resolve every seat together so choosing Chow can never outrank another seat's Pung or win. */
function resolveClaims(state: GameState, humanChoice: GameAction | null) {
  const discard = state.lastDiscard!;
  const claims: {
    playerId: number;
    action: GameAction;
    priority: number;
    distance: number;
  }[] = [];
  for (let distance = 1; distance <= 3; distance++) {
    const playerId = (discard.playerId + distance) % 4;
    const action =
      playerId === 0 ? humanChoice : chosenBotClaim(state, playerId);
    if (!action || action.type === "pass") continue;
    claims.push({
      playerId,
      action,
      priority: action.type === "win" ? 3 : action.type === "chow" ? 1 : 2,
      distance,
    });
  }
  claims.sort((a, b) => b.priority - a.priority || a.distance - b.distance);
  const selected = claims[0];
  if (selected) {
    if (humanChoice && humanChoice.type !== "pass" && selected.playerId !== 0)
      appendLog(
        state,
        `${state.players[selected.playerId].name}'s ${selected.action.type === "win" ? "win" : selected.action.type} takes priority over your ${humanChoice.type}.`,
      );
    applyClaim(state, selected.playerId, selected.action);
  } else {
    state.currentPlayer = (discard.playerId + 1) % 4;
    state.phase = "draw";
    state.drawnTileId = null;
  }
}

/** Invalid/stale choices are a no-op. All successful moves return a fresh state. */
export function reduceGame(
  state: GameState,
  action: GameAction,
  playerId = 0,
): GameState {
  if (!getActions(state, playerId).some((legal) => actionsEqual(legal, action)))
    return state;
  const next = clone(state);
  if (next.phase === "claim") {
    // Only the human submits claim choices; bots are resolved simultaneously.
    if (playerId !== 0) return state;
    resolveClaims(next, action);
    return next;
  }
  const player = next.players[playerId];
  if (action.type === "draw") {
    const tile = drawPlayable(next, playerId);
    next.drawnTileId = tile?.id ?? null;
    if (tile) {
      next.phase = "discard";
      appendLog(
        next,
        `${player.name} ${verb(player, "draw")} ${playerId === 0 ? tile.label : "a tile"}.`,
      );
    }
  } else if (action.type === "discard") {
    const tile = player.hand.find((tile) => tile.id === action.tileId)!;
    player.hand = player.hand.filter(
      (candidate) => candidate.id !== action.tileId,
    );
    next.lastDiscard = { tile, playerId };
    next.discards.push(next.lastDiscard);
    next.drawnTileId = null;
    next.phase = "claim";
    appendLog(next, `${player.name} ${verb(player, "discard")} ${tile.label}.`);
  } else if (action.type === "win") {
    finishWin(next, playerId, "self-draw");
  } else if (action.type === "concealed-kong") {
    const tiles = player.hand.filter((tile) =>
      action.tileIds.includes(tile.id),
    );
    player.hand = player.hand.filter(
      (tile) => !action.tileIds.includes(tile.id),
    );
    player.melds.push({
      id: `meld-${tiles[0].id}`,
      kind: "kong",
      tiles,
      fromPlayer: null,
      concealed: true,
    });
    appendLog(
      next,
      `${player.name} ${verb(player, "declare")} a secret kang and ${verb(player, "take")} a replacement.`,
    );
    next.drawnTileId = drawPlayable(next, playerId, true)?.id ?? null;
  } else if (action.type === "added-kong") {
    const tile = player.hand.find(
      (candidate) => candidate.id === next.drawnTileId,
    )!;
    player.hand = player.hand.filter((candidate) => candidate.id !== tile.id);
    const meld = player.melds[action.meldIndex];
    meld.kind = "kong";
    meld.tiles.push(tile);
    appendLog(
      next,
      `${player.name} ${verb(player, "call")} sagasa, extending a pung with the tile just drawn.`,
    );
    next.drawnTileId = drawPlayable(next, playerId, true)?.id ?? null;
  }
  return next;
}

/** One visible bot step. A legal human claim pauses the table until the user chooses. */
export function advanceAI(state: GameState): GameState {
  if (state.phase === "finished") return state;
  if (state.phase === "claim") {
    if (getActions(state, 0).length) return state;
    const next = clone(state);
    resolveClaims(next, null);
    return next;
  }
  if (state.currentPlayer === 0) return state;
  const playerId = state.currentPlayer;
  const actions = getActions(state, playerId);
  const win = actions.find((action) => action.type === "win");
  if (win) return reduceGame(state, win, playerId);
  const draw = actions.find((action) => action.type === "draw");
  if (draw) return reduceGame(state, draw, playerId);
  const kong = actions.find(
    (action) =>
      action.type === "concealed-kong" || action.type === "added-kong",
  );
  if (kong) return reduceGame(state, kong, playerId);
  const tile = suggestDiscard(
    state.players[playerId].hand,
    state.players[playerId].melds,
  );
  return tile
    ? reduceGame(state, { type: "discard", tileId: tile.id }, playerId)
    : state;
}
