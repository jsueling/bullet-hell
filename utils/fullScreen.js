// openFullscreen and closeFullScreen copied from: https://www.w3schools.com/jsref/event_fullscreenchange.asp

let elem = document.documentElement;

/* Function to open fullscreen mode */
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) { /* Firefox */
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE/Edge */
    elem = window.top.document.body; // To break out of frame in IE
    elem.msRequestFullscreen();
  }
}

/* Function to close fullscreen mode */
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    window.top.document.msExitFullscreen();
  }
}

function toggleFullscreen() {
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/fullscreenElement
  // document.fullScreenElement returns the element that is currently being displayed in fullScreen or null if nothing is in fullScreen
  if (!document.fullscreenElement) openFullscreen()
  else closeFullscreen()
}

export { toggleFullscreen }