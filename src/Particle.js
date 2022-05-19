export default class Particle {
  constructor(canvas, ctx, x, y, colour) {
    this.canvas = canvas
    this.ctx = ctx
    this.x = x
    this.y = y
    this.velX = (Math.random() - 0.5) * Math.random() * canvas.height * 0.002 // Speed vector given to the particle within square box around it scaled by random magnitude
    this.velY = (Math.random() - 0.5) * Math.random() * canvas.height * 0.002
    this.radius = canvas.height * 0.002 + Math.random() * canvas.height * 0.002 // random radius with minimum
    this.colour = colour
    this.opacity = 1
  }

  update() {
    this.x += this.velX
    this.y += this.velY
    this.opacity *= 0.97 // fade out particles in size and opacity
    if (this.radius > 0) this.radius *= 0.98
  }

  draw() {
    this.ctx.save()
    this.ctx.translate(this.x, this.y)
    this.ctx.globalAlpha = this.opacity
    this.ctx.shadowBlur = this.canvas.height * 0.01
    this.ctx.shadowColor = this.colour
    this.ctx.fillStyle = this.colour
    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.restore()
  }
}