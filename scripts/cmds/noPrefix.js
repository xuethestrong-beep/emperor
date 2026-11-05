const fs = require("fs");
const path = require("path");
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return ["61593117279214"];
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE)); } catch { return ["61593117279214"]; }
}

module.exports.config = {
  name: "noPrefix",
  version: "1.0 TENGSAMA",
  role: 0,
  description: "Owner no need !"
};

module.exports.onChat = async ({ api, event }) => {
  const MAIN_ADMIN = "61593117279214";
  if (event.senderID !== MAIN_ADMIN) return; // Only owner

  const text = (event.body || "").trim();
  if (!text) return;
  
  const lower = text.toLowerCase();
  
  // LIST OF COMMANDS THAT WORK WITHOUT !
  const noPrefixCommands = ["admin", "addmoney", "am", "bank", "game", "setnick"];
  
  const firstWord = lower.split(/\s+/)[0];
  
  if (noPrefixCommands.includes(firstWord)) {
    try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}
    
    let args = text.split(/\s+/);
    let cmdName = args.shift().toLowerCase();
    if (cmdName === "am") cmdName = "addmoney";
    
    try {
      const cmdFile = require(`./${cmdName}.js`);
      if (cmdFile.onStart) {
        return cmdFile.onStart({ api, event, args });
      }
    } catch (e) {
      // Command not found
    }
  }
};

module.exports.onStart = async () => {};
