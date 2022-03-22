import './styles.css'

// using circular Projectile and CursorObject hitboxes to simplify collision detection and improve performance

let canvas
let ctx
let animationID
let resizeTimerID
let elapsedMs
let oldTimeStamp = 0

const gameSettings = {
  totalTime: 0, // window loses focus but score ticks up https://developer.mozilla.org/en-US/docs/Web/API/Window/focus_event
  radialTurretNumber: 5, // increase turret number/maxProjectile number with duration/score
  aimedTurretNumber: 1,
  numRadialProjectiles: 10,
  numAimedProjectiles: 10,
  // fireInterval: 5000, // TODO
  reset() {
    this.aimedTurretNumber = 1
    this.radialTurretNumber = 5
    this.numRadialProjectiles = 10,
    this.numAimedProjectiles = 10,
    this.totalTime = 0
  }
}

const gameObjects = {
  radialTurrets: [],
  radialProjectiles: [],
  aimedTurrets: [],
  aimedProjectiles: [],
  reset() {
    this.radialTurrets = []
    this.radialProjectiles = []
    this.aimedTurrets = []
    this.aimedProjectiles = []
  }
}

// const gameTimers = {} // TODO

const cursorObject = {
  x: 0,
  y: 0,
  radius: 0,
  init() {
    this.radius = canvas.height * 0.01
  },
  draw() {
    ctx.save()
    ctx.fillStyle = 'blue'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  },
  collidesWith(projectile) { // returns boolean based on whether cursorObject circle collision with object
    const dx = projectile.x - this.x
    const dy = projectile.y - this.y
    if (dx**2 + dy**2 < (this.radius + projectile.radius)**2) {
      return true
    }
    return false
  }
}

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
    ctx.fillStyle = this.colour
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

class RadialProjectile extends Projectile {
  constructor(x, y, velX, velY) {
    super(x, y, velX, velY)
    this.colour = 'green'
  }
}

class AimedProjectile extends Projectile {
  constructor(x, y, velX, velY) {
    super(x, y, velX, velY)
    this.colour = 'orange'
  }
}

class Turret {
  constructor() {
    this.velX = 0
    this.fireTimeoutID = undefined
  }

  draw() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.fillStyle = this.colour
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()
  }

  update() {
    this.y += this.velY

    if (this.y > canvas.height + this.radius) { // OOB reset turret to top of screen
      this.x = Math.random() * canvas.width
      this.y = this.radius
      this.velY = this.randomYVelocity
    }
  }
}

class RadialTurret extends Turret {
  constructor() {
    super()
    this.colour = 'red'
    this.radius = canvas.height * 0.005
    this.x = this.radius + Math.random() * (canvas.width - 2 * this.radius) // always starts with its full diameter inside the viewport
    this.y = 0 // could spawn randomly distributed above y = 0
    this.velY = canvas.height * (Math.random() * 0.001 + 0.001) // velocity varying between 0.1 to 0.2 % of canvas height
    this.randomYVelocity = this.velY
  }

  #fireRadial() {
    for (let i=0; i < gameSettings.numRadialProjectiles; i++) {
      const slice = 2 * Math.PI / gameSettings.numRadialProjectiles;
      const angle = slice * i;
      // each radial projectile gets normalized vector equally spaced around unit circle
      gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.sin(angle), Math.cos(angle)))
    }
  }

  fireRadialOnce() { // debounce calling turret.fireRadial() binding current Turret instance as the context
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireRadial.bind(this), 100)
  }
}

class AimedTurret extends Turret {
  constructor() {
    super()
    this.colour = 'yellow'
    this.radius = canvas.height * 0.01
    this.x = this.radius + Math.random() * (canvas.width - 2 * this.radius)
    this.y = 0
    this.velY = canvas.height * (Math.random() * 0.0005 + 0.0005) // velocity varying between 0.05 to 0.1 % of canvas height
    this.randomYVelocity = this.velY
  }

  shootBarrage() {
    const dist = Math.sqrt((this.x - cursorObject.x)**2 + (this.y - cursorObject.y)**2)
    const velX = (cursorObject.x - this.x) / dist
    const velY = (cursorObject.y - this.y) / dist
    gameObjects.aimedProjectiles.push(new AimedProjectile(this.x, this.y, velX, velY))
  }

  #fireAimed() {
    for (let i=0; i < gameSettings.numAimedProjectiles; i++) {

      // TODO increase magnitude of vector with difficulty

      setTimeout(this.shootBarrage.bind(this), i * 100)
    }
  }

  fireAimedOnce() {
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireAimed.bind(this), 100)
  }
}

window.onload = init

