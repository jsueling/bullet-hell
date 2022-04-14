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
  constructor(canvas, ctx, x, y, velX, velY, radialProjectileColour) {
    super(canvas, ctx, x, y, velX, velY)
    this.colourIndex = 0
    this.frames = 0
    this.radius = canvas.height * 0.003
    switch(radialProjectileColour) {
      case 'red':
        this.colours = ['#f9d5e5', '#eeac99', '#e06377', '#c83349']
        break
      case 'mint':
        this.colours = ['#1FAB89', '#62D2A2', '#9DF3C4', '#D7FBE8']
        break
    }
  }

  draw() {
    if (this.colourIndex == this.colours.length) this.colourIndex = 0
  
    this.ctx.save()
    this.ctx.shadowBlur = this.canvas.height * 0.01
    this.ctx.shadowColor = this.colours[this.colourIndex]
    this.ctx.translate(this.x, this.y)
    this.ctx.fillStyle = this.colours[this.colourIndex]
    this.ctx.beginPath()
    this.ctx.arc(0, 0, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.restore()

    // every 20 calls to draw (frames), change this projectile's colour (colourIndex)
    if (this.frames % 20 == 0) this.colourIndex += 1
    this.frames += 1
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