import './styles.css'
import spaceStars1 from '../assets/spaceStars1.svg'
import spaceStars2 from '../assets/spaceStars2.svg'
import spaceStars3 from '../assets/spaceStars3.svg'

// using circular Projectile and CursorObject hitboxes to simplify collision detection and improve performance

let canvas
let ctx

const menuScreen = document.getElementById('menuScreen')
const startButton = document.getElementById('startButton')
startButton.addEventListener('click', startGame)

const gameSettings = {
  totalTime: 0,

  maxRadialTurrets: 2, // maxTurret === currentTurret on game start
  currentRadialTurrets: 2,
  numRadialProjectiles: 10, // increase turret number/maxProjectile number with duration/score

  maxAimedTurrets: 2,
  currentAimedTurrets: 2,
  numAimedProjectiles: 5,
  // fireInterval: 5000, // TODO
  reset() {
    this.totalTime = 0

    this.maxRadialTurrets = 2
    this.currentRadialTurrets = 2
    this.numRadialProjectiles = 5

    this.maxAimedTurrets = 2
    this.currentAimedTurrets = 2
    this.numAimedProjectiles = 5
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
  paused: false,
}

const frame1 = new Image()
const frame2 = new Image()
const frame3 = new Image()
frame1.src = spaceStars1
frame2.src = spaceStars2
frame3.src = spaceStars3

// repeat frame2 after frame3, stars expanding then contracting in brightness and colour i.e. 12321232
const frames = [frame1, frame2, frame3, frame2]

const background = {
  yOffset: 0,
  frameIndex: 0,
  frameIndexInterval: undefined,
  reset() {
    clearInterval(this.frameIndexInterval)
    this.yOffset = 0,
    this.frameIndex = 0
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
    this.colour = 'violet'
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
    this.fireTimeoutID = undefined // stores the debounced timeoutID call for this turret to invoke a fire method once
    this.delayedTimeoutIDs = [] // stores the current timeoutIDs of this turret's fire methods
    this.radius = canvas.height * 0.01
    this.x = this.radius + Math.random() * (canvas.width - 2 * this.radius) // always starts with its full diameter inside the viewport
    this.y = -this.radius
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

  // setTimeouts for the debounce fire + turret fire methods called as the game ends persist and push projectiles to the next game
  // Because we are storing all timeouts, we can clearTimeout all of them if they are pending when the game ends by calling this method
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
    this.velY = canvas.height * (Math.random() * 0.00025 + 0.00025) // velocity varying between 0.025 to 0.05 % of canvas height
    this.randomYVelocity = this.velY
    this.offSet = 0
    this.fireRadialMethods = [ // store function references in array https://stackoverflow.com/a/9792043
      this.#fireRadial,
      this.#fireWindmillRings,
      this.#fireFlowerRings,
      this.#fireSpiralRings,
      // TODO more methods
    ]
  }

  #fireRadial() { // fires evenly spaced projectiles emitted from the centre of each turret
    const radialProjectiles = gameSettings.numRadialProjectiles * 5

    const randomPartition = (Math.random() * Math.PI) + Math.PI // varies between Pi and 2Pi radians

    for (let i=0; i < radialProjectiles; i++) {
      const slice = 2 * Math.PI / radialProjectiles;
      const angle = slice * i;

      // calculate a randomPartition angle on lower half of circle then skip firing projectiles in a 5% range either side
      if (angle > randomPartition * 0.95 && angle < randomPartition * 1.05) continue

      // assigns vectors that evenly distributes each radialProjectile around the unit circle
      gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.cos(angle), Math.sin(-angle))) // correct for down increasing y
    }
  }

  #spiralRing() { // single spiral ring accumulating offSet each time it is called
    const angle = this.offSet
    gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle)))
    this.offSet += Math.PI * 0.33
  }
  
  #fireSpiralRings() { // fires rings in a spiral pattern
    const numSpiralRings = gameSettings.numRadialProjectiles * 5 * (1 + Math.floor(Math.random() * 3))
    for (let i=0; i < numSpiralRings; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#spiralRing.bind(this), i * 10)
      )
    }
    while (this.delayedTimeoutIDs.length > numSpiralRings) this.delayedTimeoutIDs.shift()
  }
  
  #flowerRing() { // single ring staggering lines equal and opposite of each other accumulating offset for each call
    const angle = this.offSet
    gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle)))
    gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.cos(-angle), Math.sin(-angle)))
    this.offSet += Math.PI * 0.22
  }
  
  #fireFlowerRings() { // fires rings in a flower pattern
    const numFlowerRings = gameSettings.numRadialProjectiles * 2.5 * (1 + Math.floor(Math.random() * 3)) // 100 + 100 * Math.floor(Math.random() * 3)
    for (let i=0; i < numFlowerRings; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#flowerRing.bind(this), i * 20)
      )
    }
    while (this.delayedTimeoutIDs.length > numFlowerRings) this.delayedTimeoutIDs.shift()
  }

  #windMillRing() { // single ring of straight line + staggered line
    for (let j=0; j < gameSettings.numRadialProjectiles; j++) { // these rings do not accumulate offset i.e. fires a straight line
      const slice = 2 * Math.PI / gameSettings.numRadialProjectiles;
      const angle = slice * j;
      gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle)))
    }
    for (let j=0; j < gameSettings.numRadialProjectiles; j++) { // these rings accumulate offset which staggers projectiles
      const slice = 2 * Math.PI / gameSettings.numRadialProjectiles;
      const angle = this.offSet + slice * j;
      gameObjects.radialProjectiles.push(new RadialProjectile(this.x, this.y, Math.cos(angle), Math.sin(angle)))
    }
    this.offSet += Math.PI * 0.22 // accumulate offSet for each ring
  }

  #fireWindmillRings() { // fires rings in a windmill pattern
    const numWindmillRings = gameSettings.numRadialProjectiles * (0.5 + 0.5 * Math.floor(Math.random() * 3)) // * 0.5, * 1, * 1.5
    for (let i=0; i < numWindmillRings; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#windMillRing.bind(this), i * 120) // bind this context when setTimeout calls the method of this turret
      )
      // FIFO only store the most recent delayedTimeoutIDs
      while (this.delayedTimeoutIDs.length > numWindmillRings) this.delayedTimeoutIDs.shift()
    }
  }

  // fires a random attack from this.fireRadialMethods array
  #fireRandomRadialAttack() {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    const fireMethodsIndex = Math.floor(Math.random() * this.fireRadialMethods.length) // Math.random() returns 0 to <1. Safe to floor the result and not get an out of bounds index
    this.fireRadialMethods[fireMethodsIndex].bind(this)()
  }

  debounceFire() { // debounce call for this turret to fire
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireRandomRadialAttack.bind(this), 20)
  }
}

