class Projectile {
  constructor(canvas, ctx, x, y, velX, velY) {
    this.canvas = canvas
    this.ctx = ctx
    this.x = x
    this.y = y
    this.velX = velX * (canvas.height + canvas.width) * 0.0005 // add magnitude to the normalized vectors to scale with canvas width/height
    this.velY = velY * (canvas.height + canvas.width) * 0.0005
  }

  // removed shadowBlur from projectiles because it kills performance

  draw() {
    this.ctx.save()
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
        this.colours = ['hsl(0, 100%, 65%)', 'hsl(0, 100%, 70%)', 'hsl(0, 100%, 75%)', 'hsl(0, 100%, 80%)', 'hsl(0, 100%, 85%)'] // https://www.w3schools.com/colors/colors_hsl.asp
        break
      case 'darkPink':
        this.colours = ['hsl(350, 100%, 65%)', 'hsl(350, 100%, 70%)', 'hsl(350, 100%, 75%)', 'hsl(350, 100%, 80%)', 'hsl(350, 100%, 85%)']
        break
      case 'magenta':
        this.colours = ['hsl(355, 100%, 65%)', 'hsl(355, 100%, 70%)', 'hsl(355, 100%, 75%)', 'hsl(355, 100%, 80%)', 'hsl(355, 100%, 85%)']
        break
    }
  }

  draw() {
    if (this.colourIndex == this.colours.length) this.colourIndex = 0
  
    this.ctx.save()
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
  constructor(canvas, ctx, x, y, velX, velY, aimedProjectileColour) {
    super(canvas, ctx, x, y, velX, velY)
    this.colour = aimedProjectileColour
    this.radius = canvas.height * 0.003
  }
}

export class PlayerProjectile extends Projectile {
  constructor(canvas, ctx, x, y, velX, velY, projectileColour) {
    super(canvas, ctx, x, y, velX, velY)
    this.colour = projectileColour
    this.radius = canvas.height * 0.002
  }
}