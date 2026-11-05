const fs = require("fs");
const path = require("path");
const BANK_FILE = path.join(__dirname, "bank.json");

function loadBank() {
  if (!fs.existsSync(BANK_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(BANK_FILE)); } catch { return {}; }
}
function saveBank(data) { fs.writeFileSync(BANK_FILE, JSON.stringify(data, null, 2)); }

module.exports.config = {
  name: "addmoney",
  aliases: ["am", "setmoney", "addbal"],
  version: "2.0 TENGSAMA",
  role: 2,
  description: "Admin money control - Master TENGSAMA"
};

module.exports.onStart = async ({ api, event, args }) => {
  const ADMIN_ID = "61593117279214";
  if (event.senderID !== ADMIN_ID) {
    return api.sendMessage(`╔════════════════╗\n║ ❌ ACCESS DENIED ║\n╚════════════════╝\nOnly Master TENGSAMA can use this.`, event.threadID, event.messageID);
  }

  const threadID = event.threadID;
  let targetID = null;
  let amount = null;

  if (event.type === "message_reply") {
    targetID = event.messageReply.senderID;
    amount = parseInt(args[0]);
  } else if (Object.keys(event.mentions).length > 0) {
    targetID = Object.keys(event.mentions)[0];
    amount = parseInt(args[1]);
  } else {
    targetID = args[0];
    amount = parseInt(args[1]);
  }

  if (!targetID || isNaN(amount)) {
    return api.sendMessage(`╔════════════════════╗\n║ 💰 FENG ADMIN PANEL ║\n╚════════════════════╝\n\nUse: !addmoney @user 5000\n🔐 Admin: Master TENGSAMA Only`, threadID, event.messageID);
  }

  const bank = loadBank();
  if (!bank[targetID]) bank[targetID] = { wallet: 1000, bank: 0, lastDaily: 0, lastWork: 0, lastInterest: Date.now() };
  
  const oldWallet = bank[targetID].wallet;
  bank[targetID].wallet += amount;
  if (bank[targetID].wallet < 0) bank[targetID].wallet = 0;
  saveBank(bank);

  const name = Object.values(event.mentions)[0]?.replace("@", "") || targetID.slice(0, 8) + "...";

  return api.sendMessage(`╔════════════════════╗\n║ ✅ TRANSACTION SUCCESS ║\n╚════════════════════╝\n\n👤 User: ${name}\n💰 Before: $${oldWallet}\nAfter: $${bank[targetID].wallet}\n\n👑 Executed by: Master TENGSAMA`, threadID, event.messageID);
};
