import './styles.css'

// using circular Projectile and CursorObject hitboxes to simplify collision detection and improve performance

let canvas
let ctx

const gameSettings = {
  totalTime: 0, // window loses focus but score ticks up https://developer.mozilla.org/en-US/docs/Web/API/Window/focus_event

  maxRadialTurrets: 2, // maxTurret === currentTurret on game start
  currentRadialTurrets: 2,
  numRadialProjectiles: 20, // increase turret number/maxProjectile number with duration/score
  numRadialRings: 10,

  maxAimedTurrets: 1,
  currentAimedTurrets: 1,
  numAimedProjectiles: 30,
  // fireInterval: 5000, // TODO
  reset() {
    this.totalTime = 0
    this.maxRadialTurrets = 2
    this.currentRadialTurrets = 2
    this.numRadialProjectiles = 20
    this.numRadialRings = 10
    this.maxAimedTurrets = 1
    this.currentAimedTurrets = 1
    this.numAimedProjectiles = 30
  }
}

// maxTurrets in gameSettings describes the limit of turrets that are on screen at one time,
// which will be converged to by the actual number in gameObjects

// doing the comparison: if (gameObjects.turrets.length < gameSettings.maxRadialTurrets)
// can cause a bug if we want to delay replacement unless we immediately add the new turrets
// because the next frame will call more setTimeouts to replace lost turrets

const gameObjects = {
  radialTurrets: [],
  radialProjectiles: [],
  aimedTurrets: [],
  aimedProjectiles: [],
  playerProjectiles: [],
  reset() {
    this.radialTurrets.forEach((turret) => {
      turret.stopFiring()
    })
    this.aimedTurrets.forEach((turret) => {
      turret.stopFiring()
    })
    this.radialTurrets = []
    this.radialProjectiles = []
    this.aimedTurrets = []
    this.aimedProjectiles = []
    this.playerProjectiles = []
  }
}

const gameTimers = {
  elapsedMs: undefined,
  oldTimeStamp: undefined,
  reset() {
    // empty
  }
}

const timeoutIDs = {
  gameLoopID: undefined,
  resizeTimeoutID: undefined,
  cursorObjectfireInterval: undefined,
  createTurretTimeoutIDs: [],
  reset() {
    clearInterval(this.cursorObjectfireInterval)
    this.createTurretTimeoutIDs.forEach((id) => {
      clearTimeout(id)
    })
  }
}

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
  fire() {
    gameObjects.playerProjectiles.push( // fires 2 shots upwards at L, R edge of the cursorObject
      new PlayerProjectile(this.x - this.radius, this.y, 0, -3),
      new PlayerProjectile(this.x + this.radius, this.y, 0, -3),
    )
  },
  startFireInterval() {
    timeoutIDs.cursorObjectfireInterval = setInterval(this.fire.bind(this), 500)
  }
}

class Projectile {
  constructor(x, y, velX, velY) {
    this.x = x
    this.y = y
    this.velX = velX * (canvas.height + canvas.width) * 0.0005 // add magnitude to the normalized vectors to scale with canvas width/height
    this.velY = velY * (canvas.height + canvas.width) * 0.0005
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
    this.colour = 'white'
    this.radius = canvas.height * 0.003
  }
}

class AimedProjectile extends Projectile {
  constructor(x, y, velX, velY) {
    super(x, y, velX, velY)
    this.colour = 'orange'
    this.radius = canvas.height * 0.003
  }
}

class PlayerProjectile extends Projectile {
  constructor(x, y, velX, velY) {
    super(x, y, velX, velY)
    this.colour = 'magenta'
    this.radius = canvas.height * 0.002
  }
}

class Turret {
  constructor() {
    this.velX = 0
    this.fireTimeoutID = undefined // stores the debounced timeoutID call for this turret to invoke a fire sequence once (can be single or interval)
    this.delayedTimeoutIDs = [] // stores the timeoutIDs for each of the fire methods called at delayed intervals
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
      this.y = -this.radius
      this.velY = this.randomYVelocity
    }
  }

  // setTimeouts for the turret fire methods called as the game ends persist
  // and push projectiles to the next game after reset unless this is called
  stopFiring() {
    clearTimeout(this.fireTimeoutID)
    this.delayedTimeoutIDs.forEach((id) => {
      clearTimeout(id)
    })
  }
}

