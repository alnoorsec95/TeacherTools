/**
 * خادم تعليقات «ركن المعلم» — Google Apps Script
 * يحفظ التعليقات في ورقة "Comments" داخل نفس ملف Google Sheet.
 * كلمة مرور المشرف تُحفظ في: Project Settings ← Script properties ← ADMIN_PASSWORD
 */
var SHEET = 'Comments';

function sh_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(SHEET);
  if (!s) {
    s = ss.insertSheet(SHEET);
    s.appendRow(['id', 'tool', 'name', 'text', 'ts', 'likes']);
    s.getRange('A:E').setNumberFormat('@'); // نص عادي (يمنع تنفيذ الصيغ)
  }
  return s;
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function props_() { return PropertiesService.getScriptProperties(); }
function enabled_() { return props_().getProperty('ENABLED') !== '0'; }
function isAdmin_(pw) {
  var real = props_().getProperty('ADMIN_PASSWORD');
  return !!real && String(pw || '') === real;
}
function rows_() {
  return sh_().getDataRange().getValues().slice(1);
}

function doGet(e) {
  var a = (e.parameter && e.parameter.action) || 'list';
  var rows = rows_();
  if (a === 'counts') {
    var c = {};
    rows.forEach(function (r) { c[r[1]] = (c[r[1]] || 0) + 1; });
    return out_({ enabled: enabled_(), counts: c });
  }
  var t = e.parameter.tool;
  var list = rows.filter(function (r) { return r[1] === t; }).map(function (r) {
    return { id: r[0], name: r[2], text: r[3], ts: r[4], likes: Number(r[5]) || 0 };
  }).reverse();
  return out_({ enabled: enabled_(), comments: list });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var d = JSON.parse(e.postData.contents);
    var a = d.action;
    if (a === 'check') return out_({ admin: isAdmin_(d.pw) });

    if (a === 'add') {
      if (!enabled_()) return out_({ ok: false, error: 'disabled' });
      if (d.hp) return out_({ ok: true }); // فخ الروبوتات
      var tool = String(d.tool || '');
      if (!/^[a-z0-9_-]{1,30}$/.test(tool)) return out_({ ok: false, error: 'bad_tool' });
      var text = String(d.text || '').replace(/\s+/g, ' ').trim().slice(0, 500);
      var name = String(d.name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (!text) return out_({ ok: false, error: 'empty' });
      sh_().appendRow([Utilities.getUuid(), tool, name, text, new Date().toISOString(), 0]);
      return out_({ ok: true });
    }

    if (a === 'like') {
      var s2 = sh_(), v2 = s2.getDataRange().getValues();
      var delta = Number(d.delta) > 0 ? 1 : -1;
      for (var k = 1; k < v2.length; k++) {
        if (v2[k][0] === d.id) {
          var n = Math.max(0, (Number(v2[k][5]) || 0) + delta);
          s2.getRange(k + 1, 6).setValue(n);
          return out_({ ok: true, likes: n });
        }
      }
      return out_({ ok: false, error: 'not_found' });
    }

    if (a === 'delete') {
      if (!isAdmin_(d.pw)) return out_({ ok: false, error: 'not_admin' });
      var s = sh_(), vals = s.getDataRange().getValues();
      for (var i = vals.length - 1; i >= 1; i--) {
        if (vals[i][0] === d.id) { s.deleteRow(i + 1); return out_({ ok: true }); }
      }
      return out_({ ok: false, error: 'not_found' });
    }

    if (a === 'toggle') {
      if (!isAdmin_(d.pw)) return out_({ ok: false, error: 'not_admin' });
      props_().setProperty('ENABLED', d.enabled ? '1' : '0');
      return out_({ ok: true, enabled: !!d.enabled });
    }
    return out_({ ok: false, error: 'unknown' });
  } catch (err) {
    return out_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}
