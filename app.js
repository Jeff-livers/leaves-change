(function () {
  'use strict';

  var ICON_MUTED = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M16 9l5 6M21 9l-5 6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  var ICON_SOUND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M3 9v6h4l5 5V4L7 9H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M8 5v14l11-7z"/></svg>';

  var HOLD_MS = 300;
  var MOVE_PX = 10;

  var frame = document.getElementById('frame');
  var video = document.getElementById('video');
  var song = document.getElementById('song');
  var flashEl = document.getElementById('flash');
  var corner = document.getElementById('corner');
  var cornerIcon = corner.querySelector('span');
  var status = document.getElementById('status');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  var isMuted = true;
  var blocked = false;
  var pending = false;     // song.play() called but not yet resolved
  var userPaused = false;  // paused with Space; don't auto-resume
  var flashAnim = null;
  var press = null;

  function noop() {}

  function render() {
    corner.setAttribute('aria-pressed', String(isMuted));
    corner.setAttribute('aria-label', isMuted ? 'Unmute' : 'Mute');
    cornerIcon.innerHTML = isMuted ? ICON_MUTED : ICON_SOUND;
    status.textContent = isMuted ? 'Sound off' : 'Sound on';
  }

  function flash(icon) {
    if (flashAnim) flashAnim.cancel();
    flashEl.style.opacity = '';
    flashEl.innerHTML = icon;
    var scale = !reducedMotion.matches;
    var frames = [
      { offset: 0, opacity: 0 },
      { offset: 150 / 950, opacity: 1 },
      { offset: 750 / 950, opacity: 1 },
      { offset: 1, opacity: 0 }
    ];
    if (scale) {
      frames[0].transform = 'scale(0.8)';
      frames[1].transform = frames[2].transform = frames[3].transform = 'scale(1)';
    }
    flashAnim = flashEl.animate(frames, { duration: 950, easing: 'ease-out' });
  }

  function block() {
    blocked = true;
    if (flashAnim) flashAnim.cancel();
    flashEl.innerHTML = ICON_PLAY;
    flashEl.style.opacity = '1';
  }

  function unblock() {
    if (!blocked) return;
    blocked = false;
    flashEl.style.opacity = '';
  }

  function playVideo() {
    video.play().then(unblock, function (err) {
      // AbortError just means a pause() interrupted us; only a policy refusal needs the play icon.
      if (err && err.name === 'NotAllowedError') block();
    });
  }

  function playSong() {
    song.play().catch(function () {
      isMuted = true;
      render();
    });
  }

  function pauseAll() {
    video.pause();
    song.pause();
  }

  function resumeAll() {
    playVideo();
    if (!isMuted) playSong();
  }

  function toggle() {
    if (isMuted && !pending) {
      pending = true;
      // Must run synchronously inside the gesture or the browser refuses audio.
      song.play().then(function () {
        pending = false;
        isMuted = false;
        flash(ICON_SOUND);
        render();
      }, function () {
        pending = false;
        isMuted = true;
        render();
      });
      if (video.paused) {
        userPaused = false;
        unblock();
        playVideo();
      }
    } else {
      song.pause();
      isMuted = true;
      flash(ICON_MUTED);
      render();
    }
  }

  function endPress(e, canToggle) {
    if (!press || e.pointerId !== press.id) return;
    var p = press;
    press = null;
    clearTimeout(p.timer);
    if (p.held) {
      if (p.resume) resumeAll();
    } else if (canToggle) {
      toggle();
    }
  }

  frame.addEventListener('pointerdown', function (e) {
    if (press || (e.pointerType === 'mouse' && e.button !== 0)) return;
    var p = { id: e.pointerId, x: e.clientX, y: e.clientY, held: false, resume: false };
    p.timer = setTimeout(function () {
      p.held = true;
      p.resume = !video.paused;
      pauseAll();
    }, HOLD_MS);
    press = p;
  });

  frame.addEventListener('pointermove', function (e) {
    if (!press || e.pointerId !== press.id || press.held) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_PX) {
      clearTimeout(press.timer);
      press = null;
    }
  });

  frame.addEventListener('pointerup', function (e) { endPress(e, true); });
  frame.addEventListener('pointercancel', function (e) { endPress(e, false); });

  frame.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  ['pointerdown', 'pointerup', 'pointercancel'].forEach(function (type) {
    corner.addEventListener(type, function (e) { e.stopPropagation(); });
  });
  corner.addEventListener('click', function (e) {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (e.key === 'm' || e.key === 'M') {
      toggle();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (video.paused) {
        userPaused = false;
        resumeAll();
      } else {
        userPaused = true;
        pauseAll();
      }
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pauseAll();
    else if (!userPaused) resumeAll();
  });

  song.volume = 0.85;
  video.muted = true;
  playVideo();
})();
