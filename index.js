const login = require("ws3-fca");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

console.log(`\n👑 ${config.botName} Starting... Owner: ${config.ownerName}`);

let appState;
try {
  if (process.env.APPSTATE) {
    appState = JSON.parse(process.env.APPSTATE);
    console.log("✅ Loaded APPSTATE from Railway Variable");
  } else {
    appState = require("./appstate.json");
  }
} catch {
  console.log("❌ NO APPSTATE! Add it in Railway Variables");
  process.exit(1);
}

// LOAD COMMANDS FROM scripts/cmds
const cmds = new Map();
const cmdsPath = path.join(__dirname, "scripts", "cmds");
if (fs.existsSync(cmdsPath)) {
  const files = fs.readdirSync(cmdsPath).filter(f => f.endsWith(".js"));
  for (const file of files) {
    try {
      const cmd = require(path.join(cmdsPath, file));
      if (cmd.config && cmd.config.name) {
        cmds.set(cmd.config.name.toLowerCase(), cmd);
        console.log(`✅ Loaded command: ${cmd.config.name}`);
        if (cmd.config.aliases) {
          for (const al of cmd.config.aliases) cmds.set(al.toLowerCase(), cmd);
        }
      }
    } catch(e){ console.log(`❌ Failed to load ${file}: ${e.message}`)}
  }
}
console.log(`👑 Total Commands: ${cmds.size}`);

login({ appState }, (err, api) => {
  if (err) return console.error("❌ Login Fail:", err);
  console.log("✅ Emperor Connected - MQTT Online!");

  api.setOptions({ listenEvents: true, selfListen: false });

  api.listenMqtt((err, event) => {
    if (err) return;
    if (event.type === "message") {
      const body = event.body || "";
      
      // 👑 AUTO REACT - OWNER ONLY
if (config.autoReact) {
  try {
    const ownerID = (config.ownerID || "61593117279214").toString();
    const senderID = event.senderID.toString();
    const reactFor = config.autoReactFor || "owner";
    if (reactFor === "owner" && senderID === ownerID) {
      api.setMessageReaction(config.autoReactEmoji || "😆", event.messageID, () => {}, true);
    }
  } catch(e) {}
}

        // 🔒 COMMAND HANDLER WITH OWNER LOCK
  if (body.startsWith(config.prefix)) {
    const fs = require("fs");
    const path = require("path");
    const lockPath = path.join(__dirname, "locked.json");
    
    let isLocked = false;
    if (fs.existsSync(lockPath)) {
      try { isLocked = JSON.parse(fs.readFileSync(lockPath, "utf8")).locked; } catch(e) {}
    }

    const args = body.slice(config.prefix.length).trim().split(/ +/);
    const cmdName = args[0].toLowerCase();
    const command = cmds.get(cmdName);
    
    if (command) {
      // If locked, only owner can use ANY command
      if (isLocked) {
        const ownerID = (config.ownerID || "").toString();
        const adminIDs = config.adminIDs || config.admin || [];
        const senderID = event.senderID.toString();
        const isOwner = senderID === ownerID || adminIDs.includes(senderID);
        
        // Allow lock command itself to unlock
        if (cmdName !== "lock" && !isOwner) {
          return api.sendMessage(
`╭─ 🔒 LOCKED ─╮
│ ❌ Bot is locked by Owner!
│ 👑 Only owner can use commands
│ Owner: ${config.ownerName}
╰──────────────╯`, event.threadID);
        }
      }

      try {
        command.onStart({ api, event, args, config, cmds });
      } catch(e){ console.error(e); }
    }
  }
