const fs = require("fs");
const path = require("path");
const http = require("http");

// ============ LOAD APPSTATE FROM RAILWAY ============
let appState;
try {
  if (process.env.APPSTATE) {
    console.log("[TENGSAMA] Using APPSTATE from Railway Variable - SAFE");
    const decoded = Buffer.from(process.env.APPSTATE, 'base64').toString('utf8');
    appState = JSON.parse(decoded);
  } else if (fs.existsSync(path.join(__dirname, "appstate.json"))) {
    console.log("[TENGSAMA] Using appstate.json file");
    appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
  } else {
    console.error("[ERROR] No appstate! Set APPSTATE in Railway Variables!");
    process.exit(1);
  }
} catch (e) {
  console.error("[ERROR] Parse appstate failed:", e.message);
  process.exit(1);
}

// ============ LOGIN LIBRARY ============
let login;
try {
  login = require("fca-unofficial");
  console.log("[LIB] Using fca-unofficial");
} catch {
  login = require("ws3-fca");
  console.log("[LIB] Using ws3-fca");
}

// ============ GROQ SETUP ============
let groqClient = null;
try {
  const Groq = require("groq-sdk");
  if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log("[GROQ] Groq AI Enabled! Key found!");
  } else {
    console.log("[GROQ] No GROQ_API_KEY in Railway! AI will use fallback!");
  }
} catch (e) {
  console.log("[GROQ] groq-sdk not installed yet, will install on deploy");
}

let retryCount = 0;
const MAX_RETRY = 20;
const cmds = {};

function loadCommands() {
  const cmdsPath = path.join(__dirname, "scripts/cmds");
  if (!fs.existsSync(cmdsPath)) return;
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
          cmd.config.aliases.forEach(a => cmds[a.toLowerCase()] = cmd);
        }
        console.log(`✅ DONE !${cmd.config.name}`);
        loaded++;
      }
    } catch (e) {
      console.log(`❌ FAIL ${file}: ${e.message}`);
    }
  });
  console.log(`[TENGSAMA] LOADED ${loaded} CMDS`);
}

function startBot() {
  console.log(`\n[TENGSAMA] Starting... Attempt ${retryCount + 1}/${MAX_RETRY}`);
  loadCommands();

  login({ appState: appState, selfListen: false }, (err, api) => {
    if (err) {
      console.error("[LOGIN FAIL]", err.error || err.message || err);
      retryCount++;
      if (retryCount < MAX_RETRY) {
        console.log(`[RETRY] 30 sec... (${retryCount}/${MAX_RETRY})`);
        return setTimeout(startBot, 30000);
      }
      return setTimeout(() => process.exit(1), 5000);
    }

    console.log("\n╔════════════════════════╗");
    console.log("║ ✅ TENGSAMA BOT ONLINE ║");
    console.log(`║ 🤖 GROQ: ${groqClient ? "READY" : "NO KEY"}         ║`);
    console.log("╚════════════════════════╝\n");
    retryCount = 0;

    api.setOptions({ listenEvents: true, selfListen: false });

    api.listenMqtt((err, event) => {
      if (err) {
        console.error("[LISTEN ERR]", err.message || err);
        console.log("[RECONNECT] 10 sec...");
        try { api.removeAllListeners(); } catch {}
        return setTimeout(startBot, 10000);
      }

      try {
        if (event.type === "message" || event.type === "message_reply") {
          const body = event.body || "";
          if (!body) return;
          const prefix = "!";
          
          // Inject groq client to all commands
          const extra = { groq: groqClient };

          if (body.startsWith(prefix)) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();
            if (cmds[cmdName] && cmds[cmdName].onStart) {
              console.log(`[CMD] !${cmdName}`);
              cmds[cmdName].onStart({ api, event, args, body, ...extra });
            }
          } else {
            if (cmds["noprefix"] && cmds["noprefix"].onChat) {
              cmds["noprefix"].onChat({ api, event, groq: groqClient });
            }
            // Allow ai without prefix for master
            const args = body.trim().split(/ +/);
            const cmdName = args[0].toLowerCase();
            if (event.senderID === "61593117279214" && cmds[cmdName]) {
              const cmdArgs = args.slice(1);
              if (cmds[cmdName].onStart) {
                cmds[cmdName].onStart({ api, event, args: cmdArgs, body, ...extra });
              }
            }
          }
        }

        if (event.logMessageType || event.type === "event") {
          Object.values(cmds).forEach(cmd => {
            try {
              if (cmd.onChat) cmd.onChat({ api, event, groq: groqClient });
              if (cmd.onEvent) cmd.onEvent({ api, event, groq: groqClient });
            } catch {}
          });
        }
      } catch (e) {
        console.log("[EVENT ERROR]", e.message);
      }
    });
  });
}

process.on("unhandledRejection", (r) => {
  console.error("[FATAL]", r);
  setTimeout(() => process.exit(1), 3000);
});

setInterval(() => {
  console.log(`[ALIVE] ${new Date().toLocaleTimeString("en-PH", {timeZone: "Asia/Manila"})} - ${Math.floor(process.uptime()/60)} mins - GROQ: ${groqClient ? "ON" : "OFF"}`);
}, 180000);

http.createServer((req,res) => {
  res.writeHead(200, {"Content-Type":"text/html"});
  res.end(`<h1>✅ TENGSAMA ALIVE! GROQ: ${groqClient ? "READY" : "NO KEY"} 👍🏿</h1><p>Uptime: ${Math.floor(process.uptime()/60)} mins</p>`);
}).listen(process.env.PORT || 3000, () => {
  console.log(`[WEB] Server on ${process.env.PORT || 3000}`);
});

startBot();
