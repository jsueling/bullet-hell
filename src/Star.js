export default class Star {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.velY = canvas.height * (Math.random() * 0.0005 + 0.0005)
    this.radius = canvas.height * (Math.random() * 0.0009 + 0.0001)
  }

  update() {
    this.y += this.velY
    if (this.y > this.canvas.height + this.radius) {
      this.x = Math.random() * this.canvas.width // OOB, assign new random x position
      this.y = -this.radius
    }
  }

  draw() {
    // transparent larger circle drawn behind with shadowblur gives larger effect https://stackoverflow.com/a/41372024
    this.ctx.save()
    this.ctx.fillStyle = 'none'
    this.ctx.shadowColor = 'white'
    this.ctx.shadowBlur = this.canvas.height * 0.02
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.radius* 3, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.restore()

    this.ctx.save()
    this.ctx.fillStyle = 'white'
    this.ctx.shadowColor = 'white'
    this.ctx.shadowBlur = this.canvas.height * 0.01
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.restore()
  }
}