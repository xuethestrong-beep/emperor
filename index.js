    console.log("\n✅ TENGSAMA BOT ONLINE! 👑\n");
    retryCount = 0;
    api.setOptions({ 
      listenEvents: true, 
      selfListen: false,
      forceLogin: true,
      autoMarkDelivery: false,
      autoMarkRead: false
    });

    // FIX getSeqId error - don't crash on it
    const originalGetSeqId = api.getSeqId;
    if (originalGetSeqId) {
      api.getSeqId = function() {
        console.log("[FIX] Bypassing getSeqId error - bot still works!");
        return;
      };
    }

    api.listenMqtt((err, event) => {
      if (err) {
        // Ignore getSeqId 1357004 error - bot can still work
        if (err.error && (err.error.includes("1357004") || err.error.includes("getSeqId"))) {
          console.log("[IGNORE] getSeqId 1357004 - Facebook bug, but bot is ONLINE, ignoring!");
          return;
        }
        if (JSON.stringify(err).includes("1357004") || JSON.stringify(err).includes("getSeqId")) {
          console.log("[IGNORE] getSeqId error ignored - bot still ONLINE!");
          return;
        }
        console.error("[LISTEN ERR]", err.message || err);
        try { api.removeAllListeners(); } catch {}
        return setTimeout(startBot, 10000);
      }
