const fs = require("fs");
const path = require("path");
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) {
    const def = ["61593117279214"];
    fs.writeFileSync(ADMIN_FILE, JSON.stringify(def, null, 2));
    return def;
  }
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE)); } catch { return ["61593117279214"]; }
}
function saveAdmins(data) { fs.writeFileSync(ADMIN_FILE, JSON.stringify(data, null, 2)); }

module.exports.config = {
  name: "admin",
  aliases: ["admins", "adminlist"],
  version: "4.0 TENGSAMA NOPREFIX",
  role: 2,
  description: "Admin - owner no need !"
};

// FOR NORMAL ! COMMAND
module.exports.onStart = async ({ api, event, args }) => {
  try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}
  return handleAdmin({ api, event, args });
};

// FOR NO PREFIX - OWNER ONLY!
module.exports.onChat = async ({ api, event }) => {
  const MAIN_ADMIN = "61593117279214";
  if (event.senderID !== MAIN_ADMIN) return; // Only MASTER TENGSAMA can no prefix!

  const body = (event.body || "").toLowerCase().trim();
  // Check if message starts with admin commands without !
  if (
    body.startsWith("admin ") ||
    body.startsWith("admin list") ||
    body === "admin list" ||
    body === "admin" ||
    body.startsWith("addmoney ") ||
    body.startsWith("am ") ||
    body.startsWith("bank ") ||
    body.startsWith("game ")
  ) {
    try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}
    
    // Remove the command name and parse args
    let args = event.body.trim().split(/\s+/);
    const cmd = args[0].toLowerCase();
    
    if (cmd === "admin") {
      args.shift(); // Remove "admin"
      return handleAdmin({ api, event, args });
    }
    
    if (cmd === "addmoney" || cmd === "am") {
      args.shift();
      // Simulate addmoney logic
      const addmoneyCmd = require("./addmoney.js");
      if (addmoneyCmd.onStart) return addmoneyCmd.onStart({ api, event, args });
    }
  }
};

async function handleAdmin({ api, event, args }) {
  const MAIN_ADMIN = "61593117279214";
  let admins = loadAdmins();
  const threadID = event.threadID;
  const type = (args[0]||"").toLowerCase();
  const isAdmin = admins.includes(event.senderID) || event.senderID === MAIN_ADMIN;
  
  if (!isAdmin) return;

  if (!type || type === "list") {
    let msg = `╔════════════════════╗\n║ 👑 TENGSAMA ADMIN LIST ║\n╚════════════════════╝\n\nTotal: ${admins.length}\n\n`;
    admins.forEach((id, i) => {
      const isMain = id === MAIN_ADMIN ? " 👑 MASTER TENGSAMA [NO PREFIX]" : "";
      msg += `${i+1}. ${id}${isMain}\n`;
    });
    msg += `\n📝 No ! needed for Owner!\nYou can type:\nadmin add @user\nadmin list\naddmoney @user 5000`;
    return api.sendMessage(msg, threadID, event.messageID);
  }

  if (type === "add") {
    if (event.senderID !== MAIN_ADMIN) return api.sendMessage(`❌ Only MASTER TENGSAMA!`, threadID, event.messageID);
    let targetID = Object.keys(event.mentions)[0] || (event.type === "message_reply" ? event.messageReply.senderID : args[1]);
    if (!targetID) return api.sendMessage("Use: admin add @user (no ! needed!)", threadID, event.messageID);
    if (admins.includes(targetID)) return api.sendMessage(`⚠️ Already admin`, threadID, event.messageID);
    admins.push(targetID); saveAdmins(admins);
    return api.sendMessage(`✅ ADMIN ADDED 😆\n👤 ${targetID}\n👑 By: MASTER TENGSAMA\nNo prefix mode!`, threadID, event.messageID);
  }

  if (type === "remove" || type === "rem") {
    if (event.senderID !== MAIN_ADMIN) return api.sendMessage(`❌ Only MASTER TENGSAMA!`, threadID, event.messageID);
    let targetID = Object.keys(event.mentions)[0] || (event.type === "message_reply" ? event.messageReply.senderID : args[1]);
    if (!targetID) return api.sendMessage("Use: admin remove @user", threadID, event.messageID);
    if (targetID === MAIN_ADMIN) return api.sendMessage(`❌ Cannot remove MASTER!`, threadID, event.messageID);
    admins = admins.filter(id => id !== targetID); saveAdmins(admins);
    return api.sendMessage(`✅ ADMIN REMOVED\n👤 ${targetID}`, threadID, event.messageID);
  }
    }
