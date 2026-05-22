
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
document.querySelectorAll('button, a, .proj-card, .skill-card, .info-card, .portrait-frame').forEach(el => {
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

// Portrait 3D Tilt
const portrait = document.getElementById('portrait')
if (portrait) {
  portrait.addEventListener('mousemove', e => {
    const r = portrait.getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2
    const dx = (e.clientX - cx) / r.width * 20
    const dy = (e.clientY - cy) / r.height * 20
    portrait.style.transform = `perspective(800px) rotateX(${-dy}deg) rotateY(${dx}deg)`
  })
  portrait.addEventListener('mouseleave', () => { portrait.style.transform = '' })
}

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


