const fs = require("fs");
const path = require("path");
const MAIN_ADMIN = "61593117279214";
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) {
    fs.writeFileSync(ADMIN_FILE, JSON.stringify([MAIN_ADMIN], null, 2));
    return [MAIN_ADMIN];
  }
  try {
    const data = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
    if (!data.includes(MAIN_ADMIN)) {
      data.push(MAIN_ADMIN);
      fs.writeFileSync(ADMIN_FILE, JSON.stringify(data, null, 2));
    }
    return data;
  } catch { return [MAIN_ADMIN]; }
}

function saveAdmins(list) {
  if (!list.includes(MAIN_ADMIN)) list.push(MAIN_ADMIN);
  fs.writeFileSync(ADMIN_FILE, JSON.stringify([...new Set(list)], null, 2));
}

module.exports.config = {
  name: "admin",
  aliases: ["addmin", "ad"],
  version: "6.0",
  role: 0,
  description: "Admin list - TENGSAMA is permanent owner"
};

module.exports.onStart = async ({ api, event, args }) => {
  const { threadID, messageID, senderID, mentions } = event;
  const admins = loadAdmins();
  const isMaster = senderID === MAIN_ADMIN || admins.includes(MAIN_ADMIN);

  if (!isMaster && senderID !== MAIN_ADMIN) {
    return api.sendMessage("❌ Only MASTER TENGSAMA can manage admins! 👑", threadID, messageID);
  }

  const type = args[0]?.toLowerCase();

  if (!type || type === "list") {
    return api.sendMessage(
`👑 TENGSAMA ADMIN LIST:

${admins.map((id, i) => `${i+1}. ${id} ${id === MAIN_ADMIN ? "👑 MASTER" : ""}`).join("\n")}

Main Owner: 61593117279214 (Can't be removed!)
Total: ${admins.length}`,
      threadID, messageID
    );
  }

  if (type === "add") {
    let target = Object.keys(mentions)[0] || args[1];
    if (!target) return api.sendMessage("Use: !admin add @user or ID", threadID, messageID);
    if (admins.includes(target)) return api.sendMessage("Already admin!", threadID, messageID);
    admins.push(target);
    saveAdmins(admins);
    return api.sendMessage(`✅ Added ${target} as admin!\n👑 Master still: ${MAIN_ADMIN}`, threadID, messageID);
  }

  if (type === "remove" || type === "rm") {
    let target = Object.keys(mentions)[0] || args[1];
    if (!target) return api.sendMessage("Use: !admin remove @user", threadID, messageID);
    if (target === MAIN_ADMIN) return api.sendMessage("❌ Can't remove MASTER TENGSAMA 61593117279214! He is permanent owner! 👑", threadID, messageID);
    const newList = admins.filter(id => id !== target);
    saveAdmins(newList);
    return api.sendMessage(`✅ Removed ${target}`, threadID, messageID);
  }
};
