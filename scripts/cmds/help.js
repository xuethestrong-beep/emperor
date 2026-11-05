module.exports.config = {
  name: "help",
  aliases: ["menu", "cmds", "list"],
  version: "6.0 TENGSAMA CLEAN",
  role: 0,
  description: "Show commands - clean"
};

module.exports.onStart = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const fs = require("fs");
  const path = require("path");

  const cmdsPath = path.join(__dirname);
  const files = fs.readdirSync(cmdsPath);

  // If user asks help <command> - show only that command info
  if (args[0]) {
    const cmdName = args[0].toLowerCase();
    try {
      let targetFile = null;
      for (const file of files) {
        if (!file.endsWith(".js")) continue;
        const fullPath = path.join(cmdsPath, file);
        try {
          delete require.cache[require.resolve(fullPath)];
          const cmd = require(fullPath);
          if (cmd.config && (cmd.config.name === cmdName || cmd.config.aliases?.includes(cmdName))) {
            targetFile = cmd;
            break;
          }
        } catch {}
      }

      if (targetFile) {
        return api.sendMessage(
`╔════════════════════╗
║ ${targetFile.config.name.toUpperCase()} ║
╚════════════════════╝

Name: ${targetFile.config.name}
${targetFile.config.aliases ? `Alias: ${targetFile.config.aliases.join(", ")}` : ""}
Desc: ${targetFile.config.description || "No description"}
Version: ${targetFile.config.version || "1.0"}`,
          threadID, messageID
        );
      } else {
        return api.sendMessage(`❌ Command "${cmdName}" not found!`, threadID, messageID);
      }
    } catch {}
  }

  // Main help - CLEAN LIST ONLY, NO EXAMPLES
  let cmdList = [];
  files.forEach(file => {
    if (!file.endsWith(".js")) return;
    if (file === "help.js") return;
    try {
      const fullPath = path.join(cmdsPath, file);
      delete require.cache[require.resolve(fullPath)];
      const cmd = require(fullPath);
      if (cmd.config && cmd.config.name) {
        cmdList.push(cmd.config.name);
      }
    } catch {}
  });

  cmdList = [...new Set(cmdList)].sort();

  // Divide into categories
  const adminCmds = ["admin", "add", "ban", "kick", "welcome", "antiout", "setnick", "restart"];
  const aiCmds = ["ai", "groq", "gpt"];
  const funCmds = ["game", "bank", "autoreact", "noprefix"];

  let msg = `╔════════════════════╗
║ 👑 TENGSAMA MENU ║
╚════════════════════╝

📜 ALL COMMANDS (${cmdList.length}):

${cmdList.join(" • ")}

━━━━━━━━━━━━━━
Use: !help <name>
Example: !help ai

Owner: 61593117279214
Groq: Ready ⚡`;

  api.sendMessage(msg, threadID, messageID);
};
