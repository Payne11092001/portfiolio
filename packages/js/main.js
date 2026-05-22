
// Loader
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('hide'), 1200)
})

// Custom Cursor
const cur = document.getElementById('cursor')
const ring = document.getElementById('cursor-ring')
let mx = 0, my = 0, rx = 0, ry = 0
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY
  cur.style.left = mx + 'px'; cur.style.top = my + 'px'
})
function animCursor() {
  rx += (mx - rx) * .12; ry += (my - ry) * .12
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px'
  requestAnimationFrame(animCursor)
}
animCursor()
document.querySelectorAll('button, a, .proj-card, .skill-card, .info-card, #water-canvas').forEach(el => {
  el.addEventListener('mouseenter', () => { cur.style.width = '20px'; cur.style.height = '20px'; ring.style.width = '52px'; ring.style.height = '52px' })
  el.addEventListener('mouseleave', () => { cur.style.width = '12px'; cur.style.height = '12px'; ring.style.width = '36px'; ring.style.height = '36px' })
})

// Particle System
const canvas = document.getElementById('particles')
const ctx = canvas.getContext('2d')
let W, H
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
resize(); window.addEventListener('resize', resize)
const particles = []
class Particle {
  constructor() { this.reset() }
  reset() {
    this.x = Math.random() * W; this.y = Math.random() * H
    this.vx = (Math.random() - .5) * .3; this.vy = (Math.random() - .5) * .3
    this.r = Math.random() * 1.5 + .5
    this.alpha = Math.random() * .4 + .1
    this.color = Math.random() > .5 ? '0,212,255' : '168,85,247'
  }
  update() {
    this.x += this.vx; this.y += this.vy
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset()
  }
  draw() {
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${this.color},${this.alpha})`; ctx.fill()
  }
}
for (let i = 0; i < 120; i++) particles.push(new Particle())
function animP() {
  ctx.clearRect(0, 0, W, H)
  particles.forEach(p => { p.update(); p.draw() })
  particles.forEach((a, i) => {
    particles.slice(i + 1).forEach(b => {
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d < 100) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = `rgba(0,212,255,${.06 * (1 - d / 100)})`
        ctx.lineWidth = .5; ctx.stroke()
      }
    })
  })
  requestAnimationFrame(animP)
}
animP()

// Typing Effect
const roles = ['IT Specialist', 'Graphic Designer', 'Technical Support', 'Website Developer']
let ri = 0, ci = 0, deleting = false
function type() {
  const el = document.getElementById('typing'), r = roles[ri]
  if (!deleting) {
    el.textContent = r.slice(0, ++ci)
    if (ci === r.length) { deleting = true; setTimeout(type, 1800); return }
  } else {
    el.textContent = r.slice(0, --ci)
    if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length }
  }
  setTimeout(type, deleting ? 60 : 100)
}
type()

// Scroll Reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
}, { threshold: .15 })
document.querySelectorAll('.reveal, .skill-card, .proj-card, .tl-item, .exp-item').forEach(el => obs.observe(el))

// Skill Bars
const skillObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const pct = e.target.dataset.pct
      if (pct) e.target.querySelector('.skill-fill').style.width = pct + '%'
    }
  })
}, { threshold: .3 })
document.querySelectorAll('.skill-card').forEach(el => skillObs.observe(el))

// Stat Counters
const statObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      document.querySelectorAll('[data-count]').forEach(el => {
        const target = +el.dataset.count, dur = 1500, start = Date.now()
        function count() {
          const p = (Date.now() - start) / dur
          const val = Math.min(Math.round(p * target), target)
          el.textContent = val + (target === 100 ? '%' : '+')
          if (p < 1) requestAnimationFrame(count)
        }
        count()
      })
      statObs.disconnect()
    }
  })
}, { threshold: .5 })
const strip = document.querySelector('.stats-strip')
if (strip) statObs.observe(strip)

// ══════════════════════════════════════════════════════════════
// WEBGL WATER RIPPLE EFFECT — Casual → Formal photo transition
// ══════════════════════════════════════════════════════════════
(function initWaterEffect() {
  const canvas = document.getElementById('water-canvas')
  if (!canvas) return
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

  // If WebGL unavailable, fall back to CSS crossfade
  if (!gl) {
    console.warn('WebGL not available — using CSS fallback')
    return
  }

  const W = canvas.width, H = canvas.height

  // ── Shaders ──────────────────────────────────────────────
  const vsSource = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main(){
      v_uv = a_pos * .5 + .5;
      v_uv.y = 1.0 - v_uv.y;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `
  // Water displacement fragment shader
  // Samples both textures, displaces UVs by a ripple field,
  // blends based on the "progress" uniform (0 = casual, 1 = formal)
  const fsSource = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_tex0;   // casual
    uniform sampler2D u_tex1;   // formal
    uniform float u_progress;   // 0..1
    uniform float u_time;
    uniform vec2  u_mouse;      // 0..1 normalised mouse position
    uniform float u_hover;      // 0..1 hover strength

