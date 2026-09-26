import { describe, expect, it } from "vitest";
import {
  advanceAI,
  createGame,
  createTiles,
  getActions,
  getWinningPattern,
  isWinningHand,
  reduceGame,
  sortTiles,
  suggestDiscard,
  type GameState,
  type Meld,
  type Tile,
} from "./game";

let serial = 0;
function tiles(spec: string): Tile[] {
  const suits = { d: "dots", b: "bamboo", c: "characters" } as const;
  return spec
    .trim()
    .split(/\s+/)
    .flatMap((group) => {
      const suit = suits[group.at(-1) as keyof typeof suits];
      return [...group.slice(0, -1)].map((rank) => ({
        id: `fixture-${serial++}`,
        suit,
        rank: Number(rank),
        label: `${rank} ${suit}`,
      }));
    });
}
function emptyTable(): GameState {
  const state = createGame({ seed: 21 });
  state.players.forEach((player) => {
    player.hand = [];
    player.flowers = [];
    player.melds = [];
  });
  state.discards = [];
  state.lastDiscard = null;
  state.drawnTileId = null;
  return state;
}
function offer(state: GameState, spec: string, playerId: number): Tile {
  const tile = tiles(spec)[0];
  state.phase = "claim";
  state.currentPlayer = playerId;
  state.lastDiscard = { tile, playerId };
  state.discards.push(state.lastDiscard);
  return tile;
}
function meld(spec: string, kind: Meld["kind"] = "pung"): Meld {
  return {
    id: `m-${serial++}`,
    kind,
    tiles: tiles(spec),
    concealed: false,
    fromPlayer: 3,
  };
}

describe("Filipino tile set and deal", () => {
  it("uses 108 suited tiles plus all 36 bonus tiles, with no playable honor tiles", () => {
    const deck = createTiles();
    expect(deck).toHaveLength(144);
    expect(new Set(deck.map((tile) => tile.id)).size).toBe(144);
    expect(deck.filter((tile) => tile.suit === "bonus")).toHaveLength(36);
    expect(deck.filter((tile) => tile.suit === "dots")).toHaveLength(36);
    expect(deck.filter((tile) => tile.label.includes("Dragon"))).toHaveLength(
      12,
    );
    expect(deck.filter((tile) => tile.label.includes("Wind"))).toHaveLength(16);
  });

  it("deals 16 working tiles each and 17 to the dealer, replacing every bonus", () => {
    const state = createGame({ seed: "fixed-deal", dealer: 2 });
    expect(state.players.map((player) => player.hand.length)).toEqual([
      16, 16, 17, 16,
    ]);
    expect(
      state.players
        .flatMap((player) => player.hand)
        .every((tile) => tile.suit !== "bonus"),
    ).toBe(true);
    const all = [
      ...state.wall,
      ...state.players.flatMap((player) => [...player.hand, ...player.flowers]),
    ];
    expect(new Set(all.map((tile) => tile.id)).size).toBe(144);
    expect(state).toEqual(createGame({ seed: "fixed-deal", dealer: 2 }));
    expect(state.drawnTileId).not.toBeNull();
  });
});

describe("17-tile winning structures", () => {
  it("recognizes five melds plus an eye and rejects a Chinese-size four-meld hand", () => {
    expect(isWinningHand(tiles("11122233344d 123b 789c"))).toBe(true);
    expect(isWinningHand(tiles("11122233344d 123b"))).toBe(false);
    expect(isWinningHand(tiles("11122233346d 123b 789c"))).toBe(false);
  });

  it("backtracks between triplets and runs and refuses sequences crossing suits", () => {
    expect(isWinningHand(tiles("11122233345677d 123b"))).toBe(true);
    expect(isWinningHand(tiles("11122244d 123b 789c 89b 1c"))).toBe(false);
  });

  it("counts an exposed kong as a single meld", () => {
    expect(
      isWinningHand(tiles("11122244d 123b 789c"), [meld("5555b", "kong")]),
    ).toBe(true);
    expect(isWinningHand(tiles("11122244d 123b 789c"), [])).toBe(false);
  });

  it("allows optional seven distinct pairs plus a pung, never seven pairs alone", () => {
    const special = tiles("11225588d 224488b 777c");
    expect(getWinningPattern(special)).toBe("siete-pares");
    expect(isWinningHand(special, [], false)).toBe(false);
    expect(isWinningHand(tiles("11225588d 224488b"))).toBe(false);
    expect(isWinningHand(tiles("11112255d 224488b 777c"))).toBe(false);
  });
});

