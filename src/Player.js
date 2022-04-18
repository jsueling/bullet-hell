import { PlayerProjectile } from "./Projectile"
import { gameTimers, gameObjects } from './index.js'

export class Player {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    this.x = 0,
    this.y = 0,
    this.radius = 0,
    this.radius = canvas.height * 0.01 // Player Object size is responsive to canvas height
    this.fireIntervalID = undefined
  }
  draw() {
    this.ctx.save()
    this.ctx.fillStyle = 'blue'
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.restore()
  }
  resize() { // resize the player object relative to the canvas
    this.radius = this.canvas.height * 0.01
  }
  fire() {
    if (!gameTimers.paused) {
      const projectileColour = 'hsl(180, 100%, 70%)'
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
