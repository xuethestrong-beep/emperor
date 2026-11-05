const fs = require("fs");
const path = require("path");

const MAIN_ADMIN = "61593117279214";
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return [MAIN_ADMIN];
  try {
    const data = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
    if (!data.includes(MAIN_ADMIN)) data.push(MAIN_ADMIN);
    return data;
  } catch { return [MAIN_ADMIN]; }
}

module.exports.config = {
  name: "autoreact",
  aliases: ["autorea", "reactadmin"],
  version: "6.0 TENGSAMA",
  role: 0,
  description: "Auto 😆 react to admin chats"
};

let isEnabled = true;

module.exports.onStart = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const admins = loadAdmins();
  if (senderID !== MAIN_ADMIN && !admins.includes(senderID)) {
    return api.sendMessage("❌ Only admin can toggle!", threadID, messageID);
  }

  const type = args[0]?.toLowerCase();
  if (type === "on") {
    isEnabled = true;
    return api.sendMessage("✅ Auto 😆 react ENABLED for all admins!", threadID, messageID);
  }
  if (type === "off") {
    isEnabled = false;
    return api.sendMessage("❌ Auto 😆 react DISABLED!", threadID, messageID);
  }

  return api.sendMessage(
`😆 AUTO REACT STATUS:

${isEnabled ? "✅ ON" : "❌ OFF"}

For: Admins only
Emoji: 😆

Commands:
!autoreact on - Enable
!autoreact off - Disable

Master: ${MAIN_ADMIN} 👑`,
    threadID, messageID
  );
};

module.exports.onChat = async ({ api, event }) => {
  try {
    if (!isEnabled) return;
    if (!event.body) return;
    if (event.body.startsWith("!")) return; // Don't react to commands

    const admins = loadAdmins();
    const senderID = event.senderID;

    // Check if sender is admin
    const isAdmin = senderID === MAIN_ADMIN || admins.includes(senderID);
    if (!isAdmin) return;

    // Auto react with 😆
    api.setMessageReaction("😆", event.messageID, (err) => {
      if (!err) console.log(`[AUTOREACT] 😆 reacted to admin ${senderID}`);
    }, true);

  } catch (e) {
    console.log("[AUTOREACT ERROR]", e.message);
  }
};

module.exports.onEvent = module.exports.onChat;
