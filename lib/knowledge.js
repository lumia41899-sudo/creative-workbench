/**
 * ç¥è¯å±è¿è¡æ¶å è½½å¨ï¼lib/knowledge.jsï¼
 *
 * è¯»åä¼åçº§ï¼
 *   1) äºç«¯æ°æ®åº cloud.databaseï¼WorkBuddy Cloudï¼è·¨è®¾å¤ï¼ââ ç± sync/ima-to-cloud.js ä» Ima åæ­¥åå¥
 *   2) æ¬å°æå JSONï¼knowledge/*.jsonï¼ââ ååºï¼ç¡®ä¿æ ç½ç»/æªåæ­¥æ¶ä¹è½è·
 *
 * ç¥è¯å±å­æ®µï¼äº§å/åç¹/è§å/Prompt/æ¨¡æ¿ï¼å¨é¨å¨æ­¤è¯»åï¼åºç¨å±é¶ç¡¬ç¼ç ã
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CWKnowledge = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // äºåºè¡¨åï¼ä¸ sync/ima-to-cloud.js åå¥çè¡¨ä¸è´ï¼
  var TABLES = {
    products: "cw_products",
    skills: "cw_skills",
    assets: "cw_assets",
    cases: "cw_cases",
    workflows: "cw_workflows",
    rules: "cw_rules",
    demo: "cw_demo",
  };

  var cloud = null;
  function setCloud(c) { cloud = c; }

  function tableRef(name) {
    if (!cloud || !cloud.database) return null;
    return cloud.database.from(TABLES[name]);
  }

  async function loadCloud(name) {
    try {
      var ref = tableRef(name);
      if (!ref) return null;
      var r = await ref.select("*");
      if (r && r.data && r.data.length) return r.data;
    } catch (e) { /* äºåºä¸å¯ç¨ â èµ°ååº */ }
    return null;
  }

  async function loadBundled(name) {
    try {
      if (typeof window !== "undefined" && window.fetch) {
        var res = await fetch("./knowledge/" + name + ".json", { cache: "no-cache" });
        if (res.ok) return await res.json();
      }
    } catch (e) { /* æ¬å°æä»¶ä¸å¯ç¨ â è¿å null */ }
    return null;
  }

  // åå¹¶ï¼äºä¼åï¼äºä¸ºç©ºæ¶ååºæ¬å°
  async function load(name) {
    var d = await loadCloud(name);
    if (d && d.length) return d;
    return await loadBundled(name);
  }

  // ä¾¿æ·æ¹æ³ï¼ä¾ UI è°ç¨ï¼
  async function loadProducts() { return (await load("products")) || []; }
  async function loadSkills() { return (await load("skills")) || []; }
  async function loadAssets() { return (await load("assets")) || null; }
  async function loadCases() { return (await load("cases")) || []; }
  async function loadWorkflows() { return (await load("workflows")) || []; }

  // åä¾åç¥è¯ï¼rules.json / demo.json æ¯å¯¹è±¡èéæ°ç»ï¼ï¼äºä¼å â æ¬å°ååº
  async function loadCloudOne(name) {
    try {
      var ref = tableRef(name);
      if (!ref) return null;
      var r = await ref.select("*");
      if (r && r.data && r.data.length) {
        var row = r.data[0];
        if (row.data != null) return (typeof row.data === "string") ? JSON.parse(row.data) : row.data;
        return row;
      }
    } catch (e) { /* äºåºä¸å¯ç¨ â èµ°ååº */ }
    return null;
  }
  async function loadBundledRaw(name) {
    try {
      if (typeof window !== "undefined" && window.fetch) {
        var res = await fetch("./knowledge/" + name + ".json", { cache: "no-cache" });
        if (res.ok) return await res.json();
      }
    } catch (e) { /* æ¬å°æä»¶ä¸å¯ç¨ â è¿å null */ }
    return null;
  }
  async function loadRules() { return (await loadCloudOne("rules")) || (await loadBundledRaw("rules")); }
  async function loadDemo() { return (await loadCloudOne("demo")) || (await loadBundledRaw("demo")); }

  // æ skill å­æ®µæ¼æç³»ç»æç¤ºï¼æ¿ä»£åç¡¬ç¼ç  HARD_RULESï¼
  function skillToRules(skill, product) {
    var parts = [];
    parts.push("ä½ æ¯ä¿¡æ¯æµç­è§é¢å¹¿åçèµæ·±ç¼å¯¼ã");
    if (skill && skill.hookRule) parts.push("ãé£æ ¼ã" + skill.hookRule + "ã");
    if (skill && skill.structRule) parts.push("ãç»æã" + skill.structRule + "ã");
    if (skill && skill.qaRule) parts.push("ãåè§/QAã" + skill.qaRule + "ã");
    if (product) {
      parts.push("ãäº§åã" + product.name);
      if (product.positioning) parts.push("äº§åç«æç¹/æ ¸å¿åä½è§åº¦ï¼" + product.positioning);
      if (product.audience) parts.push("ç®æ äººç¾¤ï¼" + product.audience);
      if (product.sellingPoints && product.sellingPoints.length)
        parts.push("åç¹æ¸åï¼" + product.sellingPoints.join("ï¼"));
      if (product.cta) parts.push("CTAï¼" + product.cta);
      if (product.compliance && product.compliance.length)
        parts.push("åè§éå¶ï¼" + product.compliance.join("ï¼"));
      if (product.forbidden && product.forbidden.length)
        parts.push("ç¦ç¨è¡¨è¾¾ï¼" + product.forbidden.join("ï¼"));
    }
    parts.push("æ¯ä¸æ¡èæ¬é½å¿é¡»åå«ï¼äº§åå©çç¹ï¼åç¹ï¼+ å¼å¯¼ï¼CTAï¼ã");
    parts.push("è¾åºå¿é¡»ä¸åªè½æ¯ JSONï¼æ°ç»ï¼ï¼ä¸è¦ä»»ä½è§£éæ§æå­ã");
    return parts.join("\n");
  }

  return {
    TABLES: TABLES,
    setCloud: setCloud,
    load: load,
    loadProducts: loadProducts,
    loadSkills: loadSkills,
    loadAssets: loadAssets,
    loadCases: loadCases,
    loadWorkflows: loadWorkflows,
    loadRules: loadRules,
    loadDemo: loadDemo,
    skillToRules: skillToRules,
  };
});

