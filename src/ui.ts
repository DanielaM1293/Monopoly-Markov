import styled, { createGlobalStyle, css, keyframes } from 'styled-components';

export const fadeUp = keyframes`from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}`;
export const float = keyframes`0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-14px) rotate(6deg)}`;
export const drift = keyframes`0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(40px,-30px,0) scale(1.12)}100%{transform:translate3d(0,0,0) scale(1)}`;
export const pulse = keyframes`0%{box-shadow:0 0 0 0 var(--ring)}100%{box-shadow:0 0 0 14px transparent}`;
export const shimmer = keyframes`0%{background-position:0% 50%}100%{background-position:200% 50%}`;
export const spin = keyframes`to{transform:rotate(360deg)}`;

export const GlobalStyle = createGlobalStyle`
  :root, [data-theme='light'] {
    --bg:#f5f3ff; --bg2:#ffffff; --surface:rgba(255,255,255,.78); --surface-solid:#ffffff;
    --text:#1b1535; --muted:#6a6585; --line:rgba(76,58,160,.14);
    --accent:#7c3aed; --accent2:#ec4899; --accent3:#06b6d4; --good:#16a34a; --bad:#e11d48;
    --heat:244,63,94; --shadow:0 10px 40px -12px rgba(76,58,160,.28); --ring:rgba(124,58,237,.45);
    --board:#e9f3ea;
  }
  [data-theme='dark'] {
    --bg:#0a0d1c; --bg2:#10142a; --surface:rgba(24,29,58,.72); --surface-solid:#151a35;
    --text:#eef0ff; --muted:#9aa2c8; --line:rgba(150,160,255,.16);
    --accent:#a78bfa; --accent2:#f472b6; --accent3:#22d3ee; --good:#4ade80; --bad:#fb7185;
    --heat:251,113,133; --shadow:0 14px 50px -14px rgba(0,0,0,.7); --ring:rgba(167,139,250,.5);
    --board:#0f1a24;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--bg);color:var(--text);transition:background .5s,color .4s;
    font-family:ui-rounded,'SF Pro Rounded','Nunito','Segoe UI',system-ui,-apple-system,Roboto,sans-serif;
    line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  h1,h2,h3,p{margin:0}
  button{font:inherit;color:inherit;cursor:pointer}
  ::selection{background:var(--accent);color:#fff}
  @media (prefers-reduced-motion:reduce){*{animation-duration:.001ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}
`;

export const Page = styled.div`
  position:relative;min-height:100vh;
  &::before{content:'';position:fixed;inset:0;z-index:-2;
    background:
      radial-gradient(1200px 600px at 10% -10%, color-mix(in srgb,var(--accent) 22%,transparent), transparent 60%),
      radial-gradient(900px 500px at 100% 10%, color-mix(in srgb,var(--accent2) 18%,transparent), transparent 60%),
      radial-gradient(900px 700px at 50% 110%, color-mix(in srgb,var(--accent3) 16%,transparent), transparent 60%);}
`;

export const Wrap = styled.div`max-width:1120px;margin:0 auto;padding:0 20px;@media(min-width:720px){padding:0 32px}`;

export const Nav = styled.header<{ $solid: boolean }>`
  position:sticky;top:0;z-index:50;transition:all .3s;
  background:${(p) => (p.$solid ? 'var(--surface)' : 'transparent')};
  backdrop-filter:${(p) => (p.$solid ? 'blur(16px) saturate(1.4)' : 'none')};
  border-bottom:1px solid ${(p) => (p.$solid ? 'var(--line)' : 'transparent')};
`;
export const NavInner = styled(Wrap)`display:flex;align-items:center;gap:12px;height:64px;`;
export const Brand = styled.a`display:flex;align-items:center;gap:10px;font-weight:800;color:var(--text);text-decoration:none;letter-spacing:-.02em;
  svg{color:var(--accent);animation:${float} 5s ease-in-out infinite}`;
export const NavLinks = styled.nav`margin-left:auto;display:none;gap:4px;@media(min-width:900px){display:flex}
  a{color:var(--muted);text-decoration:none;font-size:14px;font-weight:600;padding:8px 12px;border-radius:999px;transition:all .2s}
  a:hover{color:var(--text);background:var(--surface)}`;
