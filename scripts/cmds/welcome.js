const fs = require("fs");
const path = require("path");
const WELCOME_FILE = path.join(__dirname, "welcome.json");
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadWelcome() {
  if (!fs.existsSync(WELCOME_FILE)) {
    const def = {};
    fs.writeFileSync(WELCOME_FILE, JSON.stringify(def, null, 2));
    return def;
  }
  try { return JSON.parse(fs.readFileSync(WELCOME_FILE)); } catch { return {}; }
}
function saveWelcome(d) { fs.writeFileSync(WELCOME_FILE, JSON.stringify(d, null, 2)); }
function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return ["61593117279214"];
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE)); } catch { return ["61593117279214"]; }
}

module.exports.config = {
  name: "welcome",
  aliases: ["welcomecard", "goodbye", "bye"],
  version: "4.0 TENGSAMA",
  role: 2,
  description: "Welcome and goodbye messages"
};

module.exports.onStart = async ({ api, event, args }) => {
  try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}

  const MAIN_ADMIN = "61593117279214";
  const admins = loadAdmins();
  if (!admins.includes(event.senderID) && event.senderID !== MAIN_ADMIN) {
    return api.sendMessage(`❌ Only Admins can set welcome!`, event.threadID, event.messageID);
  }

  let welcome = loadWelcome();
  const threadID = event.threadID;
  const type = (args[0]||"").toLowerCase();

  if (!type || type === "status" || type === "list") {
    const enabled = welcome[threadID] ? (welcome[threadID].enabled ? "✅ ON" : "❌ OFF") : "❌ OFF (default ON)";
    return api.sendMessage(
`╔════════════════════╗
║ 👋 WELCOME & BYE STATUS ║
╚════════════════════╝

📊 This GC: ${enabled}
🎨 Welcome: ${welcome[threadID]?.welcomeMsg ? "Custom" : "Default"}
👋 Goodbye: ${welcome[threadID]?.byeMsg ? "Custom" : "Default"}

📝 Commands:
├─ !welcome on - enable
├─ !welcome off - disable
├─ !welcome set - set custom welcome
├─ !welcome setbye - set custom goodbye
├─ !welcome test - test welcome
└─ !welcome testbye - test goodbye

Variables:
{name} = user name
{thread} = group name
{count} = member count

🔐 Master: TENGSAMA`,
      threadID, event.messageID
    );
  }

  if (type === "on") {
    if (!welcome[threadID]) welcome[threadID] = {};
    welcome[threadID].enabled = true;
    saveWelcome(welcome);
    return api.sendMessage(`✅ WELCOME & BYE ENABLED in this GC!`, threadID, event.messageID);
  }

  if (type === "off") {
    if (!welcome[threadID]) welcome[threadID] = {};
    welcome[threadID].enabled = false;
    saveWelcome(welcome);
    return api.sendMessage(`❌ WELCOME & BYE DISABLED`, threadID, event.messageID);
  }

  if (type === "set") {
    const customMsg = args.slice(1).join(" ");
    if (!customMsg) return api.sendMessage(`Use: !welcome set Welcome {name} to {thread}! Enjoy!\n\nVariables: {name}, {thread}, {count}`, threadID, event.messageID);
    if (!welcome[threadID]) welcome[threadID] = {};
    welcome[threadID].welcomeMsg = customMsg;
    welcome[threadID].enabled = true;
    saveWelcome(welcome);
    return api.sendMessage(`✅ Custom welcome set:\n${customMsg}`, threadID, event.messageID);
  }

  if (type === "setbye") {
    const customMsg = args.slice(1).join(" ");
    if (!customMsg) return api.sendMessage(`Use: !welcome setbye Goodbye {name}! We will miss you!`, threadID, event.messageID);
    if (!welcome[threadID]) welcome[threadID] = {};
    welcome[threadID].byeMsg = customMsg;
    welcome[threadID].enabled = true;
    saveWelcome(welcome);
    return api.sendMessage(`✅ Custom goodbye set:\n${customMsg}`, threadID, event.messageID);
  }

  if (type === "test") {
    const threadInfo = await api.getThreadInfo(threadID);
    return api.sendMessage(`╔════════════════════╗\n║ 👋 WELCOME TEST ║\n╚════════════════════╝\n\nWelcome @User to ${threadInfo.threadName}!\n\nYou are member #${threadInfo.participantIDs.length}!\n\nEnjoy! TENGSAMA👍🏿 is here!`, threadID, event.messageID);
  }

  if (type === "testbye") {
    return api.sendMessage(`╔════════════════════╗\n║ 👋 GOODBYE TEST ║\n╚════════════════════╝\n\nGoodbye @User! We will miss you!\n\nThanks for being here!`, threadID, event.messageID);
  }
};

// WELCOME WHEN SOMEONE ADDED
module.exports.onChat = async ({ api, event }) => {
  let welcome = loadWelcome();
  const threadID = event.threadID;

  // Check if disabled
  if (welcome[threadID] && welcome[threadID].enabled === false) return;

  // Someone added
  if (event.logMessageType === "log:subscribe") {
    try {
      const added = event.logMessageData.addedParticipants;
      const threadInfo = await api.getThreadInfo(threadID);
      const botID = api.getCurrentUserID();

      for (let participant of added) {
        const userID = participant.userFbId;
        const userName = participant.fullName || "New member";

        // If bot added, set nickname TENGSAMA👍🏿
        if (userID == botID) {
          try { await api.changeNickname("TENGSAMA👍🏿", threadID, botID); } catch {}
          api.sendMessage(
`╔════════════════════╗
║ 👑 TENGSAMA JOINED! ║
╚════════════════════╝

Yo! I'm TENGSAMA👍🏿!
Thanks for adding me to ${threadInfo.threadName}!

📋 My commands:
├─ !game - casino games
├─ !bank - check wallet
├─ !welcome on/off
└─ !help - all commands

Owner: MASTER TENGSAMA`,
            threadID
          );
          continue;
        }

        // Normal user welcome
        let welcomeMsg = welcome[threadID]?.welcomeMsg || 
`╔════════════════════╗
║ 👋 WELCOME! ║
╚════════════════════╝

Welcome {name}! 🎉

👥 Group: {thread}
🔢 Member #{count}

Enjoy your stay!
TENGSAMA👍🏿 Bot is here to help!

Type !help to see commands!`;

        welcomeMsg = welcomeMsg
          .replace(/{name}/g, userName)
          .replace(/{thread}/g, threadInfo.threadName || "this group")
          .replace(/{count}/g, threadInfo.participantIDs.length);

        api.sendMessage(welcomeMsg, threadID);
      }
    } catch (e) { console.log(e); }
  }

  // Someone left / removed - GOODBYE
  if (event.logMessageType === "log:unsubscribe") {
    try {
      const leftID = event.logMessageData.leftParticipantFbId;
      const botID = api.getCurrentUserID();
      if (leftID == botID) return;

      let byeMsg = welcome[threadID]?.byeMsg ||
`╔════════════════════╗
║ 👋 GOODBYE! ║
╚════════════════════╝

Goodbye {name}! 😢

We will miss you!
Hope to see you again!

TENGSAMA👍🏿`;

      // Try get name
      let userName = "Member";
      try {
        const userInfo = await api.getUserInfo(leftID);
        userName = userInfo[leftID]?.name || "Member";
      } catch {}

      byeMsg = byeMsg
        .replace(/{name}/g, userName)
        .replace(/{thread}/g, "this group");

      api.sendMessage(byeMsg, threadID);
    } catch (e) { console.log(e); }
  }
};

module.exports.onEvent = module.exports.onChat;
