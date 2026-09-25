/**
 * åä½å·¥ä½å° Â· æµç¨ç¼æï¼lib/pipeline.jsï¼
 *
 * åæ­¥ï¼â  ç¤¾åªè°ç  â â¡ åæ¹å(å«èåæ¹æ¡) â â¢ åºèæ¬3ç â â£ ç¡®è®¤è½ Excel
 * éå¾ï¼AI åªç»åé + çç±ï¼ç¨æ·éæ¡ææ¿ï¼ä¸æ¿ç¨æ·å³å®ã
 *
 * é¶ç¡¬ç¼ç ï¼ç¬¬ä¸é¶æ®µè¦æ±ï¼ï¼æ¬æä»¶ä¸å«ä»»ä½äº§åå / åç¹ / å¹¿åè§å / Prompt æ¨¡æ¿ã
 *   - è§åä¸ Prompt æ¨¡æ¿ï¼ç± setRules() æ³¨å¥ï¼ç¥è¯å± rules.jsonï¼çç¸æº Ima 02_Skillä¸­å¿/05_Workflowï¼
 *   - æ¼ç¤ºç´ æï¼ç± setDemoData() æ³¨å¥ï¼ç¥è¯å± demo.jsonï¼çç¸æº Ima 03_æ¡ä¾ç ç©¶ä¸­å¿ï¼
 * JS åªè´è´£ï¼é¡µé¢é»è¾ / æ°æ®è°ç¨ / AI è°ç¨ / å¯¼åºã
 *
 * æµè§å¨ï¼window.CWPipeline
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CWPipeline = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var LS_KEY = "cw_backlog_v2";

  // ç¥è¯å±æ³¨å¥ï¼ä¸å«ä»»ä½ç¡¬ç¼ç åå®¹ï¼
  var RULES = null;   // rules.jsonï¼globalRules / promptTemplates / qaRules / defaults
  var DEMO = null;    // demo.jsonï¼ç¦»çº¿æ¼ç¤ºç´ æï¼å« {product}/{cta}/{spN} å ä½ç¬¦ï¼

  function setRules(r) { RULES = r || null; }
  function setDemoData(d) { DEMO = d || null; }

  function globalRulesText() {
    if (RULES && RULES.globalRules) {
      var g = RULES.globalRules;
      var parts = [g.role, g.style].filter(Boolean);
      (g.hardRules || []).forEach(function (h) { parts.push(h); });
      return parts.join("\n");
    }
    return "";
  }

  function tpl(name) {
    return (RULES && RULES.promptTemplates && RULES.promptTemplates[name]) || null;
  }

  // å ä½ç¬¦æ¿æ¢ï¼{key} â map[key]
  function fill(str, map) {
    return String(str == null ? "" : str).replace(/\{(\w+)\}/g, function (m, k) {
      return map && map[k] != null ? String(map[k]) : "";
    });
  }

  function ctxText(input) {
    var p = input.productObj || null;
    var lines = [];
    if (p && p.name) lines.push("äº§å/å®¢æ·ï¼" + p.name);
    if (input.positioning) lines.push("äº§åç«æç¹/æ ¸å¿åä½è§åº¦ï¼" + input.positioning);
    else if (p && p.positioning) lines.push("äº§åç«æç¹/æ ¸å¿åä½è§åº¦ï¼" + p.positioning);
    if (p && p.sellingPoints && p.sellingPoints.length) lines.push("åç¹æ¸åï¼" + p.sellingPoints.join("ï¼"));
    if (input.platforms && input.platforms.length) lines.push("ç®æ å¹³å°ï¼" + input.platforms.join("ã"));
    if (input.audience) lines.push("ç®æ äººç¾¤ï¼" + input.audience);
    else if (p && p.audience) lines.push("ç®æ äººç¾¤ï¼" + p.audience);
    if (input.extra) lines.push("è¡¥åï¼" + input.extra);
    return lines.join("\n");
  }

  async function call(opts, buildMessages, mockFn) {
    if (opts.demo) {
      var mock = mockFn();
      if (opts.onToken) {
        var step = Math.max(1, Math.ceil(mock.length / 30));
        for (var i = 0; i < mock.length; i += step) {
          opts.onToken(mock.slice(i, i + step), mock.slice(0, i + step));
          await new Promise(function (r) { setTimeout(r, 12); });
        }
      }
      return mock;
    }
    var messages = buildMessages();
    return CWLLM.streamText(opts.cloud, { model: opts.model, messages: messages, signal: opts.signal, onToken: opts.onToken });
  }

  function parseArray(text) {
    if (typeof text !== "string") text = String(text || "");
    text = text.trim();
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    var s = text.indexOf("[");
    var e = text.lastIndexOf("]");
    if (s === -1 || e === -1 || e < s) throw new Error("æ¨¡åæªè¿åå¯ç¨ JSON æ°ç»");
    var raw = text.slice(s, e + 1);
    var arr;
    try { arr = JSON.parse(raw); }
    catch (err) {
      raw = raw.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
      arr = JSON.parse(raw);
    }
    if (!Array.isArray(arr)) throw new Error("è§£æç»æä¸æ¯æ°ç»");
    return arr;
  }

  // ââ æ¼ç¤ºç´ æï¼å ä½ç¬¦ç±äº§åè®°å¿å¡«åï¼ä¸åæ­»ä»»ä½åç¹ ââ
  function pname(input) { return (input && input.productObj && input.productObj.name) || (input && input.product) || "äº§å"; }
  function mockFill(obj, input) {
    if (!DEMO || !obj) throw new Error("æ¼ç¤ºç´ ææªå è½½ï¼ç¥è¯å± demo.jsonï¼");
    var sp = (input && input.productObj && input.productObj.sellingPoints) ||
             (input && input.sellingPoints) || [];
    var cta = (input && input.productObj && input.productObj.cta) || "";
    return fill(JSON.stringify(obj), {
      product: pname(input),
      cta: cta,
      sp0: sp[0] || "", sp1: sp[1] || sp[0] || "", sp2: sp[2] || sp[0] || "",
    });
  }
  function mockResearch(input) { return mockFill(DEMO && DEMO.research, input); }
  function mockDirections(topic, input) { return mockFill(DEMO && DEMO.directions, input); }
  function mockScripts(direction, input) { return mockFill(DEMO && DEMO.scripts, input); }

  // â  ç¤¾åªè°ç 
  async function research(input, opts) {
    var ctx = ctxText(input);
    var tp = tpl("research");
    if (!tp) throw new Error("Prompt æ¨¡æ¿æªå è½½ï¼ç¥è¯å± rules.json â promptTemplates.researchï¼");
    return call(opts,
      function () {
        return [
          { role: "system", content: tp.system },
          { role: "user", content: fill(tp.user, { ctx: ctx }) }
        ];
      },
      function () { return mockResearch(input); }
    );
  }

  // â¡ åæ¹åï¼å«èåæ¹æ¡ï¼
  async function directions(topic, input, opts) {
    var ctx = ctxText(input);
    var rules = opts.rules || globalRulesText();
    var tp = tpl("directions");
    if (!tp) throw new Error("Prompt æ¨¡æ¿æªå è½½ï¼ç¥è¯å± rules.json â promptTemplates.directionsï¼");
    return call(opts,
      function () {
        return [
          { role: "system", content: fill(tp.system, { rules: rules }) },
          { role: "user", content: fill(tp.user, { topic: topic, ctx: ctx }) }
        ];
      },
      function () { return mockDirections(topic, input); }
    );
  }

  // â¢ åºèæ¬ 3 ç
  async function scripts(direction, input, opts) {
    var ctx = ctxText(input);
    var rules = opts.rules || globalRulesText();
    var tp = tpl("scripts");
    if (!tp) throw new Error("Prompt æ¨¡æ¿æªå è½½ï¼ç¥è¯å± rules.json â promptTemplates.scriptsï¼");
    var fusion = "";
    if (direction && typeof direction === "object") {
      fusion = (direction.gimmick ? "\næ¢ï¼" + direction.gimmick : "") +
               (direction.plot ? "\nå§æï¼" + direction.plot : "") +
               (direction.implant ? "\næ¤å¥ï¼" + direction.implant : "");
    }
    var dirTitle = (direction && direction.title) || direction;
    return call(opts,
      function () {
        return [
          { role: "system", content: fill(tp.system, { rules: rules }) },
          { role: "user", content: fill(tp.user, { direction: dirTitle, fusion: fusion, ctx: ctx }) }
        ];
      },
      function () { return mockScripts(direction, input); }
    );
  }

  function normalizeScript(raw, meta) {
    var D = (RULES && RULES.defaults) || {};
    var kind = raw.kind === "å£æ­" ? "å£æ­" : "å§æ";
    var crew = raw.crew || (D.crewByKind && D.crewByKind[kind]) || "";
    var style = raw.style || (D.styleByKind && D.styleByKind[kind]) || "";
    var shotsRaw = Array.isArray(raw.shots) ? raw.shots : [];
    if (kind === "å£æ­" && shotsRaw.length > 1) shotsRaw = [shotsRaw[0]];
    if (!shotsRaw.length) shotsRaw = [{ shot: D.shot || "", visual: "ä¸»è§é¢å¯¹éå¤´ä»ç»", line: "", note: "" }];
    var shots = shotsRaw.map(function (sh, i) {
      return { no: i + 1, shot: sh.shot || (D.shot || ""), visual: sh.visual || "", line: sh.line || "", note: sh.note || "" };
    });
    return {
      kind: kind, crew: crew, relation: raw.relation || "", scene: raw.scene || "",
      costume: raw.costume || "", makeup: raw.makeup || "", props: raw.props || "",
      style: style, refVideo: D.refVideo || "", direction: meta.direction || "", version: raw.version || "", shots: shots,
    };
  }

  // æå­åºï¼localStorageï¼
  function getBacklog() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; } }
  function saveBacklog(arr) { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
  function addToBacklog(script, meta) {
    var arr = getBacklog();
    var norm = normalizeScript(script, meta);
    norm._id = "s" + Date.now() + "_" + Math.floor(Math.random() * 1e4);
    norm._ts = Date.now();
    norm._topic = meta.topic || "";
    arr.push(norm); saveBacklog(arr); return norm;
  }
  function removeFromBacklog(id) { var arr = getBacklog().filter(function (x) { return x._id !== id; }); saveBacklog(arr); return arr; }
  function clearBacklog() { saveBacklog([]); }

  function exportScripts() {
    var arr = getBacklog().slice();
    arr.sort(function (a, b) {
      if (a.direction !== b.direction) return (a.direction || "").localeCompare(b.direction || "", "zh");
      var ka = a.kind === "å§æ" ? 0 : 1, kb = b.kind === "å§æ" ? 0 : 1;
      return ka - kb;
    });
    return arr.map(function (s, i) {
      var o = {};
      ["kind", "crew", "relation", "scene", "costume", "makeup", "props", "style", "refVideo", "direction", "shots"].forEach(function (k) { o[k] = s[k]; });
      o.no = i + 1; return o;
    });
  }

  return {
    setRules: setRules, setDemoData: setDemoData, globalRulesText: globalRulesText,
    research: research, directions: directions, scripts: scripts,
    parseArray: parseArray, normalizeScript: normalizeScript,
    getBacklog: getBacklog, addToBacklog: addToBacklog, removeFromBacklog: removeFromBacklog, clearBacklog: clearBacklog,
    exportScripts: exportScripts,
  };
});

