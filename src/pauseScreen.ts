import { initAudio, setSoundEnabled, isSoundEnabled, soundUnpause } from './audio';
import type { Game } from './game';

const pauseScreen = document.getElementById('pauseScreen')!;

export function animatePauseClose(callback: () => void): void {
  pauseScreen.classList.add('closing');
  pauseScreen.addEventListener('animationend', () => {
    pauseScreen.classList.add('hidden');
    pauseScreen.classList.remove('closing');
    callback();
  }, { once: true });
}

function closePauseOverlay(game: Game, canvas: HTMLCanvasElement): void {
  soundUnpause();
  animatePauseClose(() => {
    document.getElementById('wrap')?.classList.remove('paused');
    game.paused = false;
    game.mode = 'playing';
    canvas.focus();
  });
}

export function initPauseScreen(
  game: Game,
  goToMenu: () => void,
  startLoop: () => void,
  canvas: HTMLCanvasElement,
): void {
  document.getElementById('resumeBtn')!.addEventListener('click', () => {
    if (pauseScreen.classList.contains('closing')) return;
    closePauseOverlay(game, canvas);
  });

  document.getElementById('restartBtn')!.addEventListener('click', () => {
    if (pauseScreen.classList.contains('closing')) return;
    animatePauseClose(() => {
      document.getElementById('wrap')?.classList.remove('paused');
      game.paused = false;
      initAudio();
      game.beginRun(game.modeType);
      startLoop();
      canvas.focus();
    });
  });

  document.getElementById('quitBtn')!.addEventListener('click', () => {
    if (pauseScreen.classList.contains('closing')) return;
    animatePauseClose(() => {
      document.getElementById('wrap')?.classList.remove('paused');
      game.paused = false;
      goToMenu();
    });
  });

  // Sound toggle
  const soundToggleBtn = document.getElementById('soundToggleBtn')!;
  function updateSoundToggleUI(): void {
    soundToggleBtn.textContent = isSoundEnabled() ? '🔊 Som: ligado' : '🔇 Som: desligado';
  }
  soundToggleBtn.addEventListener('click', () => {
    setSoundEnabled(!isSoundEnabled());
    updateSoundToggleUI();
  });
  updateSoundToggleUI();
}
