# Mesa · Filipino Mahjongg

A playable Filipino Mahjongg practice table for one person and three computer opponents, built with React, TypeScript, and Vite. Mesa uses a 16-tile Filipino hand, automatic bonus-flower replacement, and five sets plus a pair to win. The interface includes original SVG tiles, legal-call prompts, hints, adjustable computer pace, optional sounds, and an in-game rules guide.

## Run locally

Install Node.js and npm, then run:

```sh
npm install
npm run dev
```

Open the local address printed by Vite. The game starts with you as dealer, ready to choose your first discard.

```sh
npm run test
npm run build
npm run preview
```

`test` runs the engine tests. `build` checks TypeScript and generates the production files in `dist/`. `preview` serves that build locally.

## How to play

Select a tile, then click **Discard tile** or press **Enter**. When prompted on a subsequent turn, use **Draw a tile** before choosing your discard. Legal chow, pung, kang, and winning calls appear when available; choose **Pass** to decline a claim. **H** or **Give me a hint** suggests a discard on your turn. Hints are heuristic suggestions, not guaranteed winning moves.

Open **How to play** for the rules, or **Table settings** to change the computer pace between Relaxed, Steady, and Quick, toggle tile sounds, and change automatic sorting. A new game starts fresh; continuing after a result carries the table's points into the next round.

## This table's Filipino rules

Filipino Mahjongg has family and regional variations. Mesa implements the following explicit **no-joker practice rules**, informed by the [Mahjong Pros Filipino rules reference](https://mahjongpros.com/blogs/mahjong-rules-and-scoring-tables/official-filipino-mahjong-rules). That reference is a guide to a variant, not a universal authority over every Filipino table.

- **144 tiles:** 108 suited tiles—four copies each of 1–9 dots, bamboo, and characters—and 36 bonus tiles. All winds, dragons, flowers, and seasons are bonus flowers; they cannot form ordinary melds or a pair.
- **16 working tiles:** each player receives 16 playable tiles after replacements. The dealer receives a 17th and discards first. Play proceeds counterclockwise, to the right.
- **Automatic replacements:** bonus flowers are banked face up and replaced from the back of the wall, repeating if the replacement is another bonus. Normal draws come from the front. An exhausted wall ends the round as a draw.
- **Five sets and a pair:** a normal winning hand has five melds and one matching pair. A meld is a same-suit sequence of three, three identical tiles, or a declared four of a kind. A kang counts as one meld and receives a replacement, so a hand with kangs physically contains extra tiles.
- **Siete pares:** enabled at this table; seven distinct pairs plus a pung, all concealed, also wins. Four identical tiles do not count as two distinct pairs.
- **Chow:** claim the latest discard only from the player immediately before you to complete a same-suit sequence.
- **Pung and kang:** claim any player's latest discard with two or three matching tiles respectively. A kang draws a replacement from the back before the next discard.
- **Secret kang:** after your own draw, declare four matching concealed tiles and take a replacement.
- **Sagása:** upgrade an exposed pung only when the tile you just drew is its fourth match, then take a replacement. Another player's discard cannot upgrade your existing pung.
- **Winning claims:** a winning hand may claim any player's latest discard, including to complete a sequence or pair. A win outranks pung or kang, which outrank chow. Equal-priority claims go to the nearest player in turn order. Only the latest discard is claimable.
- **Dealer continuation:** when continuing rounds, the dealer stays after a win or drawn game; otherwise the deal passes to the right. No minimum hand value is required.

## Practice points

Only the winner earns points: **10 + the number of collected bonus flowers**. A self-drawn win (**búnot**) doubles that full amount; a discard win (**tódas**) does not. For example, six flowers earn **16 points** on a discard or **32 points** on a self-draw. Drawn rounds award no points.

This is Mesa's learning score. Traditional cash settlement, payments between players, special-hand payouts, instant flower or kang payments, and joker variants are not implemented.

## Browser data

Completed rounds, wins, total practice points, and your best score are saved only in this browser's `localStorage`. They are not synced to an account. If browser storage is unavailable, play and session statistics still work. The current hand and table preferences are session state; reloading starts a new game.

## Engine and verification

The game rules are isolated in `src/game.ts` as pure state transitions with seeded shuffling and legal-action validation. Computer players use the same rules as the human player.

`src/game.test.ts` covers tile composition, dealing, winning-hand search, claim priority, bonus replacement, the three kang forms, scoring, hints, and rejection of illegal actions. `src/game.audit.test.ts` independently checks the Filipino hand size and bonus rules, then plays 36 seeded games to completion. After every simulated transition it verifies all 144 unique tiles are conserved, all 36 bonus tiles are accounted for, hand sizes remain valid, and the game makes progress.

## License

MIT. See [LICENSE](LICENSE) for the original license and copyright notice.

## Play online

[Play the hosted game](https://intrepion.github.io/kata-filipino-mahjongg-astra-6-ultra/)
