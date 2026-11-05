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

function getAllCommands() {
  const cmds = [];
  const p = __dirname;
  if (fs.existsSync(p)) {
    fs.readdirSync(p).forEach(f => {
      if (f.endsWith(".js")) {
        try {
          const c = require(path.join(p, f));
          if (c.config?.name) cmds.push(c.config.name.toLowerCase());
        } catch {}
      }
    });
  }
  return cmds;
}

module.exports.config = {
  name: "disable",
  aliases: ["offcmd", "enable"],
  version: "2.0 TENGTENG👍🏿",
  role: 2,
  description: "Disable/enable commands - Admin only"
};

module.exports.onStart = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const admins = loadAdmins();
  
  if (senderID != MAIN_ADMIN && !admins.includes(String(senderID))) {
    return api.sendMessage(`❌ Only Master TENGTENG👍🏿 can use this!`, threadID, messageID);
  }

  const sub = args[0]?.toLowerCase();
  const target = args[1]?.toLowerCase();
  let disabled = loadDisabled();
  const protectedCmds = ["disable", "enable", "admin", "adminonly"];

  // LIST
  if (!sub || sub === "list") {
    if (disabled.length === 0) return api.sendMessage(`✅ All commands ENABLED!\nMaster: TENGTENG👍🏿`, threadID, messageID);
    return api.sendMessage(`📋 DISABLED (${disabled.length}):\n${disabled.map(c => `❌ ${c}`).join("\n")}\n\n!disable enable all to enable`, threadID, messageID);
  }

  // ENABLE
  if (sub === "enable" || sub === "on") {
    if (!target) return api.sendMessage(`❌ Usage: !disable enable <command>\nOr !disable enable all`, threadID, messageID);
    
    if (target === "all") {
      saveDisabled([]);
      return api.sendMessage(`✅ ALL COMMANDS ENABLED!\nMaster: TENGTENG👍🏿`, threadID, messageID);
    }

    if (!disabled.includes(target)) return api.sendMessage(`✅ !${target} already ENABLED!`, threadID, messageID);
    disabled = disabled.filter(c => c !== target);
    saveDisabled(disabled);
    return api.sendMessage(`✅ ENABLED: !${target}\nMaster: TENGTENG👍🏿`, threadID, messageID);
  }

  // DISABLE
  let cmdToDisable = sub;
  if (sub === "disable" || sub === "off") cmdToDisable = target;

  if (!cmdToDisable) {
    return api.sendMessage(`🔧 DISABLE - TENGTENG👍🏿\n!disable <name> - disable 1\n!disable all - disable ALL\n!disable enable <name> - enable\n!disable enable all - enable ALL\n!disable list`, threadID, messageID);
  }

  // DISABLE ALL
  if (cmdToDisable === "all") {
    const all = getAllCommands().filter(c => !protectedCmds.includes(c));
    saveDisabled(all);
    return api.sendMessage(`❌ DISABLED ALL COMMANDS (${all.length})!\n${all.join(", ")}\n\nProtected: disable, admin stay ON\nUse !disable enable all to enable\nMaster: TENGTENG👍🏿`, threadID, messageID);
  }

  if (protectedCmds.includes(cmdToDisable)) {
    return api.sendMessage(`❌ Cannot disable !${cmdToDisable} (protected)!`, threadID, messageID);
  }

  if (disabled.includes(cmdToDisable)) return api.sendMessage(`❌ !${cmdToDisable} already DISABLED!`, threadID, messageID);

  disabled.push(cmdToDisable);
  saveDisabled(disabled);
  return api.sendMessage(`❌ DISABLED: !${cmdToDisable}\nUsers cannot use it!\nMaster: TENGTENG👍🏿`, threadID, messageID);
};