    // Simplex-style hash
    float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){
      vec2 i=floor(p), f=fract(p);
      f=f*f*(3.0-2.0*f);
      float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
      return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
    }

    void main(){
      // Ripple field from mouse position
      vec2 toMouse = v_uv - u_mouse;
      float dist = length(toMouse);

      // Expanding ring ripple on hover
      float ring = u_hover * sin(dist * 18.0 - u_time * 6.0) * exp(-dist * 4.0) * 0.035;
      // Turbulent water noise
      float turb  = (noise(v_uv * 6.0 + u_time * 0.4) - .5) * u_progress * 0.06;
      float turb2 = (noise(v_uv * 12.0 - u_time * 0.3) - .5) * u_progress * 0.03;

      vec2 disp = toMouse / (dist + 0.001) * ring + vec2(turb + turb2);

      // Sample both textures with distorted UVs
      vec4 col0 = texture2D(u_tex0, v_uv + disp * (1.0 - u_progress));
      vec4 col1 = texture2D(u_tex1, v_uv - disp * u_progress);

      // Blend with a soft wave wipe driven by progress
      float wave = u_progress + sin(v_uv.y * 8.0 - u_time * 3.0) * 0.08 * u_progress * (1.0 - u_progress);
      float mask = smoothstep(wave - 0.1, wave + 0.1, v_uv.x);

      gl_FragColor = mix(col0, col1, mask);

      // Add subtle neon edge glow
      float edge = smoothstep(.48,.5,abs(mask-.5)) * 0.15 * u_progress * (1.0-u_progress);
      gl_FragColor.rgb += vec3(0.0, 0.83, 1.0) * edge;
    }
  `

  function makeShader(type, src) {
    const s = gl.createShader(type)
    gl.shaderSource(s, src); gl.compileShader(s)
    return s
  }
  const prog = gl.createProgram()
  gl.attachShader(prog, makeShader(gl.VERTEX_SHADER, vsSource))
  gl.attachShader(prog, makeShader(gl.FRAGMENT_SHADER, fsSource))
  gl.linkProgram(prog); gl.useProgram(prog)

  // Full-screen quad
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(prog, 'a_pos')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

  // Uniform locations
  const uProg  = gl.getUniformLocation(prog, 'u_progress')
  const uTime  = gl.getUniformLocation(prog, 'u_time')
  const uMouse = gl.getUniformLocation(prog, 'u_mouse')
  const uHover = gl.getUniformLocation(prog, 'u_hover')
  gl.uniform1i(gl.getUniformLocation(prog, 'u_tex0'), 0)
  gl.uniform1i(gl.getUniformLocation(prog, 'u_tex1'), 1)

  // ── Texture loader ────────────────────────────────────────
  function makeTexture(unit, img) {
    const tex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    } catch(e) {
      // CORS / same-origin fallback: create a solid colour placeholder
      const placeholder = new Uint8Array(4 * W * H)
      const isForward = unit === 1
      for (let i = 0; i < W * H; i++) {
        placeholder[i*4]   = isForward ? 168 : 0
        placeholder[i*4+1] = isForward ? 85  : 212
        placeholder[i*4+2] = isForward ? 247 : 255
        placeholder[i*4+3] = 255
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, placeholder)
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return tex
  }

  // Load both images; use placeholder canvas if src fails
  function loadImage(id, fallbackColor) {
    return new Promise(resolve => {
      const el = document.getElementById(id)
      if (!el) { resolve(makePlaceholder(fallbackColor)); return }
      if (el.complete && el.naturalWidth) { resolve(el); return }
      el.onload = () => resolve(el)
      el.onerror = () => resolve(makePlaceholder(fallbackColor))
    })
  }

  function makePlaceholder(color) {
    // Creates a small canvas as placeholder when real photos aren't present
    const pc = document.createElement('canvas')
    pc.width = W; pc.height = H
    const pctx = pc.getContext('2d')
    // Gradient background
    const g = pctx.createLinearGradient(0, 0, W, H)
    g.addColorStop(0, color[0]); g.addColorStop(1, color[1])
    pctx.fillStyle = g; pctx.fillRect(0, 0, W, H)
    // Silhouette placeholder text
    pctx.fillStyle = 'rgba(255,255,255,0.15)'
    pctx.font = 'bold 80px sans-serif'
    pctx.textAlign = 'center'; pctx.textBaseline = 'middle'
    pctx.fillText(color[2], W/2, H/2 - 30)
    pctx.font = '14px sans-serif'
    pctx.fillStyle = 'rgba(255,255,255,0.4)'
    pctx.fillText(color[3], W/2, H/2 + 50)
    pctx.fillText('(add ' + id.replace('img-','') + '.jpg)', W/2, H/2 + 75)
    return pc
  }

  // ── State ─────────────────────────────────────────────────
  let progress = 0      // 0 = casual, 1 = formal
  let target   = 0
  let hover    = 0
  let hoverTgt = 0
  let mouse    = [0.5, 0.5]
  let startTime = null

  // ── Mouse events ──────────────────────────────────────────
  canvas.addEventListener('mouseenter', e => { hoverTgt = 1; target = 1 })
  canvas.addEventListener('mouseleave', e => { hoverTgt = 0; target = 0 })
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect()
    mouse = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]
  })

  // Touch support
  canvas.addEventListener('touchstart', () => { hoverTgt = 1; target = 1 }, {passive:true})
  canvas.addEventListener('touchend',   () => { hoverTgt = 0; target = 0 }, {passive:true})

  // Badge label update
  const badge = document.getElementById('portrait-badge')

  // ── Render loop ───────────────────────────────────────────
  function render(ts) {
    if (!startTime) startTime = ts
    const t = (ts - startTime) * 0.001

    // Smooth lerp
    progress += (target   - progress) * 0.04
    hover    += (hoverTgt - hover)    * 0.06

    // Badge text
    if (badge) {
      badge.textContent = progress > 0.5 ? 'Formal Mode' : 'Casual Mode'
      badge.style.opacity = Math.abs(progress - 0.5) < 0.1 ? '0' : '1'
    }

    gl.uniform1f(uProg,  progress)
    gl.uniform1f(uTime,  t)
    gl.uniform2f(uMouse, mouse[0], mouse[1])
    gl.uniform1f(uHover, hover)

    gl.viewport(0, 0, W, H)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }

  // ── Boot ──────────────────────────────────────────────────
  Promise.all([
    loadImage('img-casual', ['#050d1a','#0a1830','👔','Casual Attire']),
    loadImage('img-formal', ['#1a0533','#2d0a52','🎩','Formal Attire'])
  ]).then(([casual, formal]) => {
    makeTexture(0, casual)
    makeTexture(1, formal)
    requestAnimationFrame(render)
  })
})()
// ── end water effect ──────────────────────────────────────────

// Contact Form
function sendMsg() {
  const n = document.getElementById('f-name').value
  const m = document.getElementById('f-msg').value
  const st = document.getElementById('form-status')
  if (!n || !m) {
    st.style.opacity = '1'; st.style.color = '#f87171'
    st.textContent = '⚠ Please fill in all required fields.'
    return
  }
  st.style.opacity = '1'; st.style.color = 'var(--neon)'
  st.textContent = '✦ Message sent! I\'ll get back to you soon.'
  setTimeout(() => { st.style.opacity = '0' }, 4000)
  document.querySelectorAll('#contact input, #contact textarea').forEach(el => el.value = '')
  /*
    TO ENABLE REAL EMAIL: 
    Option 1 – EmailJS (client-side, no backend needed):
      emailjs.send('SERVICE_ID', 'TEMPLATE_ID', { name: n, message: m, reply_to: email })
    Option 2 – PHP Mailer backend:
      fetch('send-mail.php', { method:'POST', body: new FormData(form) })
  */
}

// Dark / Light Toggle
let darkMode = true
document.getElementById('modeBtn').addEventListener('click', function () {
  darkMode = !darkMode
  this.textContent = darkMode ? '🌙' : '☀️'
  const r = document.documentElement.style
  r.setProperty('--dark',         darkMode ? '#050810' : '#f8fafc')
  r.setProperty('--dark2',        darkMode ? '#0a0f1e' : '#f1f5f9')
  r.setProperty('--dark3',        darkMode ? '#0d1525' : '#e2e8f0')
  r.setProperty('--text',         darkMode ? '#e2e8f0' : '#0f172a')
  r.setProperty('--muted',        darkMode ? '#94a3b8' : '#475569')
  r.setProperty('--glass',        darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')
  r.setProperty('--glass-border', darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)')
})

// Active Nav Highlight
window.addEventListener('scroll', () => {
  ['about', 'skills', 'projects', 'experience', 'contact'].forEach(id => {
    const el = document.getElementById(id)
    const link = document.querySelector(`a[href="#${id}"]`)
    if (!el || !link) return
    const r = el.getBoundingClientRect()
    link.style.color = (r.top < 200 && r.bottom > 0) ? 'var(--neon)' : ''
  })
})
