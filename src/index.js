import './styles.css'
import Star from './Star'
import Particle from './Particle'
import { AimedTurret, RadialTurret } from './Turret'
import { Player } from './Player'

// using circular Projectile and Player Object hitboxes to simplify collision detection and improve performance

export const gameSettings = {
  totalTime: 0,
  maxRadialTurrets: 2,
  currentRadialTurrets: 2,
  numRadialProjectiles: 10, // increase turret number/maxProjectile number with duration/score
  maxAimedTurrets: 2,
  currentAimedTurrets: 2,
  numAimedProjectiles: 5,
  numStars: 50,
  explosionDensity: 50,
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
  stars: [],
  explosionParticles: [],
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
    this.stars = []
    this.explosionParticles = []
  }
}

export const gameTimers = {
  elapsedMs: undefined,
  oldTimeStamp: undefined,
  paused: false,
}

const timeoutIDs = {
  gameLoopID: undefined,
  resizeTimeoutID: undefined,
  createTurretTimeoutIDs: [],
  reset() {
    this.createTurretTimeoutIDs.forEach((id) => {
      clearTimeout(id)
    })
  }
}

const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const menuScreen = document.getElementById('menuScreen')
const startButton = document.getElementById('startButton')
const player = new Player(canvas, ctx, gameObjects) // initialize player

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
  player.x = e.x
  player.y = e.y
}

startButton.onclick = startGame

function init() {
  // responsive width and height
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  player.resize() // resize player

  startMenu()
}

function startMenu() {
  // show button and menu
  startButton.style.display = 'block'
  menuScreen.style.display = 'block'

  // initialize all stars
  for (let i=0; i < gameSettings.numStars; i++) {
    gameObjects.stars.push(new Star(canvas, ctx))
  }

  // draw the first frame of stars animation
  gameObjects.stars.forEach((star) => {
    star.draw()
  })
}

function startGame() {
  // remove button + menuScreen as game starts
  startButton.style.display = 'none'
  menuScreen.style.display = 'none'

  // initialize Player position and fireInterval
  player.x = canvas.width/2
  player.y = canvas.height/2
  player.startFireInterval()

  // initialize turrets
  createTurret(gameSettings.maxRadialTurrets, 2000, 'radial') // spawns within 2-3 seconds of being called
  createTurret(gameSettings.maxAimedTurrets, 2000, 'aimed')

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
  player.clearFireInterval()
  gameObjects.reset()
  gameSettings.reset()
  timeoutIDs.reset()
}

function drawScore() {
  const seconds = Math.round(gameSettings.totalTime/1000)
  ctx.save()
  ctx.fillStyle = 'white'
  ctx.font = `${(canvas.width + canvas.height) * 0.01}px Play`
  ctx.shadowColor = 'white'
  ctx.shadowBlur = canvas.height * 0.005
  ctx.translate(canvas.width * 0.1, canvas.height * 0.1) // score is time in seconds alive
  ctx.fillText(seconds, 0, 0)
  ctx.restore()
}

function gameLoop(timeStamp) {
  // ctx.clearRect(0, 0, canvas.width, canvas.height)

  // animate background stars
  gameObjects.stars.forEach((star) => {
    star.update()
    star.draw()
  })

  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)' // cheap trail effect
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()

  // Record game time
  gameTimers.elapsedMs = (timeStamp - gameTimers.oldTimeStamp) // milliseconds passed since last call to gameLoop
  gameTimers.oldTimeStamp = timeStamp

  if (!gameTimers.paused) { // when game is not paused (window in focus) totalTime/score can increase
    gameSettings.totalTime += gameTimers.elapsedMs
  }

  // if (gameSettings.totalTime % 10000 < 50) { // increase difficulty every 10s
  //   increaseDifficulty()
  // }

  drawScore()
  player.draw()

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
        // create explosion particles at collision site
        for (let k=0; k < gameSettings.explosionDensity; k++) {
          gameObjects.explosionParticles.push(new Particle(canvas, ctx, turret.x, turret.y, turret.colour))
        }
        // stop the turret's current delayed fire methods
        turret.stopFiring()
        // remove the turret
        gameObjects.radialTurrets.splice(j, 1)
        j--
        // update currentTurrets
        gameSettings.currentRadialTurrets--
      }
    }

    for (let j=0; j < gameObjects.aimedTurrets.length; j++) {

      const turret = gameObjects.aimedTurrets[j]

      if (circleCollides(projectile, turret)) {
        for (let k=0; k < gameSettings.explosionDensity ; k++) {
          gameObjects.explosionParticles.push(new Particle(canvas, ctx, turret.x, turret.y, turret.colour))
        }
        turret.stopFiring()
        gameObjects.aimedTurrets.splice(j, 1)
        j--
        gameSettings.currentAimedTurrets--
      }
    }
  }

  // particles for destroyed turret explosion animation
  for (let i=0; i < gameObjects.explosionParticles.length; i++) {

    const particle = gameObjects.explosionParticles[i]
    particle.update()
    particle.draw()
    // remove particles that have faded out enough
    if (particle.opacity <= 0.1) {
      gameObjects.explosionParticles.splice(i, 1)
      i--
    }
  }

  // Replacing turrets destroyed by the player or as difficulty increases if maxTurrets variable increases
  if (gameSettings.currentRadialTurrets < gameSettings.maxRadialTurrets) {

    // store number of replacements needed
    const replacements = gameSettings.maxRadialTurrets - gameSettings.currentRadialTurrets

    // creates all turrets needed for replacement after some timer
    createTurret(replacements, 5000, 'radial') // adjust respawn rate with difficulty

    // Prevent re-entering this conditional on next frame, replacements have been ordered
    gameSettings.currentRadialTurrets = gameSettings.maxRadialTurrets
  }

  // same as above but with aimed turrets
  if (gameSettings.currentAimedTurrets < gameSettings.maxAimedTurrets) {
    const replacements = gameSettings.maxAimedTurrets - gameSettings.currentAimedTurrets
    createTurret(replacements, 5000, 'aimed')
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
    if (circleCollides(player, prj)) { // check collision for each radialProjectile with Player object
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
    if (circleCollides(player, prj)) { // check collision for each aimedProjectile with Player object
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

function createTurret(num, idleTime, turretType) { // creates turrets after some idleTime
  for (let i=0; i < num; i++) {
    // random time offset from 0 to 50% of initial idleTime
    const randomTimeOffset = Math.floor((idleTime * 0.5) * Math.random())
    timeoutIDs.createTurretTimeoutIDs.push(
      setTimeout(() => {
        switch (turretType) {
          case 'aimed':
            gameObjects.aimedTurrets.push(new AimedTurret(canvas, ctx, gameObjects.aimedProjectiles, player))
            break
          case 'radial':
            gameObjects.radialTurrets.push(new RadialTurret(canvas, ctx, gameObjects.radialProjectiles))
            break
        }
      }, randomTimeOffset + idleTime)
    )
    // limit timeoutID array length by max number of turrets that can be created at once
    const maxCreated = turretType === 'aimed' ? gameSettings.maxAimedTurrets : gameSettings.maxRadialTurrets
    while (timeoutIDs.createTurretTimeoutIDs.length > maxCreated) timeoutIDs.createTurretTimeoutIDs.shift()
  }
}