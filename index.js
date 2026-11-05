const fs = require("fs");
const path = require("path");
const http = require("http");

// ============ LOAD APPSTATE FROM RAILWAY VARIABLE ============
let appState;
try {
  if (process.env.APPSTATE) {
    console.log("[TENGSAMA] Using APPSTATE from Railway Variable - SAFE & HIDDEN");
    const decoded = Buffer.from(process.env.APPSTATE, 'base64').toString('utf8');
    appState = JSON.parse(decoded);
  } else if (fs.existsSync(path.join(__dirname, "appstate.json"))) {
    console.log("[TENGSAMA] Using appstate.json file - WARNING: Use Railway Variable!");
    appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
  } else {
    console.error("[ERROR] No appstate found! Set APPSTATE in Railway Variables!");
    process.exit(1);
  }
} catch (e) {
  console.error("[ERROR] Failed to parse appstate:", e.message);
  process.exit(1);
}

// ============ LOGIN LIBRARY ============
let login;
try {
  login = require("fca-unofficial");
  console.log("[LIB] Using fca-unofficial");
} catch {
  try {
    login = require("ws3-fca");
    console.log("[LIB] Using ws3-fca fallback");
  } catch {
    login = require("@dongdev/fca-unofficial");
    console.log("[LIB] Using @dongdev/fca-unofficial");
  }
}

let apiInstance = null;
let retryCount = 0;
const MAX_RETRY = 20;
const cmds = {};

// ============ LOAD ALL COMMANDS ============
function loadCommands() {
  const cmdsPath = path.join(__dirname, "scripts/cmds");
  if (!fs.existsSync(cmdsPath)) {
    console.log("[ERROR] scripts/cmds folder not found!");
    return;
  }
  const files = fs.readdirSync(cmdsPath);
  let loaded = 0;
  files.forEach(file => {
    if (!file.endsWith(".js")) return;
    try {
      const fullPath = path.join(cmdsPath, file);
      delete require.cache[require.resolve(fullPath)];
      const cmd = require(fullPath);
      if (cmd.config && cmd.config.name) {
        cmds[cmd.config.name.toLowerCase()] = cmd;
        if (cmd.config.aliases) {
          cmd.config.aliases.forEach(alias => {
            cmds[alias.toLowerCase()] = cmd;
          });
        }
        console.log(`✅ DONE !${cmd.config.name}`);
        loaded++;
      }
    } catch (e) {
      console.log(`❌ FAIL ${file}: ${e.message}`);
    }
  });
  console.log(`[TENGSAMA] LOADED ${loaded} CMDS - FENG UNIVERSAL INDEX`);
}

// ============ START BOT ============
function startBot() {
  console.log(`\n[TENGSAMA] Starting bot... Attempt ${retryCount + 1}/${MAX_RETRY}`);
  console.log(`[TIME] ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}`);

  loadCommands();

  login({ appState: appState, selfListen: false, autoMarkRead: true }, (err, api) => {
    if (err) {
      console.error("[LOGIN FAILED]", err.error || err.message || err);
      console.error("[INFO] Your appstate is expired or Facebook blocked Railway IP!");
      retryCount++;
      if (retryCount < MAX_RETRY) {
        console.log(`[RETRY] Waiting 30 seconds... (${retryCount}/${MAX_RETRY})`);
        setTimeout(startBot, 30000);
      } else {
        console.log("[FATAL] Max retry reached! Get new appstate!");
        setTimeout(() => process.exit(1), 5000);
      }
      return;
    }

    console.log("\n╔════════════════════════╗");
    console.log("║ ✅ TENGSAMA BOT ONLINE! ║");
    console.log("╚════════════════════════╝\n");
    apiInstance = api;
    retryCount = 0;

    api.setOptions({
      listenEvents: true,
      selfListen: false,
      autoMarkRead: false,
      autoMarkDelivery: true
    });

    // ============ LISTEN ============
    const listener = api.listenMqtt((err, event) => {
      if (err) {
        console.error("[LISTEN ERR]", err.message || err);
        console.log("[RECONNECT] MQTT disconnected, restarting in 10 sec...");
        try { api.removeAllListeners(); } catch {}
        setTimeout(startBot, 10000);
        return;
      }

      try {
        // Handle commands with prefix
        if (event.type === "message" || event.type === "message_reply") {
          const body = event.body || "";
          if (!body) return;

          // Check if it's a command
          const prefix = "!";
          if (body.startsWith(prefix)) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();
            if (cmds[cmdName] && cmds[cmdName].onStart) {
              console.log(`[CMD] !${cmdName} by ${event.senderID} in ${event.threadID}`);
              cmds[cmdName].onStart({ api, event, args, body });
            }
          } else {
            // No prefix handling for master
            const args = body.trim().split(/ +/);
            const cmdName = args[0].toLowerCase();
            // Trigger noprefix handler
            if (cmds["noprefix"] && cmds["noprefix"].onChat) {
              cmds["noprefix"].onChat({ api, event });
            }
            // Also try direct no prefix if user is master
            if (cmds[cmdName] && ["61593117279214"].includes(event.senderID)) {
              const cmdArgs = args.slice(1);
              if (cmds[cmdName].onStart) {
                console.log(`[CMD-NOPREFIX] ${cmdName} by MASTER`);
                cmds[cmdName].onStart({ api, event, args: cmdArgs, body });
              }
            }
          }
        }

        // Handle events (welcome, antiout, etc)
        if (event.logMessageType || event.type === "event" || event.type === "log:subscribe" || event.type === "log:unsubscribe") {
          Object.values(cmds).forEach(cmd => {
            try {
              if (cmd.onChat) cmd.onChat({ api, event });
              if (cmd.onEvent) cmd.onEvent({ api, event });
            } catch {}
          });
        }
      } catch (e) {
        console.log("[EVENT ERROR]", e.message);
      }
    });
  });
}

// ============ KEEP ALIVE & AUTO RESTART ============
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled Rejection:", reason);
  console.log("[RESTART] Forcing exit to trigger Railway restart in 3 sec...");
  setTimeout(() => process.exit(1), 3000);
});

process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err.message);
  console.log("[RESTART] Forcing exit...");
  setTimeout(() => process.exit(1), 3000);
});

// Keep alive log every 3 mins
setInterval(() => {
  console.log(`[ALIVE] TENGSAMA BOT RUNNING - ${new Date().toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" })} - Uptime: ${Math.floor(process.uptime()/60)} mins`);
}, 180000);

// ============ WEB SERVER FOR RAILWAY ============
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <h1>✅ TENGSAMA BOT IS ALIVE! 👍🏿</h1>
    <p>Time: ${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</p>
    <p>Uptime: ${Math.floor(process.uptime()/60)} minutes</p>
    <p>Commands: ${Object.keys(cmds).length}</p>
    <p>Owner: MASTER TENGSAMA</p>
  `);
});

server.listen(process.env.PORT || 3000, () => {
  console.log(`[WEB] Keep alive server running on port ${process.env.PORT || 3000}`);
});

// ============ START ============
startBot();
