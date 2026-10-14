/**
 * Al Noor Gaming Studio — الإعجابات والتعليقات وعدّاد اللعب
 * الصقي هذا الكود في Apps Script داخل جدول Google، ثم شغّلي الدالة setup مرة واحدة، ثم انشري كتطبيق ويب.
 * الخطوات كاملة في SETUP-ar.md
 *
 * الموافقة على التعليقات: افتحي ورقة Comments وضعي علامة ✔ في عمود approved.
 * الحذف: احذفي الصف.
 */
var STATS = 'Stats';
var COMMENTS = 'Comments';
var MAX_NAME = 30, MAX_TEXT = 500, MAX_SHOWN = 100;

function setup() {
  var ss = SpreadsheetApp.getActive();
  var st = ss.getSheetByName(STATS) || ss.insertSheet(STATS);
  if (st.getLastRow() === 0) st.appendRow(['game', 'likes', 'plays']);
  st.setFrozenRows(1);
  var cm = ss.getSheetByName(COMMENTS) || ss.insertSheet(COMMENTS);
  if (cm.getLastRow() === 0) cm.appendRow(['id', 'game', 'name', 'text', 'time', 'approved']);
  cm.getRange('A:E').setNumberFormat('@');          // نص عادي (يمنع تحويل النص إلى صيغة)
  cm.setFrozenRows(1);
  cm.setColumnWidth(4, 420);
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'stats') return out_({ stats: stats_() });
  if (p.action === 'comments') return out_({ comments: comments_(p.game) });
  return out_({ ok: true });
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return out_({ error: 'bad request' }); }
  if (!d || !/^[A-Za-z0-9_-]{1,60}$/.test(String(d.game || ''))) return out_({ error: 'bad game' });
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (d.action === 'like') return out_(bump_(d.game, 'likes', d.delta > 0 ? 1 : -1));
    if (d.action === 'play') return out_(bump_(d.game, 'plays', 1));
    if (d.action === 'comment') return out_(addComment_(d));
    return out_({ error: 'unknown action' });
  } finally {
    lock.releaseLock();
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  var s = SpreadsheetApp.getActive().getSheetByName(name);
  if (!s) { setup(); s = SpreadsheetApp.getActive().getSheetByName(name); }
  return s;
}

function isApproved_(v) { return v === true || String(v).toUpperCase() === 'TRUE'; }

function stats_() {
  var out = {}, i;
  var st = sheet_(STATS), n = st.getLastRow();
  if (n > 1) {
    var rows = st.getRange(2, 1, n - 1, 3).getValues();
    for (i = 0; i < rows.length; i++) out[rows[i][0]] = { likes: Number(rows[i][1]) || 0, plays: Number(rows[i][2]) || 0, comments: 0 };
  }
  var cm = sheet_(COMMENTS), m = cm.getLastRow();
  if (m > 1) {
    var cs = cm.getRange(2, 1, m - 1, 6).getValues();
    for (i = 0; i < cs.length; i++) {
      if (!isApproved_(cs[i][5])) continue;
      var g = cs[i][1];
      if (!out[g]) out[g] = { likes: 0, plays: 0, comments: 0 };
      out[g].comments++;
    }
  }
  return out;
}

function comments_(game) {
  var cm = sheet_(COMMENTS), m = cm.getLastRow(), list = [];
  if (m < 2) return list;
  var rows = cm.getRange(2, 1, m - 1, 6).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][1] === game && isApproved_(rows[i][5]))
      list.push({ id: rows[i][0], name: rows[i][2], text: rows[i][3], time: rows[i][4] });
  }
  list.sort(function (a, b) { return a.time < b.time ? 1 : -1; });
  return list.slice(0, MAX_SHOWN);
}

function bump_(game, field, delta) {
  var st = sheet_(STATS), n = st.getLastRow(), col = field === 'likes' ? 2 : 3, row = -1;
  if (n > 1) {
    var ids = st.getRange(2, 1, n - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) if (ids[i][0] === game) { row = i + 2; break; }
  }
  if (row < 0) { st.appendRow([game, 0, 0]); row = st.getLastRow(); }
  var cell = st.getRange(row, col);
  cell.setValue(Math.max(0, (Number(cell.getValue()) || 0) + delta));
  return { ok: true, likes: Number(st.getRange(row, 2).getValue()) || 0, plays: Number(st.getRange(row, 3).getValue()) || 0 };
}

function clean_(s, max) {
  s = String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u200B-\u200F\u202A-\u202E]/g, '').trim();
  if (s.length > max) s = s.slice(0, max);
  if (/^[=+\-@]/.test(s)) s = ' ' + s;               // حماية من حقن الصيغ في الجدول
  return s;
}

function addComment_(d) {
  var name = clean_(d.name, MAX_NAME) || 'زائر';
  var text = clean_(d.text, MAX_TEXT);
  if (text.length < 2) return { error: 'empty' };
  var cm = sheet_(COMMENTS);
  var id = Utilities.getUuid();
  cm.appendRow([id, d.game, name, text, new Date().toISOString(), false]);
  cm.getRange(cm.getLastRow(), 6).insertCheckboxes();   // خانة موافقة ✔
  return { ok: true, pending: true, id: id };
}
