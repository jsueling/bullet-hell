import './styles.css'

// ctx.globalAlpha = value;

/**
 * use circle projectiles and hitboxes to simplify collision detection and improve performance
 * x distance between any 2 projectiles must be large enough at some point for the ship to pass
 */

const mouse = { x: 0, y: 0 }
let canvas
let ctx
let animationID
let resizeTimerID
let secondsPassed
let oldTimeStamp = 0
let turretNumber = 5 // increase turret number/projectile number with duration/score
let maxProjectiles = 50
let turrets = []
let projectiles = []
let score = 0

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
      projectiles.push(new Projectile(this.x, this.y, Math.sin(angle), Math.cos(angle)))
    }
  }
}

window.addEventListener('onload', init())

window.addEventListener('resize', function() {
  // cancel animation on resize and clear the canvas, then debounce restarting the animation
  endGame()
  clearTimeout(resizeTimerID)
  resizeTimerID = setTimeout(function() {
    reset()
    init()
  }, 200)
})

window.addEventListener('mousemove', function(e) {
  mouse.x = e.x
  mouse.y = e.y
})

function init() {
  canvas = document.getElementById('canvas1')
  ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  ctx.font = `${canvas.width * 0.02}px Arial`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'white'

  const menuText = 'PRESS SPACE TO START'

  ctx.save()
  ctx.translate(canvas.width/2, canvas.height/2)
  ctx.fillText(menuText, 0, 0)
  ctx.restore()

  document.addEventListener('keydown', spaceBarListener)
}

function spaceBarListener(e) {
  if (e.key === ' ') {
    endGame()
    reset()
    startGame()
  }
}

function startGame() {
  document.removeEventListener('keydown', spaceBarListener)

  mouse.x = canvas.width/2
  mouse.y = canvas.height/2

  for (let i=0; i < turretNumber; i++) {
    turrets.push(new Turret())
  }

  animate()
}

function endGame() {
  cancelAnimationFrame(animationID)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function reset() {
  turrets = []
  projectiles = []
  score = 0
}

function animate(timeStamp) {
  ctx.save()
  // ctx.fillStyle = 'rgba(0, 0, 0, 0.1)' // cheap trail effect
  // ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.restore()

  secondsPassed = (timeStamp - oldTimeStamp) / 1000; // seconds passed since last frame

  drawCursor()

  turrets.forEach((turret) => { // update and render turrets
    turret.update()
    turret.draw()
  })

  if (secondsPassed > 5) { // create/fire projectiles every 5 seconds, increase with score
    turrets.forEach((turret) => {
      turret.fire()
    })
    oldTimeStamp = timeStamp
  }

  for (let i=0; i < projectiles.length; i++) { // update and render projectiles
    let p = projectiles[i]
    p.update()
    p.draw()
    if (p.x < -p.radius || p.x > canvas.width + p.radius || p.y < -p.radius || p.y > canvas.height + p.radius) { // OOB
      projectiles.splice(i, 1) // remove projectiles outside of screen
      i--
    }
  }

  animationID = window.requestAnimationFrame(animate)
}

function drawCursor() {
  ctx.save()
  ctx.fillStyle = 'blue'
  ctx.beginPath()
  ctx.arc(mouse.x, mouse.y, canvas.height * 0.02, 0, 2 * Math.PI)
  ctx.fill()
  ctx.restore()
}