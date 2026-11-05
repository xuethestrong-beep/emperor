const fs = require("fs");
const path = require("path");
const BAN_FILE = path.join(__dirname, "banned.json");
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadBanned() {
  if (!fs.existsSync(BAN_FILE)) return { global: {}, thread: {} };
  try { 
    const d = JSON.parse(fs.readFileSync(BAN_FILE));
    if (!d.global) d.global = {};
    if (!d.thread) d.thread = {};
    return d;
  } catch { return { global: {}, thread: {} }; }
}
function saveBanned(data) { fs.writeFileSync(BAN_FILE, JSON.stringify(data, null, 2)); }
function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return ["61593117279214"];
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE)); } catch { return ["61593117279214"]; }
}

module.exports.config = {
  name: "ban",
  aliases: ["banned", "block"],
  version: "3.0 SPECIFIC TENGSAMA",
  role: 2,
  description: "Specific ban system"
};

module.exports.onStart = async ({ api, event, args }) => {
  try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}
  
  const MAIN_ADMIN = "61593117279214";
  const admins = loadAdmins();
  if (!admins.includes(event.senderID) && event.senderID !== MAIN_ADMIN) {
    return api.sendMessage(`❌ Only TENGSAMA Admins!`, event.threadID, event.messageID);
  }

  let banned = loadBanned();
  const threadID = event.threadID;
  let type = (args[0]||"").toLowerCase();

  // !ban list / !ban list global / !ban list gc
  if (!type || type === "list") {
    const sub = (args[1]||"").toLowerCase();
    const globalCount = Object.keys(banned.global).length;
    const threadCount = Object.keys(banned.thread).length;
    
    if (sub === "global" || sub === "bot") {
      if (globalCount === 0) return api.sendMessage(`╔════════════════════╗\n║ 🌐 GLOBAL BAN LIST ║\n╚════════════════════╝\n\nNo banned. Clean ✅`, threadID, event.messageID);
      let msg = `╔════════════════════╗\n║ 🌐 GLOBAL BAN LIST ║\n╚════════════════════╝\n\nTotal: ${globalCount}\n\n`;
      for (let id in banned.global) {
        const b = banned.global[id];
        msg += `👤 ${id}\n├─ Reason: ${b.reason}\n├─ Type: GLOBAL BOT BAN\n├─ By: ${b.bannedBy === MAIN_ADMIN ? "MASTER TENGSAMA" : b.bannedBy}\n└─ Date: ${b.date}\n\n`;
      }
      return api.sendMessage(msg, threadID, event.messageID);
    }
    
    if (sub === "gc" || sub === "thread") {
      if (!banned.thread[threadID]) return api.sendMessage(`╔════════════════════╗\n║ 👥 GC BAN LIST ║\n╚════════════════════╝\n\nNo banned in this GC.`, threadID, event.messageID);
      let msg = `╔════════════════════╗\n║ 👥 GC BAN LIST - This Group ║\n╚════════════════════╝\n\n`;
      for (let id in banned.thread[threadID]) {
        const b = banned.thread[threadID][id];
        msg += `👤 ${id}\n├─ Reason: ${b.reason}\n└─ Date: ${b.date}\n\n`;
      }
      return api.sendMessage(msg, threadID, event.messageID);
    }

    // ALL LIST
    return api.sendMessage(
`╔════════════════════╗
║ 🚫 BAN SYSTEM - SPECIFIC ║
╚════════════════════╝

🌐 Global Ban: ${globalCount} users
   → Banned from ALL GCs, cannot use bot anywhere

👥 GC Ban: ${threadCount} GCs have bans
   → Banned only in specific GC

📋 Commands:
├─ !ban list global - show global banned
├─ !ban list gc - show banned in this GC
├─ !ban @user spam - global ban
├─ !ban gc @user toxic - ban only in this GC
├─ !ban unban @user - unban global
└─ !ban unban gc @user - unban in this GC

🔐 Master: TENGSAMA`,
      threadID, event.messageID
    );
  }

  // UNBAN SPECIFIC
  if (type === "unban") {
    const isGC = (args[1]||"").toLowerCase() === "gc";
    let targetID = null;
    if (Object.keys(event.mentions).length > 0) targetID = Object.keys(event.mentions)[0];
    else if (event.type === "message_reply") targetID = event.messageReply.senderID;
    else targetID = isGC ? args[2] : args[1];

    if (!targetID) return api.sendMessage(`Use:\n!ban unban @user = global unban\n!ban unban gc @user = gc unban`, threadID, event.messageID);

    if (isGC) {
      if (banned.thread[threadID] && banned.thread[threadID][targetID]) {
        delete banned.thread[threadID][targetID];
        saveBanned(banned);
        return api.sendMessage(`✅ GC UNBANNED\n👤 ${targetID}\n📍 GC: ${threadID}\nThey can use bot in this GC again!`, threadID, event.messageID);
      } else return api.sendMessage(`⚠️ Not GC banned in this group`, threadID, event.messageID);
    } else {
      if (banned.global[targetID]) {
        delete banned.global[targetID];
        saveBanned(banned);
        return api.sendMessage(`✅ GLOBAL UNBANNED\n👤 ${targetID}\n🌐 Can use bot everywhere now!`, threadID, event.messageID);
      } else return api.sendMessage(`⚠️ Not globally banned`, threadID, event.messageID);
    }
  }

  // BAN LOGIC - SPECIFIC
  let isGCBan = false;
  let targetID = null;
  let reason = "No reason";

  if (type === "gc") {
    isGCBan = true;
    if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      reason = args.slice(2).join(" ") || "No reason";
    } else if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
      reason = args.slice(1).join(" ") || "No reason";
    } else {
      targetID = args[1];
      reason = args.slice(2).join(" ") || "No reason";
    }
  } else {
    // GLOBAL BAN
    if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
      reason = args.slice(1).join(" ") || "No reason";
    } else if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
      reason = args.slice(0).join(" ") || "No reason";
    } else {
      targetID = args[0];
      reason = args.slice(1).join(" ") || "No reason";
    }
  }

  if (!targetID) return api.sendMessage(`Use:\n!ban @user reason = GLOBAL BAN\n!ban gc @user reason = GC BAN ONLY`, threadID, event.messageID);
  if (targetID === MAIN_ADMIN) return api.sendMessage(`❌ Cannot ban MASTER TENGSAMA!`, threadID, event.messageID);
  if (admins.includes(targetID)) return api.sendMessage(`❌ Cannot ban Admin!`, threadID, event.messageID);

  const banData = { reason, date: new Date().toLocaleString("en-PH"), bannedBy: event.senderID, threadID };

  if (isGCBan) {
    if (!banned.thread[threadID]) banned.thread[threadID] = {};
    banned.thread[threadID][targetID] = banData;
    saveBanned(banned);
    return api.sendMessage(`╔════════════════════╗\n║ 👥 GC BANNED ║\n╚════════════════════╝\n\n👤 ${targetID}\n📍 GC: ${threadID}\n💀 Reason: ${reason}\n👑 By: MASTER TENGSAMA\n\n⚠️ Banned ONLY in this GC!\nThey can still use bot in other GCs.`, threadID, event.messageID);
  } else {
    banned.global[targetID] = banData;
    saveBanned(banned);
    return api.sendMessage(`╔════════════════════╗\n║ 🌐 GLOBAL BANNED ║\n╚════════════════════╝\n\n👤 ${targetID}\n💀 Reason: ${reason}\n👑 By: MASTER TENGSAMA\n\n🚫 Banned from ALL GCs!\nCannot use bot anywhere!`, threadID, event.messageID);
  }
};

// CHECK BAN - USE THIS IN game.js bank.js
module.exports.checkBan = (userID, threadID) => {
  const banned = loadBanned();
  if (banned.global[userID]) return { banned: true, type: "global", data: banned.global[userID] };
  if (banned.thread[threadID] && banned.thread[threadID][userID]) return { banned: true, type: "gc", data: banned.thread[threadID][userID] };
  return { banned: false };
};
