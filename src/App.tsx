import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell as RCell, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  FaArrowDown, FaCheckCircle, FaDice, FaDiceFive, FaDiceSix, FaExclamationTriangle, FaFlask, FaGlobe, FaLock,
  FaMoon, FaPause, FaPlay, FaRedo, FaRobot, FaSun, FaTimesCircle, FaChartBar, FaProjectDiagram, FaRandom, FaQuestionCircle,
} from 'react-icons/fa';
import { DEFAULT_RULES, JAIL, makeWalker, simulateRealGame, stationary, tv, type Rules } from './engine';
import { GROUP_COLOR, GROUP_ORDER, SQUARES, groupSquares, gridPos, isProperty, type Group } from './data';
import { TXT, type Lang } from './i18n';
import * as U from './ui';

type Dict = Record<string, any>;
const fmt = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k]));
const pct = (x: number, d = 2) => (x * 100).toFixed(d) + '%';
const sameRules = (a: Rules, b: Rules) => (Object.keys(a) as (keyof Rules)[]).every((k) => a[k] === b[k]);

/* ---------- little hooks ---------- */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return void el.setAttribute('data-in', '1');
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.setAttribute('data-in', '1');
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
function R({ children, d = 0 }: { children: ReactNode; d?: number }) {
  const ref = useReveal<HTMLDivElement>();
  return <U.Reveal ref={ref} $d={d}>{children}</U.Reveal>;
}
function useCountUp(target: number, decimals = 0, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      setV(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v.toFixed(decimals);
}
const safe = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

/* ---------- constants ---------- */
const VARIANTS: Rules[] = [
  DEFAULT_RULES,
  { ...DEFAULT_RULES, goToJail: false },
  { ...DEFAULT_RULES, cards: false },
  { ...DEFAULT_RULES, payOutOfJail: true },
  { ...DEFAULT_RULES, tripleDoubles: false },
  { goToJail: false, cards: false, tripleDoubles: false, payOutOfJail: false },
];
const GUESS_CONF = [85, 60, 40, 70];
const SPEEDS = [2, 10, 100, 1000, 10000, 100000];

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    const s = safe.get('mono-lang');
    if (s === 'es' || s === 'en') return s;
    return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
  });
  const [dark, setDark] = useState<boolean>(() => {
    const s = safe.get('mono-theme');
    if (s) return s === 'dark';
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
  });
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES);
  const [mode, setMode] = useState<'exact' | 'sim'>('exact');
  const [sel, setSel] = useState<number>(24);
  const [scrolled, setScrolled] = useState(false);
  const t = TXT[lang] as unknown as Dict;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.lang = lang;
    document.title = lang === 'es' ? '¿Dónde pasa de verdad el Monopoly?' : 'Where does Monopoly really happen?';
    safe.set('mono-theme', dark ? 'dark' : 'light');
    safe.set('mono-lang', lang);
  }, [dark, lang]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12);
    f();
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);

  const exact = useMemo(() => stationary(rules), [rules]);
  const base = useMemo(() => stationary(DEFAULT_RULES), []);
  const variants = useMemo(() => VARIANTS.map((r) => stationary(r)), []);

  /* ----- live simulation ----- */
  const [running, setRunning] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(3);
  const [, setTick] = useState(0);
  const simRef = useRef<{ w: ReturnType<typeof makeWalker>; pts: { n: number; tv: number; ref: number }[]; next: number; last: number; c0: number; acc: number }>();
  const resetSim = useCallback(() => {
    simRef.current = { w: makeWalker(rules, 7), pts: [], next: 10, last: 0, c0: 0, acc: 0 };
    setTick((x) => x + 1);
  }, [rules]);
  useEffect(() => { resetSim(); setRunning(false); }, [resetSim]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const s = simRef.current;
      if (!s) return;
      s.acc += SPEEDS[speedIdx] * 0.05;
      const k = Math.floor(s.acc);
      s.acc -= k;
      for (let i = 0; i < k; i++) {
        s.last = s.w.step().pos;
        if (s.w.total >= s.next) {
          const d = tv(s.w.counts.map((c) => c / s.w.total), exact.probs);
          if (s.pts.length === 0) s.c0 = d * Math.sqrt(s.w.total);
          s.pts.push({ n: s.w.total, tv: d, ref: s.c0 / Math.sqrt(s.w.total) });
          s.next = Math.ceil(s.next * 1.2);
        }
      }
      setTick((x) => x + 1);
    }, 50);
    return () => clearInterval(id);
  }, [running, speedIdx, exact]);

  const simTotal = simRef.current?.w.total ?? 0;
  const shown: number[] = useMemo(
    () => (mode === 'exact' || simTotal === 0 ? exact.probs : simRef.current!.w.counts.map((c) => c / simTotal)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, exact, simTotal],
  );
  const rank = useMemo(() => {
    const order = shown.map((p, i) => [p, i] as const).sort((a, b) => b[0] - a[0]);
    const r = new Array(40).fill(0);
    order.forEach(([, i], k) => (r[i] = k + 1));
    return r as number[];
  }, [shown]);
  const others = shown.filter((_, i) => i !== JAIL);
  const maxOther = Math.max(...others, 1e-9);
  const minOther = [...others].sort((a, b) => a - b)[Math.floor(others.length * 0.3)] ?? 0;
  const heat = (i: number) =>
    i === JAIL ? 1 : shown[i] < 0.002 ? 0 : Math.max(0.04, Math.min(0.92, (shown[i] - minOther) / Math.max(maxOther - minOther, 1e-9) * 0.9));

  /* ----- guesses (judged against the DEFAULT rules) ----- */
  const verdicts = useMemo(() => {
    const p = base.probs;
    const props = p.map((v, i) => [v, i] as const).filter(([, i]) => isProperty(i));
    const topProp = [...props].sort((a, b) => b[0] - a[0])[0][1];
    const lowest5 = [...props].sort((a, b) => a[0] - b[0]).slice(0, 5).map(([, i]) => i);
    return [
      p.indexOf(Math.max(...p)) === JAIL,
      ['orange', 'red'].includes(SQUARES[topProp].group),
      lowest5.includes(39),
      props.every(([v]) => v <= 0.035 && v >= 0.015),
    ];
  }, [base]);
  const [guessShown, setGuessShown] = useState(false);
  const guessRef = useReveal<HTMLDivElement>();
  useEffect(() => {
    const el = guessRef.current;
    if (!el) return;
    const o = new MutationObserver(() => el.getAttribute('data-in') === '1' && setGuessShown(true));
    o.observe(el, { attributes: true });
    return () => o.disconnect();
  }, [guessRef]);

  /* ----- derived data for charts ----- */
  const axis = dark ? '#9aa2c8' : '#6a6585';
  const grid = dark ? 'rgba(150,160,255,.14)' : 'rgba(76,58,160,.12)';
  const sqName = (i: number) => (lang === 'es' && SQUARES[i].es) || SQUARES[i].name;
  const top12 = useMemo(
    () => exact.probs.map((p, i) => ({ i, p: p * 100 })).filter((d) => d.i !== JAIL).sort((a, b) => b.p - a.p).slice(0, 12),
    [exact],
  );
  const groups = useMemo(
    () => GROUP_ORDER.map((g: Group) => ({ g, p: (groupSquares(g).reduce((a, i) => a + exact.probs[i], 0) / groupSquares(g).length) * 100 })),
    [exact],
  );
  const dice = useMemo(() => Array.from({ length: 11 }, (_, k) => ({ s: k + 2, p: ((6 - Math.abs(k + 2 - 7)) / 36) * 100 })), []);
  const jailShare = exact.probs[JAIL];
  const bestOther = exact.probs.map((p, i) => [p, i] as const).filter(([, i]) => i !== JAIL).sort((a, b) => b[0] - a[0])[0];

  /* ----- held-out test ----- */
  const [test, setTest] = useState<null | { realTV: number; chainTV: number; diffs: { i: number; d: number }[]; worst: number; n: number }>(null);
  const [testing, setTesting] = useState(false);
  const runTest = () => {
    setTesting(true);
    setTimeout(() => {
      const n = 2_000_000;
      const real = simulateRealGame(DEFAULT_RULES, n, 2024);
      const w = makeWalker(DEFAULT_RULES, 99);
      for (let i = 0; i < n; i++) w.step();
      const chain = w.counts.map((c) => c / n);
      const diffs = real.map((v, i) => ({ i, d: (v - base.probs[i]) * 100 }));
      setTest({ realTV: tv(real, base.probs), chainTV: tv(chain, base.probs), diffs, worst: Math.max(...diffs.map((x) => Math.abs(x.d))), n });
      setTesting(false);
    }, 60);
  };

  const selP = shown[sel];
  const [sr, sc] = gridPos(sel);
  const [tr, tc] = gridPos(simRef.current?.last ?? 0);
  const heroJail = useCountUp(base.probs[JAIL] * 100, 1);
  const heroStates = useCountUp(123, 0);
  const NAV_IDS = ['question', 'model', 'board', 'results', 'test', 'honesty'];
  const tipStyle = (p: any, label: string, value: string) =>
    p.active ? <U.Tip><b>{label}</b> · {value}</U.Tip> : null;

  return (
    <U.Page>
      <U.GlobalStyle />
      <U.Nav $solid={scrolled}>
        <U.NavInner>
          <U.Brand href="#top"><FaDice size={24} /> <span>Monopoly · Markov</span></U.Brand>
          <U.NavLinks>
            {NAV_IDS.map((id, k) => <a key={id} href={`#${id}`}>{t.nav[k]}</a>)}
          </U.NavLinks>
          <U.NavRight>
            <U.IconBtn onClick={() => setLang(lang === 'en' ? 'es' : 'en')} aria-label="Language"><FaGlobe /> {lang === 'en' ? 'ES' : 'EN'}</U.IconBtn>
            <U.IconBtn onClick={() => setDark(!dark)} aria-label="Theme">{dark ? <FaSun /> : <FaMoon />}</U.IconBtn>
          </U.NavRight>
        </U.NavInner>
      </U.Nav>

      {/* ---------------- HERO ---------------- */}
      <U.Hero id="top">
        <U.Blob $c="var(--accent)" $s={420} $x="-6%" $y="-10%" $d={18} />
        <U.Blob $c="var(--accent2)" $s={360} $x="60%" $y="0%" $d={22} />
        <U.Blob $c="var(--accent3)" $s={300} $x="30%" $y="60%" $d={26} />
        <U.HeroDice><FaDiceFive size={110} /><FaDiceSix size={90} /></U.HeroDice>
        <U.Wrap>
          <U.Kicker><FaDice /> {t.heroKicker}</U.Kicker>
          <U.H1>{t.heroTitle1}<br /><span>{t.heroTitle2}</span></U.H1>
          <U.Lead>{t.heroSub}</U.Lead>
          <U.Row $gap={12} style={{ marginTop: 32 }}>
            <U.Btn href="#board"><FaArrowDown /> {t.heroCta}</U.Btn>
            <U.Btn href="#model" $ghost><FaProjectDiagram /> {t.heroCta2}</U.Btn>
          </U.Row>
          <U.HeroStats>
            <U.Stat><b>{heroStates}</b><span>{t.statStates}</span></U.Stat>
            <U.Stat><b>40</b><span>{t.statSquares}</span></U.Stat>
            <U.Stat><b>{heroJail}%</b><span>{t.statJail}</span></U.Stat>
          </U.HeroStats>
        </U.Wrap>
      </U.Hero>

      {/* ---------------- QUESTION ---------------- */}
      <U.Section id="question">
        <U.Wrap>
          <R><U.Tag>{t.qTag}</U.Tag><U.H2>{t.qTitle}</U.H2><U.Body>{t.qBody}</U.Body></R>
          <R d={1}><U.Body style={{ marginTop: 14 }}>{t.qWho}</U.Body></R>
          <div style={{ marginTop: 32 }}>
            <U.Reveal ref={guessRef}>
              <U.Card>
                <U.Row style={{ justifyContent: 'space-between' }}>
                  <b style={{ fontSize: 18 }}><FaQuestionCircle style={{ verticalAlign: -2, color: 'var(--accent)' }} /> {t.guessTag}</b>
                </U.Row>
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 8px' }}>{t.guessNote}</p>
                {(t.guesses as string[]).map((g, k) => (
                  <U.GuessRow key={k}>
                    <p>{g}</p>
                    <U.Meter title={`${GUESS_CONF[k]}%`}><i style={{ width: guessShown ? `${GUESS_CONF[k]}%` : '0%', transitionDelay: `${k * 150}ms` }} /></U.Meter>
                    <b style={{ width: 90 }}>{GUESS_CONF[k]}% {t.sure}</b>
                    <U.Pill $ok={guessShown ? verdicts[k] : null}>
                      {guessShown ? (verdicts[k] ? <><FaCheckCircle /> {t.verdictRight}</> : <><FaTimesCircle /> {t.verdictWrong}</>) : t.verdictPending}
                    </U.Pill>
                  </U.GuessRow>
                ))}
              </U.Card>
            </U.Reveal>
          </div>
        </U.Wrap>
      </U.Section>

      {/* ---------------- MODEL ---------------- */}
      <U.Section id="model">
        <U.Wrap>
          <R><U.Tag>{t.mTag}</U.Tag><U.H2>{t.mTitle}</U.H2><U.Body>{t.mBody}</U.Body></R>
          <U.Grid $min={230} style={{ marginTop: 32 }}>
            {(t.steps as string[][]).map((s, k) => {
              const Icon = [FaDice, FaRandom, FaDiceSix, FaLock][k];
              return (
                <R key={k} d={k}>
                  <U.Hov style={{ height: '100%' }}>
                    <U.StepNum><Icon size={20} /></U.StepNum>
                    <h3 style={{ fontSize: 19, marginBottom: 6 }}>{s[0]}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: 15 }}>{s[1]}</p>
                  </U.Hov>
                </R>
              );
            })}
          </U.Grid>

          <U.Grid $min={320} style={{ marginTop: 20 }}>
            <R>
              <U.Card style={{ height: '100%' }}>
                <b>{t.diceTitle}</b>
                <div style={{ height: 220, marginTop: 12 }}>
                  <ResponsiveContainer>
                    <BarChart data={dice} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={grid} />
                      <XAxis dataKey="s" tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip cursor={{ fill: 'transparent' }} content={(p: any) => tipStyle(p, `${p.label}`, `${(p.payload?.[0]?.value ?? 0).toFixed(1)}%`)} />
                      <Bar dataKey="p" radius={[8, 8, 0, 0]} animationDuration={1200}>
                        {dice.map((d) => <RCell key={d.s} fill={d.s === 7 ? 'var(--accent2)' : 'var(--accent)'} fillOpacity={d.s === 7 ? 1 : 0.6} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </U.Card>
            </R>
            <R d={1}>
              <U.Card style={{ height: '100%' }}>
                <b>{t.rules}</b>
                <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                  {(Object.keys(DEFAULT_RULES) as (keyof Rules)[]).map((k) => (
                    <U.Toggle key={k} $on={rules[k]} onClick={() => setRules({ ...rules, [k]: !rules[k] })} aria-pressed={rules[k]}>
                      <i />{t.ruleNames[k]}
                    </U.Toggle>
                  ))}
                </div>
              </U.Card>
            </R>
          </U.Grid>

          <R d={1}>
            <U.Card style={{ marginTop: 20, background: 'linear-gradient(120deg,color-mix(in srgb,var(--accent) 14%,var(--surface-solid)),var(--surface))' }}>
              <b>{t.formulaTitle}</b>
              <div style={{ fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', fontSize: 'clamp(15px,3.2vw,24px)', margin: '10px 0 6px', fontWeight: 700, overflowWrap: 'anywhere' }}>{t.formula}</div>
              <p style={{ color: 'var(--muted)', fontSize: 14.5 }}>{fmt(t.formulaNote, { n: exact.iters })}</p>
            </U.Card>
          </R>
        </U.Wrap>
      </U.Section>

      {/* ---------------- BOARD ---------------- */}
      <U.Section id="board">
        <U.Wrap>
          <R><U.Tag>{t.bTag}</U.Tag><U.H2>{t.bTitle}</U.H2><U.Body>{t.bBody}</U.Body></R>
          <R d={1}>
            <U.Row style={{ margin: '26px 0 18px', justifyContent: 'space-between' }}>
              <U.Seg>
                <button data-on={mode === 'exact' ? 1 : 0} onClick={() => { setMode('exact'); setRunning(false); }}><FaChartBar style={{ verticalAlign: -2 }} /> {t.exact}</button>
                <button data-on={mode === 'sim' ? 1 : 0} onClick={() => setMode('sim')}><FaDice style={{ verticalAlign: -2 }} /> {t.sim}</button>
              </U.Seg>
              <U.Legend style={{ minWidth: 240 }}>0% <i /> max · {t.uniformHint}</U.Legend>
            </U.Row>
          </R>
          <U.Split>
            <R>
              <U.BoardBox>
                {SQUARES.map((q, i) => {
                  const [r, c] = gridPos(i);
                  return (
                    <U.Cell key={i} $row={r} $col={c} $heat={heat(i)} $sel={sel === i} $color={GROUP_COLOR[q.group]}
                      onClick={() => setSel(i)} onMouseEnter={() => setSel(i)} aria-label={`${sqName(i)} ${pct(shown[i])}`}>
                      <span className="nm">{q.short}</span>
                      <span className="pc">{(shown[i] * 100).toFixed(1)}</span>
                    </U.Cell>
                  );
                })}
                <U.Center>
                  <b>{t.center1}</b>
                  <span>{t.center2}</span>
                  <span className="big">{mode === 'sim' ? `${simTotal.toLocaleString()} ${t.rolls}` : pct(selP, 1)}</span>
                  {mode === 'exact' && <span>{sqName(sel)}</span>}
                </U.Center>
                {mode === 'sim' && simTotal > 0 && <U.Token $row={tr} $col={tc} />}
              </U.BoardBox>
            </R>

            <div style={{ display: 'grid', gap: 16, position: 'sticky', top: 84 }}>
              <R d={1}>
                <U.Card key={sel} style={{ animation: 'none' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{t.selected}</span>
                  <U.Row style={{ margin: '6px 0 10px', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: 22, letterSpacing: '-.02em' }}>{sqName(sel)}</h3>
                    <U.Chip $c={GROUP_COLOR[SQUARES[sel].group]}>#{sel}</U.Chip>
                  </U.Row>
                  <U.Big>{pct(selP)}</U.Big>
                  <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>{t.probLabel}</p>
                  <U.Row $gap={8} style={{ marginTop: 14 }}>
                    <U.Pill $ok={null}>{t.rankLabel} {rank[sel]}/40</U.Pill>
                    <U.Pill $ok={selP > 0.025 ? true : selP < 0.025 ? false : null}>{(selP / 0.025).toFixed(2)}× · {t.vsUniform}</U.Pill>
                  </U.Row>
                  {sel === JAIL && mode === 'exact' && (
                    <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 12 }}>
                      {fmt(t.inJailNote, { a: (exact.inJail * 100).toFixed(1), b: (exact.visiting * 100).toFixed(1) })}
                    </p>
                  )}
                </U.Card>
              </R>

              {mode === 'sim' && (
                <R d={2}>
                  <U.Card>
                    <U.Row $gap={10}>
                      <U.Prim onClick={() => setRunning(!running)}>{running ? <><FaPause /> {t.pause}</> : <><FaPlay /> {t.play}</>}</U.Prim>
                      <U.Ghost onClick={() => { resetSim(); setRunning(false); }}><FaRedo /> {t.reset}</U.Ghost>
                    </U.Row>
                    <div style={{ marginTop: 18 }}>
                      <U.Row style={{ justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                        <b>{t.speed}</b><span style={{ color: 'var(--muted)' }}>{SPEEDS[speedIdx].toLocaleString()} / s</span>
                      </U.Row>
                      <U.Slider type="range" min={0} max={SPEEDS.length - 1} value={speedIdx} onChange={(e) => setSpeedIdx(+e.target.value)} />
                    </div>
                    <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 14 }}>
                      {t.lastRoll}: <b style={{ color: 'var(--text)' }}>{sqName(simRef.current?.last ?? 0)}</b> · {simTotal.toLocaleString()} {t.rolls}
                    </p>
                  </U.Card>
                </R>
              )}
            </div>
          </U.Split>

          {mode === 'sim' && (
            <R>
              <U.Card style={{ marginTop: 20 }}>
                <b>{t.convTitle}</b>
                <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 10px' }}>{t.convSub}</p>
                <div style={{ height: 260 }}>
                  {simRef.current && simRef.current.pts.length > 2 ? (
                    <ResponsiveContainer>
                      <LineChart data={simRef.current.pts.slice()} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
                        <CartesianGrid stroke={grid} />
                        <XAxis dataKey="n" type="number" scale="log" domain={['dataMin', 'dataMax']} tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false}
                          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)))} />
                        <YAxis scale="log" domain={['auto', 'auto']} allowDataOverflow tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => v.toPrecision(1)} width={52} />
                        <Tooltip content={(p: any) => tipStyle(p, `${Math.round(p.label ?? 0).toLocaleString()} ${t.rolls}`, `${t.tvLabel} ${(p.payload?.[0]?.value ?? 0).toFixed(4)}`)} />
                        <Line type="monotone" dataKey="ref" stroke={axis} strokeDasharray="5 5" dot={false} isAnimationActive={false} name={t.refLabel} />
                        <Line type="monotone" dataKey="tv" stroke="var(--accent2)" strokeWidth={3} dot={false} isAnimationActive={false} name={t.tvLabel} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>{t.convEmpty}</div>
                  )}
                </div>
              </U.Card>
            </R>
          )}
        </U.Wrap>
      </U.Section>

      {/* ---------------- RESULTS ---------------- */}
      <U.Section id="results">
        <U.Wrap>
          <R><U.Tag>{t.rTag}</U.Tag><U.H2>{t.rTitle}</U.H2></R>
          <U.Grid $min={260}>
            {[
              [t.rBig1, pct(jailShare, 1), fmt(t.rBig1b, { x: (jailShare / 0.025).toFixed(1) })],
              [t.rBig2, `${sqName(bestOther[1])} · ${pct(bestOther[0], 2)}`, t.rBig2b],
              [t.rBig3, pct(groups.find((g) => g.g === 'brown')!.p / 100, 2), t.rBig3b],
            ].map(([a, b, c], k) => (
              <R key={k} d={k}>
                <U.Hov style={{ height: '100%' }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 700, fontSize: 14 }}>{a}</span>
                  <U.Big style={{ fontSize: 'clamp(26px,4.4vw,38px)', margin: '8px 0' }}>{b}</U.Big>
                  <p style={{ color: 'var(--muted)', fontSize: 15 }}>{c}</p>
                </U.Hov>
              </R>
            ))}
          </U.Grid>

          <U.Grid $min={340} style={{ marginTop: 16 }}>
            <R>
              <U.Card>
                <b>{t.rTop}</b>
                <div style={{ height: 380, marginTop: 10 }}>
                  <ResponsiveContainer>
                    <BarChart data={top12} layout="vertical" margin={{ top: 4, right: 18, left: 0, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke={grid} />
                      <XAxis type="number" tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} unit="%" domain={[0, 3.5]} ticks={[0, 1, 2, 3]} />
                      <YAxis type="category" dataKey="i" width={96} tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(i) => SQUARES[i].short} />
                      <Tooltip cursor={{ fill: 'transparent' }} content={(p: any) => tipStyle(p, sqName(p.payload?.[0]?.payload?.i ?? 0), `${(p.payload?.[0]?.value ?? 0).toFixed(2)}%`)} />
                      <ReferenceLine x={2.5} stroke={axis} strokeDasharray="4 4" label={{ value: t.uniform, fill: axis, fontSize: 11, position: 'top' }} />
                      <Bar dataKey="p" radius={[0, 8, 8, 0]} animationDuration={1100}>
                        {top12.map((d) => <RCell key={d.i} fill={GROUP_COLOR[SQUARES[d.i].group]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </U.Card>
            </R>
            <R d={1}>
              <U.Card>
                <b>{t.rGroups}</b>
                <div style={{ height: 380, marginTop: 10 }}>
                  <ResponsiveContainer>
                    <BarChart data={groups} margin={{ top: 16, right: 6, left: -14, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={grid} />
                      <XAxis dataKey="g" tick={false} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} unit="%" domain={[1.5, 3]} ticks={[1.5, 2, 2.5, 3]} />
                      <Tooltip cursor={{ fill: 'transparent' }} content={(p: any) => tipStyle(p, String(p.label ?? ''), `${(p.payload?.[0]?.value ?? 0).toFixed(2)}%`)} />
                      <ReferenceLine y={2.5} stroke={axis} strokeDasharray="4 4" />
                      <Bar dataKey="p" radius={[8, 8, 0, 0]} animationDuration={1100}>
                        {groups.map((d) => <RCell key={d.g} fill={GROUP_COLOR[d.g]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <U.Row $gap={6} style={{ marginTop: 6 }}>
                  {groups.map((d) => <U.Chip key={d.g} $c={GROUP_COLOR[d.g]}>{d.g}</U.Chip>)}
                </U.Row>
              </U.Card>
            </R>
          </U.Grid>

          <R>
            <U.Card style={{ marginTop: 16 }}>
              <b>{t.variantsTitle}</b>
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '4px 0 10px' }}>{t.variantsSub}</p>
              {VARIANTS.map((v, k) => {
                const p = variants[k].probs;
                const top = p.map((x, i) => [x, i] as const).filter(([, i]) => i !== JAIL).sort((a, b) => b[0] - a[0])[0];
                return (
                  <U.VarRow key={k} data-cur={sameRules(v, rules) ? 1 : 0}>
                    <span>{t.vNames[k]}</span>
                    <div><small>{t.vJail} {pct(p[JAIL], 1)}</small><div className="bar"><i style={{ width: `${Math.min(100, p[JAIL] * 100 * 6)}%` }} /></div></div>
                    <div><small>{t.vTop}</small><div>{SQUARES[top[1]].short} · {pct(top[0], 2)}</div></div>
                  </U.VarRow>
                );
              })}
            </U.Card>
          </R>
        </U.Wrap>
      </U.Section>

      {/* ---------------- TEST ---------------- */}
      <U.Section id="test">
        <U.Wrap>
          <R><U.Tag>{t.tTag}</U.Tag><U.H2>{t.tTitle}</U.H2><U.Body>{t.tBody}</U.Body></R>
          <R d={1}>
            <U.Card style={{ marginTop: 28 }}>
              <U.Row $gap={14}>
                <U.Prim onClick={runTest} disabled={testing || !sameRules(rules, DEFAULT_RULES)}>
                  {testing ? <><U.Spinner /> {t.tRunning}</> : <><FaFlask /> {t.tRun}</>}
                </U.Prim>
                {!sameRules(rules, DEFAULT_RULES) && <U.Pill $ok={null}><FaExclamationTriangle /> {t.tOnly}</U.Pill>}
              </U.Row>

              {test && (
                <div style={{ marginTop: 24, animation: 'none' }}>
                  <U.Grid $min={200}>
                    <U.Stat><b>{test.realTV.toFixed(5)}</b><span>{t.tTV} · {fmt(t.tRolls, { n: test.n.toLocaleString() })}</span></U.Stat>
                    <U.Stat><b>{test.chainTV.toFixed(5)}</b><span>{lang === 'es' ? 'Referencia: la misma cantidad de tiradas del propio modelo (solo ruido)' : 'Baseline: same number of rolls from the model itself (pure noise)'}</span></U.Stat>
                    <U.Stat><b>{test.worst.toFixed(3)}%</b><span>{t.tWorst}</span></U.Stat>
                  </U.Grid>
                  <b style={{ display: 'block', margin: '22px 0 6px' }}>{t.tChartTitle}</b>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer>
                      <BarChart data={test.diffs} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke={grid} />
                        <XAxis dataKey="i" tick={{ fill: axis, fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                        <YAxis tick={{ fill: axis, fontSize: 12 }} tickLine={false} axisLine={false} domain={[-0.1, 0.1]} unit="%" tickFormatter={(v) => v.toFixed(2)} />
                        <Tooltip cursor={{ fill: 'transparent' }} content={(p: any) => tipStyle(p, sqName(p.payload?.[0]?.payload?.i ?? 0), `${(p.payload?.[0]?.value ?? 0).toFixed(3)}%`)} />
                        <ReferenceLine y={0} stroke={axis} />
                        <Bar dataKey="d" radius={[4, 4, 0, 0]} animationDuration={900}>
                          {test.diffs.map((d) => <RCell key={d.i} fill={d.d >= 0 ? 'var(--accent2)' : 'var(--accent3)'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <U.Pill $ok={test.realTV < test.chainTV * 1.5} style={{ marginTop: 10, whiteSpace: 'normal' }}>
                    {test.realTV < test.chainTV * 1.5 ? <FaCheckCircle /> : <FaExclamationTriangle />} {test.realTV < test.chainTV * 1.5 ? t.tVerdict : t.tVerdictNo}
                  </U.Pill>
                </div>
              )}
            </U.Card>
          </R>
        </U.Wrap>
      </U.Section>

      {/* ---------------- HONESTY ---------------- */}
      <U.Section id="honesty">
        <U.Wrap>
          <R><U.Tag>{t.hTag}</U.Tag><U.H2>{t.hTitle}</U.H2></R>
          <U.Grid $min={320}>
            <R>
              <U.Hov style={{ height: '100%' }}>
                <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.sureTitle}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 16 }}>{t.sureBody}</p>
              </U.Hov>
            </R>
            <R d={1}>
              <U.Hov style={{ height: '100%' }}>
                <h3 style={{ fontSize: 20, marginBottom: 10 }}>{t.limitsTitle}</h3>
                <U.List>{(t.limits as string[]).map((l, k) => <li key={k}><FaExclamationTriangle size={14} /> <span>{l}</span></li>)}</U.List>
              </U.Hov>
            </R>
          </U.Grid>
          <R>
            <U.Card style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}><FaRobot style={{ verticalAlign: -3, color: 'var(--accent)' }} /> {t.aiTitle}</h3>
              <p style={{ color: 'var(--muted)', fontSize: 16 }}>{t.aiBody}</p>
            </U.Card>
          </R>
        </U.Wrap>
      </U.Section>

      <U.Footer><U.Wrap>{t.footer}</U.Wrap></U.Footer>
    </U.Page>
  );
}
