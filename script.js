(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ================= Theme toggle (1.4) ================= */
  /* ================= Theme toggle (1.4) ================= */
var themeBtn = document.getElementById('theme-toggle');
function applyTheme(t) {
  if (t === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
  themeBtn.setAttribute('aria-pressed', t === 'dark');
  themeBtn.textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
}
var savedTheme = safeGet('theme');
var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
themeBtn.addEventListener('click', function () {
  var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  safeSet('theme', next);
});

  /* ================= Text size (1.4) ================= */
  var size = parseInt(safeGet('size'), 10) || 100;
  root.style.fontSize = size + '%';
  function setSize(n) {
    size = Math.max(100, Math.min(150, n));
    root.style.fontSize = size + '%';
    safeSet('size', size);
  }
  document.getElementById('text-up').addEventListener('click', function () { setSize(size + 10); });
  document.getElementById('text-down').addEventListener('click', function () { setSize(size - 10); });

  /* ================= Typing effect (off if reduced motion) (2.3) ================= */
  var typing = document.getElementById('typing');
  if (typing && !reduceMotion) {
    var full = typing.getAttribute('data-text');
    var i = 0;
    typing.textContent = '';
    (function type() {
      if (i < full.length) {
        typing.textContent += full.charAt(i++);
        setTimeout(type, 80);
      }
    })();
  }

  /* ================= Current section in nav (2.4) ================= */
  var navLinks = document.querySelectorAll('nav a');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (a) {
            if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ================= Project modal (2.1, 4.1) ================= */
  var modal = document.getElementById('project-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalImg = document.getElementById('modal-img');
  var modalVideo = document.getElementById('modal-video');
  var modalYT = document.getElementById('modal-yt');
  var modalCaption = document.getElementById('modal-caption');
  var controls = document.getElementById('modal-controls');
  var closeBtn = document.getElementById('modal-close');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');

  var items = [];
  var idx = 0;
  var lastFocus = null;

  document.querySelectorAll('.view-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.card');
      try { items = JSON.parse(card.getAttribute('data-media')); } catch (e) { items = []; }
      if (!items.length) return;
      idx = 0;
      lastFocus = btn;
      modalTitle.textContent = card.querySelector('h3').textContent;
      modal.hidden = false;
      document.body.classList.add('modal-open');
      controls.hidden = items.length < 2;
      showMedia();
      closeBtn.focus();
    });
  });

  function resetMedia() {
    modalImg.hidden = true;
    modalVideo.hidden = true;
    modalYT.hidden = true;
    modalVideo.pause();
    modalYT.removeAttribute('src');
  }

  function showMedia() {
    var it = items[idx];
    resetMedia();

    if (it.type === 'youtube') {
      modalYT.title = it.alt;
      modalYT.src = it.src;
      modalYT.hidden = false;
    } else if (it.type === 'video') {
      modalVideo.src = it.src;
      modalVideo.setAttribute('aria-label', it.alt);
      while (modalVideo.firstChild) modalVideo.removeChild(modalVideo.firstChild);
      if (it.captions) {
        var track = document.createElement('track');
        track.kind = 'captions';
        track.src = it.captions;
        track.srclang = 'en';
        track.label = 'English';
        track.default = true;
        modalVideo.appendChild(track);
      }
      modalVideo.hidden = false;
    } else {
      modalImg.src = it.src;
      modalImg.alt = it.alt;
      modalImg.hidden = false;
    }
    modalCaption.textContent = it.alt + ' (' + (idx + 1) + ' of ' + items.length + ')';
  }

  function closeModal() {
    resetMedia();
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus) lastFocus.focus();
  }

  prevBtn.addEventListener('click', function () {
    idx = (idx - 1 + items.length) % items.length;
    showMedia();
  });
  nextBtn.addEventListener('click', function () {
    idx = (idx + 1) % items.length;
    showMedia();
  });
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  // Esc to close + keep Tab inside the dialog (no keyboard trap outside of it)
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    var focusable = Array.prototype.filter.call(
      modal.querySelectorAll('button, video[controls], iframe'),
      function (el) { return !el.hidden && !el.closest('[hidden]'); }
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ================= Contact form (3.2, 3.3) ================= */
  var form = document.getElementById('contact-form');
  var summary = document.getElementById('error-summary');
  var list = document.getElementById('error-list');
  var status = document.getElementById('form-status');
  var TO = 'segisamerrycris@gmail.com';

  function check(id, msg, test) {
    var el = document.getElementById(id);
    var err = document.getElementById(id + '-error');
    var ok = test(el.value.trim());
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    err.textContent = ok ? '' : 'Error: ' + msg;
    return ok ? null : { id: id, msg: msg };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = '';

    var problems = [
      check('name', 'Please enter your full name.', function (v) { return v.length > 1; }),
      check('email', 'Please enter a valid email address, like juan@example.com.', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }),
      check('message', 'Please write a message with at least 10 characters.', function (v) { return v.length >= 10; })
    ].filter(Boolean);

    list.innerHTML = '';
    if (problems.length) {
      problems.forEach(function (p) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + p.id;
        a.textContent = p.msg;
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          document.getElementById(p.id).focus();
        });
        li.appendChild(a);
        list.appendChild(li);
      });
      summary.hidden = false;
      summary.focus();
      return;
    }

    summary.hidden = true;
    var n = document.getElementById('name').value.trim();
    var em = document.getElementById('email').value.trim();
    var m = document.getElementById('message').value.trim();
    status.textContent = 'Thank you, ' + n + '! Your email app will open so you can send the message.';
    window.location.href = 'mailto:' + TO +
      '?subject=' + encodeURIComponent('Portfolio message from ' + n) +
      '&body=' + encodeURIComponent(m + '\n\nReply to: ' + em);
    form.reset();
  });
})();