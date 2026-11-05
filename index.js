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
} catch (e) { process.exit(1); }

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

const MAIN_ADMIN = "61593117279214";
const ADMIN_IDS = [MAIN_ADMIN, "61595947850770"];
function isAdmin(s) { return ADMIN_IDS.includes(String(s)); }

function isDisabled(cmdName) {
  try {
    const p = path.join(__dirname, "scripts/cmds/cache/disabled.json");
    if (fs.existsSync(p)) {
      const list = JSON.parse(fs.readFileSync(p, "utf8"));
      return list.includes(cmdName.toLowerCase());
    }
  } catch {}
  return false;
}

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
    if (err) { console.error("[LOGIN FAIL]", err.message); return setTimeout(startBot, 30000); }
    console.log("✅ TENGTENG👍🏿 ONLINE! ! PREFIX + AUTO REPLY!");

    const origSend = api.sendMessage;
    api.sendMessage = function(m, t, cb, mid) {
      try {
        if (typeof m === "string") m = m.replace(/TENGSAMA/g, "TENGTENG👍🏿");
        else if (m?.body) m.body = m.body.replace(/TENGSAMA/g, "TENGTENG👍🏿");
      } catch {}
      return origSend.call(this, m, t, cb, mid);
    };

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
          const senderID = String(event.senderID);
          const threadID = event.threadID;
          const messageID = event.messageID;
          const isAdminUser = isAdmin(senderID);

          if (isAdminUser) {
            try { api.setMessageReaction("😆", messageID, threadID, () => {}); } catch {}
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
            // ===== UNKNOWN COMMAND WITH AUTO REPLY TO USER MESSAGE =====
            if (!cmds[commandName]) {
              return api.sendMessage(
                `The command you are using does not exist, type !help to see all available commands.`,
                threadID,
                messageID // <-- THIS MAKES IT REPLY TO UR MESSAGE!
              );
            }

            if (isDisabled(commandName) && commandName !== "disable") {
              if (!isAdminUser) return api.sendMessage(`❌ Command !${commandName} is DISABLED by Master TENGTENG👍🏿!`, threadID, messageID);
            }

            if (isAdminOnlyEnabled() && commandName !== "adminonly" && commandName !== "admin") {
              if (!isAdminUser) return api.sendMessage(`❌ ADMIN ONLY ON 🔒\nOnly Master TENGTENG👍🏿 can use commands!`, threadID, messageID);
            }

            if (cmds[commandName]?.onStart) {
              try { cmds[commandName].onStart({ api, event, args, body, groq: groqClient }); } catch {}
            }
          } else {
            if (cmds["noprefix"]?.onChat) { try { cmds["noprefix"].onChat({ api, event, groq: groqClient }); } catch {} }
          }
        }
      } catch {}
    });
  });
}

http.createServer((_, res) => { res.writeHead(200); res.end("ALIVE"); }).listen(process.env.PORT || 3000);
startBot();