class RadialTurret extends Turret {
  constructor() {
    super()
    this.colour = 'red'
    this.radius = canvas.height * 0.01
    this.x = this.radius + Math.random() * (canvas.width - 2 * this.radius) // always starts with its full diameter inside the viewport
    this.y = 0 // could spawn randomly distributed above y = 0
    this.velY = canvas.height * (Math.random() * 0.00025 + 0.00025) // velocity varying between 0.025 to 0.05 % of canvas height
    this.randomYVelocity = this.velY
    this.offSet = 0
    this.offSetCount = 1
  }

  #fireRadial() { // fires evenly spaced projectiles emitted from the centre of each turret
    for (let i=0; i < gameSettings.numRadialProjectiles; i++) {
      const slice = 2 * Math.PI / gameSettings.numRadialProjectiles;
      const angle = slice * i;
      // assigns vectors that evenly distributes each radialProjectile around the unit circle
      gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle)))
    }
  }

  #windMillRing() { // Rings of Straight line + staggered line

    for (let j=0; j < gameSettings.numRadialProjectiles; j++) { // these rings do not accumulate offset, straight line
      const slice = 2 * Math.PI / gameSettings.numRadialProjectiles;
      const angle = slice * j;
      gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle)))
    }

    for (let j=0; j < gameSettings.numRadialProjectiles; j++) { // these rings accumulate offset which staggers them
      const slice = 2 * Math.PI / gameSettings.numRadialProjectiles;
      const angle = this.offSet + slice * j;
      gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle)))
    }

    if (this.offSetCount % 2 == 0) { // offSet only increases every other call to it, staggers in lines of 2
      this.offSet += Math.PI * 0.22 // multiplication more efficient that dividing, accumulate offSet for each ring. += Math.PI * 0.22 || Math.PI / 4.5 || 40° are the same
    }
    this.offSetCount += 1
  }

  #fireRadialRings() {
    for (let i=0; i < gameSettings.numRadialRings; i++) { // 10 rings at 120ms interval
      this.delayedTimeoutIDs.push(
        setTimeout(this.#windMillRing.bind(this), i * 120) // bind this context when setTimeout calls the method of this turret
      )

      if (this.delayedTimeoutIDs.length > gameSettings.numRadialRings) { // FIFO only store the most recent delayedTimeoutIDs
        this.delayedTimeoutIDs.shift()
      }

    }
  }

  fireRadialRingsOnce() {
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireRadialRings.bind(this), 20)
  }

  fireRadialOnce() { // debounce calling turret.fireRadial() binding current Turret instance as the context
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireRadial.bind(this), 20)
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

  #fireAimed() { // fires aimed projectiles
    const dist = Math.sqrt((this.x - cursorObject.x)**2 + (this.y - cursorObject.y)**2)
    const velX = (cursorObject.x - this.x) / dist // normalized vectors pointing from the turret to the cursor
    const velY = (cursorObject.y - this.y) / dist
    // increase magnitude of vector with difficulty?
    gameObjects.aimedProjectiles.push(new AimedProjectile(this.x, this.y, velX, velY))
  }

  #fireAimedInterval() { // calls #fireAimed at 80ms interval for total numAimedProjectiles
    for (let i=0; i < gameSettings.numAimedProjectiles; i++) {

      // store the ID of each setTimeout in array, allowing us to clearTimeout on all of them if there are setTimeouts pending when the game ends
      this.delayedTimeoutIDs.push(
        setTimeout(this.#fireAimed.bind(this), i * 80)
      )

      if (this.delayedTimeoutIDs.length > gameSettings.numAimedProjectiles) { // only works for a single turret firing 1 * numAimedProjectiles, perhaps need separate variable for max setTimeouts for AimedTurrets
        this.delayedTimeoutIDs.shift()
      }

    }
  }

  fireAimedOnce() { // debounces the calls to fire from gameLoop to this turret
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireAimedInterval.bind(this), 20)
  }
}

