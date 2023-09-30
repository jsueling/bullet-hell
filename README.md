
Bullet hell themed game built with HTML, CSS, Javascript and bundled with Webpack. The difficulty increases with time spent alive which increases the number of enemies, projectiles and types of attack. The game ends when the difficulty is too high for the player. The goal is to beat your personal highscore which is based on time spent alive.

Live Demo: https://bullet-hell.netlify.app/
<hr>
<div align="center">
  <img src="https://github.com/jamessl154/bullet-hell/assets/64977718/e6b66d41-1de0-4d8c-b2a3-6d52b6ed2857" alt="bullet hell gif" />
</div>
<hr>

## File Description

- **index.js** contains the core game logic that uses the Web APIs `HTMLCanvasElement.getContext("2d")` and `window.requestAnimationFrame()` for 2D animation
- **index.html** contains the HTML skeleton with our canvas element
- **Particle.js** contains the class for each object created from the explosion when an enemy is destroyed
- **Player.js** contains the class representing the player's ship
- **Projectile.js** contains the class for instantiating projectile objects
- **Star.js** contains the implementation for stars that give the effect of moving through space
- **Turret.js** contains the Turret class and the implementation of the two types of turrets and their firing methods
- **/assets** contains sprite sheets and turrets made by me
- **/utils/fullScreen.js** contains the implementation for toggling full screen depending on the web browser copied from [here](https://www.w3schools.com/jsref/event_fullscreenchange.asp)

## How to run

Requires [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

```
# clone this repository
git clone https://github.com/jamessl154/bullet-hell.git

# navigate to the directory
cd bullet-hell

# install dependencies
npm install

# opens the app locally with webpack-dev-server for development
npm start

# builds the code for production into the ./dist directory ready for deployment to a server
npm run build
```
