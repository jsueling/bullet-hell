import { AimedProjectile, RadialProjectile } from './Projectile'
import { gameSettings } from './index.js'

import redParticleSheet from '../assets/redTurretParticles2.png'
import greenParticleSheet from '../assets/greenTurretParticles4.png'
import aimedBarrelSprite from '../assets/aimedBarrel.png'

const aimedBarrel = new Image()
aimedBarrel.src = aimedBarrelSprite

const aimedTurGlow = new Image()
aimedTurGlow.src = greenParticleSheet

const radialTurGlow = new Image()
radialTurGlow.src = redParticleSheet

class Turret {
  constructor(canvas, ctx, projectiles) {
    this.canvas = canvas
    this.ctx = ctx
    this.projectiles = projectiles
    this.fireTimeoutID = undefined // stores the debounced timeoutID call for this turret to invoke a fire method once
    this.delayedTimeoutIDs = [] // stores the current timeoutIDs of this turret's fire methods
    this.radius = canvas.height * 0.01
    this.x = this.radius + Math.random() * (canvas.width - 2 * this.radius) // always starts with its full diameter inside the viewport
    this.y = -this.radius

    this.spriteOffset = 0
    this.spriteSize = this.radius
    this.spriteCounter = 0
  }

  update() {
    this.y += this.velY

    if (this.spriteCounter % 10 === 0) { // cycle sprite sheet
      this.spriteOffset = (this.spriteOffset + 200) % 800
    }

    this.spriteCounter += 1

    if (this.y > this.canvas.height + this.radius * 6) { // OOB reset turret to top of screen, accounting for spriteSheet size
      this.x = Math.random() * this.canvas.width
      this.y = -this.radius
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

export class RadialTurret extends Turret {
  constructor(canvas, ctx, projectiles) {
    super(canvas, ctx, projectiles)
    this.colour = '#f17479'
    let turretSpeed = this.canvas.height * (Math.random() * 0.00025 + 0.00025)
    // if hardMode enabled, change turretSpeed 50% of the time
    if (gameSettings.hardMode && Math.random() < 0.5) turretSpeed = this.canvas.height * (Math.random() * 0.005 + 0.005)
    this.velY = turretSpeed
    this.offSet = 0
    this.fireRadialMethods = [ // store function references in array https://stackoverflow.com/a/9792043
      this.#fireRadial,
      this.#fireWindmillRings,
      this.#fireFlowerRings,
      this.#fireSpiralRings,
    ]
    this.projectileColours = [
      'red',
      'magenta',
      'pink'
    ]
  }

  draw() {
    this.ctx.save()
    this.ctx.translate(this.x, this.y)

    this.ctx.shadowColor = this.colour
    this.ctx.shadowBlur = this.canvas.height * 0.005

    this.ctx.fillStyle = this.colour
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    this.ctx.drawImage(radialTurGlow, this.spriteOffset, 0, 200, 400, -this.spriteSize * 2, -this.spriteSize * 6, this.spriteSize * 4, this.spriteSize * 8)
    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()

    this.ctx.restore()
  }

  drawBarrel() {
    this.ctx.save()

    this.ctx.translate(this.x, this.y)

    this.ctx.fillStyle = '#7d0c10'
    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius*0.45, 0, 2*Math.PI)
    this.ctx.fill()

    this.ctx.restore()
  }

  #fireRadial(projectileColour) { // fires evenly spaced projectiles emitted from the centre of each turret
    const radialProjectiles = gameSettings.numRadialProjectiles * 5

    const randomPartition = (Math.random() * Math.PI) + Math.PI // varies between Pi and 2Pi radians

    for (let i=0; i < radialProjectiles; i++) {
      const slice = 2 * Math.PI / radialProjectiles;
      const angle = slice * i;

      // calculate a randomPartition angle on lower half of circle then skip firing projectiles in a 5% range either side
      if (angle > randomPartition * 0.95 && angle < randomPartition * 1.05) continue

      // assigns vectors that evenly distributes each radialProjectile around the unit circle
      this.projectiles.push(new RadialProjectile(this.canvas, this.ctx, this.x, this.y, Math.cos(angle), Math.sin(-angle), projectileColour)) // correct for down increasing y
    }
  }

  #spiralRing(projectileColour) { // single spiral ring accumulating offSet each time it is called
    const angle = this.offSet
    this.projectiles.push(new RadialProjectile(this.canvas, this.ctx, this.x, this.y, Math.cos(angle), Math.sin(angle), projectileColour))
    this.offSet += Math.PI * 0.33
  }
  
