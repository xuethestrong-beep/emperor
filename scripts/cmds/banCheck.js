const fs = require("fs");
const path = require("path");
const BAN_FILE = path.join(__dirname, "banned.json");

function loadBanned() {
  if (!fs.existsSync(BAN_FILE)) return { global: {}, thread: {} };
  try { 
    const d = JSON.parse(fs.readFileSync(BAN_FILE));
    if (!d.global) d.global = {};
    if (!d.thread) d.thread = {};
    return d;
  } catch { return { global: {}, thread: {} }; }
}

module.exports.config = {
  name: "banCheck",
  version: "1.0 TENGSAMA AUTO",
  role: 0,
  description: "Auto block banned users - no need edit other cmds"
};

module.exports.onChat = async ({ api, event }) => {
  // Only check if message is a command (starts with ! or owner no prefix)
  const body = (event.body || "").toLowerCase();
  if (!body.startsWith("!") && !body.startsWith("bank") && !body.startsWith("game") && !body.startsWith("admin") && !body.startsWith("ban")) return;

  const banned = loadBanned();
  const userID = event.senderID;
  const threadID = event.threadID;

  if (banned.global[userID]) {
    try { api.setMessageReaction("🚫", event.messageID, () => {}, true); } catch {}
    return api.sendMessage(`🚫 GLOBAL BANNED - ${banned.global[userID].reason}`, threadID, event.messageID);
  }

  if (banned.thread[threadID] && banned.thread[threadID][userID]) {
    try { api.setMessageReaction("🚫", event.messageID, () => {}, true); } catch {}
    return api.sendMessage(`🚫 BANNED IN THIS GC - ${banned.thread[threadID][userID].reason}`, threadID, event.messageID);
  }
};

module.exports.onStart = async () => {};
