import './styles.css'
import Star from './Star'
import Particle from './Particle'
import { AimedTurret, RadialTurret } from './Turret'
import { Player } from './Player'
import { toggleFullscreen } from '../utils/fullScreen'

// using circular Projectile and Player Object hitboxes to simplify collision detection and improve performance

export const gameSettings = {
  totalTime: 0,
  currentRadialTurrets: 1,
  currentAimedTurrets: 1,
  numRadialProjectiles: 5,
  numAimedProjectiles: 5,
  maxRadialTurrets: 1,
  maxAimedTurrets: 1,
  numStars: 50,
  explosionDensity: 50,
  hardMode: false,
  difficultyCounter: 0,
  reset() {
    this.totalTime = 0
    this.currentRadialTurrets = 1
    this.currentAimedTurrets = 1
    this.numRadialProjectiles = 5
    this.numAimedProjectiles = 5
    this.maxRadialTurrets = 1
    this.maxAimedTurrets = 1
    this.difficultyCounter = 0
    this.hardMode = false
  }
}

// maxTurrets in gameSettings describes the limit of turrets that are on screen at one time,
// which will be converged to by the actual number in gameObjects

// doing the comparison: if (gameObjects.turrets.length < gameSettings.maxRadialTurrets)
// can cause a bug if we want to delay replacement unless we immediately add the new turrets
// because the next frame will call more setTimeouts to replace lost turrets

export const gameObjects = {
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
  gameLoop: undefined, // request id from requestAnimationFrame
  resize: undefined,
  increaseDifficulty: undefined,
  createTurrets: [],
  reset() {
    this.createTurrets.forEach((id) => {
      clearTimeout(id)
    })
    clearTimeout(this.increaseDifficulty)
  }
}

const highScore = {
  maxScores: 10,
  scores: []
}

const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')

const menuScreen = document.getElementById('menuScreen')
const infoButton = document.getElementById('infoButton')
const startButton = document.getElementById('startButton')
const backButton = document.getElementById('backButton')
const highScoreDiv = document.getElementById('highScoreDiv')
const highScoreList = document.getElementsByClassName('highScore')
const modal = document.getElementsByClassName('modal')[0]
const closeModal = document.getElementById('closeModal')
const mainTab = document.getElementById('mainTab')
const infoTab = document.getElementById('infoTab')
const highScoreForm = document.getElementById('highScoreForm')
const modalInput = document.getElementById('modalInput')
const toggleFullscreenButton = document.getElementById('toggleFullscreenButton')

toggleFullscreenButton.onclick = toggleFullscreen

const player = new Player(canvas, ctx, gameObjects) // initialize player

window.onload = function() {
  getScores()
  init()
  startMenu()
}

// Once when opening the game, get and save scores from localStorage if they exist else the empty array
function getScores() {
  const highScoreString = localStorage.getItem('bulletHellHighScores')
  highScore.scores = JSON.parse(highScoreString) ?? []
}