  #fireSpiralRings(projectileColour) { // fires rings in a spiral pattern
    const numSpiralRings = gameSettings.numRadialProjectiles * 5 * (1 + Math.floor(Math.random() * 3))
    for (let i=0; i < numSpiralRings; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#spiralRing.bind(this, projectileColour), i * 10)
      )
    }
    while (this.delayedTimeoutIDs.length > numSpiralRings) this.delayedTimeoutIDs.shift()
  }
  
  #flowerRing(projectileColour) { // single ring staggering lines equal and opposite of each other accumulating offset for each call
    const angle = this.offSet
    this.projectiles.push(new RadialProjectile(this.canvas, this.ctx, this.x, this.y, Math.cos(angle), Math.sin(angle), projectileColour))
    this.projectiles.push(new RadialProjectile(this.canvas, this.ctx, this.x, this.y, Math.cos(-angle), Math.sin(-angle), projectileColour))
    this.offSet += Math.PI * 0.22
  }
  
  #fireFlowerRings(projectileColour) { // fires rings in a flower pattern
    const numFlowerRings = gameSettings.numRadialProjectiles * 2.5 * (1 + Math.floor(Math.random() * 3)) // 100 + 100 * Math.floor(Math.random() * 3)
    for (let i=0; i < numFlowerRings; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#flowerRing.bind(this, projectileColour), i * 20)
      )
    }
    while (this.delayedTimeoutIDs.length > numFlowerRings) this.delayedTimeoutIDs.shift()
  }

  #windMillRing(projectileColour) { // single ring of straight line + staggered line
    for (let j=0; j < gameSettings.numRadialProjectiles; j++) { // these rings do not accumulate offset i.e. fires a straight line
      const slice = 2 * Math.PI / gameSettings.numRadialProjectiles;
      const angle = slice * j;
      this.projectiles.push(new RadialProjectile(this.canvas, this.ctx, this.x, this.y, Math.cos(angle), Math.sin(angle), projectileColour))
    }
    for (let j=0; j < gameSettings.numRadialProjectiles; j++) { // these rings accumulate offset which staggers projectiles
      const slice = 2 * Math.PI / gameSettings.numRadialProjectiles;
      const angle = this.offSet + slice * j;
      this.projectiles.push(new RadialProjectile(this.canvas, this.ctx, this.x, this.y, Math.cos(angle), Math.sin(angle), projectileColour))
    }
    this.offSet += Math.PI * 0.22 // accumulate offSet for each ring
  }

  #fireWindmillRings(projectileColour) { // fires rings in a windmill pattern
    const numWindmillRings = gameSettings.numRadialProjectiles * (0.5 + 0.5 * Math.floor(Math.random() * 3)) // * 0.5, * 1, * 1.5
    for (let i=0; i < numWindmillRings; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#windMillRing.bind(this, projectileColour), i * 120) // bind this context when setTimeout calls the method of this turret
      )
      // FIFO only store the most recent delayedTimeoutIDs
      while (this.delayedTimeoutIDs.length > numWindmillRings) this.delayedTimeoutIDs.shift()
    }
  }

  // fires a random attack from this.fireRadialMethods array
  #fireRandomRadialAttack() {
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    const fireMethodsIndex = Math.floor(Math.random() * this.fireRadialMethods.length) // Math.random() returns 0 to <1. Safe to floor the result and not get an out of bounds index
    const randomProjectileColour = this.projectileColours[Math.floor(Math.random() * this.projectileColours.length)]
    this.fireRadialMethods[fireMethodsIndex].call(this, randomProjectileColour)
  }

  debounceFire() { // debounce call for this turret to fire
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireRandomRadialAttack.bind(this), 20)
  }
}

