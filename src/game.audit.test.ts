import { describe, expect, it } from "vitest";
import {
  advanceAI,
  createGame,
  getActions,
  isWinningHand,
  reduceGame,
} from "./game";

type State = ReturnType<typeof createGame>;
type Tile = State["players"][number]["hand"][number];

let nextId = 0;
const tile = (suit: Tile["suit"], rank: number): Tile => ({
  id: `audit-${nextId++}`,
  suit,
  rank,
  label: `${rank} ${suit}`,
});
const tiles = (suit: Tile["suit"], ranks: number[]) =>
  ranks.map((rank) => tile(suit, rank));

function assertConservation(state: State, context: string) {
  const inventory = [
    ...state.wall,
    ...state.discards.map((discard) => discard.tile),
    ...state.players.flatMap((player) => [
      ...player.hand,
      ...player.flowers,
      ...player.melds.flatMap((meld) => meld.tiles),
    ]),
  ];
  expect(inventory.length, context).toBe(144);
  expect(new Set(inventory.map((item) => item.id)).size, context).toBe(144);
  expect(
    inventory.filter((item) => item.suit === "bonus").length,
    context,
  ).toBe(36);
  for (const player of state.players) {
    expect(
      player.hand.every((item) => item.suit !== "bonus"),
      context,
    ).toBe(true);
    expect(
      player.flowers.every((item) => item.suit === "bonus"),
      context,
    ).toBe(true);
    for (const meld of player.melds) {
      expect(meld.tiles.length, context).toBe(meld.kind === "kong" ? 4 : 3);
    }
    const hasExtraTile =
      (state.phase === "discard" && state.currentPlayer === player.id) ||
      (state.phase === "finished" && state.winner === player.id);
    expect(player.hand.length + player.melds.length * 3, context).toBe(
      hasExtraTile ? 17 : 16,
    );
  }
}

describe("independent Filipino rules audit", () => {
  it("conserves the complete set and terminates during seeded full games", () => {
    for (let seed = 1; seed <= 36; seed++) {
      let state = createGame({ seed, dealer: seed % 4 });
      let steps = 0;
      assertConservation(state, `seed ${seed}, initial deal`);
      while (state.phase !== "finished" && steps < 400) {
        const actions = getActions(state, 0);
        const nonDiscard = actions.filter(
          (action) => action.type !== "discard",
        );
        const preferred =
          nonDiscard.find((action) => action.type === "win") ??
          (seed % 3 === 0
            ? nonDiscard.find((action) => action.type === "pass")
            : undefined) ??
          nonDiscard.find((action) => action.type !== "pass") ??
          nonDiscard[0] ??
          actions[(seed + steps) % actions.length];
        const next = preferred
          ? reduceGame(state, preferred, 0)
          : advanceAI(state);
        expect(next, `seed ${seed}, step ${steps}: no progress`).not.toEqual(
          state,
        );
        state = next;
        assertConservation(state, `seed ${seed}, step ${steps}`);
        steps++;
      }
      expect(state.phase, `seed ${seed} stalled after ${steps} actions`).toBe(
        "finished",
      );
    }
  }, 20_000);

  it("accepts a complete Filipino hand while rejecting the 14-tile shape", () => {
    const hand = [
      ...tiles("dots", [1, 2, 3, 4, 5, 6]),
      ...tiles("bamboo", [2, 3, 4]),
      ...tiles("characters", [5, 5, 5, 6, 7, 8, 9, 9]),
    ];
    expect(isWinningHand(hand)).toBe(true);
    expect(isWinningHand(hand.slice(3))).toBe(false);
  });

  it("requires seven distinct pairs plus a pung for siete pares", () => {
    const hand = [
      ...tiles("dots", [1, 1, 3, 3, 5, 5, 7, 7]),
      ...tiles("bamboo", [1, 1, 3, 3, 5, 5]),
      ...tiles("characters", [9, 9, 9]),
    ];
    expect(isWinningHand(hand, [], true)).toBe(true);
    expect(isWinningHand(hand, [], false)).toBe(false);
    expect(isWinningHand(hand.slice(0, 14), [], true)).toBe(false);
    const duplicatePair = [...hand];
    duplicatePair[2] = tile("dots", 1);
    duplicatePair[3] = tile("dots", 1);
    expect(isWinningHand(duplicatePair, [], true)).toBe(false);
  });

  it("never accepts a wind or dragon as an ordinary winning pair", () => {
    const hand = [
      ...tiles("dots", [1, 2, 3, 4, 5, 6]),
      ...tiles("bamboo", [2, 3, 4]),
      ...tiles("characters", [5, 5, 5, 6, 7, 8]),
      ...tiles("bonus", [1, 1]),
    ];
    expect(isWinningHand(hand)).toBe(false);
  });

  it("allows a secret kang after drawing an unrelated tile and replaces from the back", () => {
    const state = createGame({ seed: 81, dealer: 0 });
    state.players[0].hand = [
      ...tiles("dots", [2, 2, 2, 2, 4, 6, 8]),
      ...tiles("bamboo", [1, 3, 5, 7, 9]),
      ...tiles("characters", [1, 3, 5, 7, 9]),
    ];
    state.drawnTileId = state.players[0].hand.at(-1)!.id;
    const gift = tile("bamboo", 8);
    const flower = tile("bonus", 5);
    state.wall = [tile("characters", 2), gift, flower];
    const action = getActions(state).find(
      (item) => item.type === "concealed-kong",
    );
    expect(action).toBeDefined();
    const next = reduceGame(state, action!, 0);
    expect(next.players[0].melds.at(-1)?.kind).toBe("kong");
    expect(next.players[0].melds.at(-1)?.concealed).toBe(true);
    expect(next.players[0].hand.some((item) => item.id === gift.id)).toBe(true);
    expect(next.players[0].flowers.some((item) => item.id === flower.id)).toBe(
      true,
    );
    expect(next.players[0].hand.length + 3 * next.players[0].melds.length).toBe(
      17,
    );
  });

  it("does not relabel a discarded winning tile as a double-value self-draw after a pung", () => {
    const state = createGame({ seed: 91 });
    state.players.forEach((player) => {
      player.hand = [];
      player.melds = [];
    });
    state.players[0].hand = [
      ...tiles("dots", [1, 2, 3, 5, 5]),
      ...tiles("bamboo", [1, 2, 3, 4, 5, 6]),
      ...tiles("characters", [2, 3, 4, 9, 9]),
    ];
    const discard = { tile: tile("dots", 5), playerId: 1 };
    state.phase = "claim";
    state.currentPlayer = 1;
    state.drawnTileId = null;
    state.lastDiscard = discard;
    state.discards = [discard];
    expect(getActions(state).some((action) => action.type === "win")).toBe(
      true,
    );
    const next = reduceGame(state, { type: "pung" });
    expect(next.phase).toBe("discard");
    expect(next.drawnTileId).toBeNull();
    expect(getActions(next).some((action) => action.type === "win")).toBe(
      false,
    );
  });
});
