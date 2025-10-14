import {
  touchLeft,
  touchRight,
  touchJump,
} from "./ui.js";

export function bindKeyboardControls({
  onMoveLeft,
  onMoveRight,
  onJumpAction,
  onStart,
}) {
  function handleKeyDown(event) {
    if (event.repeat) return;
    switch (event.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        event.preventDefault();
        onMoveLeft();
        break;
      case "ArrowRight":
      case "d":
      case "D":
        event.preventDefault();
        onMoveRight();
        break;
      case "Enter":
        event.preventDefault();
        onStart();
        break;
      case " ":
        event.preventDefault();
        onJumpAction();
        break;
      default:
    }
  }

  window.addEventListener("keydown", handleKeyDown);
}

export function bindTouchControls({ onMoveLeft, onMoveRight, onJumpAction }) {
  if (!touchLeft || !touchRight) {
    return;
  }

  const startMove = (direction) => {
    if (direction < 0) {
      onMoveLeft();
    } else {
      onMoveRight();
    }
  };

  let intervalId;
  const handlePress = (direction) => {
    startMove(direction);
    if (!intervalId) {
      intervalId = setInterval(() => startMove(direction), 190);
    }
  };

  const release = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  [["pointerdown", handlePress], ["pointerup", release], ["pointerleave", release]].forEach(
    ([eventName, handler]) => {
      touchLeft.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (eventName === "pointerdown") handler(-1);
        else handler();
      });
      touchRight.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (eventName === "pointerdown") handler(1);
        else handler();
      });
    }
  );

  if (touchJump) {
    touchJump.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      onJumpAction();
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
      touchJump.addEventListener(eventName, (event) => {
        event.preventDefault();
      });
    });
  }
}
