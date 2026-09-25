/**
 * äº SDK å°è£ï¼lib/cloud.jsï¼
 * ä»åä¸å±èå°è£ï¼æ´é² auth / llm / databaseï¼æ³¨æå±æ§åæ¯ database ä¸æ¯ dbï¼ã
 * æµè§å¨ï¼ä¾èµ index.html å¼å¥ç workbuddy-cloud-sdkï¼window.WorkBuddyCloudï¼ã
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CWCloud = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var ENDPOINT = "https://creative-workbench-33578.app.workbuddy.host";
  var KEY = "wbpk_EeBo8MC7tV0XX1QuWz8NP4_mUZ8yZhSt8GRZyC43RFouGlvpY6FNUIy";

  function create() {
    if (typeof window !== "undefined" && window.WorkBuddyCloud && window.WorkBuddyCloud.createWorkBuddyCloud) {
      return window.WorkBuddyCloud.createWorkBuddyCloud({ endpoint: ENDPOINT, publishableKey: KEY });
    }
    return null;
  }
  return { create: create, ENDPOINT: ENDPOINT, KEY: KEY };
});

