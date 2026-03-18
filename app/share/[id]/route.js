import { getSupabase } from '../../../lib/ai.js';

export async function GET(request, { params }) {
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from('shared_courses')
    .select('id, title, slides, learner, strategy, bloom_level, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return new Response(notFoundHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response(viewerHTML(data), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function notFoundHTML() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Course Not Found</title>
  <style>body{background:#0f172a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;}h1{font-size:2rem;margin-bottom:1rem;}p{color:rgba(255,255,255,0.5);}</style>
  </head><body><div><h1>Course not found</h1><p>This course link may have expired or been removed.</p></div></body></html>`;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function viewerHTML({ title, slides, learner, strategy, bloom_level }) {
  // Safely embed JSON — prevent </script> injection
  const slidesJSON = JSON.stringify(slides).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover">
  <title>${esc(title)} · InstruX</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; }
    body {
      background: #0a0f1e;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #player-shell {
      width: 100%;
      max-width: 420px;
      height: 100vh;
      height: 100svh;
      max-height: 860px;
      display: flex;
      flex-direction: column;
      background: #1e3a8a;
      position: relative;
      overflow: hidden;
    }
    @media (min-width: 480px) {
      body { background: #0a0f1e; }
      #player-shell {
        border-radius: 32px;
        box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
        height: 92vh;
        height: 92svh;
      }
    }
    /* Top bar */
    #top-bar {
      background: rgba(0,0,0,0.35);
      backdrop-filter: blur(12px);
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      z-index: 10;
    }
    #course-title-bar {
      font-size: 0.65rem;
      font-weight: 800;
      color: rgba(255,255,255,0.7);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    #counter {
      font-size: 0.65rem;
      font-weight: 800;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.1em;
    }
    /* Dots nav */
    #dots-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 0.5rem 1rem;
      flex-shrink: 0;
      background: rgba(0,0,0,0.2);
    }
    .dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      transition: all 0.2s;
      cursor: pointer;
      flex-shrink: 0;
    }
    .dot.active { background: #FFCC31; width: 18px; border-radius: 3px; }
    /* Stage */
    #stage {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #1e3a8a;
    }
    #stage-inner {
      position: absolute;
      inset: 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    /* Bottom nav */
    #bottom-nav {
      background: rgba(0,0,0,0.35);
      backdrop-filter: blur(12px);
      border-top: 1px solid rgba(255,255,255,0.07);
      padding: 0.75rem 1rem;
      padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-shrink: 0;
      z-index: 10;
    }
    .nav-btn {
      display: flex; align-items: center; gap: 0.35rem;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      color: white;
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.75rem 1.5rem;
      min-height: 44px;
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.15); }
    .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .nav-btn.primary {
      background: #FFCC31;
      color: #1e3a8a;
      border-color: #FFCC31;
      font-weight: 900;
    }
    .nav-btn.primary:hover { background: #ffd84d; }
    /* Flipcard */
    .ml-flip-card.ml-flipped .ml-flip-inner { transform: rotateY(180deg); }
    /* Animations */
    @keyframes mlPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    /* Branding bar */
    #branding {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      text-align: center;
      padding: 0.25rem;
      font-size: 0.55rem;
      font-weight: 700;
      color: rgba(255,255,255,0.2);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      z-index: 5;
      pointer-events: none;
    }
  </style>
</head>
<body>
<div id="player-shell">
  <!-- Top bar -->
  <div id="top-bar">
    <div id="course-title-bar">${esc(title)}</div>
    <div id="counter">1 / 1</div>
  </div>

  <!-- Dots -->
  <div id="dots-nav"></div>

  <!-- Slide stage -->
  <div id="stage">
    <div id="stage-inner"></div>
  </div>

  <!-- Bottom nav -->
  <div id="bottom-nav">
    <button id="btn-prev" class="nav-btn" onclick="navigate(-1)">&#8249; Prev</button>
    <button id="btn-next" class="nav-btn primary" onclick="navigate(1)">Next &#8250;</button>
  </div>
</div>

<script>
// ─── State ───────────────────────────────────────────────────────────────────
const SLIDES = ${slidesJSON};
let currentIndex = 0;
let quizCorrect = 0, quizTotal = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function navigate(dir) {
  const next = currentIndex + dir;
  if (next < 0 || next >= SLIDES.length) return;
  currentIndex = next;
  render();
}

function jumpTo(idx) {
  if (idx < 0 || idx >= SLIDES.length) return;
  currentIndex = idx;
  render();
}

// ─── Render ──────────────────────────────────────────────────────────────────
function render() {
  const slide = SLIDES[currentIndex];
  const inner = document.getElementById('stage-inner');
  inner.style.opacity = '0';
  inner.style.transform = 'translateX(10px)';

  setTimeout(() => {
    inner.innerHTML = renderSlide(slide);
    // Inject image src (avoids huge data URL in HTML attribute)
    if (slide.imageUrl) {
      const imgEl = inner.querySelector('[data-ml-img]');
      if (imgEl) imgEl.src = slide.imageUrl;
      const coverBg = inner.querySelector('[data-cover-img]');
      if (coverBg) coverBg.style.backgroundImage = 'url(' + JSON.stringify(slide.imageUrl) + ')';
    }
    inner.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
    inner.style.transform = 'translateX(0)';
    inner.style.opacity = '1';
  }, 80);

  // Update counter
  document.getElementById('counter').textContent = (currentIndex + 1) + ' / ' + SLIDES.length;

  // Update dots
  renderDots();

  // Update nav buttons
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  prev.disabled = currentIndex === 0;
  const isLast = currentIndex === SLIDES.length - 1;
  next.textContent = isLast ? 'Finish ✓' : 'Next ›';
  next.disabled = isLast && slide.type !== 'summary';

  // Slides with their own CTA button — hide bottom Next entirely
  const hiddenNextTypes = ['cover', 'module-title', 'quiz', 'summary'];
  if (hiddenNextTypes.includes(slide.type)) {
    next.style.display = 'none';
  } else {
    next.style.display = 'flex';
  }
}

function renderDots() {
  const nav = document.getElementById('dots-nav');
  const max = 15;
  const total = SLIDES.length;
  if (total > max) {
    nav.innerHTML = '<span style="font-size:0.6rem;color:rgba(255,255,255,0.3);font-weight:700;">' + (currentIndex+1) + ' of ' + total + '</span>';
    return;
  }
  nav.innerHTML = SLIDES.map((_, i) =>
    '<div class="dot' + (i === currentIndex ? ' active' : '') + '" onclick="jumpTo(' + i + ')"></div>'
  ).join('');
}

// ─── Render Functions ─────────────────────────────────────────────────────────
function renderSlide(slide) {
  if (!slide) return '';
  switch (slide.type) {
    case 'cover':        return renderCover(slide);
    case 'objectives':   return renderObjectives(slide);
    case 'module-title': return renderModuleTitle(slide);
    case 'content':      return renderContent(slide);
    case 'video':        return renderVideo(slide);
    case 'quote':        return renderQuote(slide);
    case 'checklist':    return renderChecklist(slide);
    case 'flipcards':    return renderFlipCards(slide);
    case 'quiz':         return renderQuiz(slide);
    case 'summary':      return renderSummary(slide);
    default: return '<div style="color:white;padding:2rem;">Unknown slide type: ' + escHtml(String(slide.type)) + '</div>';
  }
}

function renderCover(s) {
  const total = SLIDES.length;
  const mins = Math.max(3, Math.round(total * 0.8));
  const bg = s.imageUrl
    ? '<div style="position:absolute;inset:0;background-image:url(\\'\\');background-size:cover;background-position:center;z-index:0;" data-cover-img></div><div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(2,6,23,0.55) 0%,rgba(30,58,138,0.75) 100%);z-index:1;"></div>'
    : '<div style="position:absolute;inset:0;overflow:hidden;z-index:0;"><div style="position:absolute;inset:0;background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 50%,#0284c7 100%);"></div><div style="position:absolute;bottom:-30%;left:-20%;width:90%;height:90%;background:rgba(14,165,233,0.15);transform:rotate(25deg);border-radius:40%;filter:blur(40px);"></div><div style="position:absolute;top:-20%;right:-20%;width:70%;height:70%;background:rgba(255,204,49,0.08);transform:rotate(-15deg);border-radius:50%;filter:blur(30px);"></div></div>';

  return '<div style="width:100%;max-width:420px;text-align:center;padding:2rem 1.5rem;display:flex;flex-direction:column;align-items:center;justify-content:space-between;height:100%;position:relative;margin:0 auto;">'
    + bg
    + '<div style="position:relative;z-index:2;display:flex;align-items:center;gap:0.4rem;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:999px;padding:0.35rem 0.875rem;">'
    + '<span style="width:6px;height:6px;border-radius:50%;background:#FFCC31;display:inline-block;animation:mlPulse 1.8s infinite;"></span>'
    + '<span style="font-size:0.6rem;font-weight:800;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.12em;">InstruX AI Course</span>'
    + '</div>'
    + '<div style="position:relative;z-index:2;flex-grow:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem 0;">'
    + '<div style="width:3.5rem;height:3.5rem;border-radius:20px;background:rgba(255,204,49,0.15);border:1px solid rgba(255,204,49,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;"><svg width="24" height="24" fill="none" stroke="#FFCC31" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></div>'
    + '<h1 style="font-size:2rem;font-weight:900;color:white;line-height:1.15;letter-spacing:-0.02em;margin-bottom:0.75rem;text-shadow:0 2px 20px rgba(0,0,0,0.4);">' + escHtml(s.courseTitle || 'Your Course') + '</h1>'
    + '<p style="font-size:0.875rem;color:rgba(255,255,255,0.65);line-height:1.55;max-width:280px;">' + escHtml(s.subtitle || '') + '</p>'
    + '<div style="display:flex;gap:1.5rem;margin-top:1.75rem;">'
    + '<div style="text-align:center;"><div style="font-size:1.25rem;font-weight:900;color:#FFCC31;">' + total + '</div><div style="font-size:0.55rem;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Slides</div></div>'
    + '<div style="width:1px;background:rgba(255,255,255,0.1);"></div>'
    + '<div style="text-align:center;"><div style="font-size:1.25rem;font-weight:900;color:#FFCC31;">' + mins + 'm</div><div style="font-size:0.55rem;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Est. Time</div></div>'
    + '<div style="width:1px;background:rgba(255,255,255,0.1);"></div>'
    + '<div style="text-align:center;"><div style="font-size:1.25rem;font-weight:900;color:#FFCC31;">AI</div><div style="font-size:0.55rem;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Designed</div></div>'
    + '</div></div>'
    + '<button onclick="navigate(1)" style="position:relative;z-index:2;width:100%;padding:1.1rem;border-radius:20px;background:#FFCC31;border:none;color:#1e3a8a;font-weight:900;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.08em;cursor:pointer;box-shadow:0 8px 32px rgba(255,204,49,0.4);display:flex;align-items:center;justify-content:center;gap:0.5rem;font-family:inherit;">Start Course <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg></button>'
    + '</div>';
}

function renderContent(s) {
  const textOverlay =
    (s.subtitle ? '<p style="font-size:0.6rem;font-weight:800;color:#FFCC31;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.4rem;">' + escHtml(s.subtitle) + '</p>' : '')
    + '<h2 style="font-size:1.3rem;font-weight:900;color:white;line-height:1.25;margin-bottom:0.6rem;letter-spacing:-0.01em;text-shadow:0 1px 4px rgba(0,0,0,0.4);">' + escHtml(s.heading || '') + '</h2>'
    + '<p style="color:rgba(255,255,255,0.88);font-size:0.875rem;line-height:1.55;text-shadow:0 1px 3px rgba(0,0,0,0.3);">' + escHtml(s.body || '') + '</p>'
    + (s.proTip ? '<div style="background:rgba(255,204,49,0.14);border-left:3px solid #FFCC31;border-radius:0 8px 8px 0;padding:0.6rem 0.875rem;margin-top:0.875rem;"><p style="font-weight:700;font-size:0.78rem;color:#FFCC31;">' + escHtml(s.proTip) + '</p></div>' : '');

  if (s.imageUrl) {
    return '<div style="position:absolute;inset:0;overflow:hidden;background:linear-gradient(135deg,#0f172a,#1e3a8a);">'
      + '<img data-ml-img alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">'
      + '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(10,15,40,0.55) 38%,rgba(10,15,40,0.96) 100%);pointer-events:none;"></div>'
      + '<div style="position:absolute;bottom:0;left:0;right:0;padding:1.5rem 1.5rem 1.75rem;">' + textOverlay + '</div>'
      + '</div>';
  }

  if (s.imageDecision === 'css-pattern') {
    const patterns = [
      { bg: 'radial-gradient(circle at 20% 50%, rgba(255,204,49,0.18) 0%, transparent 55%), radial-gradient(circle at 80% 20%, rgba(14,165,233,0.22) 0%, transparent 55%), linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)', size: '' },
      { bg: 'repeating-linear-gradient(45deg, transparent, transparent 22px, rgba(255,255,255,0.04) 22px, rgba(255,255,255,0.04) 44px), linear-gradient(160deg,#0f172a 0%,#164e63 100%)', size: '' },
      { bg: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)', size: 'background-size:22px 22px,100% 100%;' },
      { bg: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(135deg,#0c1445 0%,#1e3a8a 100%)', size: 'background-size:28px 28px,28px 28px,100% 100%;' },
      { bg: 'repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,204,49,0.07) 12px, rgba(255,204,49,0.07) 24px), linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)', size: '' }
    ];
    const pidx = s.heading ? (s.heading.charCodeAt(0) + (s.heading.charCodeAt(1) || 0)) % patterns.length : currentIndex % patterns.length;
    const p = patterns[pidx];
    return '<div style="position:absolute;inset:0;overflow:hidden;background:' + p.bg + ';' + p.size + '">'
      + '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(10,15,40,0.55) 38%,rgba(10,15,40,0.96) 100%);pointer-events:none;"></div>'
      + '<div style="position:absolute;bottom:0;left:0;right:0;padding:1.5rem 1.5rem 1.75rem;">' + textOverlay + '</div>'
      + '</div>';
  }

  return '<div style="width:100%;max-width:420px;padding:1.5rem;margin:0 auto;display:flex;flex-direction:column;justify-content:center;height:100%;">'
    + (s.subtitle ? '<p style="font-size:0.65rem;font-weight:800;color:#FFCC31;text-transform:uppercase;margin-bottom:0.5rem;">' + escHtml(s.subtitle) + '</p>' : '')
    + '<h2 style="font-size:1.5rem;font-weight:900;color:white;line-height:1.2;margin-bottom:1.25rem;">' + escHtml(s.heading || '') + '</h2>'
    + '<p style="color:rgba(255,255,255,0.8);font-size:1rem;line-height:1.6;">' + escHtml(s.body || '') + '</p>'
    + (s.proTip ? '<div style="background:#FFCC31;border-radius:12px;padding:1rem;color:#1e3a8a;margin-top:1.5rem;"><div style="font-size:0.6rem;font-weight:900;text-transform:uppercase;margin-bottom:0.25rem;opacity:0.6;">Pro-Tip</div><p style="font-weight:700;font-size:0.85rem;">' + escHtml(s.proTip) + '</p></div>' : '')
    + '</div>';
}

function renderObjectives(s) {
  const items = s.items || [];
  return '<div style="width:100%;max-width:420px;padding:1.5rem;margin:0 auto;height:100%;display:flex;flex-direction:column;justify-content:center;">'
    + '<div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#FFCC31;margin-bottom:0.75rem;">Learning Objectives</div>'
    + '<h2 style="font-size:1.5rem;font-weight:900;color:white;line-height:1.15;letter-spacing:-0.02em;margin-bottom:1.5rem;">' + escHtml(s.heading || 'What you will master') + '</h2>'
    + '<div style="display:flex;flex-direction:column;gap:0.875rem;">'
    + items.map((item, i) => '<div style="display:flex;align-items:flex-start;gap:0.875rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:0.875rem;"><div style="flex-shrink:0;width:1.5rem;height:1.5rem;border-radius:50%;background:#FFCC31;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.7rem;color:#1e3a8a;">' + (i+1) + '</div><p style="color:rgba(255,255,255,0.85);font-size:0.85rem;line-height:1.5;padding-top:0.1rem;">' + escHtml(item) + '</p></div>').join('')
    + '</div></div>';
}

function renderModuleTitle(s) {
  return '<div style="width:100%;max-width:420px;padding:1.5rem;margin:0 auto;display:flex;flex-direction:column;justify-content:center;height:100%;text-align:center;">'
    + '<div style="width:36px;height:4px;background:#FFCC31;border-radius:2px;margin:0 auto 1.25rem;"></div>'
    + '<div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#FFCC31;margin-bottom:0.75rem;">Module ' + escHtml(String(s.moduleNum || 1)) + '</div>'
    + '<h2 style="font-size:2rem;font-weight:900;color:white;line-height:1.15;letter-spacing:-0.02em;margin-bottom:1rem;">' + escHtml(s.title || '') + '</h2>'
    + '<p style="font-size:0.9rem;color:rgba(255,255,255,0.5);font-style:italic;line-height:1.7;margin-bottom:2rem;max-width:300px;margin-left:auto;margin-right:auto;">' + escHtml(s.story || '') + '</p>'
    + '<button onclick="navigate(1)" style="display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;background:rgba(255,204,49,0.1);border:1px solid rgba(255,204,49,0.3);color:#FFCC31;font-weight:700;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;padding:0.75rem 1.5rem;border-radius:9999px;cursor:pointer;font-family:inherit;align-self:center;">Begin module <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg></button>'
    + '</div>';
}

function renderVideo(s) {
  return '<div style="width:100%;max-width:420px;padding:1.5rem;text-align:center;margin:0 auto;">'
    + '<div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#FFCC31;margin-bottom:1rem;">Video Lesson</div>'
    + '<h2 style="font-size:1.5rem;font-weight:900;color:white;line-height:1.3;margin-bottom:2rem;">' + escHtml(s.heading || 'Watch and Learn') + '</h2>'
    + '<div style="width:100%;aspect-ratio:16/9;background:rgba(255,255,255,0.05);border:2px dashed rgba(255,255,255,0.15);border-radius:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;margin-bottom:2rem;">'
    + '<div style="width:4rem;height:4rem;border-radius:50%;background:#FFCC31;display:flex;align-items:center;justify-content:center;color:#1e3a8a;font-size:1.5rem;">&#9658;</div>'
    + '<p style="color:rgba(255,255,255,0.4);font-size:0.8rem;font-style:italic;padding:0 1.5rem;">Video Idea: ' + escHtml(s.videoPrompt || '') + '</p>'
    + '</div>'
    + '<div style="background:rgba(255,204,49,0.07);border-left:4px solid #FFCC31;border-radius:0 12px 12px 0;padding:1.25rem 1.5rem;text-align:left;"><p style="color:rgba(255,255,255,0.9);font-size:0.9rem;line-height:1.7;"><strong>Key Takeaway:</strong> ' + escHtml(s.keyTakeaway || '') + '</p></div>'
    + '</div>';
}

function renderQuote(s) {
  return '<div style="width:100%;max-width:420px;height:100%;margin:0 auto;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;">'
    + '<div style="position:absolute;inset:0;background:linear-gradient(135deg,#0f172a,#1e3a8a);">' + (s.imageUrl ? '<img data-ml-img alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">' : '') + '</div>'
    + '<div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(15,23,42,0.7) 0%,rgba(30,58,138,0.85) 100%);"></div>'
    + '<div style="position:relative;z-index:1;padding:2rem;text-align:center;">'
    + '<div style="font-size:4rem;color:#FFCC31;line-height:0.8;margin-bottom:1.25rem;opacity:0.9;">&ldquo;</div>'
    + '<h2 style="font-size:1.4rem;font-weight:800;color:white;line-height:1.5;margin-bottom:1.5rem;font-style:italic;text-shadow:0 2px 12px rgba(0,0,0,0.4);">' + escHtml(s.text || '') + '</h2>'
    + '<div style="width:40px;height:2px;background:#FFCC31;margin:0 auto 1rem;"></div>'
    + '<p style="font-size:0.75rem;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.12em;">' + escHtml(s.attribution || 'Expert Insight') + '</p>'
    + '</div></div>';
}

function renderChecklist(s) {
  const items = s.items || [];
  return '<div style="width:100%;max-width:420px;padding:1.5rem;margin:0 auto;">'
    + '<div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#FFCC31;margin-bottom:0.875rem;">Practical Application</div>'
    + '<h2 style="font-size:1.75rem;font-weight:900;color:white;line-height:1.2;margin-bottom:1.5rem;">' + escHtml(s.heading || 'Implementation Steps') + '</h2>'
    + '<div style="display:flex;flex-direction:column;gap:1rem;">'
    + items.map(item => '<div style="display:flex;align-items:center;gap:1rem;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:1.125rem;"><div style="flex-shrink:0;width:1.5rem;height:1.5rem;border-radius:6px;border:2px solid #FFCC31;display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" fill="none" stroke="#FFCC31" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/></svg></div><p style="color:rgba(255,255,255,0.9);font-size:0.9rem;font-weight:600;">' + escHtml(item) + '</p></div>').join('')
    + '</div></div>';
}

function renderFlipCards(s) {
  const cards = (s.cards || []).slice(0, 3);
  return '<div style="width:100%;max-width:420px;padding:0.75rem 1rem;margin:0 auto;height:100%;display:flex;flex-direction:column;justify-content:center;">'
    + '<div style="margin-bottom:1rem;text-align:center;"><div style="font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#FFCC31;margin-bottom:0.25rem;">Flip to explore</div>'
    + '<h2 style="font-size:1.25rem;font-weight:900;color:white;line-height:1.15;margin:0;">' + escHtml(s.heading || 'Consolidate your learning') + '</h2></div>'
    + '<div style="display:flex;flex-direction:column;gap:0.5rem;">'
    + cards.map(c => '<div class="ml-flip-card" onclick="flipCard(this)" style="cursor:pointer;height:90px;width:100%;"><div class="ml-flip-inner" style="position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);"><div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#FFCC31;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.5rem 1rem;text-align:center;"><p style="font-weight:800;font-size:0.8rem;color:#1e3a8a;line-height:1.2;margin:0 0 0.25rem 0;">' + escHtml(c.front) + '</p><div style="font-size:0.5rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(30,58,138,0.45);">&#8635; tap to flip</div></div><div style="position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:rotateY(180deg);background:#1e3a8a;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:0.5rem 1rem;text-align:center;border:1px solid rgba(255,204,49,0.25);"><p style="color:white;font-size:0.75rem;line-height:1.2;font-weight:500;margin:0;">' + escHtml(c.back) + '</p></div></div></div>').join('')
    + '</div></div>';
}

function renderQuiz(s) {
  const opts = s.options || [];
  const correctJSON = JSON.stringify(s.correctIndices || [0]).replace(/"/g, '&quot;');
  const feedback = s.feedback || { correct: 'Great job!', incorrect: 'Not quite — try again next time.' };
  return '<div data-quiz-container style="width:100%;max-width:420px;padding:0.75rem 1rem;margin:0 auto;display:flex;flex-direction:column;justify-content:center;height:100%;">'
    + '<div style="margin-bottom:1rem;"><div style="font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#FFCC31;margin-bottom:0.25rem;">Challenge ' + escHtml(String(s.challengeNum || 1)) + '</div>'
    + (s.scenario ? '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:0.5rem;margin-bottom:0.5rem;color:rgba(255,255,255,0.6);font-size:0.75rem;font-style:italic;line-height:1.2;">&ldquo;' + escHtml(s.scenario) + '&rdquo;</div>' : '')
    + '<h2 style="font-size:1.1rem;font-weight:900;color:white;line-height:1.2;margin:0;">' + escHtml(s.question || '') + '</h2></div>'
    + '<div data-quiz-options data-correct="' + correctJSON + '" data-feedback-correct="' + escHtml(feedback.correct) + '" data-feedback-incorrect="' + escHtml(feedback.incorrect) + '" style="display:flex;flex-direction:column;gap:0.4rem;margin-bottom:1rem;">'
    + opts.map((opt, i) => '<button data-quiz-opt="' + i + '" onclick="selectOption(this)" style="width:100%;text-align:left;padding:0.5rem 0.75rem;border-radius:10px;border:2px solid rgba(255,255,255,0.08);background:white;color:#1e3a8a;font-size:0.8rem;font-weight:700;cursor:pointer;transition:all 0.18s;display:flex;align-items:center;gap:0.5rem;font-family:inherit;"><span style="flex-shrink:0;width:1rem;height:1rem;border-radius:50%;border:2px solid rgba(30,58,138,0.15);display:flex;align-items:center;justify-content:center;font-size:0.55rem;font-weight:900;color:#1e3a8a;">' + String.fromCharCode(65+i) + '</span>' + escHtml(opt) + '</button>').join('')
    + '</div>'
    + '<div data-quiz-explanation style="display:none;border-radius:10px;padding:0.75rem;margin-bottom:0.75rem;animation:fadeIn 0.4s ease-out;">'
    + '<div id="quiz-status-pill" style="display:inline-block;padding:0.2rem 0.5rem;border-radius:999px;font-size:0.55rem;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem;"></div>'
    + '<p id="quiz-feedback-text" style="color:white;font-size:0.75rem;line-height:1.4;font-weight:500;margin:0;"></p>'
    + '</div>'
    + '<button data-quiz-submit onclick="submitQuiz()" style="width:100%;padding:0.75rem;border-radius:12px;background:#FFCC31;border:none;color:#1e3a8a;font-weight:900;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;opacity:0.4;transition:all 0.2s;margin-top:0.5rem;font-family:inherit;">Submit</button>'
    + '</div>';
}

function renderSummary(s) {
  const takeaways = s.takeaways || [];
  const total = SLIDES.length;
  const mins = Math.max(3, Math.round(total * 0.8));
  const pct = quizTotal > 0 ? Math.round(quizCorrect / quizTotal * 100) : null;
  const scoreColor = pct === null ? '#22c55e' : pct >= 70 ? '#22c55e' : pct >= 40 ? '#FFCC31' : '#ef4444';
  return '<div style="width:100%;max-width:420px;padding:1.5rem 1.25rem;margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:space-between;height:100%;text-align:center;position:relative;">'
    + '<div style="position:absolute;top:-10%;left:50%;transform:translateX(-50%);width:200px;height:200px;background:radial-gradient(circle,rgba(255,204,49,0.15) 0%,transparent 70%);pointer-events:none;"></div>'
    + '<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:0.5rem;">'
    + '<div style="width:4.5rem;height:4.5rem;border-radius:50%;background:linear-gradient(135deg,#FFCC31,#f59e0b);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 8px rgba(255,204,49,0.12),0 0 0 16px rgba(255,204,49,0.05);"><svg width="28" height="28" fill="none" stroke="#1e3a8a" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg></div>'
    + '<div style="font-size:0.55rem;font-weight:800;text-transform:uppercase;letter-spacing:0.15em;color:#FFCC31;">Course Complete</div>'
    + '<h1 style="font-size:1.6rem;font-weight:900;color:white;line-height:1.1;letter-spacing:-0.02em;margin:0;">' + escHtml(s.heading || 'You did it!') + '</h1>'
    + (s.subheading ? '<p style="color:rgba(255,255,255,0.5);font-size:0.8rem;line-height:1.5;max-width:260px;">' + escHtml(s.subheading) + '</p>' : '')
    + '</div>'
    + '<div style="position:relative;z-index:1;display:flex;gap:0;width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">'
    + '<div style="flex:1;padding:0.875rem 0;text-align:center;border-right:1px solid rgba(255,255,255,0.08);"><div style="font-size:1.25rem;font-weight:900;color:#FFCC31;">' + total + '</div><div style="font-size:0.55rem;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;">Slides</div></div>'
    + '<div style="flex:1;padding:0.875rem 0;text-align:center;border-right:1px solid rgba(255,255,255,0.08);"><div style="font-size:1.25rem;font-weight:900;color:#FFCC31;">' + mins + 'm</div><div style="font-size:0.55rem;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;">Time</div></div>'
    + '<div style="flex:1;padding:0.875rem 0;text-align:center;"><div style="font-size:1.25rem;font-weight:900;color:' + scoreColor + ';">' + (pct !== null ? pct + '%' : '100%') + '</div><div style="font-size:0.55rem;font-weight:700;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.1em;">' + (pct !== null ? 'Quiz Score' : 'Done') + '</div></div>'
    + '</div>'
    + (takeaways.length ? '<div style="position:relative;z-index:1;width:100%;text-align:left;"><div style="font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:rgba(255,255,255,0.35);margin-bottom:0.75rem;">Key Takeaways</div><div style="display:flex;flex-direction:column;gap:0.4rem;">' + takeaways.map(t => '<div style="display:flex;align-items:flex-start;gap:0.625rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:0.625rem 0.75rem;"><div style="flex-shrink:0;width:1.1rem;height:1.1rem;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;margin-top:0.1rem;"><svg width="7" height="7" fill="none" stroke="white" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7"/></svg></div><p style="color:rgba(255,255,255,0.75);font-size:0.75rem;line-height:1.4;margin:0;">' + escHtml(t) + '</p></div>').join('') + '</div></div>' : '')
    + '<div style="position:relative;z-index:1;width:100%;display:flex;flex-direction:column;gap:0.5rem;">'
    + '<button onclick="jumpTo(0)" style="width:100%;padding:0.875rem;border-radius:14px;background:#FFCC31;border:none;color:#1e3a8a;font-weight:900;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.08em;cursor:pointer;font-family:inherit;">&#8635; Replay Course</button>'
    + '<div style="text-align:center;padding:0.5rem 0;"><span style="font-size:0.6rem;font-weight:700;color:rgba(255,255,255,0.2);letter-spacing:0.08em;text-transform:uppercase;">Powered by InstruX.io</span></div>'
    + '</div></div>';
}

// ─── Interactions ─────────────────────────────────────────────────────────────
function flipCard(el) {
  el.classList.toggle('ml-flipped');
}

function selectOption(btn) {
  const optsContainer = btn.closest('[data-quiz-options]');
  if (!optsContainer || optsContainer.dataset.submitted) return;
  optsContainer.querySelectorAll('[data-quiz-opt]').forEach(b => {
    b.style.background = 'white'; b.style.borderColor = 'rgba(30,58,138,0.15)'; b.style.color = '#1e3a8a'; b.style.fontWeight = '600';
  });
  btn.style.background = '#FFCC31'; btn.style.borderColor = '#FFCC31'; btn.style.color = '#1e3a8a'; btn.style.fontWeight = '800';
  optsContainer.dataset.selected = btn.dataset.quizOpt;
  const submitBtn = btn.closest('[data-quiz-container]')?.querySelector('[data-quiz-submit]');
  if (submitBtn) submitBtn.style.opacity = '1';
}

function submitQuiz() {
  const container = document.querySelector('[data-quiz-container]');
  if (!container) return;
  const optsContainer = container.querySelector('[data-quiz-options]');
  if (!optsContainer || optsContainer.dataset.submitted) return;
  optsContainer.dataset.submitted = '1';
  const selected = parseInt(optsContainer.dataset.selected ?? '-1');
  let correctIndices = [];
  try { correctIndices = JSON.parse(optsContainer.dataset.correct || '[]'); } catch(e) {}
  const isCorrect = selected >= 0 && correctIndices.includes(selected);
  if (selected >= 0) { quizTotal++; if (isCorrect) quizCorrect++; }

  optsContainer.querySelectorAll('[data-quiz-opt]').forEach(btn => {
    const idx = parseInt(btn.dataset.quizOpt);
    if (correctIndices.includes(idx)) {
      btn.style.background = '#22c55e'; btn.style.borderColor = '#22c55e'; btn.style.color = 'white';
    } else if (idx === selected) {
      btn.style.background = '#ef4444'; btn.style.borderColor = '#ef4444'; btn.style.color = 'white';
    } else {
      btn.style.opacity = '0.35';
    }
  });

  // Show feedback
  const exp = container.querySelector('[data-quiz-explanation]');
  if (exp) {
    exp.style.display = 'block';
    exp.style.background = isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
    const pill = document.getElementById('quiz-status-pill');
    const text = document.getElementById('quiz-feedback-text');
    if (pill) { pill.textContent = isCorrect ? 'Correct!' : 'Incorrect'; pill.style.background = isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'; pill.style.color = isCorrect ? '#22c55e' : '#ef4444'; }
    if (text) text.textContent = isCorrect ? optsContainer.dataset.feedbackCorrect : optsContainer.dataset.feedbackIncorrect;
  }

  const submitBtn = container.querySelector('[data-quiz-submit]');
  if (submitBtn) {
    submitBtn.textContent = currentIndex < SLIDES.length - 1 ? 'Continue \u2192' : 'Finish';
    submitBtn.onclick = () => navigate(1);
  }
}

// Cover image injection (cover uses a different slot)
function injectCoverImage() {
  const slide = SLIDES[currentIndex];
  if (slide && slide.type === 'cover' && slide.imageUrl) {
    const el = document.querySelector('[data-cover-img]');
    if (el) el.style.backgroundImage = "url('" + slide.imageUrl + "')";
  }
}

// Keyboard navigation
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') navigate(-1);
});

// Touch swipe
let touchX = 0;
document.getElementById('stage').addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
document.getElementById('stage').addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) navigate(dx < 0 ? 1 : -1);
}, { passive: true });

// Boot
render();
</script>
</body>
</html>`;
}
