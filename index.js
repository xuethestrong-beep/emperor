const fs = require("fs");
const path = require("path");
const http = require("http");

let appState;
try {
  if (process.env.APPSTATE) {
    console.log("[RAILWAY] APPSTATE found...");
    let raw = process.env.APPSTATE.trim();
    if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1);
    raw = raw.replace(/\\"/g, '"');
    if (raw.startsWith("[") || raw.startsWith("{")) {
      appState = JSON.parse(raw);
    } else {
      appState = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    }
    console.log(`[OK] ${appState.length} cookies`);
  } else if (fs.existsSync(path.join(__dirname, "appstate.json"))) {
    appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
  } else {
    console.log("[ERROR] No APPSTATE!");
    process.exit(1);
  }
} catch (e) {
  console.error("[FAIL]", e.message);
  process.exit(1);
}

// TRY LOGIN LIBS - F3CA style but NPM version
let login;
try {
  login = require("@dongdev/fca-unofficial");
  console.log("[LIB] @dongdev/fca-unofficial - BEST 2026 FIX");
} catch (e) {
  try {
    login = require("ws3-fca");
    console.log("[LIB] ws3-fca fallback");
  } catch (e2) {
    console.log("[ERROR] No FCA lib found");
    process.exit(1);
  }
}

let groqClient = null;
try {
  const Groq = require("groq-sdk");
  if (process.env.GROQ_API_KEY) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch {}

const cmds = {};
function loadCommands() {
  const p = path.join(__dirname, "scripts/cmds");
  if (!fs.existsSync(p)) return;
  fs.readdirSync(p).forEach(f => {
    if (!f.endsWith(".js")) return;
    try {
      const fp = path.join(p, f);
      delete require.cache[require.resolve(fp)];
      const c = require(fp);
      if (c.config?.name) {
        cmds[c.config.name.toLowerCase()] = c;
        if (c.config.aliases) c.config.aliases.forEach(a => cmds[a.toLowerCase()] = c);
      }
    } catch {}
  });
  console.log(`[CMDS] ${Object.keys(cmds).length} loaded`);
}

function startBot() {
  loadCommands();
  login({ appState, selfListen: false }, (err, api) => {
    if (err) {
      console.error("[LOGIN FAIL]", err.error || err.message);
      return setTimeout(startBot, 30000);
    }
    console.log("✅ TENGSAMA ONLINE! F3CA-STYLE NPM WORKS! 👑");
    api.setOptions({ listenEvents: true, selfListen: false });
    api.listenMqtt((err, event) => {
      if (err) {
        // Ignore 1357004 error - dongdev fixed it
        if (JSON.stringify(err).includes("1357004")) {
          console.log("[IGNORE] 1357004 ignored - bot still ONLINE");
          return;
        }
        console.log("[RECONNECT]", err.message || err);
        try { api.removeAllListeners(); } catch {}
        return setTimeout(startBot, 10000);
      }
      try {
        if (event.type === "message" || event.type === "message_reply") {
          const body = event.body || "";
          if (!body) return;
          if (body.startsWith("!")) {
            const args = body.slice(1).trim().split(/ +/);
            const n = args.shift().toLowerCase();
            if (cmds[n]?.onStart) cmds[n].onStart({ api, event, args, body, groq: groqClient });
          } else {
            if (cmds["noprefix"]?.onChat) cmds["noprefix"].onChat({ api, event, groq: groqClient });
            if (cmds["autoreact"]?.onChat) cmds["autoreact"].onChat({ api, event, groq: groqClient });
          }
        }
        if (event.logMessageType) {
          Object.values(cmds).forEach(c => { try { c.onChat && c.onChat({ api, event, groq: groqClient }); c.onEvent && c.onEvent({ api, event, groq: groqClient }); } catch {} });
        }
      } catch {}
    });
  });
}

http.createServer((_, res) => { res.writeHead(200); res.end("TENGSAMA ALIVE"); }).listen(process.env.PORT || 3000);
startBot();