window.onload = init

window.onresize = function() {
  // Debounce resize event. Then end the current gameLoop,
  // reset the game settings for the next gameLoop and call init
  clearTimeout(timeoutIDs.resizeTimeoutID)
  timeoutIDs.resizeTimeoutID = setTimeout(function() {
    endGame()
    resetGame()
    init()
  }, 100)
}

window.onmousemove = function(e) {
  cursorObject.x = e.x
  cursorObject.y = e.y
}

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
  const menuText = 'CLICK TO START'

  ctx.save()
  ctx.translate(canvas.width/2, canvas.height/2)
  ctx.fillText(menuText, 0, 0)
  ctx.restore()

  document.addEventListener('click', clickListener)
}

function clickListener() {
  startGame()
}

function startGame() {
  document.removeEventListener('click', clickListener)

  // initialize cursor
  cursorObject.x = canvas.width/2
  cursorObject.y = canvas.height/2
  cursorObject.startFireInterval()

  // initialize turrets
  createRadialTurret(gameSettings.maxRadialTurrets, 0)
  createAimedTurret(gameSettings.maxAimedTurrets, 0)

  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#parameters
  // performance.now() returns DOMHighResTimeStamp which is the same format as the timeStamp
  // passed to the callback of RequestAnimationFrame, gameLoop here
  gameTimers.oldTimeStamp = performance.now()

  // Specify the first timestamp passed to gameLoop and initialize it
  // Passing performance.now() means elapsedMs always starts from 0
  gameLoop(gameTimers.oldTimeStamp)
}

