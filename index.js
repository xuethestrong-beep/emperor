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
      
      // AUTO REACT
      if (config.autoReact) {
        try { api.setMessageReaction(config.autoReact, event.messageID, () => {}, true); } catch {}
      }

      // COMMAND HANDLER
      if (body.startsWith(config.prefix)) {
        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const cmdName = args[0].toLowerCase();
        const command = cmds.get(cmdName);
        if (command) {
          try {
            command.onStart({ api, event, args, config, cmds });
          } catch(e){ console.error(e); }
        }
      }
    }
  });
});