export const IconBtn = styled.button`
  display:inline-flex;align-items:center;justify-content:center;gap:6px;height:40px;min-width:40px;padding:0 12px;
  border-radius:999px;border:1px solid var(--line);background:var(--surface);backdrop-filter:blur(10px);
  font-size:13px;font-weight:700;transition:transform .2s,box-shadow .2s,border-color .2s;
  &:hover{transform:translateY(-2px);box-shadow:var(--shadow);border-color:var(--accent)}
  &:active{transform:scale(.94)}
  svg{transition:transform .5s}
  &:hover svg{transform:rotate(20deg)}
`;
export const NavRight = styled.div`display:flex;gap:8px;margin-left:auto;@media(min-width:900px){margin-left:12px}`;

export const Hero = styled.section`position:relative;padding:56px 0 72px;overflow:hidden;@media(min-width:720px){padding:96px 0 110px}`;
export const Blob = styled.div<{ $c: string; $s: number; $x: string; $y: string; $d: number }>`
  position:absolute;width:${(p) => p.$s}px;height:${(p) => p.$s}px;border-radius:50%;filter:blur(70px);opacity:.35;z-index:-1;
  background:${(p) => p.$c};left:${(p) => p.$x};top:${(p) => p.$y};animation:${drift} ${(p) => p.$d}s ease-in-out infinite;`;
export const Kicker = styled.span`display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:700;
  background:var(--surface);border:1px solid var(--line);color:var(--accent);animation:${fadeUp} .7s both`;
export const H1 = styled.h1`font-size:clamp(40px,8.5vw,92px);line-height:1;letter-spacing:-.045em;font-weight:900;margin:22px 0 20px;
  animation:${fadeUp} .8s .1s both;
  span{background:linear-gradient(100deg,var(--accent),var(--accent2),var(--accent3),var(--accent));background-size:200% auto;
    -webkit-background-clip:text;background-clip:text;color:transparent;animation:${shimmer} 6s linear infinite}`;
