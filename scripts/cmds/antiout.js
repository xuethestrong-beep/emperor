const fs = require("fs");
const path = require("path");
const ANTIOUT_FILE = path.join(__dirname, "antiout.json");
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadAntiout() {
  if (!fs.existsSync(ANTIOUT_FILE)) {
    const def = {};
    fs.writeFileSync(ANTIOUT_FILE, JSON.stringify(def, null, 2));
    return def;
  }
  try { return JSON.parse(fs.readFileSync(ANTIOUT_FILE)); } catch { return {}; }
}
function saveAntiout(d) { fs.writeFileSync(ANTIOUT_FILE, JSON.stringify(d, null, 2)); }
function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return ["61593117279214"];
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE)); } catch { return ["61593117279214"]; }
}

module.exports.config = {
  name: "antiout",
  aliases: ["antileave"],
  version: "3.0 TENGSAMA",
  role: 2,
  description: "Antiout - no one can leave GC"
};

module.exports.onStart = async ({ api, event, args }) => {
  try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}

  const MAIN_ADMIN = "61593117279214";
  const admins = loadAdmins();
  if (!admins.includes(event.senderID) && event.senderID !== MAIN_ADMIN) {
    return api.sendMessage(`❌ Only Admins!`, event.threadID, event.messageID);
  }

  let antiout = loadAntiout();
  const threadID = event.threadID;
  const type = (args[0]||"").toLowerCase();

  if (!type || type === "status" || type === "list") {
    const enabled = antiout[threadID] ? "✅ ON" : "❌ OFF";
    return api.sendMessage(
`╔════════════════════╗
║ 🔒 ANTIOUT STATUS ║
╚════════════════════╝

📊 This GC: ${enabled}
👥 GC ID: ${threadID}

📝 Commands:
├─ !antiout on - enable antiout
├─ !antiout off - disable
└─ !antiout status - check

When ON:
Someone leaves = Bot auto add back!
No escape! 😈

🔐 Master: TENGSAMA`,
      threadID, event.messageID
    );
  }

  if (type === "on" || type === "enable") {
    antiout[threadID] = true;
    saveAntiout(antiout);
    return api.sendMessage(
`╔════════════════════╗
║ ✅ ANTIOUT ENABLED 🔒 ║
╚════════════════════╝

No one can leave this GC now!
If someone leaves, bot will auto add back!

Try it! 😈`,
      threadID, event.messageID
    );
  }

  if (type === "off" || type === "disable") {
    delete antiout[threadID];
    saveAntiout(antiout);
    return api.sendMessage(`❌ ANTIOUT DISABLED - People can leave now.`, threadID, event.messageID);
  }
};

// DETECT WHEN SOMEONE LEAVES
module.exports.onChat = async ({ api, event }) => {
  const antiout = loadAntiout();
  const threadID = event.threadID;

  // Only if antiout enabled for this GC
  if (!antiout[threadID]) return;

  if (event.logMessageType === "log:unsubscribe") {
    const leftID = event.logMessageData.leftParticipantFbId;
    const botID = api.getCurrentUserID();

    // Don't add bot itself
    if (leftID == botID) return;

    // Don't add if MASTER TENGSAMA left (respect master)
    if (leftID == "61593117279214") return;

    try {
      // Auto add back
      await api.addUserToGroup(leftID, threadID);
      
      api.sendMessage(
`╔════════════════════╗
