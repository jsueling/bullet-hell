import './styles.css'

// ctx.globalAlpha = value;

/**
 * use circle projectiles and hitboxes to simplify collision detection and improve performance
 * x distance between any 2 projectiles must be large enough at some point for the ship to pass
 */

const mouse = { x: 0, y: 0 }
let canvas
let ctx
let secondsPassed
let oldTimeStamp = 0
const turretNumber = 5
const turrets = []
const projectiles = []

class Projectile {
  constructor(x, y, velX, velY) {
    this.x = x
    this.y = y
    this.velX = velX
    this.velY = velY
    this.radius = 5
  }

  draw() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.fillStyle = 'green'
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  }

  update() {
    this.x += this.velX
    this.y += this.velY
  }
}

class Turret {
  constructor() {
    this.radius = 20
    this.x = this.radius + Math.random() * (canvas.width - 2 * this.radius) // min: this.radius, max: canvas.width - this.radius
    this.y = 0
    this.velX = 0
    this.velY = Math.random() * 1.5 + 0.5 // 0.5-2.5 speed down
  }

  draw() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.fillStyle = 'red'
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  }

  update() {
    this.y += this.velY
    if (this.y > canvas.height) { // OOB reset
      this.x = Math.random() * canvas.width
      this.y = 0
      this.velY = Math.random() * 1.5 + 0.5
    }
  }

  fire() {
    const numProjectiles = Math.random() * 5 + 5 // 5 to 10 random number of projectiles spawned
    for (let i=0; i < numProjectiles; i++) {
			const slice = 2 * Math.PI / numProjectiles;
			const angle = slice * i;
      projectiles.push(new Projectile(this.x, this.y, Math.sin(angle), Math.cos(angle)))
    }
  }
}

window.addEventListener('onload', init())

function init() {
  canvas = document.getElementById('canvas1')
  ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  mouse.x = canvas.width/2
  mouse.y = canvas.width/2

  for (let i=0; i < turretNumber; i++) {
    turrets.push(new Turret())
  }

  window.requestAnimationFrame(animate)
}

window.addEventListener('resize', function() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  window.requestAnimationFrame(animate)
})

window.addEventListener('mousemove', function(e) {
  mouse.x = e.x
  mouse.y = e.y
})

function animate(timeStamp) {
  secondsPassed = (timeStamp - oldTimeStamp) / 1000; // seconds passed since last frame
  
  draw()

  turrets.forEach((turret) => { // update and render turrets
    turret.update()
    turret.draw()
  })

  if (secondsPassed > 5) { // create projectiles every 5 seconds
    turrets.forEach((t) => t.fire())
    oldTimeStamp = timeStamp
  }

  projectiles.forEach((projectile) => { // update and render projectiles
    projectile.update()
    projectile.draw()
  })

  window.requestAnimationFrame(animate)
}

function draw() {
  ctx.save()
  // ctx.fillStyle = 'rgba(0,0,0,0.3)' // cheap trail effect
  // ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.restore()

  ctx.save()
  ctx.fillStyle = 'blue'
  ctx.beginPath()
  ctx.arc(mouse.x, mouse.y, 20, 0, 2 * Math.PI)
  ctx.fill()
  ctx.restore()
}