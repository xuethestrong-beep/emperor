const fs = require("fs");
const path = require("path");

const MAIN_ADMIN = "61593117279214";
const ADMIN_FILE = path.join(__dirname, "admin.json");
const DISABLED_FILE = path.join(__dirname, "cache", "disabled.json");

function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return [MAIN_ADMIN];
  try {
    const data = JSON.parse(fs.readFileSync(ADMIN_FILE, "utf8"));
    if (!data.includes(MAIN_ADMIN)) data.push(MAIN_ADMIN);
    return data;
  } catch { return [MAIN_ADMIN]; }
}

function loadDisabled() {
  try {
    if (!fs.existsSync(DISABLED_FILE)) {
      const dir = path.dirname(DISABLED_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DISABLED_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = JSON.parse(fs.readFileSync(DISABLED_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function saveDisabled(list) {
  try {
    const dir = path.dirname(DISABLED_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DISABLED_FILE, JSON.stringify(list, null, 2));
  } catch {}
}

module.exports.config = {
  name: "disable",
  aliases: ["offcmd", "enable", "cmdon", "cmdoff"],
  version: "1.0 TENGTENG👍🏿",
  role: 2, // Admin only
  description: "Disable/enable commands - Admin only"
};

module.exports.onStart = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const admins = loadAdmins();
  
  // ADMIN ONLY CHECK
  if (senderID != MAIN_ADMIN && !admins.includes(String(senderID))) {
    return api.sendMessage(`❌ ACCESS DENIED!\nOnly Master TENGTENG👍🏿 can use this!\nOwner: ${MAIN_ADMIN}`, threadID, messageID);
  }

  const subCommand = args[0]?.toLowerCase();
  const targetCmd = args[1]?.toLowerCase();
  
  let disabled = loadDisabled();

  // !disable list
  if (!subCommand || subCommand === "list") {
    if (disabled.length === 0) {
      return api.sendMessage(`✅ No disabled commands!\nAll commands are ENABLED!\n\nMaster: TENGTENG👍🏿`, threadID, messageID);
    }
    return api.sendMessage(`📋 DISABLED COMMANDS (${disabled.length}):\n\n${disabled.map(c => `❌ ${c}`).join("\n")}\n\nUse: !disable enable <name> to enable\nMaster: TENGTENG👍🏿`, threadID, messageID);
  }

  // !disable on/enable <command>
  if (subCommand === "enable" || subCommand === "on" || args[0] === "enable") {
    const cmdToEnable = (subCommand === "enable" || subCommand === "on") ? targetCmd : subCommand;
    if (!cmdToEnable) return api.sendMessage(`❌ Usage: !disable enable <command>\nExample: !disable enable ai`, threadID, messageID);
    
    if (!disabled.includes(cmdToEnable)) {
      return api.sendMessage(`✅ Command !${cmdToEnable} is already ENABLED!`, threadID, messageID);
    }
    disabled = disabled.filter(c => c !== cmdToEnable);
    saveDisabled(disabled);
    return api.sendMessage(`✅ ENABLED: !${cmdToEnable}\nNow users can use it!\nMaster: TENGTENG👍🏿`, threadID, messageID);
  }

  // !disable off/disable <command>
  let cmdToDisable = subCommand;
  if (subCommand === "disable" || subCommand === "off") {
    cmdToDisable = targetCmd;
  }
  
  if (!cmdToDisable) {
    return api.sendMessage(`🔧 DISABLE COMMAND - TENGTENG👍🏿\n\nUsage:\n!disable <command> - Disable a command\n!disable enable <command> - Enable a command\n!disable list - Show disabled list\n\nExample:\n!disable ai\n!disable bank\n!disable enable ai\n\nMaster: TENGTENG👍🏿`, threadID, messageID);
  }

  // Cannot disable important admin commands
  const protectedCmds = ["disable", "enable", "admin", "adminonly"];
  if (protectedCmds.includes(cmdToDisable)) {
    return api.sendMessage(`❌ Cannot disable protected command !${cmdToDisable}!\nProtected: ${protectedCmds.join(", ")}`, threadID, messageID);
  }

  if (disabled.includes(cmdToDisable)) {
    return api.sendMessage(`❌ Command !${cmdToDisable} is already DISABLED!`, threadID, messageID);
  }

  disabled.push(cmdToDisable);
  saveDisabled(disabled);
  return api.sendMessage(`❌ DISABLED: !${cmdToDisable}\nUsers cannot use it now!\nUse !disable enable ${cmdToDisable} to enable again!\nMaster: TENGTENG👍🏿`, threadID, messageID);
};
