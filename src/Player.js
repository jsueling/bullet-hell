import { PlayerProjectile } from "./Projectile"
import { gameTimers, gameObjects } from './index.js'

import playerParticleSheet from '../assets/playerParticles2.png'
import playerBarrelSprite from '../assets/playerBarrels.png'

const playerBarrels = new Image()
playerBarrels.src = playerBarrelSprite

const playerGlow = new Image()
playerGlow.src = playerParticleSheet

export class Player {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    this.x = 0,
    this.y = 0,
    this.radius = canvas.height * 0.01 // responsive size
    this.fireIntervalID = undefined
    this.colour = '#74a0f1'

    this.spriteOffset = 0
    this.spriteSize = this.radius
    this.spriteCounter = 0
  }

  draw() {
    this.ctx.save()
    this.ctx.translate(this.x, this.y)
    // barrels
    this.ctx.drawImage(playerBarrels, -this.radius * 2, -this.radius * 2, this.radius * 4, this.radius * 4)

    // trail
    this.ctx.drawImage(playerGlow, this.spriteOffset, 0, 200, 400, -this.spriteSize * 2, -this.spriteSize * 2, this.spriteSize * 4, this.spriteSize * 8)
    
    this.ctx.fillStyle = this.colour

    this.ctx.shadowColor = this.colour
    this.ctx.shadowBlur = this.canvas.height * 0.004

    // circle
    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()

    this.ctx.restore()

    if (this.spriteCounter % 12 === 0) { // cycle sprite sheet
      this.spriteOffset = (this.spriteOffset + 200) % 800
    }

    this.spriteCounter += 1
  }

  resize() { // resize the player object relative to the canvas
    this.radius = this.canvas.height * 0.01
    this.spriteSize = this.radius
  }

  fire() {
    if (!gameTimers.paused) {
      const projectileColour = '#99bdff'
      gameObjects.playerProjectiles.push( // fires 2 shots upwards at L, R edge of the Player
        new PlayerProjectile(this.canvas, this.ctx, this.x - this.radius + this.canvas.height * 0.002, this.y, 0, -3, projectileColour),
        new PlayerProjectile(this.canvas, this.ctx, this.x + this.radius - this.canvas.height * 0.002, this.y, 0, -3, projectileColour),
      )
    }
  }

  startFireInterval() {
    this.fireIntervalID = setInterval(this.fire.bind(this), 500)
  }

  clearFireInterval() {
    clearInterval(this.fireIntervalID)
  }
}
