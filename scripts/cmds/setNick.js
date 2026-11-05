module.exports.config = {
  name: "setNick",
  version: "1.0 TENGSAMA",
  role: 0,
  description: "Auto nickname TENGSAMA👍🏿 when added to GC"
};

module.exports.onStart = async ({ api, event }) => {
  // Manual command: !setnick
  const threadID = event.threadID;
  try {
    await api.changeNickname("TENGSAMA👍🏿", threadID, api.getCurrentUserID());
    return api.sendMessage(`✅ Nickname set to TENGSAMA👍🏿`, threadID);
  } catch (e) {
    return api.sendMessage(`❌ Cannot set nickname`, threadID);
  }
};

// AUTO when bot is added to group
module.exports.onChat = async ({ api, event }) => {
  // Check if bot was added to GC
  if (event.logMessageType === "log:subscribe") {
    const addedParticipants = event.logMessageData.addedParticipants || [];
    const botID = api.getCurrentUserID();
    
    // Check if bot is in added list
    const botAdded = addedParticipants.some(p => p.userFbId === botID || p.userFbId == botID);
    
    if (botAdded) {
      try {
        // Wait 1 sec then set nickname
        setTimeout(async () => {
          await api.changeNickname("TENGSAMA👍🏿", event.threadID, botID);
          api.sendMessage(
`╔════════════════════╗
║ 👑 TENGSAMA BOT JOINED ║
╚════════════════════╝

Yo! I'm TENGSAMA👍🏿!
Thanks for adding me!

Commands:
!game - casino
!bank - wallet
!admin list

Owner: Master TENGSAMA`,
            event.threadID
          );
        }, 1000);
      } catch (e) {}
    }
  }
};

// ALSO handle when bot joins - GoatBot event
module.exports.onEvent = async ({ api, event }) => {
  if (event.logMessageType === "log:subscribe") {
    const botID = api.getCurrentUserID();
    const added = event.logMessageData.addedParticipants || [];
    if (added.some(p => String(p.userFbId) === String(botID))) {
      try {
        await api.changeNickname("TENGSAMA👍🏿", event.threadID, botID);
      } catch {}
    }
  }
};
