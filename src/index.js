import './styles.css'

let canvas
let ctx

window.addEventListener('onload', init())
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
})

function init() {
  canvas = document.getElementById('canvas1')
  ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function animate() {
  draw()
  window.requestAnimationFrame(animate)
}

function draw() {
  ctx.fillStyle = 'blue'
  ctx.fillRect(0, 0, 100, 100)
}

animate()