import './styles.css'

// ctx.globalAlpha = value;

/**
 * use circle projectiles and hitboxes to simplify collision detection and improve performance
 * x distance between any 2 projectiles must be large enough at some point for the ship to pass
 */

const mouse = { x: 0, y: 0 }
let canvas
let ctx
let animation
let resizeTimer
let secondsPassed
let oldTimeStamp = 0
const turretNumber = 5
let turrets = []
let projectiles = []

class Projectile {
  constructor(x, y, velX, velY) {
    this.x = x
    this.y = y
    this.velX = velX * (canvas.height + canvas.width) * 0.001 // add magnitude to the normalized vectors depending on canvas height and width
    this.velY = velY * (canvas.height + canvas.width) * 0.001
    this.radius = canvas.height * 0.005
  }

  draw() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.fillStyle = 'white'
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
    this.radius = canvas.height * 0.005
    this.x = this.radius + Math.random() * (canvas.width - 2 * this.radius) // min: this.radius, max: canvas.width - this.radius
    this.y = 0
    this.velX = 0
    this.velY = canvas.height * (Math.random() * 0.001 + 0.001) // velocity varying between 0.1 to 0.2 % of canvas height
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
      this.velY = canvas.height * (Math.random() * 0.001 + 0.001)
    }
  }

  fire() {
    const numProjectiles = Math.floor(Math.random() * 20) + 1 // random number of projectiles spawned for each turret, 10 to 20
    for (let i=0; i < numProjectiles; i++) {
			const slice = 2 * Math.PI / numProjectiles;
			const angle = slice * i;
      // each projectile normalized vector equally spaced around circle
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

  animate()
}

window.addEventListener('resize', function() {
  // cancel animation on resize and clear the canvas, then debounce restarting the animation
  cancelAnimationFrame(animation)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(function() {
    reset()
    init()
  }, 200)
})

function reset() {
  turrets = []
  projectiles = []
}

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

  if (secondsPassed > 5) { // create/fire projectiles every 5 seconds
    turrets.forEach((turret) => {
      turret.fire()
    })
    oldTimeStamp = timeStamp
  }

  projectiles.forEach((projectile) => { // update and render projectiles
    projectile.update()
    projectile.draw()
  })

  animation = window.requestAnimationFrame(animate)
}

function draw() {
  ctx.save()
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.1)' // cheap trail effect
  // ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.restore()

  ctx.save()
  ctx.fillStyle = 'blue'
  ctx.beginPath()
  ctx.arc(mouse.x, mouse.y, canvas.height * 0.02, 0, 2 * Math.PI)
  ctx.fill()
  ctx.restore()
}