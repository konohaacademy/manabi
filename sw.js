// まなびのテラスの入口のサービスワーカー（2026-10-17）。通知を受けて出すだけ。
//  ⚠ ページのキャッシュはしない（中身は全部ウェブアプリの向こうにある。古い入口が残ると直せない）。
//  ⚠ ここは公開リポジトリに載る。秘密も個人情報も書かない。
//  届く中身（push-worker が暗号化して送る）：{ title, body, go?, tag? }
//    go … 開くタブ（week / minna / quiz / kakomon / students …）。入口が中の画面へ渡す。
'use strict';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  var title = String(d.title || 'まなびのテラス').slice(0, 80);
  e.waitUntil(self.registration.showNotification(title, {
    body: String(d.body || '').slice(0, 300),
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: d.tag ? String(d.tag).slice(0, 40) : undefined,
    renotify: !!d.tag,
    data: { go: /^[A-Za-z]{1,20}$/.test(d.go || '') ? d.go : '' },
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var go = (e.notification.data || {}).go || '';
  var url = new URL('./' + (go ? '#go=' + go : ''), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) {
        if (go) c.postMessage({ mt: 'go', go: go });
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
