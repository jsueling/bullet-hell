import './styles.css'

// using circular Projectile and CursorObject hitboxes to simplify collision detection and improve performance

let canvas
let ctx
let animationID
let resizeTimerID
let elapsedMs
let oldTimeStamp = 0

const gameSettings = {
  totalTime: 0,
  turretNumber: 5, // increase turret number/maxProjectile number with duration/score
  maxProjectiles: 50,
  reset() {
    this.score = 0
    this.turretNumber = 5
    this.maxProjectiles = 50
    this.totalTime = 0
  }
}

const gameObjects = {
  turrets: [],
  projectiles: [],
  reset() {
    this.turrets = []
    this.projectiles = []
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
    this.radius = canvas.height * 0.005
    this.x = this.radius + Math.random() * (canvas.width - 2 * this.radius) // always starts with its full diameter inside the box view
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

    if (this.y > canvas.height) { // OOB reset turret to top of screen
      this.x = Math.random() * canvas.width
      this.y = 0
      this.velY = canvas.height * (Math.random() * 0.001 + 0.001)
    }
  }

  fire() {
    const numProjectiles = Math.floor(Math.random() * 20) + 30 // random number of projectiles spawned for each turret, 30 to 50
    for (let i=0; i < numProjectiles; i++) {
			const slice = 2 * Math.PI / numProjectiles;
			const angle = slice * i;
      // each projectile gets normalized vector equally spaced around unit circle
      gameObjects.projectiles.push(new Projectile(this.x, this.y, Math.sin(angle), Math.cos(angle)))
    }
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

  for (let i=0; i < gameSettings.turretNumber; i++) {
    gameObjects.turrets.push(new Turret())
  }

  // returns DOMHighResTimeStamp which is the same format as the timeStamp passed to the callback of RequestAnimationFrame, animate in this case
  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#parameters
  oldTimeStamp = performance.now()

  animate(0) // specify the first timestamp passed to animate is 0
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

function drawScore(elapsedMs) {
  gameSettings.totalTime += elapsedMs
  const seconds = Math.round(gameSettings.totalTime/1000)
  ctx.save()
  ctx.fillStyle = 'white'
  ctx.translate(canvas.width * 0.1, canvas.height * 0.1) // score is time in seconds alive
  ctx.fillText(seconds, 0, 0)
  ctx.restore()
}

function animate(timeStamp) {
  ctx.save()
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.3)' // cheap trail effect
  // ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.restore()

  elapsedMs = (timeStamp - oldTimeStamp) // milliseconds passed since last call to animate
  oldTimeStamp = timeStamp

  cursorObject.draw()
  drawScore(elapsedMs)

  gameObjects.turrets.forEach((turret) => { // update and render turrets
    turret.update()
    turret.draw()
  })

  if (elapsedMs > 5000) { // TODO create/fire projectiles every 5 seconds, increase with score
    gameObjects.turrets.forEach((turret) => {
      turret.fire()
    })
  }

  for (let i=0; i < gameObjects.projectiles.length; i++) { // update and render projectiles
    let p = gameObjects.projectiles[i]
    p.update()

    if (cursorObject.collidesWith(p)) { // check collision of each projectile with cursorObject
      endGame()
      resetGame()
      startMenu()
      return
    }

    p.draw()

    if (p.x < -p.radius || p.x > canvas.width + p.radius || p.y < -p.radius || p.y > canvas.height + p.radius) { // OOB
      gameObjects.projectiles.splice(i, 1) // remove projectiles outside of screen
      i--
    }

  }

  animationID = window.requestAnimationFrame(animate)
}