function endGame() {
  cancelAnimationFrame(timeoutIDs.gameLoopID)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function resetGame() {
  gameObjects.reset()
  gameSettings.reset()
  timeoutIDs.reset()
  gameTimers.reset()
}

function drawScore() {
  const seconds = Math.round(gameSettings.totalTime/1000)
  ctx.save()
  ctx.fillStyle = 'white'
  ctx.translate(canvas.width * 0.1, canvas.height * 0.1) // score is time in seconds alive
  ctx.fillText(seconds, 0, 0)
  ctx.restore()
}

function gameLoop(timeStamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // ctx.save()
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.3)' // cheap trail effect
  // ctx.fillRect(0, 0, canvas.width, canvas.height)
  // ctx.restore()

  gameTimers.elapsedMs = (timeStamp - gameTimers.oldTimeStamp) // milliseconds passed since last call to gameLoop
  gameTimers.oldTimeStamp = timeStamp

  gameSettings.totalTime += gameTimers.elapsedMs

  // if (gameSettings.totalTime % 10000 < 50) { // increase difficulty every 10s
  //   increaseDifficulty()
  // }

  cursorObject.draw()
  drawScore()

  // Player projectiles
  for (let i=0; i < gameObjects.playerProjectiles.length; i++) {

    const projectile = gameObjects.playerProjectiles[i]

    projectile.update()
    projectile.draw()

    if (projectile.y < -projectile.radius) { // OOB, player projectiles go up screen in straight line, remove projectiles above screen
      gameObjects.playerProjectiles.splice(i, 1)
      i--
    }

    // player projectiles colliding with turrets removes them
    for (let j=0; j < gameObjects.radialTurrets.length; j++) {
      const turret = gameObjects.radialTurrets[j]
      if (circleCollides(projectile, turret)) {
        turret.stopFiring()
        gameObjects.radialTurrets.splice(j, 1)
        j--
        gameSettings.currentRadialTurrets--
      }
    }

    for (let j=0; j < gameObjects.aimedTurrets.length; j++) {
      const turret = gameObjects.aimedTurrets[j]
      if (circleCollides(projectile, turret)) {
        turret.stopFiring()
        gameObjects.aimedTurrets.splice(j, 1)
        j--
        gameSettings.currentAimedTurrets--
      }
    }
  }

  // Replacing turrets destroyed by the player or as difficulty increases if maxTurrets variable increases
  if (gameSettings.currentRadialTurrets < gameSettings.maxRadialTurrets) {

    // store number of replacements needed
    const replacements = gameSettings.maxRadialTurrets - gameSettings.currentRadialTurrets
    
    createRadialTurret(replacements, 5000) // adjust respawn rate with difficulty

    // Prevent re-entering this conditional on next frame
    gameSettings.currentRadialTurrets = gameSettings.maxRadialTurrets
  }

  if (gameSettings.currentAimedTurrets < gameSettings.maxAimedTurrets) { // same as above but with aimed turrets
    const replacements = gameSettings.maxAimedTurrets - gameSettings.currentAimedTurrets
    createAimedTurret(replacements, 5000)
    gameSettings.currentAimedTurrets = gameSettings.maxAimedTurrets
  }

  // Fire aimed projectiles from turrets
  if (gameSettings.totalTime % 5000 < 20) {
    gameObjects.aimedTurrets.forEach((turret) => {
      turret.fireAimedOnce()
    })
  }

  // Fire radial projectiles from turrets
  if (gameSettings.totalTime % 10000 < 20) {
    gameObjects.radialTurrets.forEach((turret) => {
      turret.fireRadialRingsOnce()
    })
  }

  // Draw and update radial turrets/projectiles
  gameObjects.radialTurrets.forEach((turret) => {
    turret.update()
    turret.draw()
  })
  
  for (let i=0; i < gameObjects.radialProjectiles.length; i++) {

    const prj = gameObjects.radialProjectiles[i]
    prj.update()
    if (circleCollides(cursorObject, prj)) { // check collision for each radialProjectile with cursorObject
      endGame()
      resetGame()
      startMenu()
      return
    }
    prj.draw()

    if (prj.x < -prj.radius || prj.x > canvas.width + prj.radius || prj.y < -prj.radius || prj.y > canvas.height + prj.radius) { // OOB
      gameObjects.radialProjectiles.splice(i, 1) // removes projectiles outside of screen
      i--
    }
  }

  // Draw and update aimed turrets/projectiles
  gameObjects.aimedTurrets.forEach((turret) => {
    turret.update()
    turret.draw()
  })

  for (let i=0; i < gameObjects.aimedProjectiles.length; i++) {

    const prj = gameObjects.aimedProjectiles[i]
    prj.update()
    if (circleCollides(cursorObject, prj)) { // check collision for each aimedProjectile with cursorObject
      endGame()
      resetGame()
      startMenu()
      return
    }
    prj.draw()

    if (prj.x < -prj.radius || prj.x > canvas.width + prj.radius || prj.y < -prj.radius || prj.y > canvas.height + prj.radius) { // OOB
      gameObjects.aimedProjectiles.splice(i, 1) // remove projectiles outside of screen
      i--
    }
  }

  timeoutIDs.gameLoopID = window.requestAnimationFrame(gameLoop)
}

function circleCollides (A, B) { // returns boolean based on whether circle objects A and B collide
  const dx = A.x - B.x
  const dy = A.y - B.y
  if (dx**2 + dy**2 < (A.radius + B.radius)**2) {
    return true
  }
  return false
}

function createAimedTurret(num, idleTime) { // creates aimed turrets after some idleTime
  for (let i=0; i < num; i++) {
    timeoutIDs.createTurretTimeoutIDs.push(
      setTimeout(() => gameObjects.aimedTurrets.push(new AimedTurret()), idleTime) // TODO idleTime + random extra time
    )

    if (timeoutIDs.createTurretTimeoutIDs.length > gameSettings.maxAimedTurrets + gameSettings.maxRadialTurrets) { // max number of turrets that can be created at once
      timeoutIDs.createTurretTimeoutIDs.shift()
    }
  }
}

function createRadialTurret(num, idleTime) { // creates radial turrets after some idleTime
  for (let i=0; i < num; i++) {
    timeoutIDs.createTurretTimeoutIDs.push(
      setTimeout(() => gameObjects.radialTurrets.push(new RadialTurret()), idleTime)
    )

    if (timeoutIDs.createTurretTimeoutIDs.length > gameSettings.maxAimedTurrets + gameSettings.maxRadialTurrets) {
      timeoutIDs.createTurretTimeoutIDs.shift()
    }
  }
}