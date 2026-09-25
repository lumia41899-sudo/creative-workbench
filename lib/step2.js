/**
 * åä½å·¥ä½å° Â· ç¬¬ 2 æ­¥ åä½æµç¨ UIï¼lib/step2.jsï¼
 * åæ­¥ + ä¸ä¸ªç¡®è®¤å¡ç¹ï¼äº§å/å¹¿åç±»å/è§å å¨é¨æ¥èªç¥è¯å±ï¼CWKnowledgeï¼ï¼é¶ç¡¬ç¼ç ã
 * ä¾èµï¼CWCloud / CWKnowledge / CWLLM / CWPipeline / CWExporter / ExcelJS
 */
(function () {
  var P = window.CWPipeline, L = window.CWLLM, K = window.CWKnowledge, E = window.CWExporter;
  var cloud = null;
  var state = { products: [], skills: [], rules: null, demoData: null, product: null, skill: null, ctx: null, topics: [], topic: null, dirs: [], dir: null, scs: [], chosen: null, model: "", demo: false };

  function $(id) { return document.getElementById(id); }
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function say(box, text, kind) { box.className = "msg" + (kind ? " " + kind : ""); box.textContent = text || ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function mount(root) {
    root.innerHTML = `
      <div class="bar" style="justify-content:space-between">
        <div><h2 style="margin:0">åä½æµç¨ï¼åæ­¥ + ä¸ä¸ªç¡®è®¤å¡ç¹ï¼</h2><small>AI åªç»åéï¼ä½ éæ¡ææ¿ï¼è¯é¢ â æ¹å â èæ¬</small></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="s2-model" class="btn ghost" style="margin-top:0;padding:6px 8px"></select>
          <button class="btn ghost" id="s2-refresh" style="margin-top:0">å·æ°æ¨¡å</button>
          <label style="margin:0;display:flex;gap:4px;align-items:center;font-size:12px;color:var(--hand)">
            <input type="checkbox" id="s2-demo" style="width:auto;margin:0" /> æ¼ç¤ºæ¨¡å¼ï¼ä¸è°æ¨¡åï¼</label>
        </div>
      </div>
      <ol class="steps">
        <li data-step="1" class="on">â  éäº§å/ç±»å</li>
        <li data-step="2">â¡ åæ¹å</li>
        <li data-step="3">â¢ åºèæ¬</li>
        <li data-step="4">â£ è½ Excel</li>
      </ol>
      <div id="s2-step1">
        <div class="grid2">
          <div>
            <label>äº§åï¼æ¥èªç¥è¯å±ï¼</label><select id="s2-product" class="sel"></select>
            <label>å¹¿åç±»åï¼æ¥èªç¥è¯å±ï¼</label><select id="s2-type" class="sel"></select>
            <label>ç®æ å¹³å°ï¼éå·åéï¼</label><input id="s2-platforms" placeholder="æé³, å°çº¢ä¹¦, å¿«æ, å¾®å" />
          </div>
          <div>
            <label>ç®æ äººç¾¤</label><input id="s2-audience" placeholder="èªå¨å¸¦å¥äº§åè®°å¿ï¼å¯æ¹" />
            <label>åç¹æ¸åï¼æ¯è¡ä¸æ¡ï¼èªå¨å¸¦å¥å¯æ¹ï¼</label>
            <textarea id="s2-points" rows="2" placeholder="èªå¨å¸¦å¥äº§ååç¹"></textarea>
          </div>
        </div>
        <label>äº§åç«æç¹ / æ ¸å¿åä½è§åº¦<span style="color:#c0392b">ï¼å¿å¡«ï¼æ¬æ¹æææ¹åä»¥æ­¤ä¸ºåï¼</span></label>
        <textarea id="s2-positioning" rows="2" placeholder="èªå¨å¸¦å¥äº§åè®°å¿çå®ä½ï¼å¯æ¹"></textarea>
        <label>è¡¥å / å·²æå°ççå®ç­ç¹ï¼å¯ç²è´´ï¼</label>
        <textarea id="s2-extra" rows="2" placeholder="æä½ å¨æé³/å°çº¢ä¹¦çå°ççå®çæ¬¾è¯é¢è´´è¿é"></textarea>
        <button class="btn" id="s2-gene-topic">çæç­ç¹è§åº¦åéï¼Gate1ï¼</button>
        <div id="s2-topic-msg" class="msg"></div>
        <div id="s2-topics" class="cards"></div>
      </div>
      <div id="s2-step2" class="hide">
        <div class="chosen">å·²éè¯é¢ï¼<b id="s2-topic-name"></b></div>
        <button class="btn" id="s2-gene-dir">ååºæ¹ååéï¼å«èåæ¹æ¡ï¼ï¼Gate2ï¼</button>
        <div id="s2-dir-msg" class="msg"></div>
        <div id="s2-dirs" class="cards"></div>
      </div>
      <div id="s2-step3" class="hide">
        <div class="chosen">å·²éæ¹åï¼<b id="s2-dir-name"></b></div>
        <button class="btn" id="s2-gene-script">åº 3 çèæ¬ï¼A/B/Cï¼ï¼Gate3ï¼</button>
        <div id="s2-script-msg" class="msg"></div>
        <div id="s2-scripts" class="cards"></div>
      </div>
      <div id="s2-step4" class="hide">
        <h3 style="margin:6px 0" id="s2-backlog-title">æå­åºï¼0 æ¡ï¼</h3>
        <div id="s2-backlog" class="cards"></div>
        <div style="margin-top:10px">
          <button class="btn" id="s2-export">å¯¼åºè¿æ¹æ¬¡ä¸º Excelï¼æ¨¡æ¿1ï¼</button>
          <button class="btn ghost" id="s2-export-one" style="margin-left:8px">ä»å¯¼åºåéçè¿æ¡</button>
          <button class="btn ghost" id="s2-clear" style="margin-left:8px">æ¸ç©ºæå­åº</button>
        </div>
        <div class="cm" style="color:var(--hand);margin-top:8px">è¯´æï¼æå­åºä¼<b>ç´¯ç§¯</b>ä½ æ¯æ¬¡ç¡®è®¤çèæ¬ï¼æµè§å¨æ¬å°ï¼ï¼ãå¯¼åºè¿æ¹æ¬¡ãä¸æ¬¡æ§å¯¼åºå¨é¨ï¼åªæ³å¯¼åºå½åè¿æ¡ç¹ãä»å¯¼åºåéçè¿æ¡ãã</div>
        <div id="s2-export-msg" class="msg"></div>
        <div style="margin-top:12px">
          <button class="btn ghost" id="s2-more-same" style="margin-top:0">åæ¹åååºä¸ç</button>
          <button class="btn ghost" id="s2-back-dir" style="margin-top:0;margin-left:8px">è¿åæ¢æ¹å</button>
          <button class="btn ghost" id="s2-back-topic" style="margin-top:0;margin-left:8px">æ°è¯é¢éæ¥</button>
        </div>
      </div>
      <pre id="s2-stream" class="stream hide"></pre>
    `;
    $("s2-refresh").addEventListener("click", loadModels);
    $("s2-demo").addEventListener("change", function () { state.demo = this.checked; });
    $("s2-product").addEventListener("change", onProductChange);
    $("s2-gene-topic").addEventListener("click", onGeneTopic);
    $("s2-gene-dir").addEventListener("click", onGeneDir);
    $("s2-gene-script").addEventListener("click", onGeneScript);
    $("s2-export").addEventListener("click", onExport);
    $("s2-export-one").addEventListener("click", onExportOne);
    $("s2-clear").addEventListener("click", onClear);
    $("s2-more-same").addEventListener("click", function () { resetTo(3); });
    $("s2-back-dir").addEventListener("click", function () { resetTo(2); });
    $("s2-back-topic").addEventListener("click", function () { resetTo(1); });
    refreshBacklog();
    loadModels();
    loadKnowledge();
  }

  async function loadKnowledge() {
    try {
      state.products = await K.loadProducts();
      state.skills = await K.loadSkills();
      // è§å / QA / æ¼ç¤ºç´ æï¼å¨é¨æ¥èªç¥è¯å±ï¼çç¸æº Imaï¼ï¼æ³¨å¥ pipeline ä¸ exporterï¼JS åé¶ç¡¬ç¼ç 
      state.rules = await K.loadRules();
      state.demoData = await K.loadDemo();
      if (state.rules) {
        P.setRules(state.rules);
        if (state.rules.qaRules && E && E.setQA) E.setQA(state.rules.qaRules);
      }
      if (state.demoData) P.setDemoData(state.demoData);
    } catch (e) { state.products = []; state.skills = []; }
    var ps = $("s2-product"), ts = $("s2-type");
    ps.innerHTML = state.products.length
      ? state.products.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + "</option>"; }).join("")
      : '<option value="">ï¼ç¥è¯å±ææ äº§åï¼è¯·ååæ­¥ Imaï¼</option>';
    ts.innerHTML = state.skills.length
      ? state.skills.map(function (s) { return '<option value="' + s.id + '">' + esc(s.type) + " Â· " + esc(s.name) + "</option>"; }).join("")
      : '<option value="">ï¼ç¥è¯å±ææ  Skillï¼</option>';
    onProductChange();
  }

  function onProductChange() {
    var p = state.products.find(function (x) { return x.id === $("s2-product").value; }) || null;
    state.product = p;
    if (p) {
      $("s2-audience").value = p.audience || "";
      $("s2-points").value = (p.sellingPoints || []).join("\n");
      $("s2-positioning").value = p.positioning || "";
    }
  }
  function curSkill() { return state.skills.find(function (x) { return x.id === $("s2-type").value; }) || null; }

  function step(n) {
    [1, 2, 3, 4].forEach(function (i) {
      $("s2-step" + i).classList.toggle("hide", i !== n);
      var li = document.querySelector('.steps li[data-step="' + i + '"]');
      if (li) li.className = (i === n) ? "on" : (i < n ? "done" : "");
    });
  }
  function resetTo(n) {
    if (n <= 2) { state.dirs = []; state.dir = null; $("s2-dirs").innerHTML = ""; $("s2-dir-name").textContent = ""; }
    if (n <= 3) { state.scs = []; state.chosen = null; $("s2-scripts").innerHTML = ""; }
    if (n <= 1) { state.topics = []; state.topic = null; $("s2-topics").innerHTML = ""; $("s2-topic-name").textContent = ""; }
    step(n);
  }

  async function loadModels() {
    var sel = $("s2-model");
    if (!cloud) { sel.innerHTML = '<option>æªè¿æ¥äºç«¯</option>'; return; }
    try {
      var models = await L.listModels(cloud);
      if (!models.length) { sel.innerHTML = '<option>æ å¯ç¨æ¨¡å</option>'; return; }
      sel.innerHTML = models.map(function (m) { return '<option value="' + (m.id) + '">' + (m.name || m.id) + "</option>"; }).join("");
      sel.selectedIndex = sel.options.length - 1; state.model = sel.value;
    } catch (e) { sel.innerHTML = '<option>å è½½å¤±è´¥</option>'; }
  }
  function curModel() { return $("s2-model").value; }

  function readCtx() {
    var points = $("s2-points").value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    return {
      productObj: state.product,
      product: state.product ? state.product.name : "",
      platforms: $("s2-platforms").value.split(/[,ï¼]/).map(function (s) { return s.trim(); }).filter(Boolean),
      audience: $("s2-audience").value.trim(),
      positioning: $("s2-positioning").value.trim(),
      sellingPoints: points,
      extra: $("s2-extra").value.trim(),
    };
  }

  async function onGeneTopic() {
    state.ctx = readCtx();
    if (!state.product) { say($("s2-topic-msg"), "è¯·åå¨ç¥è¯å±éæ©ä¸ä¸ªäº§å", "err"); return; }
    var box = $("s2-topic-msg"), pre = $("s2-stream");
    box.className = "msg"; box.textContent = "çæä¸­â¦"; pre.className = "stream"; pre.textContent = "";
    $("s2-gene-topic").disabled = true;
    try {
      var raw = await P.research(state.ctx, { cloud: cloud, model: curModel(), demo: state.demo, onToken: function (_, full) { pre.textContent = full; pre.scrollTop = pre.scrollHeight; } });
      var topics = P.parseArray(raw);
      state.topics = topics; renderTopics(topics);
      box.textContent = "â çæ " + topics.length + " ä¸ªç­ç¹è§åº¦ï¼è¯·éä¸ä¸ªï¼Gate1ï¼"; box.className = "msg ok"; pre.className = "stream hide";
    } catch (e) { box.textContent = "â " + (e.message || e); box.className = "msg err"; }
    finally { $("s2-gene-topic").disabled = false; }
  }
  function renderTopics(list) {
    var box = $("s2-topics"); box.innerHTML = "";
    list.forEach(function (t) {
      var c = el('<div class="card2"><div class="ct">' + esc(t.title) + '</div><div class="cm"><b>ä¸ºä»ä¹ç­ï¼</b>' + esc(t.hot) + '</div><div class="cm"><b>è§åº¦ï¼</b>' + esc(t.angle) + '</div><button class="btn pick">éè¿ä¸ª â</button></div>');
      c.querySelector(".pick").addEventListener("click", function () {
        state.topic = t; $("s2-topic-name").textContent = t.title;
        box.querySelectorAll(".card2").forEach(function (x) { x.classList.remove("sel"); }); c.classList.add("sel"); step(2);
      });
      box.appendChild(c);
    });
  }

  async function onGeneDir() {
    if (!state.topic) return;
    var rules = K.skillToRules(curSkill(), state.product);
    var box = $("s2-dir-msg"), pre = $("s2-stream");
    box.textContent = "çæä¸­â¦"; pre.className = "stream"; pre.textContent = "";
    $("s2-gene-dir").disabled = true;
    try {
      var raw = await P.directions(state.topic.title, state.ctx, { cloud: cloud, model: curModel(), demo: state.demo, rules: rules, onToken: function (_, full) { pre.textContent = full; pre.scrollTop = pre.scrollHeight; } });
      var dirs = P.parseArray(raw);
      state.dirs = dirs; renderDirs(dirs);
      box.textContent = "â çæ " + dirs.length + " ä¸ªæ¹åï¼è¯·ææ¿ä¸ä¸ªï¼Gate2ï¼"; box.className = "msg ok"; pre.className = "stream hide";
    } catch (e) { box.textContent = "â " + (e.message || e); box.className = "msg err"; }
    finally { $("s2-gene-dir").disabled = false; }
  }
  function renderDirs(list) {
    var box = $("s2-dirs"); box.innerHTML = "";
    list.forEach(function (d) {
      var c = el('<div class="card2"><div class="ct">' + esc(d.title) + ' <span class="pill">' + esc(d.form || "") + '</span></div>' +
        '<div class="cm"><b>æ¢æä¹ç©ï¼</b>' + esc(d.gimmick) + '</div><div class="cm"><b>å§ææä¹èµ°ï¼</b>' + esc(d.plot) + '</div>' +
        '<div class="cm"><b>åç¹æ¤å¥+è¯æ¯ï¼</b>' + esc(d.implant) + '</div><div class="cm"><b>å½¢å¼/éå¤´ï¼</b>' + esc(d.form || "") + ' Â· ' + esc(d.shots || "") + ' é' + (d.note ? ' Â· ' + esc(d.note) : '') + '</div>' +
        '<button class="btn pick">éè¿ä¸ªæ¹å â</button></div>');
      c.querySelector(".pick").addEventListener("click", function () { state.dir = d; $("s2-dir-name").textContent = d.title; box.querySelectorAll(".card2").forEach(function (x) { x.classList.remove("sel"); }); c.classList.add("sel"); step(3); });
      box.appendChild(c);
    });
  }

  async function onGeneScript() {
    if (!state.dir) return;
    var rules = K.skillToRules(curSkill(), state.product);
    var box = $("s2-script-msg"), pre = $("s2-stream");
    box.textContent = "çæä¸­â¦"; pre.className = "stream"; pre.textContent = "";
    $("s2-gene-script").disabled = true;
    try {
      var raw = await P.scripts(state.dir, state.ctx, { cloud: cloud, model: curModel(), demo: state.demo, rules: rules, onToken: function (_, full) { pre.textContent = full; pre.scrollTop = pre.scrollHeight; } });
      var scs = P.parseArray(raw);
      state.scs = scs; renderScripts(scs);
      box.textContent = "â åº " + scs.length + " çï¼è¯·éå­æ¯ç ï¼Gate3ï¼"; box.className = "msg ok"; pre.className = "stream hide";
    } catch (e) { box.textContent = "â " + (e.message || e); box.className = "msg err"; }
    finally { $("s2-gene-script").disabled = false; }
  }
  function renderScripts(list) {
    var box = $("s2-scripts"); box.innerHTML = "";
    list.forEach(function (s) {
      var rows = (s.shots || []).map(function (sh, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc(sh.shot || "") + '</td><td>' + esc(sh.visual || "") + '</td><td>' + esc(sh.line || "") + '</td></tr>'; }).join("");
      var c = el('<div class="card2"><div class="ct">çæ¬ ' + esc(s.version) + ' <span class="pill">' + esc(s.kind) + '</span> <span class="pill">' + esc(s.crew || "") + '</span></div>' +
        '<table class="shot"><tr><th>#</th><th>æ¯å«</th><th>ç»é¢</th><th>å°è¯</th></tr>' + rows + '</table>' +
        '<div class="cm" style="margin-top:6px"><b>åºæ¯ï¼</b>' + esc(s.scene || "") + ' Â· <b>éå·ï¼</b>' + esc(s.props || "") + ' Â· <b>æè£ï¼</b>' + esc(s.costume || "") + '</div>' +
        '<button class="btn pick">éè¿ç â</button></div>');
      c.querySelector(".pick").addEventListener("click", function () {
        var norm = P.addToBacklog(s, { direction: state.dir.title, topic: state.topic ? state.topic.title : "" });
        state.chosen = norm; box.querySelectorAll(".card2").forEach(function (x) { x.classList.remove("sel"); }); c.classList.add("sel"); refreshBacklog(); step(4);
      });
      box.appendChild(c);
    });
  }

  function refreshBacklog() {
    var arr = P.getBacklog(); updateCounts(arr.length);
    var box = $("s2-backlog");
    if (!arr.length) { box.innerHTML = '<div class="cm" style="color:var(--hand)">æå­åºä¸ºç©ºãå®æ Gate3 éçåä¼èªå¨è½å¥è¿éã</div>'; return; }
    box.innerHTML = "";
    arr.forEach(function (s) {
      var c = el('<div class="card2 row"><div style="flex:1"><b>èæ¬' + arr.indexOf(s) + '</b> Â· ' + esc(s.direction) + ' <span class="pill">' + esc(s.kind) + '</span> <span class="pill">' + esc(s.crew) + '</span><div class="cm">' + esc(s.shots.length) + ' é Â· ' + esc(s.style) + '</div></div><button class="btn ghost rm" style="margin:0">ç§»é¤</button></div>');
      c.querySelector(".rm").addEventListener("click", function () { P.removeFromBacklog(s._id); refreshBacklog(); });
      box.appendChild(c);
    });
  }
  function onClear() { P.clearBacklog(); refreshBacklog(); }
  function updateCounts(n) {
    if (typeof n !== "number") n = P.getBacklog().length;
    var t = $("s2-backlog-title"); if (t) t.textContent = "æå­åºï¼" + n + " æ¡ï¼";
    var b = $("s2-export"); if (b) b.textContent = "å¯¼åºè¿æ¹æ¬¡ä¸º Excelï¼æ¨¡æ¿1ï¼Â· " + n + " æ¡";
    var o = $("s2-export-one"); if (o) o.textContent = state.chosen ? ("ä»å¯¼åºåéçè¿æ¡ï¼" + (state.chosen.version || "?") + "ï¼") : "ä»å¯¼åºåéçè¿æ¡";
  }

  async function onExportOne() {
    var box = $("s2-export-msg"); box.className = "msg";
    try {
      if (!E || !window.ExcelJS) throw new Error("å¯¼åºå¨æ ExcelJS æªå è½½");
      if (!state.chosen) throw new Error("è¿æ²¡æéä¸­çèæ¬ï¼è¯·åå¨ â¢ åºèæ¬ ééä¸ç");
      var single = {}; Object.keys(state.chosen).forEach(function (k) { if (k[0] !== "_") single[k] = state.chosen[k]; });
      single.no = 1;
      var spec = await E.loadSpec();
      var issues = E.validateBatch([single]);
      var built = E.createWorkbook(window.ExcelJS, { scripts: [single] }, spec);
      var buf = await built.workbook.xlsx.writeBuffer();
      download(buf, "èæ¬ææ¡£_1æ¡.xlsx");
      box.textContent = (issues.length ? "â å·²å¯¼åº 1 æ¡ Â· " + issues.slice(0, 3).join("ï¼") : "â å·²å¯¼åº 1 æ¡ Â· æ ¡éªæ ç¡¬ä¼¤") + " Â· å± " + built.rowCount + " è¡"; box.className = "msg ok";
    } catch (e) { box.textContent = "â å¯¼åºå¤±è´¥ï¼" + (e.message || e); box.className = "msg err"; }
  }
  async function onExport() {
    var box = $("s2-export-msg");
    try {
      if (!E || !window.ExcelJS) throw new Error("å¯¼åºå¨æ ExcelJS æªå è½½");
      var scripts = P.exportScripts();
      if (!scripts.length) throw new Error("æå­åºä¸ºç©ºï¼åç¡®è®¤è³å°ä¸æ¡èæ¬");
      var spec = await E.loadSpec();
      var issues = E.validateBatch(scripts);
      var built = E.createWorkbook(window.ExcelJS, { scripts: scripts }, spec);
      var buf = await built.workbook.xlsx.writeBuffer();
      download(buf, "èæ¬ææ¡£_" + scripts.length + "æ¡.xlsx");
      box.textContent = (issues.length ? "â å·²å¯¼åº " + scripts.length + " æ¡ Â· " + issues.slice(0, 3).join("ï¼") : "â å·²å¯¼åº " + scripts.length + " æ¡ Â· æ ¡éªæ ç¡¬ä¼¤") + " Â· å± " + built.rowCount + " è¡"; box.className = "msg ok";
    } catch (e) { box.textContent = "â å¯¼åºå¤±è´¥ï¼" + (e.message || e); box.className = "msg err"; }
  }
  function download(buf, name) {
    var blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    var url = URL.createObjectURL(blob); var a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
  }

  function init(c) {
    cloud = c;
    if (window.CWKnowledge) window.CWKnowledge.setCloud(c);
    var root = $("step2-root"); if (!root) return;
    mount(root); step(1);
  }

  window.CWStep2 = { init: init, loadModels: loadModels };
})();

