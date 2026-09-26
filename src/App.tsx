import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDownAZ,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Flower2,
  Flag,
  Hand,
  Leaf,
  Lightbulb,
  Maximize2,
  RotateCcw,
  Settings2,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Tile from "./components/Tile";
import {
  advanceAI,
  createGame,
  getActions,
  reduceGame,
  sortTiles,
  suggestDiscard,
  type GameAction,
  type GameState,
  type Player,
} from "./game";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/fraunces/latin-400.css";
import "@fontsource/fraunces/latin-500.css";

const RULES_URL =
  "https://mahjongpros.com/blogs/mahjong-rules-and-scoring-tables/official-filipino-mahjong-rules";
const STORAGE_KEY = "mesa-stats-v1";
type Stats = {
  played: number;
  won: number;
  points: number;
  best: number;
  lastGame: string;
};
const EMPTY_STATS: Stats = {
  played: 0,
  won: 0,
  points: 0,
  best: 0,
  lastGame: "",
};
function readStats(): Stats {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (
      value &&
      ["played", "won", "points", "best"].every(
        (key) => Number.isFinite(value[key]) && value[key] >= 0,
      )
    )
      return value;
  } catch {
    /* Storage is optional for play. */
  }
  return EMPTY_STATS;
}

function Sun({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="11" stroke="currentColor" strokeWidth="2" />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i} transform={`rotate(${i * 45} 32 32)`}>
          <path
            d="M32 4v11M28 7l1 8M36 7l-1 8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </g>
      ))}
      <circle cx="32" cy="32" r="4" fill="currentColor" />
    </svg>
  );
}

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "brand--small" : ""}`}>
      <span className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <span>
        mesa<span className="brand-period">.</span>
      </span>
    </span>
  );
}

function Avatar({
  person,
  className = "",
}: {
  person: number;
  className?: string;
}) {
  const colors = ["#b9cbbb", "#e9bd91", "#b9c9d5", "#d9bbc6"];
  return (
    <span className={`avatar avatar--${person} ${className}`}>
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect width="64" height="64" rx="32" fill={colors[person]} />
        {person === 0 ? (
          <>
            <path d="M14 64c0-16 8-23 18-23s18 7 18 23" fill="#527c6d" />
            <circle cx="32" cy="28" r="11" fill="#f6eee1" />
          </>
        ) : (
          <>
            {person !== 2 && (
              <path
                d="M15 43V27c0-13 6-20 17-20s18 8 18 21v18"
                fill="#403c32"
              />
            )}
            {person === 3 && <circle cx="42" cy="11" r="8" fill="#403c32" />}
            <path
              d="M11 65c2-17 10-23 21-23s20 6 22 23"
              fill={
                person === 1 ? "#b26247" : person === 2 ? "#527b8c" : "#947188"
              }
            />
            <path d="M28 38h9v13h-9z" fill="#bf8765" />
            <ellipse cx="32" cy="29" rx="13" ry="16" fill="#dfaa7e" />
            {person === 2 ? (
              <path
                d="M17 23c0-15 8-18 17-17 10 1 14 7 14 15-8-1-13-5-16-8-3 6-9 8-15 10"
                fill="#4d453a"
              />
            ) : (
              <path
                d="M18 22c1-9 8-15 15-15 11 0 15 8 15 18-8-2-14-8-16-12-2 7-7 10-14 11"
                fill="#403c32"
              />
            )}
            <path
              d="M25 29h1m12 0h1"
              stroke="#453b32"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M29 37q4 3 7-1"
              stroke="#a05947"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {person === 2 && (
              <>
                <circle
                  cx="25"
                  cy="29"
                  r="5"
                  stroke="#403c32"
                  strokeWidth="1.7"
                />
                <circle
                  cx="39"
                  cy="29"
                  r="5"
                  stroke="#403c32"
                  strokeWidth="1.7"
                />
                <path d="M30 29h4" stroke="#403c32" />
                <path d="M26 35q6-5 12 0" stroke="#4d453a" strokeWidth="2" />
              </>
            )}
            {person === 1 && (
              <>
                <circle cx="19" cy="34" r="2" fill="#d9b557" />
                <circle cx="45" cy="34" r="2" fill="#d9b557" />
              </>
            )}
          </>
        )}
      </svg>
    </span>
  );
}

function Modal({
  title,
  eyebrow,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, select, [tabindex="0"]',
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = priorOverflow;
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "modal--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
        <span className="eyebrow">{eyebrow}</span>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function RulesContent({ initialTab = 0 }: { initialTab?: number }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <>
      <p className="modal-intro">
        A familiar Filipino table, with a little guidance along the way.
      </p>
      <div className="rule-tabs" role="tablist" aria-label="Rules sections">
        {["The basics", "Calls & kongs", "Table rules"].map((label, i) => (
          <button
            key={label}
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 0 && (
        <div className="rule-content">
          <div className="rule-highlight">
            <span className="big-number">
              16<span>+ 1</span>
            </span>
            <div>
              <strong>Sixteen in your hand. Seventeen to win.</strong>
              <p>
                Build five sets and one pair. The dealer starts with 17 tiles
                and discards first.
              </p>
            </div>
          </div>
          <div className="rule-step">
            <span>01</span>
            <div>
              <h3>Draw, then discard</h3>
              <p>
                Take a tile from the wall, then discard one you don’t need. Play
                moves to your right, counterclockwise.
              </p>
            </div>
          </div>
          <div className="rule-step">
            <span>02</span>
            <div>
              <h3>Make your bahay</h3>
              <p>
                A set is three consecutive numbers in one suit (chow), three
                matching tiles (pung), or a declared four of a kind (kang). Your
                pair is two matching tiles.
              </p>
            </div>
          </div>
          <div className="rule-step">
            <span>03</span>
            <div>
              <h3>Flowers have their own place</h3>
              <p>
                Winds, dragons, flowers, and seasons are all bonus flowers. We
                set them aside and draw replacements from the back of the wall
                automatically.
              </p>
            </div>
          </div>
          <div className="rule-step">
            <span>04</span>
            <div>
              <h3>Call Mahjongg!</h3>
              <p>
                Win with your own draw (búnot) or another player’s discard
                (tódas). This table also accepts siete pares: seven distinct
                pairs and a pung, with no open melds.
              </p>
            </div>
          </div>
        </div>
      )}
      {tab === 1 && (
        <div className="rule-content call-rules">
          <div>
            <span className="rule-token">Chow</span>
            <p>
              Claim a discard to finish a sequence, only from the player
              immediately before you.
            </p>
          </div>
          <div>
            <span className="rule-token">Pung</span>
            <p>
              Claim anyone’s latest discard when you have two matching tiles.
              Expose the set and discard.
            </p>
          </div>
          <div>
            <span className="rule-token">Kang</span>
            <p>
              Claim anyone’s latest discard when you have three matching tiles.
              Your four-tile set counts as one set; draw a replacement before
              discarding.
            </p>
          </div>
          <div>
            <span className="rule-token">Secret</span>
            <p>
              On your draw turn, declare four matching concealed tiles as a
              kang. You receive a replacement tile.
            </p>
          </div>
          <div>
            <span className="rule-token">Sagása</span>
            <p>
              If the tile you just drew is the fourth match for your exposed
              pung, add it to make a kang and take a replacement.
            </p>
          </div>
          <div className="priority-note">
            <Flag size={20} />
            <p>
              <strong>Winning comes first.</strong> Mahjongg beats pung or kang,
              which beat chow. Equal claims go to the nearest player in turn
              order. You can pass any offered claim.
            </p>
          </div>
        </div>
      )}
      {tab === 2 && (
        <div className="rule-content">
          <div className="rule-highlight">
            <Flower2 size={34} />
            <div>
              <strong>Filipino practice · no jokers</strong>
              <p>
                A 144-tile set, including 36 bonus flowers. No minimum hand
                value is needed to win.
              </p>
            </div>
          </div>
          <h3>A friendly score, no stakes</h3>
          <p>
            Our practice score is{" "}
            <strong>10 points + 1 per collected flower</strong>. A self-drawn
            win doubles that total. For example, winning with 6 flowers scores
            16 on a discard, or 32 on a self-draw.
          </p>
          <p>
            Only the winner earns points. These are learning points, not a
            traditional cash payout table. Optional payments for special hands,
            flowers, and kongs are not used.
          </p>
          <h3>Every family has its table rules</h3>
          <p>
            Regional variants may use jokers, different payouts, or different
            special hands. Here, seven pairs must be distinct, the dealer stays
            after winning or a drawn game, and otherwise passes to the right.
          </p>
          <a
            className="source-link"
            href={RULES_URL}
            target="_blank"
            rel="noreferrer"
          >
            Read the Filipino rules reference <ArrowUpRight size={15} />
          </a>
        </div>
      )}
    </>
  );
}

function Opponent({
  player,
  position,
  active,
  dealer,
  reveal = false,
  onFlowers,
}: {
  player: Player;
  position: string;
  active: boolean;
  dealer: boolean;
  reveal?: boolean;
  onFlowers: () => void;
}) {
  return (
    <div
      className={`opponent opponent--${position} ${active ? "opponent--active" : ""}`}
    >
      <div className="opponent-info">
        <Avatar person={player.id} />
        <div>
          <div className="opponent-name">
            {player.name}{" "}
            {dealer && (
              <span className="dealer-mark" title="Dealer · Máno">
                D
              </span>
            )}
          </div>
          <span className="opponent-meta">
            <button
              className="flower-count"
              onClick={onFlowers}
              aria-label={`View ${player.name}’s bonus flowers`}
            >
              <Flower2 size={11} /> {player.flowers.length}
            </button>{" "}
            <span>·</span> {active ? "Thinking…" : "Computer"}
          </span>
        </div>
        {active && (
          <span className="thinking-dots">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
      <div className="opponent-tile-area">
        <div
          className={`opponent-tiles ${reveal ? "opponent-tiles--revealed" : ""}`}
        >
          {player.hand.map((tile) => (
            <Tile key={tile.id} tile={tile} faceDown={!reveal} small />
          ))}
        </div>
      </div>
      {player.melds.length > 0 && (
        <div className="opponent-melds">
          {player.melds.map((meld, i) => (
            <span className="tiny-meld" key={i}>
              {meld.tiles.map((tile) => (
                <Tile
                  key={tile.id}
                  tile={tile}
                  faceDown={meld.concealed && !reveal}
                  small
                />
              ))}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [game, setGame] = useState<GameState>(() => createGame());
  const [selected, setSelected] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [sorted, setSorted] = useState(true);
  const [sound, setSound] = useState(false);
  const [modal, setModal] = useState<
    "rules" | "guide" | "stats" | "new" | "settings" | "flowers" | null
  >(null);
  const [ruleStart, setRuleStart] = useState(0);
  const [speed, setSpeed] = useState(850);
  const [round, setRound] = useState(1);
  const [stats, setStats] = useState<Stats>(readStats);
  const [confirmStatsReset, setConfirmStatsReset] = useState(false);
  const [toast, setToast] = useState("");
  const [resultDismissed, setResultDismissed] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const me = game.players[0];
  const actions = getActions(game, 0);
  const humanClaim =
    game.phase === "claim" && actions.some((action) => action.type !== "pass");
  const myDiscard = game.currentPlayer === 0 && game.phase === "discard";
  const myDraw = game.currentPlayer === 0 && game.phase === "draw";
  const canWin = actions.find((action) => action.type === "win");
  const humanNeedsInput = myDiscard || myDraw || humanClaim;
  const hand = sorted ? sortTiles(me.hand) : me.hand;
  const closeModal = useCallback(() => {
    setModal(null);
    setConfirmStatsReset(false);
  }, []);
  const showResult = game.phase === "finished" && !resultDismissed && !modal;

  const playSound = useCallback(
    (kind: "tile" | "win" = "tile") => {
      if (!sound) return;
      try {
        audioRef.current ??= new AudioContext();
        const context = audioRef.current;
        void context.resume();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(
          kind === "win" ? 660 : 740,
          context.currentTime,
        );
        oscillator.frequency.exponentialRampToValueAtTime(
          kind === "win" ? 990 : 370,
          context.currentTime + 0.08,
        );
        gain.gain.setValueAtTime(0.075, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + 0.16,
        );
        oscillator.start();
        oscillator.stop(context.currentTime + 0.18);
      } catch {
        /* Play remains available without audio support. */
      }
    },
    [sound],
  );

  const act = useCallback(
    (action: GameAction) => {
      setGame((current) => reduceGame(current, action, 0));
      setSelected(null);
      setSuggested(null);
      setToast("");
      playSound(action.type === "win" ? "win" : "tile");
    },
    [playSound],
  );

  useEffect(() => {
    if (game.phase === "finished" || humanNeedsInput || modal) return;
    const timer = window.setTimeout(
      () => {
        setGame((current) => advanceAI(current));
      },
      game.phase === "claim" ? speed / 2 : speed,
    );
    return () => window.clearTimeout(timer);
  }, [game, humanNeedsInput, modal, speed]);

  useEffect(() => {
    if (game.phase !== "finished") return;
    setStats((previous) => {
      if (previous.lastGame === game.id) return previous;
      const points = game.result?.winner === 0 ? game.result.totalPoints : 0;
      const updated = {
        played: previous.played + 1,
        won: previous.won + (game.winner === 0 ? 1 : 0),
        points: previous.points + points,
        best: Math.max(previous.best, points),
        lastGame: game.id,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* Stats are still available for this session. */
      }
      return updated;
    });
  }, [game.phase, game.id, game.result, game.winner]);

  useEffect(() => {
    if (suggested)
      boardRef.current
        ?.querySelector<HTMLButtonElement>(".tile--suggested")
        ?.focus({ preventScroll: true });
  }, [suggested]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 6500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const hint = useCallback(() => {
    if (!myDiscard) {
      setToast("Hints are available when it’s your turn to discard.");
      return;
    }
    const suggestion = suggestDiscard(me.hand, me.melds);
    const tile =
      typeof suggestion === "string"
        ? me.hand.find((tile) => tile.id === suggestion)
        : suggestion;
    if (tile) {
      setSuggested(tile.id);
      setSelected(tile.id);
      setToast(
        `Consider the ${tile.label}. Keep pairs and nearby numbers together.`,
      );
    }
  }, [myDiscard, me.hand, me.melds]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        modal ||
        showResult ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        hint();
      }
      if (
        event.key === "Enter" &&
        selected &&
        myDiscard &&
        (event.target === document.body ||
          (event.target instanceof HTMLElement &&
            event.target.closest(".hand-tiles")))
      ) {
        event.preventDefault();
        act({ type: "discard", tileId: selected });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, showResult, hint, selected, myDiscard, act]);

  const newGame = (continueScores = false) => {
    const nextDealer =
      continueScores && game.phase === "finished"
        ? game.winner === game.dealer || game.winner === null
          ? game.dealer
          : (game.dealer + 1) % 4
        : 0;
    setGame(
      createGame({
        dealer: nextDealer,
        scores: continueScores
          ? game.players.map((player) => player.score)
          : undefined,
      }),
    );
    setSelected(null);
    setSuggested(null);
    setToast("");
    setModal(null);
    setResultDismissed(false);
    setRound((current) => (continueScores ? current + 1 : 1));
  };

  const statusText =
    game.phase === "finished"
      ? game.winner === null
        ? "The wall is empty. A well-played draw."
        : `${game.players[game.winner].name === "You" ? "You win" : `${game.players[game.winner].name} wins`} — ${game.winType === "self-draw" ? "búnot" : "tódas"}!`
      : humanClaim
        ? `${game.players[game.lastDiscard!.playerId].name} discarded ${game.lastDiscard!.tile.label}. Your call.`
        : myDiscard
          ? canWin
            ? "Your hand is complete. Call Mahjongg!"
            : "Your turn. Choose a tile to discard."
          : myDraw
            ? "Your turn. Draw a tile from the wall."
            : game.phase === "claim"
              ? "Checking the table for calls…"
              : `${game.players[game.currentPlayer].name} is playing. Make yourself at home.`;
  const specialActions = actions.filter(
    (action) =>
      action.type === "concealed-kong" || action.type === "added-kong",
  );
  const meldCount = me.melds.length;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          className="home-link"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            closeModal();
          }}
          aria-label="Mesa home"
        >
          <Logo />
        </a>
        <nav aria-label="Main navigation">
          <button className="nav-active" onClick={closeModal}>
            Let’s play
            <span />
          </button>
          <button
            onClick={() => {
              setRuleStart(0);
              setModal("rules");
            }}
          >
            How to play
          </button>
          <button onClick={() => setModal("stats")}>Your stats</button>
        </nav>
        <div className="header-end">
          <span className="made-in">
            <span className="flag-mark">
              <i />
              <i />
              <i />
            </span>
            Filipino at heart
          </span>
          <button
            className="profile-button"
            onClick={() => setModal("settings")}
            aria-label="Your preferences"
          >
            <Avatar person={0} />
          </button>
        </div>
      </header>

      <main>
        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <span /> PULL UP A CHAIR
            </div>
            <h1>
              A little luck. A little <em>diskarte.</em>
            </h1>
            <p>The familiar Filipino game. A fresh place to play.</p>
          </div>
          <button
            className="button button-outline new-game-button"
            onClick={() => setModal("new")}
          >
            <RotateCcw size={16} /> New game
          </button>
        </section>

        <div className="game-layout">
          <section className="game-column" aria-label="Mahjongg game">
            <div className="table-card" ref={boardRef}>
              <div className="table-toolbar">
                <div className="table-label">
                  <span className="live-dot" />
                  Practice table
                  <span className="toolbar-divider" />
                  <span className="table-player-count">
                    You + 3 computer players
                  </span>
                </div>
                <div className="table-tools">
                  <button
                    className="icon-button"
                    aria-label={sound ? "Turn sound off" : "Turn sound on"}
                    title={sound ? "Sound on" : "Sound off"}
                    onClick={() => setSound((current) => !current)}
                  >
                    {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
                  </button>
                  <button
                    className="icon-button"
                    aria-label="Table settings"
                    title="Table settings"
                    onClick={() => setModal("settings")}
                  >
                    <Settings2 size={17} />
                  </button>
                  <button
                    className="icon-button fullscreen-button"
                    aria-label="Expand table"
                    title="Expand table"
                    onClick={() => {
                      if (document.fullscreenElement)
                        void document.exitFullscreen();
                      else
                        void boardRef.current
                          ?.closest<HTMLElement>(".app-shell")
                          ?.requestFullscreen?.()
                          .catch(() =>
                            setToast(
                              "Fullscreen isn’t available in this browser.",
                            ),
                          );
                    }}
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
              <div className="felt-table">
                <div className="felt-border" />
                <div className="table-corner table-corner--tl" />
                <div className="table-corner table-corner--tr" />
                <div className="table-corner table-corner--bl" />
                <div className="table-corner table-corner--br" />
                <div className="round-label">
                  <span>ROUND {String(round).padStart(2, "0")}</span>
                  <i />
                  {game.wall.length} tiles in the wall
                </div>
                <Opponent
                  player={game.players[2]}
                  position="top"
                  active={game.currentPlayer === 2 && game.phase !== "finished"}
                  dealer={game.dealer === 2}
                  reveal={game.winner === 2}
                  onFlowers={() => setModal("flowers")}
                />
                <Opponent
                  player={game.players[3]}
                  position="left"
                  active={game.currentPlayer === 3 && game.phase !== "finished"}
                  dealer={game.dealer === 3}
                  reveal={game.winner === 3}
                  onFlowers={() => setModal("flowers")}
                />
                <Opponent
                  player={game.players[1]}
                  position="right"
                  active={game.currentPlayer === 1 && game.phase !== "finished"}
                  dealer={game.dealer === 1}
                  reveal={game.winner === 1}
                  onFlowers={() => setModal("flowers")}
                />
                <div
                  className={`table-center ${game.discards.length ? "table-center--playing" : ""}`}
                >
                  <div className="table-watermark">
                    <Sun />
                    <span>mesa</span>
                    <p>GOOD TILES. GOOD TIMES.</p>
                  </div>
                  {game.discards.length > 0 && (
                    <div className="discard-pool" aria-label="Discarded tiles">
                      {game.discards.map(({ tile, playerId }) => (
                        <div
                          key={tile.id}
                          className={`discard-tile ${game.lastDiscard?.tile.id === tile.id ? "discard-tile--latest" : ""}`}
                          title={`${game.players[playerId].name} discarded ${tile.label}`}
                        >
                          <Tile tile={tile} small />
                        </div>
                      ))}
                    </div>
                  )}
                  {game.discards.length === 0 && (
                    <span className="first-discard-note">
                      A new hand, a fresh start.
                    </span>
                  )}
                </div>
                <div className="your-place">
                  <div className="your-info">
                    <Avatar person={0} />
                    <span className="your-name">
                      You{" "}
                      {game.dealer === 0 && (
                        <span className="dealer-mark">D</span>
                      )}
                    </span>
                    <span
                      className={`turn-pill ${humanNeedsInput ? "turn-pill--active" : ""}`}
                    >
                      {game.phase === "finished"
                        ? "Hand complete"
                        : humanNeedsInput
                          ? "Your turn"
                          : "At the table"}
                    </span>
                    <button
                      className="your-flowers"
                      onClick={() => setModal("flowers")}
                      aria-label="View collected bonus flowers"
                    >
                      <Flower2 size={14} />
                      {me.flowers.length}
                      <span>flowers</span>
                    </button>
                  </div>
                  {me.melds.length > 0 && (
                    <div className="your-melds" aria-label="Your declared sets">
                      {me.melds.map((meld, index) => (
                        <div key={index} className="your-meld">
                          {meld.tiles.map((tile) => (
                            <Tile key={tile.id} tile={tile} small />
                          ))}
                          <span>
                            {meld.concealed
                              ? "secret kang"
                              : meld.kind === "kong"
                                ? "kang"
                                : meld.kind}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="hand-tiles" aria-label="Your hand">
                    {hand.map((tile) => (
                      <Tile
                        key={tile.id}
                        tile={tile}
                        selected={selected === tile.id}
                        suggested={suggested === tile.id}
                        className={
                          tile.id === game.drawnTileId ? "tile--drawn" : ""
                        }
                        onClick={() => {
                          if (myDiscard) {
                            setSelected((current) =>
                              current === tile.id ? null : tile.id,
                            );
                            setSuggested(null);
                            playSound();
                          }
                        }}
                        disabled={!myDiscard}
                      />
                    ))}
                  </div>
                  <div className="hand-caption">
                    <span>
                      {me.hand.length} concealed tiles
                      {meldCount > 0
                        ? ` · ${meldCount} declared ${meldCount === 1 ? "set" : "sets"}`
                        : ""}
                    </span>
                    <span>Make 5 sets + 1 pair</span>
                  </div>
                </div>
              </div>
              <div
                className={`action-bar ${humanClaim ? "action-bar--claim" : ""}`}
              >
                <div className="turn-message">
                  <span
                    className={`turn-indicator ${humanNeedsInput ? "turn-indicator--active" : ""}`}
                  >
                    <Hand size={17} />
                  </span>
                  <div>
                    <strong aria-live="polite">{statusText}</strong>
                    <span>
                      {humanClaim
                        ? "A winning claim always takes priority."
                        : myDiscard
                          ? "Click a tile, then discard. Take your time."
                          : myDraw
                            ? "Bonus flowers are replaced automatically."
                            : game.phase === "finished"
                              ? "The next hand is a fresh opportunity."
                              : "Watch the discards. Your next set could be there."}
                    </span>
                  </div>
                </div>
                <div className="primary-actions">
                  {humanClaim ? (
                    <>
                      <button
                        className="button button-text"
                        onClick={() => act({ type: "pass" })}
                      >
                        Pass
                      </button>
                      {actions
                        .filter((action) => action.type !== "pass")
                        .map((action, index) => (
                          <button
                            key={index}
                            className={`button ${action.type === "win" ? "button-gold" : "button-primary"}`}
                            onClick={() => act(action)}
                          >
                            {action.type === "win"
                              ? "Mahjongg!"
                              : action.type === "kong"
                                ? "Kang"
                                : action.type === "chow"
                                  ? `Chow ${action.tileIds
                                      .map(
                                        (id) =>
                                          me.hand.find((tile) => tile.id === id)
                                            ?.rank,
                                      )
                                      .sort()
                                      .join("·")}`
                                  : "Pung"}
                          </button>
                        ))}
                    </>
                  ) : game.phase === "finished" ? (
                    <button
                      className="button button-primary"
                      onClick={() => setResultDismissed(false)}
                    >
                      View result <ArrowRight size={16} />
                    </button>
                  ) : (
                    <>
                      {specialActions.map((action, index) => (
                        <button
                          className="button button-outline"
                          key={index}
                          onClick={() => act(action)}
                        >
                          {action.type === "concealed-kong"
                            ? "Secret kang"
                            : "Sagása"}
                        </button>
                      ))}
                      {canWin && (
                        <button
                          className="button button-gold"
                          onClick={() => act(canWin)}
                        >
                          <Sparkles size={16} /> Mahjongg!
                        </button>
                      )}
                      {myDraw ? (
                        <button
                          className="button button-primary"
                          onClick={() => act({ type: "draw" })}
                        >
                          Draw a tile <ArrowRight size={16} />
                        </button>
                      ) : (
                        <button
                          className="button button-primary discard-button"
                          disabled={!selected || !myDiscard}
                          onClick={() =>
                            selected &&
                            act({ type: "discard", tileId: selected })
                          }
                        >
                          Discard tile <ArrowRight size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="below-table">
              <span>
                <span className="keyboard-key">↵</span> to discard
                <span className="shortcut-separator" />
                <span className="keyboard-key">H</span> for a hint
              </span>
              <div>
                <button
                  aria-pressed={sorted}
                  onClick={() => {
                    setSorted((current) => !current);
                    setToast(
                      sorted
                        ? "Tiles are now shown in draw order."
                        : "Tiles sorted by suit and number.",
                    );
                  }}
                >
                  <ArrowDownAZ size={16} />
                  {sorted ? "Sorted by suit" : "Sort tiles"}
                </button>
                <span />
                <button onClick={hint} disabled={!myDiscard}>
                  <Lightbulb size={16} />
                  Give me a hint
                </button>
              </div>
            </div>
            <div className="toast-area" role="status">
              {toast && (
                <div className="toast">
                  <Lightbulb size={16} />
                  {toast}
                  <button
                    aria-label="Dismiss hint"
                    onClick={() => setToast("")}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </section>

          <aside className="sidebar">
            <section className="welcome-card">
              <div className="card-eyebrow">
                <span>THE FILIPINO WAY</span>
                <Sun />
              </div>
              <h2>
                Same tiles.
                <br />
                Our own game.
              </h2>
              <p>
                Sixteen tiles, bonus flowers, and a little friendly competition.
              </p>
              <div className="rules-summary">
                <div>
                  <span className="rule-stat-icon">
                    <Hand size={17} />
                  </span>
                  <span>
                    <strong>16-tile hands</strong>
                    <small>One more to make your win</small>
                  </span>
                </div>
                <div>
                  <span className="rule-stat-icon">
                    <Flower2 size={18} />
                  </span>
                  <span>
                    <strong>All honors are flowers</strong>
                    <small>Winds & dragons earn bonuses</small>
                  </span>
                </div>
                <div>
                  <span className="rule-stat-icon">
                    <span className="sets-symbol">▥</span>
                  </span>
                  <span>
                    <strong>5 sets + a pair</strong>
                    <small>Your path to Mahjongg</small>
                  </span>
                </div>
              </div>
              <button
                className="inline-link"
                onClick={() => {
                  setRuleStart(2);
                  setModal("rules");
                }}
              >
                Our table rules <ArrowUpRight size={16} />
              </button>
            </section>
            <section className="score-card">
              <div className="sidebar-heading">
                <h3>At the table</h3>
                <span>POINTS</span>
              </div>
              <div className="score-list">
                {game.players.map((player) => (
                  <div
                    className={`score-row ${player.id === 0 ? "score-row--you" : ""}`}
                    key={player.id}
                  >
                    <Avatar person={player.id} />
                    <span>
                      {player.name}
                      {player.id === 0 && <small>THAT’S YOU</small>}
                    </span>
                    <strong>{player.score}</strong>
                  </div>
                ))}
              </div>
              <div className="score-note">
                <Leaf size={13} /> A friendly game. No real stakes.
              </div>
            </section>
            <button
              className="learn-card"
              onClick={() => {
                setRuleStart(0);
                setModal("guide");
              }}
            >
              <span className="learn-icon">
                <BookOpen size={21} />
              </span>
              <span>
                <strong>First time at the table?</strong>
                <small>Learn the basics in a minute</small>
              </span>
              <ChevronRight size={17} />
            </button>
          </aside>
        </div>

        <section className="table-bottom">
          <div className="activity">
            <span className="activity-label">TABLE TALK</span>
            <span className="activity-dot" />
            <p aria-live="polite">
              {game.log.at(-1) || "The tiles are dealt. Let’s play."}
            </p>
          </div>
          <button
            className="help-link"
            onClick={() => {
              setRuleStart(0);
              setModal("rules");
            }}
          >
            <CircleHelp size={15} /> Need a hand?
          </button>
        </section>
        <footer>
          <span>
            <Logo small />
            <span className="footer-rule" />A seat for everyone.
          </span>
          <span>
            Made for the way we play. <span className="little-flower">✳</span>
          </span>
        </footer>
      </main>

      {(modal === "rules" || modal === "guide") && (
        <Modal
          title={
            modal === "guide"
              ? "Your first hand starts here."
              : "The rules of this table."
          }
          eyebrow="FILIPINO MAHJONGG"
          wide
          onClose={closeModal}
        >
          <RulesContent initialTab={ruleStart} />
          <button
            className="button button-primary modal-play"
            onClick={closeModal}
          >
            Back to the table <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {modal === "flowers" && (
        <Modal
          title="A little flower power."
          eyebrow="BONUS FLOWERS"
          wide
          onClose={closeModal}
        >
          <p className="modal-intro">
            Winds, dragons, flowers, and seasons live here. Each one has already
            been replaced from the back of the wall.
          </p>
          <div className="flower-collections">
            {game.players.map((player) => (
              <section key={player.id}>
                <div className="flower-collection-heading">
                  <Avatar person={player.id} />
                  <strong>{player.name}</strong>
                  <span>{player.flowers.length} flowers</span>
                </div>
                <div className="bonus-tile-grid">
                  {player.flowers.length ? (
                    player.flowers.map((tile) => (
                      <Tile key={tile.id} tile={tile} small />
                    ))
                  ) : (
                    <p>No flowers collected yet.</p>
                  )}
                </div>
              </section>
            ))}
          </div>
          <button
            className="button button-primary modal-play"
            onClick={closeModal}
          >
            Back to the table <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {modal === "stats" && (
        <Modal
          title="A little better, every hand."
          eyebrow="YOUR MESA STATS"
          onClose={closeModal}
        >
          <p className="modal-intro">
            Your completed games on this browser. Every hand is a chance to
            learn.
          </p>
          <div className="stats-grid">
            <div>
              <span>{stats.played}</span>
              <p>Hands played</p>
            </div>
            <div>
              <span>{stats.won}</span>
              <p>Hands won</p>
            </div>
            <div>
              <span>{stats.points}</span>
              <p>Practice points</p>
            </div>
            <div>
              <span>{stats.best}</span>
              <p>Best hand</p>
            </div>
          </div>
          <p className="small-note">
            {stats.played
              ? `${Math.round((stats.won / stats.played) * 100)}% win rate · Keep finding your diskarte.`
              : "Your story begins with the first hand."}
          </p>
          <button
            className="button button-primary modal-play"
            onClick={closeModal}
          >
            Let’s play <ArrowRight size={16} />
          </button>
          {stats.played > 0 && (
            <div className="reset-stats">
              <button
                className="button button-text"
                onClick={() => {
                  if (!confirmStatsReset) {
                    setConfirmStatsReset(true);
                    return;
                  }
                  const cleanStats = {
                    ...EMPTY_STATS,
                    lastGame: game.phase === "finished" ? game.id : "",
                  };
                  setStats(cleanStats);
                  try {
                    localStorage.setItem(
                      STORAGE_KEY,
                      JSON.stringify(cleanStats),
                    );
                  } catch {
                    /* Session stats still reset. */
                  }
                  setConfirmStatsReset(false);
                }}
              >
                {confirmStatsReset
                  ? "Yes, clear saved stats"
                  : "Reset saved stats"}
              </button>
              {confirmStatsReset && (
                <button
                  className="button button-text"
                  onClick={() => setConfirmStatsReset(false)}
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </Modal>
      )}
      {modal === "settings" && (
        <Modal
          title="Make yourself at home."
          eyebrow="YOUR TABLE"
          onClose={closeModal}
        >
          <div className="setting-row">
            <div>
              <strong>Tile sounds</strong>
              <p>A little click with every move.</p>
            </div>
            <button
              className={`toggle ${sound ? "toggle--on" : ""}`}
              role="switch"
              aria-checked={sound}
              aria-label="Tile sounds"
              onClick={() => setSound((current) => !current)}
            >
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Computer pace</strong>
              <p>Room to think, or keep things moving.</p>
            </div>
            <select
              aria-label="Computer pace"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            >
              <option value={1300}>Relaxed</option>
              <option value={850}>Steady</option>
              <option value={350}>Quick</option>
            </select>
          </div>
          <div className="setting-row">
            <div>
              <strong>Automatic sorting</strong>
              <p>Keep your suits together.</p>
            </div>
            <button
              className={`toggle ${sorted ? "toggle--on" : ""}`}
              role="switch"
              aria-checked={sorted}
              aria-label="Automatic sorting"
              onClick={() => setSorted((current) => !current)}
            >
              <span />
            </button>
          </div>
          <div className="settings-foot">
            <Flower2 size={18} />
            <p>
              16 tiles · No jokers · Siete pares enabled
              <br />
              Filipino practice scoring
            </p>
          </div>
          <button
            className="inline-link settings-stats"
            onClick={() => setModal("stats")}
          >
            Your stats <ArrowRight size={16} />
          </button>
          <button
            className="button button-primary modal-play"
            onClick={closeModal}
          >
            All set <Check size={16} />
          </button>
        </Modal>
      )}
      {modal === "new" && (
        <Modal
          title="A fresh set of possibilities."
          eyebrow="NEW GAME"
          onClose={closeModal}
        >
          <p className="modal-intro">
            Shuffle the tiles and start a new table with Mila, Lito, and Rosa.
            The current hand and table points will reset; your lifetime stats
            stay.
          </p>
          <div className="new-game-art">
            <Tile tile={{ id: "a", suit: "dots", rank: 3, label: "3 dots" }} />
            <Tile
              tile={{ id: "b", suit: "bamboo", rank: 2, label: "2 bamboo" }}
            />
            <Tile
              tile={{
                id: "c",
                suit: "characters",
                rank: 8,
                label: "8 characters",
              }}
            />
          </div>
          <div className="modal-actions">
            <button className="button button-outline" onClick={closeModal}>
              Keep playing
            </button>
            <button className="button button-primary" onClick={() => newGame()}>
              Shuffle & deal <RotateCcw size={16} />
            </button>
          </div>
        </Modal>
      )}
      {showResult && (
        <Modal
          title={
            game.winner === 0
              ? "Mahjongg! Nicely played."
              : game.winner === null
                ? "Sometimes, it’s a draw."
                : `${game.players[game.winner].name} takes this hand.`
          }
          eyebrow={
            game.winner === null
              ? "THE WALL IS EMPTY"
              : game.winType === "self-draw"
                ? "BÚNOT · SELF-DRAWN WIN"
                : "TÓDAS · WIN BY DISCARD"
          }
          wide
          onClose={() => setResultDismissed(true)}
        >
          <div className="result-intro">
            <span className="result-icon">
              {game.winner === null ? <Leaf size={30} /> : <Trophy size={30} />}
            </span>
            <p>
              {game.winner === null
                ? "No winning hand this time. Shuffle up and give luck another chance."
                : game.result?.pattern === "siete-pares"
                  ? "Seven pairs and a pung. A beautiful siete pares."
                  : "Five sets and a pair, all brought together."}
            </p>
          </div>
          {game.winner !== null && (
            <>
              <div className="winning-hand">
                {sortTiles(game.players[game.winner].hand).map((tile) => (
                  <Tile key={tile.id} tile={tile} small />
                ))}
                {game.players[game.winner].melds.map((meld, i) => (
                  <span className="winning-meld" key={i}>
                    {meld.tiles.map((tile) => (
                      <Tile key={tile.id} tile={tile} small />
                    ))}
                  </span>
                ))}
              </div>
              <div className="result-score">
                <span>
                  10 base + {game.result?.bonusPoints} flower points
                  {game.winType === "self-draw" ? ", doubled for búnot" : ""}
                </span>
                <strong>
                  +{game.result?.totalPoints}
                  <small>pts</small>
                </strong>
              </div>
            </>
          )}
          <div className="modal-actions">
            <button
              className="button button-outline"
              onClick={() => setResultDismissed(true)}
            >
              Look at the table
            </button>
            <button
              className="button button-primary"
              onClick={() => newGame(true)}
            >
              Play another hand <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