export class AimedTurret extends Turret {
  constructor(canvas, ctx, projectiles, player) {
    super(canvas, ctx, projectiles)
    this.player = player
    this.colour = '#4caf50'
    this.velY = canvas.height * (Math.random() * 0.0005 + 0.0005) // velocity varying between 0.05 to 0.1 % of canvas height
    this.projectileLight = 73
    this.minProjectileHue = 80
    this.maxProjectileHue = 180
    this.projectileHueRange = this.maxProjectileHue - this.minProjectileHue
    this.projectileSaturation = 82
    this.fireAimedMethods = [
      this.#lineAttack,
      this.#coneAttack,
      this.#shotgunAttack,
      this.#overtakeArrowAttack
    ]

    // When hardMode is enabled newly created aimedTurrets have access to the overtakeWaveAttack fire method
    if (gameSettings.hardMode) {
      this.fireAimedMethods.push(this.#overtakeWaveAttack)
    }
  }

  draw() {
    this.ctx.save()
    this.ctx.translate(this.x, this.y)

    this.ctx.shadowColor = this.colour
    this.ctx.shadowBlur = this.canvas.height * 0.005

    this.ctx.fillStyle = this.colour
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    this.ctx.drawImage(aimedTurGlow, this.spriteOffset, 0, 200, 400, -this.spriteSize * 2, -this.spriteSize * 6, this.spriteSize * 4, this.spriteSize * 8)
  
    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()

    this.ctx.restore()

    // barrel sprite
    this.ctx.save()
    this.ctx.translate(this.x, this.y)
    // correct for y axis being positive in downward direction with * -1
    const angleToPlayer = Math.atan2(-1 * (this.player.y - this.y), this.player.x - this.x)
    // ctx.rotate() rotates from the x-axis down while math.atan2 gives us an angle from the x-axis up. the sprite is drawn facing up which we also need to correct for
    this.ctx.rotate(-angleToPlayer + Math.PI / 2)
    this.ctx.drawImage(aimedBarrel, -this.radius * 2, -this.radius * 2, this.radius * 4, this.radius * 4)
    this.ctx.restore()
  }

  #lineAttack() { // fires a line of projectiles aimed at the player
    const projectiles = gameSettings.numAimedProjectiles
    const colourIncrement = this.projectileHueRange / projectiles
    for (let i=0; i < projectiles; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#fireAimed.bind(this, `hsl(${this.minProjectileHue + (colourIncrement * i)}, ${this.projectileSaturation}%, ${this.projectileLight}%)`), i * 200)
      )
      while (this.delayedTimeoutIDs.length > projectiles) this.delayedTimeoutIDs.shift()
    }
  }

  #fireAimed(projectileColour) { // fires a projectile targeting the player
    const dist = Math.sqrt((this.x - this.player.x)**2 + (this.y - this.player.y)**2)
    const velX = (this.player.x - this.x) / dist // normalized vectors pointing from the turret to the player
    const velY = (this.player.y - this.y) / dist
    const magnitude = 3
    this.projectiles.push(new AimedProjectile(this.canvas, this.ctx, this.x, this.y, magnitude * velX, magnitude * velY, projectileColour))
  }

  #coneAttack() { // fires decreasing rows of projectiles at the player
    const maxCone = gameSettings.numAimedProjectiles
    const colourIncrement = this.projectileHueRange / maxCone
    for (let i=0; i < maxCone; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#fireConeRow.bind(this, maxCone-i, `hsl(${this.minProjectileHue + (colourIncrement * i)}, ${this.projectileSaturation}%, ${this.projectileLight}%)`), i * 200)
      )
      while (this.delayedTimeoutIDs.length > maxCone) this.delayedTimeoutIDs.shift()
    }
  }

  #fireConeRow(rowLen, projectileColour) { // fires a single row centered targeting the player
    // Math.atan2 https://en.wikipedia.org/wiki/Atan2
    const angleFromTurretToPlayer = Math.atan2(this.player.y - this.y, this.player.x - this.x)
    // align each row (startAngle) so that it centers the target differing for odd/even row length
    const offset = Math.PI * 0.01
    const startAngle = angleFromTurretToPlayer - offset * (rowLen % 2 == 0 ? rowLen * 0.5 - 0.5 : Math.floor(rowLen * 0.5))
    const magnitude = 1.5

    for (let i=0; i < rowLen; i++) {
      this.projectiles.push(
        new AimedProjectile(
          this.canvas,
          this.ctx,
          this.x,
          this.y,
          magnitude * Math.cos(offset * i + startAngle),
          magnitude * Math.sin(offset * i + startAngle),
          projectileColour
        )
      )
    }
  }

  // Fire consecutive waves at the player, each wave is faster than the last and the start of the wave is offSet more relative to the target => overtake or unfolding animation
  #overtakeWaveAttack() { // credits to: https://youtu.be/xbQ9e0zYuj4?t=221
    const numWaves = gameSettings.numAimedProjectiles * 3
    const colourIncrement = this.projectileHueRange / numWaves
    for (let i=0; i < numWaves; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(
          this.#overtakeWave.bind(
            this,
            0.3 + (i+1) * 0.3,
            (i+1) * 0.02 * Math.PI,
            `hsl(${this.minProjectileHue + (colourIncrement * i)}, ${this.projectileSaturation}%, ${this.projectileLight}%)`
          ),
          i * 100
        )
      )

      while (this.delayedTimeoutIDs.length > numWaves) this.delayedTimeoutIDs.shift()
    }
  }

  #overtakeWave(magnitude, globalOffset, projectileColour) {
    const angleFromTurretToPlayer = Math.atan2(this.player.y - this.y, this.player.x - this.x)
    const innerOffset = 0.1 * Math.PI
    const startAngle = angleFromTurretToPlayer - innerOffset * 2.5
    for (let i=0; i < 5; i++) {
      const curAngle = startAngle + (innerOffset * i) + globalOffset
      this.projectiles.push(
        new AimedProjectile(
          this.canvas,
          this.ctx,
          this.x,
          this.y,
          magnitude * Math.cos(curAngle),
          magnitude * Math.sin(curAngle),
          projectileColour
        )
      )
    }
  }

  #overtakeArrowAttack() {
    const arrowWidth = gameSettings.numAimedProjectiles // 5
    const colourIncrement = this.projectileHueRange / arrowWidth
    const angleFromTurretToPlayer = Math.atan2(this.player.y - this.y, this.player.x - this.x)
    const angleIncrement = Math.PI * 0.05
    const magnitude = 1

    let angle = angleFromTurretToPlayer - (arrowWidth + 1) * angleIncrement

    for (let i=0; i < arrowWidth; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(
          this.#overtakeArrow.bind(
            this,
            angle,
            magnitude * (i + 1), // * 0.1
            `hsl(${this.minProjectileHue + (colourIncrement * i)}, ${this.projectileSaturation}%, ${this.projectileLight}%)`
          ),
          i * 100
        )
      )
      angle += angleIncrement
    }

    angle += angleIncrement * 2 // head

    for (let i=arrowWidth-1; i >= 0; i--) {
      this.delayedTimeoutIDs.push(
        setTimeout(
          this.#overtakeArrow.bind(
            this,
            angle,
            magnitude * (i + 1),
            `hsl(${this.minProjectileHue + (colourIncrement * i)}, ${this.projectileSaturation}%, ${this.projectileLight}%)`
          ),
          i * 100
        )
      )
      angle += angleIncrement
    }
  }

  #overtakeArrow(angle, magnitude, projectileColour) {
    this.projectiles.push(
      new AimedProjectile(
        this.canvas,
        this.ctx,
        this.x,
        this.y,
        magnitude * Math.cos(angle),
        magnitude * Math.sin(angle),
        projectileColour
      )
    )
  }

  // Fires projectiles tightly but randomly spread towards the player
  #shotgunAttack() {
    const numWaves = gameSettings.numAimedProjectiles
    const colourIncrement = this.projectileHueRange / numWaves
    for (let i=0; i < numWaves; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#shotgunWave.bind(this, `hsl(${this.minProjectileHue + (colourIncrement * i)}, ${this.projectileSaturation}%, ${this.projectileLight}%)`), i * 100)
      )
      while (this.delayedTimeoutIDs.length > numWaves) this.delayedTimeoutIDs.shift()
    }
  }

  #shotgunWave(projectileColour) {
    const angleFromTurretToPlayer = Math.atan2(this.player.y - this.y, this.player.x - this.x)
    const waveSize = gameSettings.numAimedProjectiles
    const magnitude = 1.5
    for (let i=0; i < waveSize; i++) {
      this.projectiles.push(
        new AimedProjectile(
          this.canvas,
          this.ctx,
          this.x,
          this.y,
          magnitude * Math.cos(angleFromTurretToPlayer + (Math.random() - 0.5) * Math.PI * 0.0625),
          magnitude * Math.sin(angleFromTurretToPlayer + (Math.random() - 0.5) * Math.PI * 0.0625),
          projectileColour
        )
      )
    }
  }

  #fireRandomAimedAttack() { // fires a random attack from this.fireAimedMethods array
    const fireMethodsIndex = Math.floor(Math.random() * this.fireAimedMethods.length)
    this.fireAimedMethods[fireMethodsIndex].call(this)
  }

  debounceFire() { // debounces the calls to fire from gameLoop to this turret
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireRandomAimedAttack.bind(this), 20)
  }
}