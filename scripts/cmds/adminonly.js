const fs = require("fs");
const path = require("path");
const ADMINONLY_FILE = path.join(__dirname, "adminonly.json");
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadAdminOnly() {
  if (!fs.existsSync(ADMINONLY_FILE)) return { enabled: false };
  try { return JSON.parse(fs.readFileSync(ADMINONLY_FILE)); } catch { return { enabled: false }; }
}
function saveAdminOnly(d) { fs.writeFileSync(ADMINONLY_FILE, JSON.stringify(d, null, 2)); }
function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return ["61593117279214"];
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE)); } catch { return ["61593117279214"]; }
}

module.exports.config = {
  name: "adminonly",
  aliases: ["onlyadmin", "adminmode"],
  version: "4.0 TENGSAMA",
  role: 2,
  description: "Only admin can use commands"
};

module.exports.onStart = async ({ api, event, args }) => {
  try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}

  const MAIN_ADMIN = "61593117279214";
  const admins = loadAdmins();
  if (!admins.includes(event.senderID) && event.senderID !== MAIN_ADMIN) {
    return api.sendMessage(`❌ Only MASTER TENGSAMA can toggle admin only!`, event.threadID, event.messageID);
  }

  let data = loadAdminOnly();
  const type = (args[0]||"").toLowerCase();
  const threadID = event.threadID;

  if (!type || type === "status") {
    return api.sendMessage(
`╔════════════════════╗
║ 🔐 ADMIN ONLY MODE ║
╚════════════════════╝

📊 Status: ${data.enabled ? "✅ ON - Only admins can command" : "❌ OFF - Everyone can command"}

📝 Commands:
├─ !adminonly on - enable (only admin can use bot)
├─ !adminonly off - disable (everyone can use)
└─ !adminonly status - check

When ON:
Normal users type !game, !bank = BLOCKED ❌
Only admins can use commands ✅

🔐 Master: TENGSAMA`,
      threadID, event.messageID
    );
  }

  if (type === "on" || type === "enable") {
    data.enabled = true;
    saveAdminOnly(data);
    return api.sendMessage(
`╔════════════════════╗
║ ✅ ADMIN ONLY ON 🔒 ║
╚════════════════════╝

Now ONLY ADMINS can use bot commands!

❌ Normal users: !game, !bank, etc = BLOCKED
✅ Admins: Can use all commands

To disable: !adminonly off`,
      threadID, event.messageID
    );
  }

  if (type === "off" || type === "disable") {
    data.enabled = false;
    saveAdminOnly(data);
    return api.sendMessage(`✅ ADMIN ONLY OFF 🔓\nEveryone can use bot now!`, threadID, event.messageID);
  }
};

// BLOCK ALL COMMANDS IF ADMIN ONLY ENABLED
module.exports.onChat = async ({ api, event }) => {
  const data = loadAdminOnly();
  if (!data.enabled) return;

  const body = (event.body || "").trim();
  if (!body.startsWith("!")) return;

  const MAIN_ADMIN = "61593117279214";
  const admins = loadAdmins();
  const isAdmin = admins.includes(event.senderID) || event.senderID === MAIN_ADMIN;

  // Allow adminonly and admin commands even in admin only mode
  const allowedCmds = ["adminonly", "admin", "lockcmd"];
  const cmd = body.slice(1).split(/\s+/)[0].toLowerCase();
  
  if (allowedCmds.includes(cmd)) return;
  if (isAdmin) return; // Admins can use

  // BLOCK NORMAL USER
  try { api.setMessageReaction("🔒", event.messageID, () => {}, true); } catch {}
  
  return api.sendMessage(
`╔════════════════════╗
║ 🔒 ADMIN ONLY MODE ║
╚════════════════════╝

❌ Only admins can use commands now!

This bot is in admin-only mode.
Contact MASTER TENGSAMA to get admin or disable.

🔐 TENGSAMA`,
    event.threadID, event.messageID
  );
};
