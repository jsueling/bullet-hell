import { AimedProjectile, RadialProjectile } from './Projectile'
import { gameSettings } from './index.js'

import redTurretFlame7 from '../assets/redTurretFlame7.png'
import greenTurretFlame2 from '../assets/greenTurretFlame2.png'

const greenSprite = new Image()
greenSprite.src = greenTurretFlame2

const redSprite = new Image()
redSprite.src = redTurretFlame7

class Turret {
  constructor(canvas, ctx, projectiles) {
    this.canvas = canvas
    this.ctx = ctx
    this.projectiles = projectiles
    this.velX = 0
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

    if (this.spriteCounter % 5 === 0) { // cycle sprite sheet
      this.spriteOffset = (this.spriteOffset + 200) % 800
    }

    this.spriteCounter += 1

    if (this.y > this.canvas.height + this.radius) { // OOB reset turret to top of screen
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
      'darkPink',
      'magenta'
    ]
  }

  draw() {
    this.ctx.save()
    this.ctx.translate(this.x, this.y)

    this.ctx.fillStyle = this.colour
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    this.ctx.drawImage(redSprite, this.spriteOffset, 0, 200, 400, -this.spriteSize * 2, -this.spriteSize * 6, this.spriteSize * 4, this.spriteSize * 8)
    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
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
    this.offSet = Math.PI * 0.04
    this.fireAimedMethods = [
      this.#lineAttack,
      this.#coneAttack,
      this.#shotgunAttack
    ]

    // When hardMode is enabled newly created aimedTurrets have access to the overTakeAttack fire method
    if (gameSettings.hardMode) {
      this.fireAimedMethods.push(this.#overTakeAttack)
    }
  }

  draw() {
    this.ctx.save()
    this.ctx.translate(this.x, this.y)

    this.ctx.fillStyle = this.colour
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
    this.ctx.drawImage(greenSprite, this.spriteOffset, 0, 200, 400, -this.spriteSize * 2, -this.spriteSize * 6, this.spriteSize * 4, this.spriteSize * 8)
  
    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()

    this.ctx.restore()
  }

  #lineAttack(projectileHue, minProjectileLight, maxProjectileLight) { // fires a line of projectiles aimed at the player
    let projectileLight = minProjectileLight
    const projectiles = gameSettings.numAimedProjectiles * 2
    for (let i=0; i < projectiles; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#fireAimed.bind(this, `hsl(${projectileHue}, 100%, ${projectileLight}%)`), i * 200)
      )
      projectileLight += 2
      if (projectileLight > maxProjectileLight) projectileLight = minProjectileLight
      while (this.delayedTimeoutIDs.length > projectiles) this.delayedTimeoutIDs.shift()
    }
  }

  #fireAimed(projectileColour) { // fires a projectile targeting the player
    const dist = Math.sqrt((this.x - this.player.x)**2 + (this.y - this.player.y)**2)
    const velX = (this.player.x - this.x) / dist // normalized vectors pointing from the turret to the player
    const velY = (this.player.y - this.y) / dist
    const magnitude = 2
    this.projectiles.push(new AimedProjectile(this.canvas, this.ctx, this.x, this.y, magnitude * velX, magnitude * velY, projectileColour))
  }

  #coneAttack(projectileHue, minProjectileLight, maxProjectileLight) { // fires decreasing rows of projectiles at the player
    const maxCone = gameSettings.numAimedProjectiles
    let projectileLight = minProjectileLight
    for (let i=0; i < maxCone; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#fireConeRow.bind(this, maxCone-i, `hsl(${projectileHue}, 100%, ${projectileLight}%)`), i * 200)
      )
      projectileLight += 5
      if (projectileLight > maxProjectileLight) projectileLight = minProjectileLight
      while (this.delayedTimeoutIDs.length > maxCone) this.delayedTimeoutIDs.shift()
    }
  }

  #fireConeRow(rowLen, projectileColour) { // fires a single row centered targeting the player
    // Math.atan2 https://en.wikipedia.org/wiki/Atan2
    const angleFromTurretToPlayer = Math.atan2(this.player.y - this.y, this.player.x - this.x)
     // align each row (startAngle) so that it centers the target differing for odd/even row length
    const startAngle = angleFromTurretToPlayer - this.offSet * (rowLen % 2 == 0 ? rowLen * 0.5 - 0.5 : Math.floor(rowLen * 0.5))
    const magnitude = 1.5

    for (let i=0; i < rowLen; i++) {
      this.projectiles.push(
        new AimedProjectile(
          this.canvas,
          this.ctx,
          this.x,
          this.y,
          magnitude * Math.cos(this.offSet * i + startAngle),
          magnitude * Math.sin(this.offSet * i + startAngle),
          projectileColour
        )
      )
    }
  }

  // Fire consecutive waves at the player, each wave is faster than the last and the start of the wave is offSet more relative to the target => overtake or unfolding animation
  #overTakeAttack(projectileHue, minProjectileLight, maxProjectileLight) { // credits to: https://youtu.be/xbQ9e0zYuj4?t=221
    const numWaves = gameSettings.numAimedProjectiles
    let projectileLight = minProjectileLight
    for (let i=0; i < numWaves; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(
          this.#overTakeWave.bind(
            this,
            0.3 + (i+1) * 0.3,
            (i+1) * 0.02 * Math.PI,
            `hsl(${projectileHue}, 100%, ${projectileLight}%)`
          ),
          i * 100
        )
      )
      projectileLight += 1
      if (projectileLight > maxProjectileLight) projectileLight = minProjectileLight
      while (this.delayedTimeoutIDs.length > numWaves) this.delayedTimeoutIDs.shift()
    }
  }

  #overTakeWave(magnitude, globalOffset, projectileColour) {
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

  // Fires projectiles tightly but randomly spread towards the player
  #shotgunAttack(projectileHue, minProjectileLight, maxProjectileLight) {
    const numWaves = gameSettings.numAimedProjectiles
    let projectileLight = minProjectileLight
    for (let i=0; i < numWaves; i++) {
      this.delayedTimeoutIDs.push(
        setTimeout(this.#shotgunWave.bind(this, `hsl(${projectileHue}, 100%, ${projectileLight}%)`), i * 100)
      )
      projectileLight += 5
      if (projectileLight > maxProjectileLight) projectileLight = minProjectileLight
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
    const projectileHue = 140 + Math.floor(Math.random() * 21)
    const minProjectileLight = 60
    const maxProjectileLight = 90
    this.fireAimedMethods[fireMethodsIndex].call(this, projectileHue, minProjectileLight, maxProjectileLight)
  }

  debounceFire() { // debounces the calls to fire from gameLoop to this turret
    if (this.fireTimeoutID) clearTimeout(this.fireTimeoutID)
    this.fireTimeoutID = setTimeout(this.#fireRandomAimedAttack.bind(this), 20)
  }
}