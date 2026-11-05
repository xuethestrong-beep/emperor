const fs = require("fs");
const path = require("path");
const http = require("http");

let appState;
try {
  if (process.env.APPSTATE) {
    let raw = process.env.APPSTATE.trim();
    if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1);
    raw = raw.replace(/\\"/g, '"');
    if (raw.startsWith("[") || raw.startsWith("{")) appState = JSON.parse(raw);
    else appState = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } else if (fs.existsSync(path.join(__dirname, "appstate.json"))) {
    appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
  } else { process.exit(1); }
} catch (e) { console.error("[FAIL]", e.message); process.exit(1); }

let login;
try { login = require("@dongdev/fca-unofficial"); } catch { login = require("ws3-fca"); }

let groqClient = null;
try { const Groq = require("groq-sdk"); if (process.env.GROQ_API_KEY) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY }); } catch {}

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
}

const ADMIN_IDS = ["61593117279214"]; // Your owner UID from screenshot!
function isAdmin(s) { return ADMIN_IDS.includes(String(s)); }
function isAdminOnlyEnabled() {
  try {
    const p = path.join(__dirname, "scripts/cmds/cache/adminonly.json");
    if (fs.existsSync(p)) {
      const d = JSON.parse(fs.readFileSync(p, "utf8"));
      if (d.enabled || d.on || d.status) return true;
    }
  } catch {}
  return false;
}

function startBot() {
  loadCommands();
  login({ appState, selfListen: false }, (err, api) => {
    if (err) { console.error("[FAIL]", err.message); return setTimeout(startBot, 30000); }
    console.log("✅ TENGTENG ONLINE! 👑");

    // ===== OWNER NAME OVERRIDE - CHANGE TENGSAMA TO TENGTENG =====
    const originalSend = api.sendMessage;
    api.sendMessage = function(msg, threadID, callback, messageID) {
      try {
        if (typeof msg === "string") {
          msg = msg.replace(/TENGSAMA/g, "TENGTENG👍🏿");
        } else if (msg && typeof msg.body === "string") {
          msg.body = msg.body.replace(/TENGSAMA/g, "TENGTENG👍🏿");
        }
      } catch {}
      return originalSend.call(this, msg, threadID, callback, messageID);
    };
    // ===== END OVERRIDE =====

    api.setOptions({ listenEvents: true, selfListen: false });
    api.listenMqtt((err, event) => {
      if (err) {
        if (JSON.stringify(err).includes("1357004")) return;
        try { api.removeAllListeners(); } catch {} return setTimeout(startBot, 10000);
      }
      try {
        if (event.type === "message" || event.type === "message_reply") {
          let body = (event.body || "").trim();
          if (!body) return;
          const senderID = event.senderID;
          const isAdminUser = isAdmin(senderID);

          if (isAdminUser) {
            try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}
          }

          let commandName = null, args = [], isCommand = false;
          if (body.startsWith("!")) {
            const split = body.slice(1).trim().split(/ +/);
            commandName = split.shift().toLowerCase();
            args = split;
            isCommand = true;
          } else if (isAdminUser) {
            const split = body.split(/ +/);
            const maybeCmd = split[0].toLowerCase();
            if (cmds[maybeCmd]) { commandName = maybeCmd; args = split.slice(1); isCommand = true; }
          }

          if (isCommand && commandName) {
            if (isAdminOnlyEnabled() && commandName !== "adminonly" && commandName !== "admin") {
              if (!isAdminUser) return api.sendMessage(`❌ ACCESS DENIED ||\nOnly Master TENGTENG👍🏿 can use this.`, event.threadID);
            }
            if (cmds[commandName]?.onStart) cmds[commandName].onStart({ api, event, args, body, groq: groqClient });
          } else {
            if (cmds["noprefix"]?.onChat) cmds["noprefix"].onChat({ api, event, groq: groqClient });
          }
        }
      } catch {}
    });
  });
}

http.createServer((_, res) => { res.writeHead(200); res.end("ALIVE"); }).listen(process.env.PORT || 3000);
startBot();
