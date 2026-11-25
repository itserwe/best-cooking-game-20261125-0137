# Dapur Kilat — Warung Rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/itserwe/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/itserwe/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original cooking game that plays offline in a desktop browser from its own
files. Entry for the make.fun bounty
[Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137).

## The game

You run a small warung kitchen for one 3-minute shift. Customers order from the board —
**Nasi Goreng**, **Ayam Geprek**, **Sop Sayur** — and each order waits at most 50 seconds.

- **Take ingredients** from the bins on the left wall: rice, chicken, egg, chili, vegetables.
- **Chop** on the cutting board (talenan) and **cook** on the stove (kompor). Every station
  shows a progress ring; a finished dish left too long burns and must go in the trash.
- **Plate** the processed ingredients, then **serve** when the plate matches an order.
  A fast serve earns a tip; serving dishes back-to-back builds a combo bonus.
- Lose a heart when an order expires. Lose all three hearts, or run out the shift clock,
  and the shift ends.

## Controls

- **WASD / arrow keys** — walk the chef around the kitchen.
- **E / Space** — pick up, place, chop, cook, plate, serve: whatever is nearest.
- **Mouse click** — walk there; clicking a nearby station uses it at once.
- **P** — pause.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: `game/index.html` and its ES modules under `game/`
are the whole game. Sounds are synthesised with WebAudio in code — no sound files.

## Screenshots

The three screenshots in `screenshots/` are real renders of this game's own code,
staged with `?shot=start|play|end&seed=1` (see `shots.json` and `game/src/shots.js`).

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
