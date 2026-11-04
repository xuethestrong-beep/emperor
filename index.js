const fs = require("fs");
const path = require("path");
const login = require("ws3-fca");

const configPath = "./config.json";
let config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const appStatePath = "./appstate.json";
const cmdsPath = "./scripts/cmds";
const cmds = new Map();

// Load commands
fs.readdirSync(cmdsPath).forEach(file => {
  if (file.endsWith(".js")) {
    try {
      const cmd = require(path.join(__dirname, cmdsPath, file));
      if (cmd.config && cmd.config.name) {
        cmds.set(cmd.config.name.toLowerCase(), cmd);
        if (cmd.config.aliases) {
          cmd.config.aliases.forEach(alias => cmds.set(alias.toLowerCase(), cmd));
        }
      }
    } catch(e) { console.log(`Failed load ${file}: ${e.message}`); }
  }
});

console.log(`👑 Loaded ${cmds.size} commands`);

// Login
let appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));
login({ appState }, (err, api) => {
  if (err) return console.error(err);
  
  console.log("👑 Emperor Bot Started!");

  api.setOptions({ listenEvents: true, selfListen: false });

  api.listen(async (err, event) => {
    if (err) return console.error(err);
    if (event.type !== "message" && event.type !== "message_reply") return;

    const body = event.body || "";

    // 👑 AUTO REACT - OWNER ONLY - ELEGANT
    if (config.autoReact) {
      try {
        const ownerID = (config.ownerID || "61593117279214").toString();
        const senderID = event.senderID.toString();
        const reactFor = config.autoReactFor || "owner";
        if (reactFor === "owner" && senderID === ownerID) {
          api.setMessageReaction(config.autoReactEmoji || "👑", event.messageID, () => {}, true);
        }
      } catch(e) {}
    }

    // 🔒 COMMAND HANDLER WITH LOCK
    if (body.startsWith(config.prefix)) {
      const lockPath = path.join(__dirname, "locked.json");
      let isLocked = false;
      if (fs.existsSync(lockPath)) {
        try { isLocked = JSON.parse(fs.readFileSync(lockPath, "utf8")).locked; } catch(e) {}
      }

      const args = body.slice(config.prefix.length).trim().split(/ +/);
      const cmdName = args[0].toLowerCase();
      const command = cmds.get(cmdName);

      if (command) {
        // Lock check
        if (isLocked) {
          const ownerID = (config.ownerID || "").toString();
          const adminIDs = config.adminIDs || config.admin || [];
          const senderID = event.senderID.toString();
          const isOwner = senderID === ownerID || adminIDs.includes(senderID) || adminIDs.includes(senderID.toString());
          
          if (cmdName !== "lock" && !isOwner) {
            return api.sendMessage(
`     𓆩  𝑨𝑪𝑪𝑬𝑺𝑺 𝑫𝑬𝑵𝑰𝑬𝑫  𓆪

  Bawal ka Botchog 😂😂😂🫵🏿
   si master zin lang 😂😂
   .

  Owner : ${config.ownerName}
  Status : 🔒 Locked`, event.threadID);
          }
        }

        // Role check
        const role = command.config.role || 0;
        if (role > 0) {
          const senderID = event.senderID.toString();
          const ownerID = (config.ownerID || "").toString();
          const adminIDs = config.adminIDs || config.admin || [];
          const isAdmin = adminIDs.includes(senderID) || senderID === ownerID;
          if (role === 2 && senderID !== ownerID) {
            return api.sendMessage(`❀ Owner only command ❀`, event.threadID);
          }
          if (role === 1 && !isAdmin) {
            return api.sendMessage(`❀ Admin only ❀`, event.threadID);
          }
        }

        try {
          await command.onStart({ api, event, args, config, cmds });
        } catch(e) {
          console.error(e);
          api.sendMessage(`❌ Error: ${e.message}`, event.threadID);
        }
      }
    }
  });
});
