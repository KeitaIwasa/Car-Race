import {
  GAME_CANVAS_ASPECT,
  GAME_CANVAS_WIDTH,
  VIEWPORT_RESIZE_DEBOUNCE_MS,
} from "./constants.js";
import { canvas } from "./ui.js";

const root = document.documentElement;
const gameShell = document.querySelector(".game-shell");
const hud = document.querySelector(".hud");
const controls = document.querySelector(".controls");

const toNumber = (value) => Number.parseFloat(value) || 0;

const getVisibleHeight = (element) =>
  element && element.offsetParent ? element.offsetHeight : 0;

function readViewportHeight() {
  return (
    window.visualViewport?.height ??
    window.innerHeight ??
    document.documentElement?.clientHeight ??
    GAME_CANVAS_WIDTH * GAME_CANVAS_ASPECT
  );
}

function applyViewportVars(viewportHeight) {
  root.style.setProperty("--app-viewport-height", `${viewportHeight}px`);
}

function clampCanvasDimensions(widthBudget, heightBudget) {
  let width = widthBudget > 0 ? widthBudget : GAME_CANVAS_WIDTH;
  let height = width * GAME_CANVAS_ASPECT;

  if (heightBudget > 0 && height > heightBudget) {
    height = heightBudget;
    width = height / GAME_CANVAS_ASPECT;
  }

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

function sizeCanvas(viewportHeight) {
  if (!canvas || !gameShell) {
    return;
  }

  const bodyStyles = getComputedStyle(document.body);
  const bodyPaddingTop = toNumber(bodyStyles.paddingTop);
  const bodyPaddingBottom = toNumber(bodyStyles.paddingBottom);
  const verticalBudget = Math.max(
    viewportHeight - bodyPaddingTop - bodyPaddingBottom,
    0
  );

  const shellStyles = getComputedStyle(gameShell);
  const shellPaddingTop = toNumber(shellStyles.paddingTop);
  const shellPaddingBottom = toNumber(shellStyles.paddingBottom);
  const shellPaddingLeft = toNumber(shellStyles.paddingLeft);
  const shellPaddingRight = toNumber(shellStyles.paddingRight);

  const hudHeight = getVisibleHeight(hud);
  const controlsHeight = getVisibleHeight(controls);
  const controlsGap =
    controlsHeight > 0
      ? toNumber(getComputedStyle(controls).marginTop)
      : 0;

  const chromeHeight =
    shellPaddingTop +
    shellPaddingBottom +
    hudHeight +
    controlsHeight +
    controlsGap;

  const availableForCanvas = Math.max(verticalBudget - chromeHeight, 1);
  const shellContentWidth =
    gameShell.clientWidth - shellPaddingLeft - shellPaddingRight;

  const { width, height } = clampCanvasDimensions(
    shellContentWidth,
    availableForCanvas
  );

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

export function syncViewportLayout() {
  const viewportHeight = readViewportHeight();
  applyViewportVars(viewportHeight);
  sizeCanvas(viewportHeight);
}

export function initializeViewportLayout(afterSync) {
  let resizeTimer = null;

  const scheduleSync = () => {
    if (resizeTimer) {
      window.clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(() => {
      resizeTimer = null;
      syncViewportLayout();
      afterSync?.();
    }, VIEWPORT_RESIZE_DEBOUNCE_MS);
  };

  window.addEventListener("resize", scheduleSync);
  window.addEventListener("orientationchange", scheduleSync);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleSync);
  }
}