class AimedTurret extends Turret {
  constructor() {
    super()
    this.colour = 'yellow'
    this.velY = canvas.height * (Math.random() * 0.0005 + 0.0005) // velocity varying between 0.05 to 0.1 % of canvas height
    this.randomYVelocity = this.velY
    this.offSet = Math.PI * 0.0625
    this.fireAimedMethods = [
      this.#lineAttack,
      this.#coneAttack,
      // TODO more methods
    ]
  }

  #fireAimed() { // fires a projectile targeting the cursor
    const dist = Math.sqrt((this.x - cursorObject.x)**2 + (this.y - cursorObject.y)**2)
    const velX = (cursorObject.x - this.x) / dist // normalized vectors pointing from the turret to the cursor
    const velY = (cursorObject.y - this.y) / dist
    gameObjects.aimedProjectiles.push(new AimedProjectile(this.x, this.y, velX, velY))
  }

  #lineAttack() { // fires a line of projectiles aimed at the cursor
    const projectiles = gameSettings.numAimedProjectiles * 2
    for (let i=0; i < projectiles; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#fireAimed.bind(this), i * 400)
      )
      while (this.delayedTimeoutIDs.length > projectiles) this.delayedTimeoutIDs.shift()
    }
  }

  #fireConeRow(rowLen) { // fires a single row centered targeting the cursor

    // Math.atan2 https://math.stackexchange.com/a/2587852 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2
    const angleFromTurretToCursor = Math.atan2(cursorObject.y - this.y, cursorObject.x - this.x)

     // align each row (startAngle) so that it centers the target differing for odd/even row length
    const startAngle = angleFromTurretToCursor - this.offSet * (rowLen % 2 == 0 ? rowLen * 0.5 - 0.5 : Math.floor(rowLen * 0.5))

    for (let i=0; i < rowLen; i++) {
      gameObjects.aimedProjectiles.push(new AimedProjectile(this.x, this.y, Math.cos(this.offSet * i + startAngle), Math.sin(this.offSet * i + startAngle)))
    }
  }

  #coneAttack() { // fires decreasing rows of projectiles at the cursor
    const maxCone = gameSettings.numAimedProjectiles
    for (let i=0; i < maxCone; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#fireConeRow.bind(this, maxCone-i, maxCone), i * 400)
      )
      while (this.delayedTimeoutIDs.length > maxCone) this.delayedTimeoutIDs.shift()
    }
  }

  #fireRandomAimedAttack() { // fires a random attack from this.fireAimedMethods array
    const fireMethodsIndex = Math.floor(Math.random() * this.fireAimedMethods.length)
    this.fireAimedMethods[fireMethodsIndex].bind(this)()
  }

  debounceFire() { // debounces the calls to fire from gameLoop to this turret
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireRandomAimedAttack.bind(this), 20)
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

window.onblur = function() {
  gameTimers.paused = true 
}

window.onfocus = function() {
  gameTimers.paused = false // simplest implementation for pause out of focus:
  gameTimers.oldTimeStamp = performance.now() // window lost focus but score/gameSettings.totalTime ticks up
}

