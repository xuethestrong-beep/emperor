const fs = require("fs");
const path = require("path");
const BAN_FILE = path.join(__dirname, "banned.json");
const SPAM_FILE = path.join(__dirname, "antispam.json");
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadSpamConfig() {
  if (!fs.existsSync(SPAM_FILE)) {
    const def = { enabled: true, maxMessages: 5, timeWindow: 10000, banTime: 300000, warns: {} };
    fs.writeFileSync(SPAM_FILE, JSON.stringify(def, null, 2));
    return def;
  }
  try { return JSON.parse(fs.readFileSync(SPAM_FILE)); } catch { return { enabled: true, maxMessages: 5, timeWindow: 10000, banTime: 300000, warns: {} }; }
}
function saveSpamConfig(d) { fs.writeFileSync(SPAM_FILE, JSON.stringify(d, null, 2)); }
function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return ["61593117279214"];
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE)); } catch { return ["61593117279214"]; }
}

// Memory for spam tracking
const userMessages = new Map(); // userID -> [{time, content}]

module.exports.config = {
  name: "antispam",
  aliases: ["antispamlist", "as"],
  version: "3.0 TENGSAMA",
  role: 2,
  description: "Antispam system"
};

module.exports.onStart = async ({ api, event, args }) => {
  try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}
  
  const MAIN_ADMIN = "61593117279214";
  const admins = loadAdmins();
  if (!admins.includes(event.senderID) && event.senderID !== MAIN_ADMIN) return api.sendMessage(`❌ Only Admins!`, event.threadID, event.messageID);

  let config = loadSpamConfig();
  const type = (args[0]||"").toLowerCase();
  const threadID = event.threadID;

  if (!type || type === "status" || type === "list") {
    return api.sendMessage(
`╔════════════════════╗
║ 🛡️ ANTISPAM STATUS ║
╚════════════════════╝

📊 Enabled: ${config.enabled ? "✅ ON" : "❌ OFF"}
⚡ Max Messages: ${config.maxMessages} messages
⏱️ Time Window: ${config.timeWindow/1000}s
🔨 Auto Action: Warn → GC Ban 5 mins

📝 Commands:
├─ !antispam on - enable
├─ !antispam off - disable
├─ !antispam set 5 - set max messages (5 spam = ban)
├─ !antispam reset @user - reset warn
└─ !antispam list - this status

🔐 Master: TENGSAMA`,
      threadID, event.messageID
    );
  }

  if (type === "on" || type === "enable") {
    config.enabled = true; saveSpamConfig(config);
    return api.sendMessage(`✅ ANTISPAM ENABLED! 🛡️\nMax ${config.maxMessages} messages in ${config.timeWindow/1000}s = auto ban`, threadID, event.messageID);
  }

  if (type === "off" || type === "disable") {
    config.enabled = false; saveSpamConfig(config);
    return api.sendMessage(`❌ ANTISPAM DISABLED!`, threadID, event.messageID);
  }

  if (type === "set") {
    const num = parseInt(args[1]);
    if (!num || num < 2) return api.sendMessage(`Use: !antispam set 5\n(2-10)`, threadID, event.messageID);
    config.maxMessages = num; saveSpamConfig(config);
    return api.sendMessage(`✅ Set to ${num} messages = spam`, threadID, event.messageID);
  }

  if (type === "reset") {
    let targetID = Object.keys(event.mentions)[0] || args[1];
    if (!targetID) return api.sendMessage(`Use: !antispam reset @user`, threadID, event.messageID);
    userMessages.delete(targetID);
    return api.sendMessage(`✅ Reset spam data for ${targetID}`, threadID, event.messageID);
  }
};

module.exports.onChat = async ({ api, event }) => {
  const config = loadSpamConfig();
  if (!config.enabled) return;

  const MAIN_ADMIN = "61593117279214";
  const admins = loadAdmins();
  const userID = event.senderID;
  const threadID = event.threadID;
  const now = Date.now();

  // Ignore admin and owner
  if (admins.includes(userID) || userID === MAIN_ADMIN) return;
  // Ignore bot
  if (userID === api.getCurrentUserID()) return;

  // Track message
  if (!userMessages.has(userID)) userMessages.set(userID, []);
  let messages = userMessages.get(userID);
  
  // Add current message
  messages.push({ time: now, content: event.body || "" });
  
  // Remove old messages outside timeWindow
  messages = messages.filter(m => now - m.time < config.timeWindow);
  userMessages.set(userID, messages);

  // Check spam: same message repeated OR too many messages fast
  if (messages.length >= config.maxMessages) {
    const isSameContent = messages.every(m => m.content === messages[0].content && m.content.length > 2);
    const isFlooding = messages.length >= config.maxMessages;

    if (isSameContent || isFlooding) {
      // SPAM DETECTED!
      try { api.setMessageReaction("🚫", event.messageID, () => {}, true); } catch {}

      // Auto ban in GC
      const banned = fs.existsSync(BAN_FILE) ? JSON.parse(fs.readFileSync(BAN_FILE)) : { global: {}, thread: {} };
      if (!banned.thread) banned.thread = {};
      if (!banned.thread[threadID]) banned.thread[threadID] = {};
      
      banned.thread[threadID][userID] = {
        reason: isSameContent ? `Spam same message: "${(event.body||"").slice(0,20)}"` : `Flooding ${messages.length} messages in ${config.timeWindow/1000}s`,
        date: new Date().toLocaleString("en-PH"),
        bannedBy: "ANTISPAM SYSTEM 🛡️",
        auto: true
      };
      fs.writeFileSync(BAN_FILE, JSON.stringify(banned, null, 2));

      api.sendMessage(
`╔════════════════════╗
║ 🚫 ANTISPAM TRIGGERED ║
╚════════════════════╝

👤 User: ${userID}
💀 Reason: ${banned.thread[threadID][userID].reason}
⏱️ Auto GC Ban: 5 mins (or until admin unban)
🛡️ Action: Blocked!

Use !ban unban gc @user to unban early.`,
        threadID
      );

      // Clear spam data
      userMessages.delete(userID);

      // Auto unban after banTime
      setTimeout(() => {
        try {
          const current = JSON.parse(fs.readFileSync(BAN_FILE));
          if (current.thread[threadID] && current.thread[threadID][userID] && current.thread[threadID][userID].auto) {
            delete current.thread[threadID][userID];
            fs.writeFileSync(BAN_FILE, JSON.stringify(current, null, 2));
            api.sendMessage(`✅ Auto unban: ${userID} - spam ban expired (5 mins)`, threadID);
          }
        } catch {}
      }, config.banTime);
    }
  }
};