export const Lead = styled.p`font-size:clamp(17px,2.4vw,22px);color:var(--muted);max-width:640px;animation:${fadeUp} .8s .2s both`;
export const Row = styled.div<{ $gap?: number }>`display:flex;flex-wrap:wrap;gap:${(p) => p.$gap ?? 12}px;align-items:center`;
export const Btn = styled.a<{ $ghost?: boolean }>`
  display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:800;text-decoration:none;font-size:16px;
  transition:transform .25s,box-shadow .25s;cursor:pointer;animation:${fadeUp} .8s .3s both;
  ${(p) =>
    p.$ghost
      ? css`background:var(--surface);border:1px solid var(--line);color:var(--text)`
      : css`background:linear-gradient(120deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 12px 30px -10px var(--accent)`};
  &:hover{transform:translateY(-3px) scale(1.02);box-shadow:var(--shadow)}
  &:active{transform:scale(.96)}
`;
export const HeroStats = styled.div`display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:44px;max-width:640px;animation:${fadeUp} .9s .45s both`;
export const Stat = styled.div`padding:16px;border-radius:20px;background:var(--surface);border:1px solid var(--line);backdrop-filter:blur(10px);
  b{display:block;font-size:clamp(24px,5vw,38px);letter-spacing:-.03em;font-weight:900}
  span{font-size:12.5px;color:var(--muted);line-height:1.3;display:block}`;
export const HeroDice = styled.div`position:absolute;right:5%;top:400px;display:none;gap:18px;color:var(--accent);opacity:.9;z-index:-1;
  @media(min-width:1100px){display:flex}
  svg{filter:drop-shadow(0 18px 24px color-mix(in srgb,var(--accent) 40%,transparent));animation:${float} 6s ease-in-out infinite}
  svg:nth-child(2){color:var(--accent2);animation-delay:-2.5s;margin-top:70px}`;

export const Section = styled.section`padding:56px 0;scroll-margin-top:70px;@media(min-width:720px){padding:84px 0}`;
export const Tag = styled.span`display:inline-block;font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin-bottom:10px`;
export const H2 = styled.h2`font-size:clamp(28px,5vw,48px);line-height:1.08;letter-spacing:-.035em;font-weight:900;margin-bottom:16px`;
export const Body = styled.p`font-size:clamp(16px,2vw,19px);color:var(--muted);max-width:720px`;
export const Card = styled.div<{ $pad?: number }>`
  background:var(--surface);border:1px solid var(--line);border-radius:26px;padding:${(p) => p.$pad ?? 24}px;
  backdrop-filter:blur(14px);box-shadow:var(--shadow);transition:transform .3s,border-color .3s;
`;
export const Grid = styled.div<{ $min?: number }>`display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(100%,${(p) => p.$min ?? 240}px),1fr))`;
export const Hov = styled(Card)`&:hover{transform:translateY(-6px);border-color:var(--accent)}`;

export const reveal = css`
  opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1);
  &[data-in='1']{opacity:1;transform:none}
`;
export const Reveal = styled.div<{ $d?: number }>`${reveal};transition-delay:${(p) => (p.$d ?? 0) * 90}ms`;

export const GuessRow = styled.div`display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:16px 0;border-top:1px solid var(--line);&:first-of-type{border-top:0}
  p{flex:1 1 260px;font-weight:600}`;
export const Meter = styled.div`flex:0 0 150px;height:10px;border-radius:99px;background:var(--line);overflow:hidden;
  i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--accent),var(--accent2));transform-origin:left;transition:width 1.2s cubic-bezier(.2,.8,.2,1)}`;
export const Pill = styled.span<{ $ok?: boolean | null }>`
  display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;font-size:13px;font-weight:800;
  color:${(p) => (p.$ok == null ? 'var(--muted)' : p.$ok ? 'var(--good)' : 'var(--bad)')};
  background:color-mix(in srgb,${(p) => (p.$ok == null ? 'var(--muted)' : p.$ok ? 'var(--good)' : 'var(--bad)')} 14%,transparent);
`;

export const StepNum = styled.div`width:44px;height:44px;border-radius:14px;display:grid;place-items:center;color:#fff;margin-bottom:14px;
  background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 10px 24px -8px var(--accent);transition:transform .4s;
  ${Hov}:hover &{transform:rotate(-8deg) scale(1.08)}`;

export const Toggle = styled.button<{ $on: boolean }>`
  display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:18px;text-align:left;font-weight:700;font-size:15px;
  border:1px solid ${(p) => (p.$on ? 'var(--accent)' : 'var(--line)')};background:${(p) => (p.$on ? 'color-mix(in srgb,var(--accent) 12%,var(--surface-solid))' : 'var(--surface)')};
  transition:all .25s;&:hover{transform:translateY(-2px)}&:active{transform:scale(.97)}
  i{flex:0 0 42px;height:24px;border-radius:99px;position:relative;background:${(p) => (p.$on ? 'var(--accent)' : 'var(--line)')};transition:background .25s;
    &::after{content:'';position:absolute;top:3px;left:${(p) => (p.$on ? '21px' : '3px')};width:18px;height:18px;border-radius:50%;background:#fff;transition:left .25s cubic-bezier(.3,1.5,.5,1);box-shadow:0 2px 6px rgba(0,0,0,.3)}}
`;

export const Seg = styled.div`display:inline-flex;padding:4px;border-radius:999px;background:var(--surface);border:1px solid var(--line);
  button{border:0;background:transparent;padding:9px 18px;border-radius:999px;font-weight:800;font-size:14px;color:var(--muted);transition:all .25s}
  button[data-on='1']{background:linear-gradient(120deg,var(--accent),var(--accent2));color:#fff;box-shadow:0 6px 16px -6px var(--accent)}`;

/* ---------- board ---------- */
export const BoardBox = styled.div`position:relative;width:100%;aspect-ratio:1;border-radius:clamp(14px,3vw,28px);overflow:hidden;
  background:var(--board);border:1px solid var(--line);box-shadow:var(--shadow);
  display:grid;grid-template-columns:repeat(11,1fr);grid-template-rows:repeat(11,1fr);gap:2px;padding:2px;`;
export const Cell = styled.button<{ $heat: number; $sel: boolean; $color: string; $row: number; $col: number }>`
  grid-row:${(p) => p.$row + 1};grid-column:${(p) => p.$col + 1};position:relative;border:0;padding:0;overflow:hidden;
  display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;
  border-radius:clamp(3px,.8vw,8px);color:var(--text);min-width:0;
  background:linear-gradient(rgba(var(--heat),${(p) => 0.04 + p.$heat * 0.78}),rgba(var(--heat),${(p) => 0.04 + p.$heat * 0.78})),var(--surface-solid);
  transition:background .5s,transform .2s,box-shadow .2s;
  outline:${(p) => (p.$sel ? '2px solid var(--accent)' : 'none')};outline-offset:-2px;z-index:${(p) => (p.$sel ? 3 : 1)};
  &::before{content:'';display:block;width:100%;height:clamp(3px,1.1vw,10px);background:${(p) => p.$color};flex:none}
  &:hover{transform:scale(1.18);z-index:5;box-shadow:0 8px 24px rgba(0,0,0,.35)}
  .nm{display:none;font-size:clamp(7px,.85vw,10px);font-weight:700;line-height:1.05;padding:0 2px;opacity:.85;@media(min-width:640px){display:block}}
  .pc{font-weight:900;font-size:clamp(7.5px,1.9vw,15px);letter-spacing:-.03em;padding-bottom:clamp(1px,.5vw,5px);font-variant-numeric:tabular-nums}
`;
export const Token = styled.div<{ $row: number; $col: number }>`
  position:absolute;width:calc(100% / 11);height:calc(100% / 11);z-index:8;pointer-events:none;
  left:calc(${(p) => p.$col} * 100% / 11);top:calc(${(p) => p.$row} * 100% / 11);
  transition:left .16s cubic-bezier(.3,1.3,.5,1),top .16s cubic-bezier(.3,1.3,.5,1);display:grid;place-items:center;
  &::after{content:'';width:46%;height:46%;border-radius:50%;background:linear-gradient(135deg,var(--accent2),var(--accent));border:2px solid #fff;
    box-shadow:0 4px 14px rgba(0,0,0,.45);animation:${pulse} 1s ease-out infinite}
`;
export const Center = styled.div`grid-row:2/11;grid-column:2/11;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;padding:8px;
  b{font-size:clamp(18px,6vw,56px);font-weight:900;letter-spacing:-.05em;background:linear-gradient(100deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
  span{font-size:clamp(9px,1.6vw,14px);color:var(--muted);font-weight:600}
  .big{font-size:clamp(20px,5vw,48px);font-weight:900;color:var(--text);margin-top:6px;font-variant-numeric:tabular-nums}`;

export const Split = styled.div`display:grid;gap:20px;grid-template-columns:1fr;align-items:start;@media(min-width:960px){grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}`;
export const Legend = styled.div`display:flex;align-items:center;gap:10px;font-size:12.5px;color:var(--muted);font-weight:600;
  i{flex:1;height:8px;border-radius:99px;background:linear-gradient(90deg,rgba(var(--heat),.08),rgba(var(--heat),.85))}`;
export const Big = styled.div`font-size:clamp(38px,7vw,64px);font-weight:900;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;
  background:linear-gradient(100deg,var(--accent),var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent`;
export const Chip = styled.span<{ $c?: string }>`display:inline-block;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:800;color:#fff;background:${(p) => p.$c ?? 'var(--accent)'}`;
export const Slider = styled.input`-webkit-appearance:none;appearance:none;width:100%;height:8px;border-radius:99px;background:var(--line);outline:none;
  &::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3);cursor:grab;transition:transform .2s}
  &::-webkit-slider-thumb:hover{transform:scale(1.2)}
  &::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:var(--accent);border:3px solid #fff;cursor:grab}`;
export const Spinner = styled.span`width:18px;height:18px;border-radius:50%;border:3px solid color-mix(in srgb,#fff 40%,transparent);border-top-color:#fff;animation:${spin} .7s linear infinite;display:inline-block`;
export const Prim = styled.button`display:inline-flex;align-items:center;gap:10px;padding:13px 22px;border-radius:999px;border:0;font-weight:800;color:#fff;
  background:linear-gradient(120deg,var(--accent),var(--accent2));box-shadow:0 10px 26px -10px var(--accent);transition:transform .25s,box-shadow .25s,opacity .2s;
  &:hover{transform:translateY(-2px) scale(1.03)}&:active{transform:scale(.95)}&:disabled{opacity:.6;cursor:progress;transform:none}`;
export const Ghost = styled(Prim)`background:var(--surface);color:var(--text);border:1px solid var(--line);box-shadow:none`;
export const VarRow = styled.div`display:grid;grid-template-columns:minmax(110px,1.3fr) 1fr 1fr;gap:8px 14px;align-items:center;padding:12px 6px;border-top:1px solid var(--line);font-size:14.5px;
  transition:background .25s;border-radius:12px;&:hover{background:color-mix(in srgb,var(--accent) 7%,transparent)}
  &[data-cur='1']{background:color-mix(in srgb,var(--accent) 12%,transparent);font-weight:700}
  .bar{height:8px;border-radius:99px;background:var(--line);overflow:hidden;margin-top:4px;i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .8s cubic-bezier(.2,.8,.2,1)}}
  small{color:var(--muted)}`;
export const List = styled.ul`margin:0;padding:0;list-style:none;display:grid;gap:12px;
  li{display:flex;gap:12px;color:var(--muted);font-size:16px;align-items:flex-start}
  li svg{flex:none;margin-top:4px;color:var(--accent2)}`;
export const Footer = styled.footer`padding:48px 0 56px;border-top:1px solid var(--line);color:var(--muted);font-size:14px;text-align:center`;
export const Tip = styled.div`background:var(--surface-solid);border:1px solid var(--line);border-radius:12px;padding:8px 12px;font-size:13px;box-shadow:var(--shadow);b{font-weight:800}`;