window.onmousemove = function(e) {
  cursorObject.x = e.x
  cursorObject.y = e.y
}

function init() {
  canvas = document.getElementById('gameCanvas')
  ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  cursorObject.init() // initialize cursorObject size to be responsive to canvas height

  ctx.font = `${canvas.width * 0.02}px Arial`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'white'

  startMenu()
}

function startMenu() {
  // show button and menu
  startButton.style.display = 'block'
  menuScreen.style.display = 'block'

  // draw the first frame of background animation
  ctx.drawImage(frame1, 0, 0, canvas.width, canvas.height)
}

function startGame() {
  // remove button + menuScreen as game starts
  startButton.style.display = 'none'
  menuScreen.style.display = 'none'

  // initialize background animation
  background.frameIndexInterval = setInterval(() => {
    background.frameIndex++
  }, 1000)

  // initialize cursorObject position and fireInterval
  cursorObject.x = canvas.width/2
  cursorObject.y = canvas.height/2
  cursorObject.startFireInterval()

  // initialize turrets
  createRadialTurret(gameSettings.maxRadialTurrets, 2000) // spawns within 2-3 seconds of being called
  createAimedTurret(gameSettings.maxAimedTurrets, 2000)

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
  background.reset()
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

  // Endless background scroll
  ctx.drawImage(frames[background.frameIndex % frames.length], 0, background.yOffset, canvas.width, canvas.height)
  ctx.drawImage(frames[background.frameIndex % frames.length], 0, background.yOffset - canvas.height, canvas.width, canvas.height)
  if (background.yOffset > canvas.height) background.yOffset = 0 // reset to original
  background.yOffset += 2

  // ctx.save()
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.3)' // cheap trail effect
  // ctx.fillRect(0, 0, canvas.width, canvas.height)
  // ctx.restore()

  // Record game time
  gameTimers.elapsedMs = (timeStamp - gameTimers.oldTimeStamp) // milliseconds passed since last call to gameLoop
  gameTimers.oldTimeStamp = timeStamp

  if (!gameTimers.paused) { // when game is not paused (window in focus) totalTime/score can increase
    gameSettings.totalTime += gameTimers.elapsedMs
  }

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
    // creates all turrets needed for replacement after some timer
    createRadialTurret(replacements, 5000) // adjust respawn rate with difficulty
    // Prevent re-entering this conditional on next frame, replacements have been ordered
    gameSettings.currentRadialTurrets = gameSettings.maxRadialTurrets
  }
  // same as above but with aimed turrets
  if (gameSettings.currentAimedTurrets < gameSettings.maxAimedTurrets) {
    const replacements = gameSettings.maxAimedTurrets - gameSettings.currentAimedTurrets
    createAimedTurret(replacements, 5000)
    gameSettings.currentAimedTurrets = gameSettings.maxAimedTurrets
  }
  /**
   * N.B. unless maxTurrets increases in the same frame as a turret is destroyed or
   * 2 turrets are destroyed in the same frame, createTurrets() will be called with only 1 replacement
   */

  // Fire aimed projectiles from turrets
  if (gameSettings.totalTime % 5000 < 20) {
    gameObjects.aimedTurrets.forEach((turret) => {
      turret.debounceFire()
    })
  }

  // Fire radial projectiles from turrets
  if (gameSettings.totalTime % 5000 < 20) {
    gameObjects.radialTurrets.forEach((turret) => {
      turret.debounceFire()
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

function createAimedTurret(num, idleTime) { // creates num aimed turrets after some idleTime
  for (let i=0; i < num; i++) {
    // random time offset from 0 to 50% of initial idleTime
    const randomTimeOffset = Math.floor((idleTime * 0.5) * Math.random())
    timeoutIDs.createTurretTimeoutIDs.push(
      setTimeout(() => gameObjects.aimedTurrets.push(new AimedTurret()), randomTimeOffset + idleTime)
    )
    // limit timeoutID array length by max number of turrets that can be created at once
    const maxCreated = gameSettings.maxAimedTurrets + gameSettings.maxRadialTurrets
    if (timeoutIDs.createTurretTimeoutIDs.length > maxCreated) timeoutIDs.createTurretTimeoutIDs.shift()
  }
}
// Same as above but for radialTurrets
function createRadialTurret(num, idleTime) { // creates num radialTurrets after some idleTime
  for (let i=0; i < num; i++) {
    const randomTimeOffset = Math.floor((idleTime * 0.5) * Math.random())
    timeoutIDs.createTurretTimeoutIDs.push(
      setTimeout(() => gameObjects.radialTurrets.push(new RadialTurret()), randomTimeOffset + idleTime)
    )
    const maxCreated = gameSettings.maxAimedTurrets + gameSettings.maxRadialTurrets
    if (timeoutIDs.createTurretTimeoutIDs.length > maxCreated) timeoutIDs.createTurretTimeoutIDs.shift()
  }
}