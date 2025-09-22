# Bullet Hell

A classic bullet hell style game built from scratch using HTML, CSS, and JavaScript. The objective is to survive as long as possible by dodging an ever-increasing barrage of projectiles from enemy turrets. Your score is based on your survival time, with high scores saved locally in your browser.

[**Live Demo**](https://bullet-hell.netlify.app/)

<div align="center">
  <img src="https://github.com/jamessl154/bullet-hell/assets/64977718/e6b66d41-1de0-4d8c-b2a3-6d52b6ed2857" alt="bullet hell gameplay gif" />
</div>

## Features

- **Endless Gameplay:** Survive as long as you can against waves of enemies.
- **Dynamic Difficulty:** The game gets harder over time, with more enemies, faster projectiles, and complex attack patterns.
- **Two Enemy Types:** Face off against Radial Turrets with area-denial attacks and Aimed Turrets that target the player directly.
- **High Score System:** Compete against yourself with a persistent high score board saved via `localStorage`.
- **Responsive Design:** The game canvas and UI adapt to any screen size.
- **Visual Effects:** Features particle explosions and smooth animations powered by `requestAnimationFrame`.

## Built With

- HTML5
- CSS3
- JavaScript (ES6+)
- Webpack

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You'll need [Node.js](https://nodejs.org/en/) (which includes npm) and [Git](https://git-scm.com/) installed on your machine.

### Installation & Usage

1.  Clone the repository:
    ```sh
    git clone https://github.com/jsueling/bullet-hell.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd bullet-hell
    ```
3.  Install NPM packages:
    ```sh
    npm install
    ```
4.  Start the development server:
    ```sh
    npm start
    ```
    This will open the game in your default browser.

5.  To create a production build:
    ```sh
    npm run build
    ```
    This bundles the application into the `/dist` directory, ready for deployment.

## Acknowledgements

-   The fullscreen toggle implementation is adapted from [W3Schools](https://www.w3schools.com/jsref/event_fullscreenchange.asp).