(function () {
  'use strict';

  var avatarCache = {};
  var fetchQueue = [];
  var fetching = false;

  function removeBodyBg() {
    var all = document.querySelectorAll('body, html, #mainbody, #mainbody-2, #mainbody-3, #mainbody-4, #mainbody-5, #mainbody *, .mainbody, .mainbody *');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none' && bg.indexOf('body-bg') !== -1) {
        el.style.setProperty('background-image', 'none', 'important');
      }
    }
  }

  function addPMBadge() {
    var links = document.querySelectorAll('#nav a');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.href.indexOf('action=pm') === -1 && link.textContent.indexOf('Mesajlar') === -1) continue;

      var text = link.textContent.trim();
      var count = 0;
      var match = text.match(/(\d+)/);
      if (match) count = parseInt(match[1], 10);

      link.innerHTML = 'Mesajlar\u0131m ';
      var badge = document.createElement('span');
      badge.className = 'pm-badge';
      badge.textContent = count;
      link.appendChild(badge);
      break;
    }
  }

  function getUserInfoSync() {
    var all = document.querySelectorAll('body *');
    for (var i = 0; i < all.length; i++) {
      var text = all[i].textContent || '';
      if (text.indexOf('Merhaba') !== -1 && text.indexOf('Ziyaret') === -1) {
        var b = all[i].querySelector('b');
        if (b) {
          var name = b.textContent.trim();
          if (name.length > 0 && name.length < 50) return name;
        }
      }
    }
    return null;
  }

  function findUserProfileId() {
    var links = document.querySelectorAll('a[href*="action=profile"]');
    for (var i = 0; i < links.length; i++) {
      var uid = extractUserId(links[i].href);
      if (uid) return uid;
    }
    var ownLink = document.querySelector('a[href*="action=profile"]:not([href*=";u="])');
    if (ownLink && ownLink.href.indexOf('action=profile') !== -1) {
      return 'self';
    }
    return null;
  }

  function getPMCounts() {
    var total = 0, unread = 0;
    var all = document.querySelectorAll('.smalltext, .middletext, span, td, div, b');
    for (var i = 0; i < all.length; i++) {
      var txt = all[i].textContent.replace(/\s+/g, ' ');
      if (txt.indexOf('mesaj') === -1 && txt.indexOf('Mesaj') === -1) continue;
      var m = txt.match(/size\s*ait\s*(\d+)\s*mesaj\s*var\s*(\d+)\s*tanesi\s*yeni/i);
      if (m) {
        total = parseInt(m[1], 10);
        unread = parseInt(m[2], 10);
        break;
      }
    }
    return { total: total, unread: unread };
  }

  function addUserWelcome() {
    var logoutLink = document.querySelector('a[href*="action=logout"]');
    if (!logoutLink) return;

    var username = getUserInfoSync();
    if (!username) username = 'Kullan\u0131c\u0131';

    var userId = findUserProfileId();

    var counts = getPMCounts();
    var totalPM = counts.total;
    var newPM = counts.unread;

    var base = getBaseUrl() + '/forum/';

    var initial = username.charAt(0).toUpperCase();
    var placeholder = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">' +
        '<rect width="80" height="80" fill="#2a4a8a"/>' +
        '<text x="40" y="52" text-anchor="middle" fill="#fff" font-size="34" font-family="Ubuntu Mono" font-weight="bold">' + initial + '</text>' +
      '</svg>'
    );

    var welcomeSection = document.createElement('div');
    welcomeSection.className = 'tborder welcome-section';
    welcomeSection.innerHTML =
      '<table class="bordercolor" width="100%" style="border:none!important">' +
        '<tr>' +
          '<td class="welcome-avatar" style="width:92px;padding:12px 0 12px 12px!important;vertical-align:top;border:none!important">' +
            '<img src="' + placeholder + '" width="80" height="80" style="border-radius:8px;display:block" alt="' + username + '">' +
          '</td>' +
          '<td class="welcome-info" style="padding:12px!important;vertical-align:top;border:none!important">' +
            '<div class="welcome-greeting">Merhaba, <strong>' + username + '</strong></div>' +
            '<div class="welcome-pmcount">' + totalPM + ' mesaj\u0131n var, ' + newPM + ' tanesi yeni</div>' +
            '<div class="welcome-links">' +
              '<a href="' + base + '?action=unread">Yeni g\u00f6nderilen mesajlar</a>' +
              ' &middot; ' +
              '<a href="' + base + '?action=unreadreplies">Mesajlar\u0131ma yaz\u0131lan yeni cevaplar</a>' +
            '</div>' +
          '</td>' +
        '</tr>' +
      '</table>';

    if (userId) {
      var avatarUserId = userId === 'self' ? null : userId;
      var avatarUrl = avatarUserId
        ? getBaseUrl() + '/forum/index.php?action=profile;u=' + avatarUserId
        : getBaseUrl() + '/forum/index.php?action=profile';
      fetch(avatarUrl)
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var div = document.createElement('div');
          div.innerHTML = html;
          var avatarImg = div.querySelector('img.avatar, img[alt*="avatar"], td.windowbg img[src*="dlattach"]');
          if (avatarImg && avatarImg.src) {
            var wImg = welcomeSection.querySelector('.welcome-avatar img');
            if (wImg) wImg.src = avatarImg.src;
          }
        })
        .catch(function () {});
    }

    var container = document.getElementById('mainbody-padding') || document.querySelector('#mainbody .wrapper');
    if (container) {
      container.insertBefore(welcomeSection, container.firstChild);
    }
  }

  function init() {
    removeClutter();
    fixAvatars();
    hideVisitorRow();
    injectFont();
    addBodyClass();
    enhanceRecentPosts();
    removeBodyBg();
    addUserWelcome();
    addPMBadge();
    wrapHeaderCenter();
    animateLogo();
    addRainbowBg();
    addHeaderRipples();
    fixTopicButtons();
    fixNavButtons();
    fixOtherButtons();
    fixMenuText();
    setTimeout(removeBodyBg, 500);
  }

  function addHeaderRipples() {
    var header = document.getElementById('header');
    if (!header) return;
    var count = 6;
    for (var i = 0; i < count; i++) {
      var ripple = document.createElement('div');
      ripple.className = 'header-ripple';
      ripple.style.animationDelay = (i * 0.8) + 's';
      header.appendChild(ripple);
    }
  }

  function addRainbowBg() {
    var welcome = document.querySelector('.welcome-section');
    if (!welcome) return;

    var table = welcome.querySelector('table');
    if (!table) return;
    table.style.position = 'relative';
    table.style.overflow = 'hidden';

    var colors = [
      'rgb(232, 121, 249)', 'rgb(96, 165, 250)', 'rgb(94, 234, 212)'
    ];
    var perms = [
      [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 1, 0], [2, 0, 1]
    ];

    var animDuration = 90;
    var count = 25;

    for (var i = 1; i <= count; i++) {
      var el = document.createElement('div');
      el.className = 'rainbow-bar';
      var p = perms[Math.floor(Math.random() * perms.length)];
      var dur = animDuration - (animDuration / count / 2 * i);
      var delay = -(i / count * animDuration);
      el.style.cssText =
        'animation:' + dur + 's linear infinite slide;' +
        'animation-delay:' + delay + 's;' +
        'box-shadow:-60px 0 40px 20px transparent,-30px 0 40px 20px ' + colors[p[0]] + ',0 0 40px 20px ' + colors[p[1]] + ',30px 0 40px 20px ' + colors[p[2]] + ',60px 0 40px 20px transparent;';
      table.appendChild(el);
    }
  }

  function wrapHeaderCenter() {
    var wrapper = document.querySelector('#header .wrapper');
    if (!wrapper) return;
    var center = document.createElement('div');
    center.className = 'header-center';
    var logo = document.getElementById('logo');
    var access = document.getElementById('access');
    if (logo) center.appendChild(logo);
    if (access) center.appendChild(access);
    wrapper.appendChild(center);
  }

  function animateLogo() {
    var logo = document.getElementById('logo');
    if (!logo) return;

    var img = logo.querySelector('img');
    if (img) img.style.display = 'none';

    logo.style.cssText = 'background:none!important;background-image:none!important;width:auto!important;display:flex!important;align-items:center;justify-content:center;padding:30px 0';

    var wrap = document.createElement('div');
    wrap.className = 'logo-3d-wrap';

    var box = document.createElement('div');
    box.className = 'logo-3d-box';

    for (var i = 1; i <= 16; i++) {
      var span = document.createElement('span');
      span.style.setProperty('--i', i);
      span.innerHTML = '<i>commodore</i>.gen.<i>tr</i>';
      box.appendChild(span);
    }

    wrap.appendChild(box);
    logo.appendChild(wrap);
  }

  function injectFont() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;500;600;700&family=Press+Start+2P&display=swap';
    document.head.appendChild(link);
  }

  function removeClutter() {
    var ids = ['showcase', 'rhino', 'slider', 'demo'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.style.setProperty('display', 'none', 'important');
      }
    });

    var classes = ['scroll-img'];
    classes.forEach(function (cn) {
      var els = document.getElementsByClassName(cn);
      for (var i = 0; i < els.length; i++) {
        els[i].style.setProperty('display', 'none', 'important');
      }
    });
  }

  function fixAvatars() {
    var avatars = document.querySelectorAll('img.avatar');
    for (var i = 0; i < avatars.length; i++) {
      avatars[i].style.setProperty('border-radius', '50%');
      avatars[i].style.setProperty('width', '80px');
      avatars[i].style.setProperty('height', '80px');
      avatars[i].style.setProperty('object-fit', 'cover');
    }
  }

  function hideVisitorRow() {
    var els = document.querySelectorAll('td[colspan="7"]');
    for (var i = 0; i < els.length; i++) {
      var td = els[i];
      if (td.textContent.indexOf('Ziyaret') !== -1 || td.textContent.indexOf('incelemekte') !== -1) {
        var tr = td.parentNode;
        if (tr) {
          tr.style.setProperty('display', 'none', 'important');
        }
      }
    }
  }

  function generatePlaceholderAvatar(username) {
    var canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2a4a8a';
    ctx.fillRect(0, 0, 40, 40);

    var first = username.charAt(0).toUpperCase();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px "Ubuntu Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(first, 20, 21);

    return canvas.toDataURL();
  }

  function extractUserId(href) {
    var match = href.match(/[?&;]u=(\d+)/);
    return match ? match[1] : null;
  }

  function getBaseUrl() {
    return window.location.protocol + '//' + window.location.host;
  }

  function fetchAvatarFromProfile(userId, callback) {
    if (avatarCache[userId]) {
      callback(avatarCache[userId]);
      return;
    }

    var url = getBaseUrl() + '/forum/index.php?action=profile;u=' + userId;

    fetch(url)
      .then(function (resp) { return resp.text(); })
      .then(function (html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        var avatarImg = div.querySelector('td.windowbg[align="center"] img.avatar');
        if (avatarImg && avatarImg.src && avatarImg.src.indexOf('dlattach') !== -1) {
          var avatarUrl = avatarImg.src;
          avatarCache[userId] = avatarUrl;
          callback(avatarUrl);
        } else {
          callback(null);
        }
      })
      .catch(function () {
        callback(null);
      });
  }

  function processFetchQueue() {
    if (fetching || fetchQueue.length === 0) return;
    fetching = true;

    var item = fetchQueue.shift();
    fetchAvatarFromProfile(item.userId, function (avatarUrl) {
      if (avatarUrl) {
        var imgs = document.querySelectorAll('img[data-userid="' + item.userId + '"]');
        for (var i = 0; i < imgs.length; i++) {
          imgs[i].src = avatarUrl;
          imgs[i].removeAttribute('data-userid');
        }
      }
      fetching = false;
      setTimeout(processFetchQueue, 300);
    });
  }

  function queueFetchAvatar(userId) {
    if (avatarCache[userId]) {
      return avatarCache[userId];
    }
    var exists = false;
    for (var i = 0; i < fetchQueue.length; i++) {
      if (fetchQueue[i].userId === userId) { exists = true; break; }
    }
    if (!exists) {
      fetchQueue.push({ userId: userId });
      processFetchQueue();
    }
    return null;
  }

  function enhanceRecentPosts() {
    var titleTds = document.querySelectorAll('td.titlebg');
    for (var t = 0; t < titleTds.length; t++) {
      var td = titleTds[t];
      if (td.textContent.indexOf('Son Mesajlar') === -1) continue;

      var containerTr = td.parentNode;
      var nextTr = containerTr.nextElementSibling;
      if (!nextTr) continue;

      var innerTable = nextTr.querySelector('td.windowbg2 table');
      if (!innerTable) continue;

      var parentTable = containerTr.parentNode;
      if (parentTable && parentTable.tagName === 'TABLE') {
        var pp = parentTable.parentNode;
        if (!pp || !pp.classList || !pp.classList.contains('tborder')) {
          var tborderDiv = document.createElement('div');
          tborderDiv.className = 'tborder';
          pp.insertBefore(tborderDiv, parentTable);
          tborderDiv.appendChild(parentTable);
        }
      }

      var wrapper = nextTr;
      wrapper.id = 'cgtr-recent-wrapper';
      var rows = innerTable.querySelectorAll('tr');

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var tds2 = r.querySelectorAll('td.middletext');
        if (tds2.length < 2) continue;

        var firstTd = tds2[0];
        var secondTd = tds2[1];

        var bTag = firstTd.querySelector('b');
        if (!bTag) continue;

        var text = firstTd.textContent;
        if (text.indexOf('Gönderen') === -1 && text.indexOf('Gnderen') === -1) continue;

        var titleLink = bTag.querySelector('a');
        var nodes = firstTd.childNodes;
        var pastB = false;
        var authorLink = null;
        var categoryLink = null;

        for (var j = 0; j < nodes.length; j++) {
          if (nodes[j] === bTag) { pastB = true; continue; }
          if (pastB && nodes[j].nodeType === 1 && nodes[j].tagName === 'A') {
            if (!authorLink) authorLink = nodes[j];
            else if (!categoryLink) categoryLink = nodes[j];
          }
        }

        var timeHtml = secondTd.innerHTML;
        var authorName = authorLink ? authorLink.textContent : '?';
        var userId = authorLink ? extractUserId(authorLink.href) : null;

        r.className = 'recent-item';
        r.innerHTML = '';

        var cell = document.createElement('td');
        cell.setAttribute('colspan', '2');
        cell.style.cssText = 'display:flex;padding:0!important;border:none!important;';

        var avatarDiv = document.createElement('div');
        avatarDiv.className = 'recent-avatar';
        var img = document.createElement('img');
        img.src = generatePlaceholderAvatar(authorName);
        img.alt = authorName;

        if (userId) {
          img.setAttribute('data-userid', userId);
          queueFetchAvatar(userId);
        }

        avatarDiv.appendChild(img);

        var contentDiv = document.createElement('div');
        contentDiv.className = 'recent-content';

        var titleDiv = document.createElement('div');
        titleDiv.className = 'recent-title';
        if (titleLink) {
          titleDiv.appendChild(titleLink.cloneNode(true));
        }

        var metaDiv = document.createElement('div');
        metaDiv.className = 'recent-meta';

        if (categoryLink) {
          var cs = document.createElement('span');
          cs.className = 'recent-category';
          cs.appendChild(categoryLink.cloneNode(true));
          metaDiv.appendChild(cs);
        }

        if (authorLink) {
          var as = document.createElement('span');
          as.className = 'recent-author';
          as.appendChild(authorLink.cloneNode(true));
          metaDiv.appendChild(as);
        }

        var ts = document.createElement('span');
        ts.className = 'recent-time';
        ts.innerHTML = timeHtml;
        metaDiv.appendChild(ts);

        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(metaDiv);

        cell.appendChild(avatarDiv);
        cell.appendChild(contentDiv);
        r.appendChild(cell);
      }
      break;
    }
  }

  function addBodyClass() {
    document.body.classList.add('cgtr-modern');
  }

  function getBtnIcon(alt) {
    var svg = '<svg viewBox="0 0 12 12" width="12" height="12" style="vertical-align:middle;margin-right:4px">';
    var a = alt.toLowerCase();
    if (a.indexOf('cevapla') !== -1 || a.indexOf('reply') !== -1) {
      svg += '<path d="M5 2L1 6l4 4" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M11 6H2" stroke="#fff" stroke-width="1.5" fill="none"/>';
    } else if (a.indexOf('alıntı') !== -1 || a.indexOf('alinti') !== -1 || a.indexOf('quote') !== -1) {
      svg += '<path d="M3 3v4h2l-2 2M7 3v4h2l-2 2" stroke="#fff" stroke-width="1.5" fill="none"/>';
    } else if (a.indexOf('düzenle') !== -1 || a.indexOf('duzenle') !== -1 || a.indexOf('edit') !== -1) {
      svg += '<path d="M2 9l1 2 7-7-2-2z" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M6 2l2 2" stroke="#fff" stroke-width="1.5"/>';
    } else if (a.indexOf('yazdır') !== -1 || a.indexOf('yazdir') !== -1 || a.indexOf('print') !== -1) {
      svg += '<rect x="2" y="6" width="8" height="4" rx="1" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M2 4V1h8v3" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M4 8h4" stroke="#fff" stroke-width="1.5"/>';
    } else if (a.indexOf('sil') !== -1 || a.indexOf('delete') !== -1 || a.indexOf('kaldır') !== -1 || a.indexOf('kaldir') !== -1) {
      svg += '<path d="M2 2l8 8M10 2l-8 8" stroke="#fff" stroke-width="1.5" fill="none"/>';
    } else if (a.indexOf('notify') !== -1 || a.indexOf('bildirim') !== -1 || a.indexOf('izle') !== -1) {
      svg += '<path d="M2 9h8L8 5V3a2 2 0 0 0-4 0v2z" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M5 10a1 1 0 0 0 2 0" stroke="#fff" stroke-width="1.5"/>';
    } else if (a.indexOf('gönder') !== -1 || a.indexOf('gonder') !== -1 || a.indexOf('send') !== -1) {
      svg += '<path d="M7 2l4 4-4 4" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M1 6h10" stroke="#fff" stroke-width="1.5" fill="none"/>';
    } else if (a.indexOf('okundu') !== -1 || a.indexOf('okunmadı') !== -1 || a.indexOf('okunmadi') !== -1) {
      if (a.indexOf('okunmadı') !== -1 || a.indexOf('okunmadi') !== -1) {
        svg += '<rect x="1" y="3" width="10" height="6" rx="1" stroke="#fff" stroke-width="1.5" fill="none"/><path d="M1 4l5 3 5-3" stroke="#fff" stroke-width="1.5" fill="none"/>';
      } else {
        svg += '<path d="M1 6l3 4 7-8" stroke="#fff" stroke-width="1.5" fill="none"/>';
      }
    } else {
      svg += '';
    }
    svg += '</svg>';
    return svg;
  }

  function fixTopicButtons() {
    var cells = document.querySelectorAll('td.postbuttons, td[class*="postbuttons"]');
    for (var i = 0; i < cells.length; i++) {
      var links = cells[i].querySelectorAll('a');
      var len = links.length;
      for (var j = 0; j < len; j++) {
        var img = links[j].querySelector('img');
        var alt = img ? img.getAttribute('alt') : '';

        if (alt) {
          img.style.display = 'none';
          var labels = {
            'Bu mesajı alıntı ile cevapla': 'Alıntı Ekle',
            'Bu Konuyu Gönder': 'Gönder',
            'Okunmadı olarak say': 'Okunmadı Say',
            'Cevaplardan haberdar et': 'Haberdar Et'
          };
          var text = labels[alt] || alt;
          var icon = getBtnIcon(text);
          links[j].innerHTML = icon + text;
          links[j].className += ' middletext topic-btn';
        }

        var txt = links[j].textContent.trim().toLowerCase();
        var isNav = txt.indexOf('aşağı') !== -1 || txt.indexOf('aşağıya') !== -1 || txt.indexOf('yukarı') !== -1 || txt.indexOf('yukarıya') !== -1;
        if (isNav) {
          links[j].style.flex = '0 0 100%';
          links[j].style.marginBottom = '6px';
        }

        if (j < len - 1 && !isNav) {
          var pipe = document.createElement('span');
          pipe.textContent = ' | ';
          pipe.style.cssText = 'color:#999;display:inline-flex;align-items:center';
          links[j].parentNode.insertBefore(pipe, links[j].nextSibling);
        }
      }
    }
  }

  function fixNavButtons() {
    var navLinks = document.querySelectorAll('a[href="#top"], a[href="#bottom"], a[href*="#top"], a[href*="#bottom"]');
    for (var i = 0; i < navLinks.length; i++) {
      var parentCell = navLinks[i].closest('td');
      if (!parentCell || parentCell.className.indexOf('postbuttons') === -1) continue;
      navLinks[i].style.flex = '0 0 100%';
      navLinks[i].style.marginBottom = '6px';
    }
  }

  function fixOtherButtons() {
    var sel = 'a[href*="action=markasread"], a[href*="action=markasread;"]';
    var links = document.querySelectorAll(sel);
    for (var i = 0; i < links.length; i++) {
      var img = links[i].querySelector('img');
      if (!img) continue;
      var alt = img.getAttribute('alt');
      img.style.display = 'none';
      if (alt) {
        links[i].innerHTML = '<svg viewBox="0 0 12 12" width="12" height="12" style="vertical-align:middle;margin-right:4px"><path d="M1 6l3 4 7-8" stroke="#fff" stroke-width="1.5" fill="none"/></svg>' + alt;
      }
      links[i].className += ' middletext topic-btn';
    }
  }

  function fixMenuText() {
    var link = document.querySelector('a[href="/adp/"]');
    if (link) {
      link.textContent = 'Amiga Dökümantasyon Projesi';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
