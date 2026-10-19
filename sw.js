// まなびのテラスの入口のサービスワーカー（2026-10-17）。通知を受けて出すだけ。
//  ⚠ ページのキャッシュはしない（中身は全部ウェブアプリの向こうにある。古い入口が残ると直せない）。
//  ⚠ ここは公開リポジトリに載る。秘密も個人情報も書かない。
//  届く中身（push-worker が暗号化して送る）：{ title, body, go?, tag?, who?, at?, actions? }
//    go … 開くタブ（week / minna / quiz / kakomon / inbox …）。入口が中の画面へ渡す。
//    who … 講師へ：どの生徒の知らせか（ログインID）。at … 画面のどこへ飛ぶか（短い JSON の文字）。
//    actions … 講師へ：通知に「👀 くわしく」「💬 ひとこと」のボタンを出す（Android・PC。iPhone は出ない＝押すと知らせの画面）。
'use strict';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  var title = String(d.title || 'まなびのテラス').slice(0, 80);
  var who = /^[A-Za-z0-9._-]{1,40}$/.test(d.who || '') ? d.who : '';
  var opt = {
    body: String(d.body || '').slice(0, 600),
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag ? String(d.tag).slice(0, 40) : undefined,
    renotify: !!d.tag,
    data: { go: /^[A-Za-z]{1,20}$/.test(d.go || '') ? d.go : '', who: who,
            at: typeof d.at === 'string' ? d.at.slice(0, 300) : '' },
  };
  if (d.actions && who) opt.actions = [{ action: 'see', title: '👀 くわしく' }, { action: 'reply', title: '💬 ひとこと' }];
  e.waitUntil(self.registration.showNotification(title, opt));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var nd = e.notification.data || {};
  // ボタン：くわしく＝その子の画面のその課題へ／ひとこと＝知らせの画面でひとことの欄を開く
  var m = { mt: 'go', go: nd.go || '', who: nd.who || '', at: nd.at || '' };
  if (e.action === 'see') m.go = 'see';
  else if (e.action === 'reply') { m.go = 'inbox'; m.reply = 1; }
  var q = m.go ? 'go=' + m.go + (m.who ? '&who=' + encodeURIComponent(m.who) : '') +
                 (m.at ? '&at=' + encodeURIComponent(m.at) : '') + (m.reply ? '&reply=1' : '') : '';
  var url = new URL('./' + (q ? '#' + q : ''), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) {
        if (m.go) c.postMessage(m);
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