describe("claim windows and precedence", () => {
  it("restricts a chow to the next player in turn order but allows a pung from any seat", () => {
    const state = emptyTable();
    state.players[0].hand = tiles("13d");
    state.players[1].hand = tiles("13d");
    state.players[2].hand = tiles("22d");
    offer(state, "2d", 3);
    expect(getActions(state, 0).some((action) => action.type === "chow")).toBe(
      true,
    );
    expect(getActions(state, 1).some((action) => action.type === "chow")).toBe(
      false,
    );
    expect(getActions(state, 2).some((action) => action.type === "pung")).toBe(
      true,
    );
  });

  it("pauses bots for a legal human claim, then gives an opposing pung priority over chow", () => {
    const state = emptyTable();
    state.players[0].hand = tiles("13d");
    state.players[2].hand = tiles("225b 22d");
    offer(state, "2d", 3);
    expect(advanceAI(state)).toBe(state);
    const chow = getActions(state, 0).find((action) => action.type === "chow")!;
    const next = reduceGame(state, chow);
    expect(next.currentPlayer).toBe(2);
    expect(next.players[2].melds[0].kind).toBe("pung");
    expect(next.players[0].hand).toEqual(state.players[0].hand);
    expect(next.discards).toHaveLength(0);
  });

  it("gives a winning claim priority over kong and resolves simultaneous wins by turn order", () => {
    const state = emptyTable();
    state.players[0].hand = tiles("1112223334d 123b 789c");
    state.players[2].hand = tiles("1236784d 456b 123456c");
    state.players[3].hand = tiles("444d");
    offer(state, "4d", 1);
    const next = reduceGame(state, { type: "win" });
    expect(next.winner).toBe(2);
    expect(next.winType).toBe("discard");
    expect(next.players[3].melds).toHaveLength(0);
    expect(next.result?.pattern).toBe("standard");
  });

  it("allows the human to pass a legal claim and allows bots to win without human involvement", () => {
    const state = emptyTable();
    state.players[0].hand = tiles("44d");
    state.players[2].hand = tiles("1236784d 456b 123456c");
    offer(state, "4d", 1);
    expect(reduceGame(state, { type: "pass" }).winner).toBe(2);
    state.players[0].hand = [];
    expect(advanceAI(state).winner).toBe(2);
  });

  it("moves to the next draw on an unclaimed discard and never permits claiming your own discard", () => {
    const state = emptyTable();
    offer(state, "9c", 3);
    expect(getActions(state, 3)).toEqual([]);
    const next = advanceAI(state);
    expect(next.phase).toBe("draw");
    expect(next.currentPlayer).toBe(0);
    expect(getActions(next)).toEqual([{ type: "draw" }]);
  });
});

