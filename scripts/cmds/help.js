const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "help",
  aliases: ["menu", "cmds", "commands"],
  version: "5.0 TENGSAMA",
  role: 0,
  description: "Show all commands"
};

module.exports.onStart = async ({ api, event, args }) => {
  try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}

  const cmdsPath = __dirname;
  const files = fs.readdirSync(cmdsPath).filter(f => f.endsWith(".js"));

  // Your custom descriptions for your files
  const customHelp = {
    "add.js": "➕ Add user to GC: !add @user or !add ID",
    "addmin.js": "👑 Admin management: !addmin @user, !addmin list",
    "addmoney.js": "💰 Add money: !addmoney @user 1000",
    "adminonly.js": "🔐 Admin only mode: !adminonly on/off",
    "ai.js": "🤖 AI Chat: !ai your question",
    "antiout.js": "🔒 Anti leave: !antiout on/off",
    "antispam.js": "🛡️ Anti spam: !antispam on/off/set",
    "ban.js": "🚫 Ban system: !ban @user, !ban list",
    "banCheck.js": "🔍 Auto ban check (no command)",
    "bank.js": "🏦 Bank: !bank, !bank top",
    "feng.js": "🎴 Feng shui: !feng",
    "game.js": "🎰 Casino games: !game (slots, etc)",
    "noPrefix.js": "⚡ No prefix for owner: game, bank, etc",
    "setNick.js": "📝 Set nickname: !setNick TENGSAMA👍🏿",
    "welcome.js": "👋 Welcome card: !welcome on/off/test",
    "help.js": "📋 This menu: !help, !help [cmd name]"
  };

  const threadID = event.threadID;

  // If user asks help for specific command: !help ban
  if (args[0]) {
    const cmdName = args[0].toLowerCase().replace(".js", "");
    const file = files.find(f => f.toLowerCase() === cmdName + ".js");
    
    if (file) {
      try {
        const cmd = require(path.join(cmdsPath, file));
        const config = cmd.config || {};
        return api.sendMessage(
`╔════════════════════╗
║ 📖 HELP: ${config.name?.toUpperCase() || cmdName.toUpperCase()} ║
╚════════════════════╝

📄 File: ${file}
📛 Name: ${config.name || cmdName}
🔗 Aliases: ${config.aliases ? config.aliases.join(", ") : "None"}
👑 Role: ${config.role === 2 ? "Admin only" : config.role === 1 ? "GC Admin" : "Everyone"}
📝 Desc: ${config.description || customHelp[file] || "No description"}

Usage: !${config.name || cmdName}

🔐 Master: TENGSAMA`,
          threadID, event.messageID
        );
      } catch {}
    }
    
    return api.sendMessage(`❌ Command !${args[0]} not found! Use !help to see all.`, threadID, event.messageID);
  }

  // Main help menu
  let total = files.length;
  let adminCmds = [];
  let publicCmds = [];
  let systemCmds = [];

  for (let file of files) {
    try {
      const cmdPath = path.join(cmdsPath, file);
      // Clear cache
      delete require.cache[require.resolve(cmdPath)];
      const cmd = require(cmdPath);
      const role = cmd.config?.role || 0;
      const name = cmd.config?.name || file.replace(".js", "");
      
      if (["banCheck", "noPrefix"].includes(name)) {
        systemCmds.push(`⚙️ ${name} - system`);
      } else if (role === 2) {
        adminCmds.push(`🔒 !${name} - ${customHelp[file] || ""}`);
      } else {
        publicCmds.push(`✅ !${name} - ${customHelp[file] || ""}`);
      }
    } catch {
      publicCmds.push(`✅ !${file.replace(".js","")}`);
    }
  }

  let msg = `╔════════════════════╗
║ 👑 TENGSAMA BOT MENU ║
╚════════════════════╝

📊 Total Commands: ${total}
👑 Bot: TENGSAMA👍🏿

`;

  if (publicCmds.length > 0) {
    msg += `╔══ PUBLIC (${publicCmds.length}) ══╗\n`;
    publicCmds.forEach(c => msg += `║ ${c}\n`);
    msg += `╚═══════════════════╝\n\n`;
  }

  if (adminCmds.length > 0) {
    msg += `╔══ ADMIN ONLY (${adminCmds.length}) ══╗\n`;
    adminCmds.forEach(c => msg += `║ ${c}\n`);
    msg += `╚═══════════════════╝\n\n`;
  }

  msg += `📝 How to use:
├─ !help - this menu
├─ !help ban - info about ban
└─ !help game - info about game

💡 Owner no prefix:
├─ Type: game, bank, welcome
└─ No need ! for you MASTER!

🔐 Owner: 61593117279214
⚡ Version: Emperor v5.0`;

  return api.sendMessage(msg, threadID, event.messageID);
};