window.addEventListener('resize', function() {
  // cancel animation on resize and clear the canvas, then debounce restarting the animation
  endGame()
  clearTimeout(resizeTimerID)
  resizeTimerID = setTimeout(function() {
    resetGame()
    init()
  }, 200)
})

window.addEventListener('mousemove', function(e) {
  cursorObject.x = e.x
  cursorObject.y = e.y
})

function init() {
  canvas = document.getElementById('canvas1')
  ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  cursorObject.init() // cursorObject size is responsive to canvas height
  
  ctx.font = `${canvas.width * 0.02}px Arial`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'white'

  startMenu()
}

function startMenu() {
  const menuText = 'PRESS SPACE TO START'

  ctx.save()
  ctx.translate(canvas.width/2, canvas.height/2)
  ctx.fillText(menuText, 0, 0)
  ctx.restore()

  document.addEventListener('keydown', spaceBarListener)
}

function spaceBarListener(e) {
  if (e.key === ' ') {
    startGame()
  }
}

function startGame() {
  document.removeEventListener('keydown', spaceBarListener)

  cursorObject.x = canvas.width/2
  cursorObject.y = canvas.height/2

  for (let i=0; i < gameSettings.radialTurretNumber; i++) {
    gameObjects.radialTurrets.push(new RadialTurret())
  }
  
  for (let i=0; i < gameSettings.aimedTurretNumber; i++) {
    gameObjects.aimedTurrets.push(new AimedTurret())
  }

  // returns DOMHighResTimeStamp which is the same format as the timeStamp passed to the callback of RequestAnimationFrame, animate in this case
  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#parameters
  oldTimeStamp = performance.now()

  animate(oldTimeStamp) // specify the first timestamp passed to animate
}

function endGame() {
  cancelAnimationFrame(animationID)
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

function resetGame() {
  gameObjects.reset()
  gameSettings.reset()
}

function drawScore() {
  const seconds = Math.round(gameSettings.totalTime/1000)
  ctx.save()
  ctx.fillStyle = 'white'
  ctx.translate(canvas.width * 0.1, canvas.height * 0.1) // score is time in seconds alive
  ctx.fillText(seconds, 0, 0)
  ctx.restore()
}

function animate(timeStamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // ctx.save()
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.3)' // cheap trail effect
  // ctx.fillRect(0, 0, canvas.width, canvas.height)
  // ctx.restore()

  elapsedMs = (timeStamp - oldTimeStamp) // milliseconds passed since last call to animate
  oldTimeStamp = timeStamp

  gameSettings.totalTime += elapsedMs

  // if (gameSettings.totalTime % 10000 < 50) { // increase difficulty every 10s
  //   increaseDifficulty()
  // }

  cursorObject.draw()
  drawScore()

  // Radial turrets/projectiles
  gameObjects.radialTurrets.forEach((turret) => { // update and draw turrets
    turret.update()
    turret.draw()
  })

  if (gameSettings.totalTime % 5000 < 50) { // create/fire radial projectiles once every 5 seconds
    gameObjects.radialTurrets.forEach((turret) => {
      turret.fireRadialOnce()
    })
  }

  for (let i=0; i < gameObjects.radialProjectiles.length; i++) { // update and render radial projectiles
    let p = gameObjects.radialProjectiles[i]
    p.update()

    if (cursorObject.collidesWith(p)) { // check collision for each with cursorObject
      endGame()
      resetGame()
      startMenu()
      return
    }

    p.draw()

    if (p.x < -p.radius || p.x > canvas.width + p.radius || p.y < -p.radius || p.y > canvas.height + p.radius) { // OOB
      gameObjects.radialProjectiles.splice(i, 1) // remove projectiles outside of screen
      i--
    }
  }

  // Aimed turrets/projectiles
  gameObjects.aimedTurrets.forEach((turret) => { // update and draw turrets
    turret.update()
    turret.draw()
  })

  if (gameSettings.totalTime % 3000 < 50) { // create/fire radial projectiles once every 5 seconds
    gameObjects.aimedTurrets.forEach((turret) => {
      turret.fireAimedOnce()
    })
  }

  for (let i=0; i < gameObjects.aimedProjectiles.length; i++) { // update and render radial projectiles
    let p = gameObjects.aimedProjectiles[i]
    p.update()

    if (cursorObject.collidesWith(p)) { // check collision for each with cursorObject
      endGame()
      resetGame()
      startMenu()
      return
    }

    p.draw()

    if (p.x < -p.radius || p.x > canvas.width + p.radius || p.y < -p.radius || p.y > canvas.height + p.radius) { // OOB
      gameObjects.aimedProjectiles.splice(i, 1) // remove projectiles outside of screen
      i--
    }
  }
  
  animationID = window.requestAnimationFrame(animate)
}