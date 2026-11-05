const fs = require("fs");
const path = require("path");
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) {
    // Default admin - YOU TENGSAMA
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
  version: "3.0 TENGSAMA",
  role: 2,
  description: "Admin list, add, remove - Master TENGSAMA"
};

module.exports.onStart = async ({ api, event, args }) => {
  const MAIN_ADMIN = "61593117279214"; // MASTER TENGSAMA ONLY CAN ADD/REMOVE
  let admins = loadAdmins();
  const threadID = event.threadID;
  const type = (args[0]||"").toLowerCase();

  // CHECK IF USER IS ADMIN
  const isAdmin = admins.includes(event.senderID) || event.senderID === MAIN_ADMIN;
  if (!isAdmin) {
    return api.sendMessage(
`╔════════════════╗
║ ❌ ACCESS DENIED ║
╚════════════════╝
Only Admins can use this.

Your ID: ${event.senderID}`,
      threadID, event.messageID
    );
  }

  // LIST ADMINS
  if (!type || type === "list" || type === "all") {
    let msg = `╔════════════════════╗\n║ 👑 TENGSAMA ADMIN LIST ║\n╚════════════════════╝\n\n`;
    msg += `Total Admins: ${admins.length}\n\n`;
    admins.forEach((id, i) => {
      const isMain = id === MAIN_ADMIN ? " 👑 MASTER TENGSAMA" : "";
      msg += `${i+1}. ${id}${isMain}\n`;
    });
    msg += `\n📝 Commands:\n├─ !admin add @user\n├─ !admin remove @user\n├─ !admin add 615xxx\n└─ !admin list`;
    return api.sendMessage(msg, threadID, event.messageID);
  }

  // ADD ADMIN - ONLY MASTER TENGSAMA
  if (type === "add") {
    if (event.senderID !== MAIN_ADMIN) {
      return api.sendMessage(`❌ Only MASTER TENGSAMA can add admins!`, threadID, event.messageID);
    }

    let targetID = null;
    if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else if (event.type === "message
