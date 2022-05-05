import { PlayerProjectile } from "./Projectile"
import { gameTimers, gameObjects } from './index.js'

// import playerGlow4 from '../assets/playerGlow4.png' TODO

// const glowSprite = new Image()
// glowSprite.src = playerGlow4

export class Player {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    this.x = 0,
    this.y = 0,
    this.radius = canvas.height * 0.01 // Player Object size is responsive to canvas height
    this.fireIntervalID = undefined
    this.colour = '#7dabff'

    // this.spriteOffset = 0
    // this.spriteSize = this.radius
    // this.spriteCounter = 0
  }
  draw() {
    this.ctx.save()
    this.ctx.translate(this.x, this.y)
    this.ctx.fillStyle = this.colour

    this.ctx.shadowColor = this.colour
    this.ctx.shadowBlur = this.canvas.height * 0.004

    // this.ctx.drawImage(glowSprite, this.spriteOffset, 0, 200, 200, -this.spriteSize * 2, -this.spriteSize * 2, this.spriteSize * 4, this.spriteSize * 4)

    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.restore()

    // if (this.spriteCounter % 5 === 0) { // cycle sprite sheet
    //   this.spriteOffset = (this.spriteOffset + 200) % 800
    // }

    // this.spriteCounter += 1
  }
  resize() { // resize the player object relative to the canvas
    this.radius = this.canvas.height * 0.01
    this.spriteSize = this.radius
  }
  fire() {
    if (!gameTimers.paused) {
      const projectileColour = '#99bdff'
      gameObjects.playerProjectiles.push( // fires 2 shots upwards at L, R edge of the Player
        new PlayerProjectile(this.canvas, this.ctx, this.x - this.radius, this.y, 0, -3, projectileColour),
        new PlayerProjectile(this.canvas, this.ctx, this.x + this.radius, this.y, 0, -3, projectileColour),
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
