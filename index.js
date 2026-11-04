const login = require("fca-priyansh");
const config = require("./config.json");

console.log(`\n👑 ${config.botName} Starting... Owner: ${config.owner}`);

let appState;
try {
  if (process.env.APPSTATE) {
    appState = JSON.parse(process.env.APPSTATE);
    console.log("✅ Loaded APPSTATE from Railway Variable");
  } else {
    appState = require("./appstate.json");
  }
} catch {
  console.log("❌ NO APPSTATE! Add it in Railway Variables!");
  process.exit(1);
}

login({ appState }, (err, api) => {
  if (err) return console.error("❌ Login Fail:", err);
  console.log("✅ Emperor Connected - MQTT Online!");
  
  api.setOptions({ listenEvents: true, selfListen: false });
  
  api.listenMqtt((err, event) => {
    if (err) return;
    if (event.type === "message") {
      const body = event.body || "";
      
      // 👑 AUTO REACT - Emperor reacts to every message
      if (config.autoReact) {
        try { api.setMessageReaction(config.autoReactEmoji, event.messageID, () => {}, true); } catch {}
      }
      
      // COMMANDS
      if (body.startsWith(config.prefix)) {
        const args = body.slice(config.prefix.length).trim().split(" ");
        const cmd = args[0].toLowerCase();
        
        if (cmd === "restart" && config.admin.includes(event.senderID)) {
          api.sendMessage("👑 Emperor Restarting... 5s!", event.threadID);
          setTimeout(() => process.exit(2), 2000);
        }
        if (cmd === "hi" || cmd === "hello") {
          api.sendMessage(`👑 Hello! I am ${config.botName}! Emperor of chats!`, event.threadID);
        }
        if (cmd === "help") {
          api.sendMessage(`👑 Emperor Commands:\n\n!hi - Hello\n!help - This\n!restart - Restart (admin)\n\nAuto reacts ${config.autoReactEmoji}`, event.threadID);
        }
      }
    }
  });
});