describe("bonus replacement and Filipino kang rules", () => {
  it("appends new draws without reordering held tiles so draw-order display is truthful", () => {
    const state = emptyTable();
    state.phase = "draw";
    state.players[0].hand = tiles("7c 9d 2b");
    const originalOrder = [...state.players[0].hand];
    const draw = tiles("1d")[0];
    state.wall = [draw];
    const next = reduceGame(state, { type: "draw" });
    expect(next.players[0].hand).toEqual([...originalOrder, draw]);
    expect(state.players[0].hand).toEqual(originalOrder);
    const sorted = sortTiles(next.players[0].hand);
    expect(sorted).not.toEqual(next.players[0].hand);
    expect(next.players[0].hand).toEqual([...originalOrder, draw]);
  });

  it("draws normally from the front and takes all bonus replacements from the back", () => {
    const state = emptyTable();
    const [middle, back] = tiles("35d");
    const bonus = createTiles().filter((tile) => tile.suit === "bonus");
    state.wall = [bonus[0], middle, back, bonus[1]];
    state.phase = "draw";
    state.currentPlayer = 0;
    const next = reduceGame(state, { type: "draw" });
    expect(next.players[0].flowers).toEqual([bonus[0], bonus[1]]);
    expect(next.players[0].hand).toEqual([back]);
    expect(next.wall).toEqual([middle]);
    expect(next.drawnTileId).toBe(back.id);
  });

  it("permits a secret kang only on your own draw turn and replaces it from the back", () => {
    const state = emptyTable();
    state.players[0].hand = tiles("4444d 7b");
    state.drawnTileId = state.players[0].hand[4].id;
    const action = getActions(state).find(
      (candidate) => candidate.type === "concealed-kong",
    )!;
    expect(action).toBeDefined();
    const replacement = state.wall.at(-1)!;
    const next = reduceGame(state, action);
    expect(next.players[0].melds[0]).toMatchObject({
      kind: "kong",
      concealed: true,
      fromPlayer: null,
    });
    expect(next.players[0].melds[0].tiles).toHaveLength(4);
    if (replacement.suit !== "bonus")
      expect(next.drawnTileId).toBe(replacement.id);
    state.drawnTileId = null;
    expect(
      getActions(state).some(
        (candidate) => candidate.type === "concealed-kong",
      ),
    ).toBe(false);
  });

  it("permits sagasa only when the newly drawn tile completes an exposed pung", () => {
    const state = emptyTable();
    state.players[0].melds = [meld("333d")];
    state.players[0].hand = tiles("3d 8b");
    state.drawnTileId = state.players[0].hand[1].id;
    expect(
      getActions(state).some((action) => action.type === "added-kong"),
    ).toBe(false);
    state.drawnTileId = state.players[0].hand[0].id;
    expect(getActions(state)).toContainEqual({
      type: "added-kong",
      meldIndex: 0,
    });
    const next = reduceGame(state, { type: "added-kong", meldIndex: 0 });
    expect(next.players[0].melds[0].kind).toBe("kong");
    expect(next.players[0].melds[0].tiles).toHaveLength(4);
    expect(
      next.players[0].hand.some((tile) => tile.id === state.drawnTileId),
    ).toBe(false);
  });

  it("finishes as a draw if the wall ends during a bonus replacement", () => {
    const state = emptyTable();
    state.phase = "draw";
    state.wall = createTiles()
      .filter((tile) => tile.suit === "bonus")
      .slice(0, 2);
    const next = reduceGame(state, { type: "draw" });
    expect(next.phase).toBe("finished");
    expect(next.endReason).toBe("wall-exhausted");
    expect(next.winner).toBeNull();
    expect(next.players[0].flowers).toHaveLength(2);
    expect(next.players[0].score).toBe(0);
  });
});

describe("safe pure transitions and practice scoring", () => {
  it("rejects stale, foreign, duplicate and otherwise illegal tile actions without changing the state", () => {
    const state = createGame({ seed: 42 });
    expect(
      reduceGame(state, {
        type: "discard",
        tileId: state.players[1].hand[0].id,
      }),
    ).toBe(state);
    expect(reduceGame(state, { type: "win" })).toBe(state);
    expect(reduceGame(state, { type: "draw" })).toBe(state);
    expect(
      reduceGame(state, {
        type: "concealed-kong",
        tileIds: Array(4).fill(state.players[0].hand[0].id),
      }),
    ).toBe(state);
    const original = JSON.stringify(state);
    const next = reduceGame(state, {
      type: "discard",
      tileId: state.players[0].hand[0].id,
    });
    expect(next).not.toBe(state);
    expect(JSON.stringify(state)).toBe(original);
    expect(next.players[0].hand).toHaveLength(16);
  });

  it("doubles the full practice hand value for bunot and keeps accumulated scores", () => {
    const state = emptyTable();
    state.players[0].hand = tiles("11122233344d 123b 789c");
    state.players[0].flowers = createTiles()
      .filter((tile) => tile.suit === "bonus")
      .slice(0, 3);
    state.players[0].score = 40;
    state.drawnTileId = state.players[0].hand[0].id;
    const next = reduceGame(state, { type: "win" });
    expect(next.result).toMatchObject({
      basePoints: 10,
      bonusPoints: 3,
      totalPoints: 26,
      winType: "self-draw",
    });
    expect(next.players[0].score).toBe(66);
    expect(reduceGame(next, { type: "win" })).toBe(next);
    expect(
      createGame({ scores: next.players.map((player) => player.score) })
        .players[0].score,
    ).toBe(66);
  });

  it("suggests a real tile without mutating a hand, preferring an isolated terminal", () => {
    const hand = tiles("12345677d 123456b 12c 9d");
    const before = [...hand];
    const suggestion = suggestDiscard(hand)!;
    expect(hand).toContain(suggestion);
    expect(suggestion).toMatchObject({ suit: "dots", rank: 9 });
    expect(hand).toEqual(before);
    expect(sortTiles(hand)).not.toBe(hand);
  });
});
