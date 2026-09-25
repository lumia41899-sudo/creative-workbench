/**
 * åä½å·¥ä½å° Â· äºç«¯æ¨¡åå°è£ï¼lib/llm.jsï¼
 *
 * ä¾èµï¼window.WorkBuddyCloud.createWorkBuddyCloud è¿åç cloud å®ä¾
 * ç¡¬çº¦æï¼æ¥èª SDK æºç å®æµï¼ï¼
 *   - cloud.llm.chat.completions.create({ model, messages, stream:true })
 *     è¿åãå¼æ­¥çæå¨ãï¼å¿é¡» for await éåè¯»åï¼éæµå¼ä¼è¢« SDK ç´æ¥æç»ã
 *   - æ¯åä¸º OpenAI å¼å®¹ç»æï¼chunk.choices[0].delta.content ç´¯å å³ä¸ºè¾åºã
 *   - æ¨¡åç¨ models.list() è¿åç id å­æ®µã
 *
 * æµè§å¨ï¼window.CWLLM
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CWLLM = factory();
})(typeof self !== "undefined" ? self : this, function () {

  /** ååºå¯ç¨æ¨¡åï¼è¿å [{id,name,...}]ï¼æâæ¯å¦æ´å¼ºâç²ç¥æåºï¼å¼ºæ¨¡åç½®åï¼UI é»è®¤åæåä¸ä¸ªï¼ */
  async function listModels(cloud) {
    var res = await cloud.llm.models.list();
    var arr = Array.isArray(res) ? res : (res && res.data) || [];
    if (!arr.length) return [];
    // æåå­éå¸¦ pro/max/æè°/ultra/gpt-4/claude çæå°åé¢ï¼ä½ä¸ºé»è®¤åé
    var strong = /pro|max|ultra|æè°|gpt-4|gpt4|claude|opus|deepseek[- ]?(v3|r1)?|è¾å¼ºç/i;
    arr.sort(function (a, b) {
      var sa = strong.test((a.name || "") + " " + (a.id || "")) ? 1 : 0;
      var sb = strong.test((b.name || "") + " " + (b.id || "")) ? 1 : 0;
      return sa - sb;
    });
    return arr;
  }

  /**
   * æµå¼çæææ¬ã
   * @param cloud   cloud å®ä¾
   * @param opts   { model, messages, signal, conversationId, onToken(text, full) }
   * @returns å®æ´ææ¬ï¼stringï¼
   */
  async function streamText(cloud, opts) {
    var messages = opts.messages;
    var model = opts.model;
    if (!model) throw new Error("æªæå®æ¨¡åï¼è¯·åå¨ãæ¨¡åãä¸æä¸­éæ©ï¼");
    if (!Array.isArray(messages) || !messages.length) throw new Error("messages ä¸ºç©º");

    // åå»ºæµå¼è¯·æ±ï¼SDK è¦æ± stream:trueï¼å¦åæéï¼
    var stream = await cloud.llm.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      signal: opts.signal || undefined,
      conversationId: opts.conversationId || undefined,
    });

    var full = "";
    var onToken = opts.onToken || null;
    // stream æ¯å¼æ­¥çæå¨
    for await (var chunk of stream) {
      var delta = chunk && chunk.choices && chunk.choices[0] && chunk.choices[0].delta;
      var piece = delta && delta.content;
      if (piece) {
        full += piece;
        if (onToken) { try { onToken(piece, full); } catch (e) {} }
      }
    }
    return full;
  }

  /** ä¸æ¬¡æ§çæï¼åé¨ä»æ¯æµå¼ï¼åªæ¯ä¸åè° tokenï¼ */
  async function complete(cloud, opts) {
    return streamText(cloud, opts);
  }

  return { listModels: listModels, streamText: streamText, complete: complete };
});

