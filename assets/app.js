/* Подпискомат: интерактивные блоки. Без зависимостей; весь смысловой текст лежит в HTML. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var nf = function (n) { return Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₸'; };
  var plural = function (n) {
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return 'месяц';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'месяца';
    return 'месяцев';
  };
  var press = function (group, btn) {
    $$('[aria-pressed]', group).forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
  };

  /* Мобильное меню */
  var menuBtn = $('.menu-btn'), nav = $('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* Окно заказа: оплату подключает владелец, здесь только выбранный вариант */
  var dlg = $('#order');
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-buy]');
    if (!b || !dlg || typeof dlg.showModal !== 'function') return;
    e.preventDefault();
    $('[data-d=what]', dlg).textContent = b.getAttribute('data-buy');
    $('[data-d=price]', dlg).textContent = b.getAttribute('data-price') || '';
    dlg.showModal();
  });
  if (dlg) {
    $('.dlg__close', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* Калькулятор срока: data-calc='{"official":2499,"prices":{"3":7490,...}}' */
  $$('[data-calc]').forEach(function (box) {
    var cfg = JSON.parse(box.getAttribute('data-calc'));
    var buy = $('[data-buy]', box);
    var set = function (m) {
      var price = cfg.prices[m], off = cfg.official * m, save = off - price;
      var until = new Date(); until.setMonth(until.getMonth() + Number(m));
      var o = function (k, v) { var el = $('[data-o=' + k + ']', box); if (el) el.textContent = v; };
      o('price', nf(price));
      o('term', m + ' ' + plural(Number(m)));
      o('pm', nf(price / m));
      o('off', nf(off));
      o('save', save > 50 ? nf(save) + ' (−' + Math.round(save * 100 / off) + '%)' : 'как у Яндекса, но без карты и автопродления');
      o('until', until.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }));
      if (buy) { buy.setAttribute('data-buy', 'Промокод Яндекс Плюс на ' + m + ' ' + plural(Number(m))); buy.setAttribute('data-price', nf(price)); }
    };
    $$('[data-m]', box).forEach(function (b) {
      b.addEventListener('click', function () { press(box, b); set(b.getAttribute('data-m')); });
    });
    var start = $('[data-m][aria-pressed=true]', box);
    if (start) set(start.getAttribute('data-m'));
  });

  /* Фильтр карточек: кнопки data-show, карточки data-kind */
  $$('[data-filter]').forEach(function (box) {
    $$('[data-show]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        press(box, b);
        var k = b.getAttribute('data-show');
        $$('[data-kind]', box).forEach(function (c) { c.hidden = k !== 'all' && c.getAttribute('data-kind') !== k; });
      });
    });
  });

  /* Вкладки-мастера: role=tab + aria-controls */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role=tab]', box);
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) {
          var on = x === t;
          x.setAttribute('aria-selected', on ? 'true' : 'false');
          x.tabIndex = on ? 0 : -1;
          var p = document.getElementById(x.getAttribute('aria-controls'));
          if (p) p.hidden = !on;
        });
      });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t), n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (n === null) return;
        var next = tabs[(n + tabs.length) % tabs.length]; next.focus(); next.click();
      });
    });
  });

  /* Семья: цена на человека */
  $$('[data-family]').forEach(function (box) {
    var cfg = JSON.parse(box.getAttribute('data-family'));
    var r = $('input[type=range]', box);
    var upd = function () {
      var n = Number(r.value);
      $('[data-o=n]', box).textContent = n === 1 ? 'только вы' : 'вы и ещё ' + (n - 1);
      $('[data-o=off]', box).textContent = nf(cfg.official / n);
      $('[data-o=our]', box).textContent = nf(cfg.our / n);
    };
    r.addEventListener('input', upd); upd();
  });

  /* Страны приглашений */
  $$('[data-countries]').forEach(function (box) {
    var out = $('[data-o=country]', box);
    $$('[data-c]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        press(box, b);
        var d = JSON.parse(b.getAttribute('data-c'));
        $('[data-o=cname]', out).textContent = d.name;
        $('[data-o=cmusic]', out).textContent = d.music;
        $('[data-o=ckp]', out).textContent = d.kp;
        $('[data-o=cnote]', out).textContent = d.note;
        out.hidden = false;
      });
    });
  });

  /* Квиз подбора: правила описаны на странице в разделе «Как мы подбираем» */
  $$('[data-quiz]').forEach(function (box) {
    var Q = [
      { id: 'where', q: 'Где вы сейчас живёте?', a: [['kz', 'В Казахстане'], ['ru', 'В России'], ['by', 'В Беларуси'], ['other', 'В другой стране']] },
      { id: 'had', q: 'Был ли Яндекс Плюс на этом аккаунте?', a: [['never', 'Никогда не было'], ['was', 'Был, сейчас нет'], ['now', 'Активен сейчас']] },
      { id: 'how', q: 'Как оплачен текущий Плюс?', when: function (s) { return s.had === 'now'; }, a: [['card', 'Картой на сайте Яндекса'], ['op', 'Через Kcell, activ, Tele2, Beeline или Altel'], ['store', 'App Store или Google Play'], ['gift', 'Подарочный период к Станции'], ['code', 'Промокодом']] },
      { id: 'for', q: 'Для чего вам Плюс в первую очередь?', a: [['station', 'Станция и Алиса'], ['music', 'Музыка'], ['movies', 'Кино и сериалы'], ['all', 'Всё сразу']] },
      { id: 'who', q: 'Сколько человек будет пользоваться?', a: [['one', 'Только я'], ['family', '2–4 человека']] },
      { id: 'gift', q: 'Это подарок?', a: [['no', 'Нет, для себя'], ['yes', 'Да, в подарок']] }
    ];
    var state = {}, i = 0;
    var qEl = $('.quiz__q', box), opts = $('.choice', box), bar = $('.quiz__bar i', box), res = $('.quiz__res', box), back = $('[data-q=back]', box);
    var visible = function () { return Q.filter(function (q) { return !q.when || q.when(state); }); };
    var render = function () {
      var list = visible();
      if (i >= list.length) return result();
      var q = list[i];
      res.hidden = true; opts.hidden = false; qEl.hidden = false;
      qEl.textContent = q.q;
      bar.style.width = Math.round(i * 100 / list.length) + '%';
      opts.innerHTML = '';
      q.a.forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'opt'; b.textContent = a[1];
        b.addEventListener('click', function () { state[q.id] = a[0]; i++; render(); });
        opts.appendChild(b);
      });
      back.hidden = i === 0;
    };
    var result = function () {
      bar.style.width = '100%'; opts.hidden = true; qEl.hidden = true; back.hidden = false; res.hidden = false;
      var abroad = state.where !== 'kz';
      var long = state.who === 'family' || state['for'] === 'all';
      var term = abroad ? (long ? 36 : 12) : (long ? 12 : (state['for'] === 'station' ? 12 : 6));
      var t = abroad ? 'Ссылка-приглашение на ' + term + ' ' + plural(term) : 'Промокод Яндекс Плюс на ' + term + ' ' + plural(term);
      var why = [], warn = [];
      if (abroad) {
        why.push('Промокоды для Казахстана активируются на странице Яндекса для Казахстана, поэтому из другой страны удобнее ссылка-приглашение: она подключает Плюс на один аккаунт без ввода кода.');
        if (state.where === 'by' || state.where === 'ru') warn.push('Алиса Плюс в вашей стране продаётся отдельно и в Яндекс Плюс не входит.');
      } else {
        why.push('Вы в Казахстане — подойдёт промокод: оплата в Kaspi, код на странице заказа, активация на plus.yandex.kz/gift.');
      }
      if (state.how === 'op' || state.how === 'store') warn.push('Ваш Плюс оплачен через оператора или магазин приложений. По правилам промокодов (п. 2.12.3) код будет действовать параллельно — сначала отключите старую подписку, иначе заплатите дважды.');
      if (state.how === 'card') why.push('Плюс оплачен картой на сайте Яндекса — код сдвинет следующее списание на свой срок (правила промокодов, п. 2.12.1).');
      if (state.how === 'gift') warn.push('У подарочного периода к Станции обычно привязана карта. Отключите автопродление до активации кода.');
      if (state['for'] === 'station') warn.push('Активируйте код на тот Яндекс ID, к которому привязана Станция, — иначе Алиса не увидит подписку.');
      if (state.who === 'family') why.push('В подписку можно добавить до трёх близких. Каждому нужен свой Яндекс ID — тогда у всех будут свои рекомендации.');
      if (state.who === 'family' && abroad) warn.push('Одна ссылка-приглашение подключает Плюс на один аккаунт. Для каждого члена семьи нужна своя ссылка.');
      if (state.gift === 'yes') why.push(abroad ? 'Это подарок — ссылку-приглашение можно передать: получатель откроет её своим аккаунтом.' : 'Это подарок — на странице «Подарить» можно сделать открытку и отправить код вместе с ней.');
      $('[data-o=title]', res).textContent = t;
      $('[data-o=why]', res).innerHTML = why.map(function (w) { return '<p>' + w + '</p>'; }).join('');
      $('[data-o=warn]', res).innerHTML = warn.map(function (w) { return '<p class="quiz__warn">' + w + '</p>'; }).join('');
      var go = $('[data-o=go]', res);
      go.setAttribute('data-buy', t);
      go.setAttribute('data-price', '');
      var more = $('[data-o=more]', res);
      var base = box.getAttribute('data-base') || '/';
      var link = abroad ? ['priglashenie-v-yandex-plus/', 'Как работает приглашение'] : state.gift === 'yes' ? ['podarit-yandex-plus/', 'Как подарить'] : state['for'] === 'station' ? ['yandex-plus-dlya-alisy/', 'Плюс для Станции'] : state['for'] === 'music' ? ['yandex-muzyka/', 'Яндекс Музыка'] : ['pomoshch/aktivaciya-promokoda/', 'Как активировать код'];
      more.href = base + link[0]; more.textContent = link[1];
    };
    back.addEventListener('click', function () { if (i > 0) { i = Math.min(i, visible().length) - 1; } render(); });
    $('[data-q=restart]', box).addEventListener('click', function () { state = {}; i = 0; render(); });
    render();
  });

  /* Открытка к подарку: рисуем на canvas и даём скачать PNG */
  $$('[data-gift]').forEach(function (box) {
    var c = $('canvas', box), ctx = c.getContext('2d');
    var themes = { blue: ['#1844D8', '#FFFFFF', '#FFD23F'], sun: ['#FFD23F', '#0B1B3F', '#1844D8'], ink: ['#0B1B3F', '#FFFFFF', '#3ABEFF'], green: ['#00A878', '#0B1B3F', '#FFFFFF'] };
    var theme = 'blue';
    var wrap = function (text, x, y, max, lh) {
      var words = text.split(/\s+/), line = '', lines = 0;
      for (var n = 0; n < words.length && lines < 4; n++) {
        var test = line ? line + ' ' + words[n] : words[n];
        if (ctx.measureText(test).width > max && line) { ctx.fillText(line, x, y); line = words[n]; y += lh; lines++; }
        else line = test;
      }
      if (lines < 4) ctx.fillText(line, x, y);
    };
    var draw = function () {
      var t = themes[theme], to = $('[name=to]', box).value.trim(), msg = $('[name=msg]', box).value.trim(), term = $('[name=term]', box).value;
      ctx.fillStyle = t[0]; ctx.fillRect(0, 0, 1200, 630);
      ctx.fillStyle = t[2]; ctx.globalAlpha = .18;
      for (var a = 0; a < 360; a += 20) { ctx.beginPath(); ctx.moveTo(1020, 315); ctx.arc(1020, 315, 900, a * Math.PI / 180, (a + 8) * Math.PI / 180); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = t[2]; ctx.beginPath(); ctx.roundRect(840, 200, 300, 230, 28); ctx.fill();
      ctx.strokeStyle = t[0]; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(925, 320); ctx.lineTo(975, 365); ctx.lineTo(1060, 270); ctx.stroke();
      ctx.fillStyle = t[1];
      ctx.font = '800 30px Manrope, sans-serif'; ctx.fillText('подпискомат', 72, 92);
      ctx.font = '800 60px Unbounded, Manrope, sans-serif'; ctx.fillText(to ? 'Для ' + to : 'Подарок для тебя', 72, 210);
      ctx.font = '700 34px Manrope, sans-serif'; ctx.fillText('Яндекс Плюс на ' + term, 72, 280);
      ctx.font = '500 30px Manrope, sans-serif'; wrap(msg || 'Музыка, кино и книги — пусть будет больше хороших моментов.', 72, 360, 700, 44);
      ctx.font = '600 22px Manrope, sans-serif'; ctx.fillText('Активировать: plus.yandex.kz/gift', 72, 580);
    };
    $$('[data-theme]', box).forEach(function (b) { b.addEventListener('click', function () { press(box, b); theme = b.getAttribute('data-theme'); draw(); }); });
    $$('input, select, textarea', box).forEach(function (el) { el.addEventListener('input', draw); });
    $('[data-o=dl]', box).addEventListener('click', function () {
      var a = document.createElement('a'); a.download = 'otkrytka-yandex-plus.png'; a.href = c.toDataURL('image/png'); a.click();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw); else draw();
    draw();
  });
})();