window.onresize = function() {
  // Debounce resize event. Then end the current gameLoop,
  // reset the game settings for the next gameLoop and call init
  clearTimeout(timeoutIDs.resize)
  timeoutIDs.resize = setTimeout(function() {
    cancelAnimationFrame(timeoutIDs.gameLoop)
    modal.style.display = 'none'
    init()
    endGame()
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

window.onclick = (e) => { // clicking on the modal background or cross removes the modal
  if (e.target === modal || e.target === closeModal) {
    modal.style.display = 'none'
    modalInput.value = ''
    endGame() // and ends without saving a highScore
  }
}

function init() {
  // responsive width and height
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  player.resize() // responsive player
}

function startMenu() {
  // show menuScreen
  menuScreen.style.display = 'block'

  if (highScore.scores.length) { // if highScores are pulled from localStorage
    
    // show the highScore div
    highScoreDiv.style.display = 'flex'

    // Insert scores/user input into the DOM
    let lastHighScoreIndex = 0
    for (let i=0; i < highScore.scores.length; i++) {
      highScoreList[i].style.display = 'list-item'
      highScoreList[i].textContent = `${highScore.scores[i].name}: ${highScore.scores[i].score}`
      lastHighScoreIndex++
    }
    for (let i=lastHighScoreIndex; i < highScoreList.length; i++) {
      highScoreList[i].style.display = 'none'
    }
  }

  // initialize all stars
  for (let i=0; i < gameSettings.numStars; i++) {
    gameObjects.stars.push(new Star(canvas, ctx))
  }

  // draw the first frame of stars animation
  gameObjects.stars.forEach((star) => {
    star.draw()
  })

  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()
}

highScoreForm.addEventListener('submit', function(e) {
  e.preventDefault()
  const userName = e.target[0].value
  modal.style.display = 'none'
  e.target[0].value = ''
  // extract username from form and pass through
  endGame(userName)
})

infoButton.onclick = () => {
  mainTab.style.display = 'none'
  infoTab.style.display = 'block'
}

backButton.onclick = () => {
  mainTab.style.display = 'block'
  infoTab.style.display = 'none'
}

startButton.onclick = startGame

function startGame(e) {
  // hide menuScreen as game starts
  menuScreen.style.display = 'none'

  // initialize Player fireInterval and position from click event 
  player.x = e.x
  player.y = e.y
  player.startFireInterval()

  // initialize turrets
  createTurret(gameSettings.maxRadialTurrets, 6000, 'radial')
  createTurret(gameSettings.maxAimedTurrets, 3000, 'aimed')

  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#parameters
  // performance.now() returns DOMHighResTimeStamp which is the same format as the timeStamp
  // passed to the callback of RequestAnimationFrame, gameLoop here
  gameTimers.oldTimeStamp = performance.now()

  // Specify the first timestamp passed to gameLoop and initialize it
  // Passing performance.now() means elapsedMs always starts from 0
  gameLoop(gameTimers.oldTimeStamp)
}

function handleScore() {
  // first stop the animation
  cancelAnimationFrame(timeoutIDs.gameLoop)
  const finalScore = Math.round(gameSettings.totalTime/1000)
   // if score beats lowest stored score (or 0 if no scores)
  if (finalScore > (highScore.scores.length ? highScore.scores[highScore.scores.length-1].score : 0)) {
    // then show modal for username input to save highscore
    modal.style.display = 'flex'
    modalInput.focus();
  } else {
    endGame()
  }
}

// recieves userName from input, only stores new highScore if a name is submitted (from modal)
function endGame(userName) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (userName) {
    const finalScore = Math.round(gameSettings.totalTime/1000)
    highScore.scores.push({ score: finalScore, name: userName })
    highScore.scores.sort((a, b) => b.score - a.score) // sort
    highScore.scores.splice(highScore.maxScores) // restrict maxLength
    localStorage.setItem('bulletHellHighScores', JSON.stringify(highScore.scores)) // save
  }

  resetGame()
}

function resetGame() {
  player.clearFireInterval()
  gameObjects.reset()
  gameSettings.reset()
  timeoutIDs.reset()
  // ready for next game to start by clicking from menu again
  startMenu()
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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)' // cheap trail effect
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()

  // Record game time
  gameTimers.elapsedMs = (timeStamp - gameTimers.oldTimeStamp) // milliseconds passed since last call to gameLoop
  gameTimers.oldTimeStamp = timeStamp

  if (!gameTimers.paused) { // when game is not paused (window in focus) totalTime/score can increase
    gameSettings.totalTime += gameTimers.elapsedMs
  }

  if (gameSettings.totalTime > 6000 && gameSettings.totalTime % 5000 < 20) {
    debounceIncreaseDifficulty()
  }

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

    // player projectiles colliding with radialTurrets removes them
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

    // player projectiles colliding with aimedTurrets
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

  player.draw()

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
    if (circleCollides(player, prj)) { // check collision for each radialProjectile with Player object which ends the game
      handleScore()
      return
    }
    prj.draw()

    if (prj.x < -prj.radius || prj.x > canvas.width + prj.radius || prj.y < -prj.radius || prj.y > canvas.height + prj.radius) { // OOB
      gameObjects.radialProjectiles.splice(i, 1) // removes projectiles outside of screen
      i--
    }
  }

  // Draw and update aimed turrets/projectiles
  for (let i=0; i < gameObjects.aimedProjectiles.length; i++) {

    const prj = gameObjects.aimedProjectiles[i]
    prj.update()
    if (circleCollides(player, prj)) { // check collision for each aimedProjectile with Player object
      handleScore()
      return
    }
    prj.draw()

    if (prj.x < -prj.radius || prj.x > canvas.width + prj.radius || prj.y < -prj.radius || prj.y > canvas.height + prj.radius) { // OOB
      gameObjects.aimedProjectiles.splice(i, 1) // remove projectiles outside of screen
      i--
    }
  }

  gameObjects.aimedTurrets.forEach((turret) => {
    turret.update()
    turret.draw()
  })

  timeoutIDs.gameLoop = window.requestAnimationFrame(gameLoop)
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
    timeoutIDs.createTurrets.push(
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
    // limit timeoutID array length by max number of turrets possibly pending for creation
    const maxPending = gameSettings.maxAimedTurrets + gameSettings.maxRadialTurrets
    while (timeoutIDs.createTurrets.length > maxPending) timeoutIDs.createTurrets.shift()
  }
}

function debounceIncreaseDifficulty() {
  clearTimeout(timeoutIDs.increaseDifficulty)
  timeoutIDs.increaseDifficulty = setTimeout(increaseDifficulty, 20)
}

// currently called every 5s starting from 10s totalTime
function increaseDifficulty() {
  gameSettings.difficultyCounter += 1 // increment first to prevent immediate increase to turrets and projectileCount

  // hardMode starts at 15s
  if (gameSettings.difficultyCounter === 10) { // set hardMode after X amount of calls to increaseDifficulty
    console.log('hardmode');
    gameSettings.hardMode = true
  }

  // 60, 160, 260, 360
  if (gameSettings.difficultyCounter % 11 === 0) {
    console.log('increased maxTurrets');
    gameSettings.maxAimedTurrets += 1
    gameSettings.maxRadialTurrets += 1
  }

  // 30, 55, 80, 105, 130
  if (gameSettings.difficultyCounter % 5 === 0) {
    console.log('increased projectileCount');
    gameSettings.numAimedProjectiles += 1
    gameSettings.numRadialProjectiles += 1
  }
}