/**
 * åä½å·¥ä½å° Â· Excel å¯¼åºå¨ï¼æ¨¡æ¿1 ç»æå¤å»ï¼
 *
 * è®¾è®¡ï¼æ¨¡æ¿å¥çº¦(åå®½/è²/å­/è¡é«/è¡¨å¤´) ä¸åç¡¬ç¼ç ï¼ç»ä¸æ¥èª templates/template1.json
 *      ï¼ç¥è¯å±/å·¥ç¨å±èµäº§ï¼ãè¿è¡æ¶ç± loadSpec() è¯»åï¼æç±è°ç¨æ¹ä¼ å¥ specã
 * æµè§å¨ï¼window.CWExporter.createWorkbook(ExcelJS, batch, spec)
 * Node  ï¼const { createWorkbook, setSpec } = require('./exporter.js')
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CWExporter = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var SPEC = null; // æ¨¡æ¿å¥çº¦ï¼ç± loadSpec()/setSpec() æ³¨å¥ï¼templates/template1.jsonï¼
  var QA = null;   // QA è§åï¼ç± setQA() æ³¨å¥ï¼ç¥è¯å± rules.json â qaRulesï¼

  function setSpec(s) { SPEC = s; }
  function setQA(q) { QA = q || null; }
  async function loadSpec() {
    if (typeof window !== "undefined" && window.fetch) {
      try {
        var r = await fetch("./templates/template1.json", { cache: "no-cache" });
        if (r.ok) return await r.json();
      } catch (e) { /* å¿½ç¥ï¼åé */ }
    }
    return null;
  }

  function titleOf(s) { return "èæ¬" + s.no + "  " + s.direction; }

  function headerValues(s) {
    // ç¼å¯¼ / è§é¢é£æ ¼åå¼å¨é¨æ¥èªæ¨¡æ¿å¥çº¦ï¼ä¸å¨ JS ååæ­»
    var op = (SPEC && SPEC.operator) || "";
    var clip = (SPEC && SPEC.clipType) || "";
    var talk = (SPEC && SPEC.talkType) || "";
    return [
      [s.crew || "", s.relation || "", s.scene || ""],
      [s.costume || "", s.makeup || "", s.props || ""],
      [op, s.style || (s.kind === "å§æ" ? clip : talk), s.refVideo || ""],
    ];
  }

  function estLines(text, cap) {
    text = String(text == null ? "" : text);
    var parts = text.split("\n");
    var total = 0;
    parts.forEach(function (p) {
      if (p.length === 0) total += 1;
      else total += Math.max(1, Math.ceil(p.length / cap));
    });
    return total;
  }

  // æºå¨èªæ£ï¼ææéå¼æ¥èªç¥è¯å±ï¼rules.json â qaRulesï¼ï¼JS åä¸ç¡¬ç¼ç ä»»ä½è§åæ°å¼
  function validateBatch(scripts, qa) {
    qa = qa || QA;
    if (!qa) throw new Error("QA è§åæªå è½½ï¼ç¥è¯å± rules.json â qaRulesï¼");
    var issues = [];
    var clips = scripts.filter(function (s) { return s.kind === "å§æ"; });
    var talks = scripts.filter(function (s) { return s.kind === "å£æ­"; });
    var total = scripts.length;

    if (total > 0 && qa.ratio && qa.ratio.clip != null) {
      var target = qa.ratio.clip;
      var tol = qa.ratio.tolerance == null ? 0.1 : qa.ratio.tolerance;
      var clipRatio = clips.length / total;
      if (Math.abs(clipRatio - target) > tol + 1e-9) {
        issues.push("éæ¯åç¦»ç®æ ï¼å§æ " + clips.length + " / å£æ­ " + talks.length +
          "ï¼ç®æ å§æå æ¯ " + Math.round(target * 100) + "%ï¼");
      }
    }

    var shotRange = qa.clipShotRange || [];
    var talkCount = qa.talkShotCount;
    var vmin = qa.visualMinLen || {};
    var vmax = qa.visualMaxLen;

    scripts.forEach(function (s) {
      var isTalk = s.kind === "å£æ­";
      if (!isTalk) {
        if (shotRange.length === 2 && (s.shots.length < shotRange[0] || s.shots.length > shotRange[1]))
          issues.push("èæ¬" + s.no + "ï¼å§æéå¤´æ° " + s.shots.length + "ï¼åºä¸º " + shotRange[0] + "â" + shotRange[1] + "ï¼");
      } else if (talkCount != null && s.shots.length !== talkCount) {
        issues.push("èæ¬" + s.no + "ï¼å£æ­åºåºå® " + talkCount + " è¡éå·ï¼å®é " + s.shots.length + "ï¼");
      }
      s.shots.forEach(function (sh, i) {
        if (Number(sh.no) !== i + 1) issues.push("èæ¬" + s.no + "ï¼éå·ä¸è¿ç»­ï¼ç¬¬ " + (i + 1) + " è¡ï¼");
      });
      s.shots.forEach(function (sh) {
        var v = String(sh.visual || "");
        var minLen = isTalk ? vmin.talk : vmin.clip;
        if (minLen != null && v.length < minLen)
          issues.push("èæ¬" + s.no + " é" + sh.no + "ï¼ç»é¢æè¿°è¿ç­ï¼" + v.length + " å­ï¼ä¸é " + minLen + "ï¼");
        if (!isTalk && vmax != null && v.length > vmax)
          issues.push("èæ¬" + s.no + " é" + sh.no + "ï¼ç»é¢æè¿°è¿é¿ï¼" + v.length + " å­ï¼ä¸é " + vmax + "ï¼");
      });
      if (!isTalk && s.shots[0] && qa.firstLineMax != null) {
        var first = String(s.shots[0].line || "").replace(/^[ç·å¥³]ï¼/, "");
        if (first.length > qa.firstLineMax)
          issues.push("èæ¬" + s.no + "ï¼å¼å¤´ç¬¬ä¸å¥ " + first.length + " å­ï¼åº â¤" + qa.firstLineMax + "ï¼");
      }
    });

    if (qa.genderAlternate) {
      var talkCrew = talks.map(function (s) { return s.crew; });
      for (var i = 1; i < talkCrew.length; i++) {
        if (talkCrew[i] === talkCrew[i - 1])
          issues.push("å£æ­æ§å«æªäº¤æ¿ï¼èæ¬" + talks[i].no + " ä¸ä¸ä¸æ¡åä¸º " + talkCrew[i]);
      }
    }
    return issues;
  }

  function createWorkbook(ExcelJS, batch, spec) {
    spec = spec || SPEC;
    if (!spec) throw new Error("æ¨¡æ¿å¥çº¦ template1.json æªå è½½ï¼è¯·å loadSpec() æä¼ å¥ spec");
    SPEC = spec;
    var scripts = batch.scripts || batch;
    var wb = new ExcelJS.Workbook();
    wb.creator = "åä½å·¥ä½å°";
    var ws = wb.addWorksheet(spec.sheetName, { views: [{ state: "frozen", ySplit: 0 }] });
    spec.cols.forEach(function (c, i) { ws.getColumn(i + 1).width = c.width; });

    var thin = { style: "thin", color: { argb: spec.color.border } };
    var allBorders = { top: thin, left: thin, bottom: thin, right: thin };
    var centerWrap = { horizontal: "center", vertical: "middle", wrapText: true };
    var leftWrap = { horizontal: "left", vertical: "middle", wrapText: true };

    var r = 1;
    scripts.forEach(function (s) {
      var startRow = r;
      ws.mergeCells("A" + r + ":F" + r);
      var t = ws.getCell("A" + r);
      t.value = titleOf(s);
      t.font = { name: spec.font.name, size: spec.font.size, bold: true, color: { argb: spec.color.titleFg } };
      t.alignment = centerWrap;
      r++;

      var hv = headerValues(s);
      for (var hi = 0; hi < 3; hi++) {
        for (var gi = 0; gi < 3; gi++) {
          var lc = gi * 2 + 1, vc = gi * 2 + 2;
          var lab = ws.getCell(r, lc), val = ws.getCell(r, vc);
          lab.value = spec.headerRows[hi][gi];
          val.value = hv[hi][gi];
          [lab, val].forEach(function (c) {
            c.font = { name: spec.font.name, size: spec.font.size, color: { argb: spec.color.infoFg } };
            c.alignment = centerWrap;
          });
        }
        r++;
      }

      ws.mergeCells("A" + r + ":F" + r);
      var st = ws.getCell("A" + r);
      st.value = "åéå¤´èæ¬";
      st.font = { name: spec.font.name, size: spec.font.size, color: { argb: spec.color.infoFg } };
      st.alignment = centerWrap;
      r++;

      for (var c4 = 1; c4 <= 4; c4++) {
        var hc = ws.getCell(r, c4);
        hc.value = spec.shotHead[c4 - 1];
        hc.font = { name: spec.font.name, size: spec.font.size, color: { argb: spec.color.headFg } };
        hc.alignment = centerWrap;
      }
      ws.mergeCells("E" + r + ":F" + r);
      var hc5 = ws.getCell(r, 5);
      hc5.value = spec.shotHead[4];
      hc5.font = { name: spec.font.name, size: spec.font.size, color: { argb: spec.color.headFg } };
      hc5.alignment = centerWrap;
      r++;

      s.shots.forEach(function (sh) {
        var shNum = ws.getCell(r, 1); shNum.value = Number(sh.no);
        var shShot = ws.getCell(r, 2); shShot.value = sh.shot;
        var shVis = ws.getCell(r, 3); shVis.value = sh.visual;
        var shLine = ws.getCell(r, 4); shLine.value = sh.line;
        ws.mergeCells("E" + r + ":F" + r);
        var shNote = ws.getCell(r, 5); shNote.value = sh.note || "";
        [shNum, shShot, shVis, shLine, shNote].forEach(function (c) {
          c.font = { name: spec.font.name, size: spec.font.size, color: { argb: spec.color.dataFg } };
        });
        shNum.alignment = centerWrap; shShot.alignment = centerWrap;
        shVis.alignment = leftWrap; shLine.alignment = leftWrap; shNote.alignment = leftWrap;
        var vLines = estLines(sh.visual, spec.cap[2]);
        var lLines = estLines(sh.line, spec.cap[3]);
        var lh = s.kind === "å§æ" ? spec.lineHClip : spec.lineH;
        ws.getRow(r).height = Math.max(spec.rowH.dataMin, Math.max(vLines, lLines) * lh + spec.rowPad);
        r++;
      });

      var endRow = r - 1;
      for (var rr = startRow; rr <= endRow; rr++) {
        for (var cc = 1; cc <= 6; cc++) {
          var cell = ws.getCell(rr, cc);
          cell.border = allBorders;
          if (rr === startRow) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: spec.color.titleBg } };
          else if (rr <= startRow + 3) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: spec.color.infoBg } };
          else if (rr === startRow + 4) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: spec.color.infoBg } };
          else if (rr === startRow + 5) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: spec.color.headBg } };
        }
        if (rr === startRow) ws.getRow(rr).height = spec.rowH.title;
        else if (rr <= startRow + 3) {
          var hiIdx = rr - startRow - 1;
          var vals = hv[hiIdx];
          var caps = [spec.cap[1], spec.cap[3], spec.cap[5]];
          var ih = (hiIdx === 0) ? spec.rowH.infoActor : spec.rowH.infoMin;
          for (var k = 0; k < 3; k++) {
            var ln = estLines(vals[k], caps[k]);
            ih = Math.max(ih, ln * spec.lineH + spec.rowPad);
          }
          ws.getRow(rr).height = ih;
        }
        else if (rr === startRow + 4) ws.getRow(rr).height = spec.rowH.label;
        else if (rr === startRow + 5) ws.getRow(rr).height = spec.rowH.head;
      }
    });

    return { workbook: wb, worksheet: ws, rowCount: r - 1 };
  }

  return { setSpec: setSpec, setQA: setQA, loadSpec: loadSpec, titleOf: titleOf, headerValues: headerValues, validateBatch: validateBatch, createWorkbook: createWorkbook };
});

