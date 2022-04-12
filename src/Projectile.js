class Projectile {
  constructor(canvas, ctx, x, y, velX, velY) {
    this.canvas = canvas
    this.ctx = ctx
    this.x = x
    this.y = y
    this.velX = velX * (canvas.height + canvas.width) * 0.0005 // add magnitude to the normalized vectors to scale with canvas width/height
    this.velY = velY * (canvas.height + canvas.width) * 0.0005
  }

  draw() {
    this.ctx.save()
    this.ctx.shadowBlur = this.canvas.height * 0.01
    this.ctx.shadowColor = this.colour
    this.ctx.translate(this.x, this.y)
    this.ctx.fillStyle = this.colour
    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.restore()
  }

  update() {
    this.x += this.velX
    this.y += this.velY
  }
}

export class RadialProjectile extends Projectile {
  constructor(canvas, ctx, x, y, velX, velY) {
    super(canvas, ctx, x, y, velX, velY)
    this.colour = 'violet'
    this.radius = canvas.height * 0.003
  }
}

export class AimedProjectile extends Projectile {
  constructor(canvas, ctx, x, y, velX, velY) {
    super(canvas, ctx, x, y, velX, velY)
    this.colour = 'orange'
    this.radius = canvas.height * 0.003
  }
}

export class PlayerProjectile extends Projectile {
  constructor(canvas, ctx, x, y, velX, velY) {
    super(canvas, ctx, x, y, velX, velY)
    this.colour = 'magenta'
    this.radius = canvas.height * 0.002
  }
}