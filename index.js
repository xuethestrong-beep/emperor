const fs = require("fs");
const path = require("path");
const http = require("http");

// ================= APPSTATE =================
let appState;
try {
  if (process.env.APPSTATE) {
    let raw = process.env.APPSTATE.trim();
    if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1);
    raw = raw.replace(/\\"/g, '"');
    if (raw.startsWith("[") || raw.startsWith("{")) appState = JSON.parse(raw);
    else appState = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    console.log(`[OK] ${appState.length} cookies loaded`);
  } else if (fs.existsSync(path.join(__dirname, "appstate.json"))) {
    appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
  } else {
    console.log("[ERROR] No APPSTATE found!");
    process.exit(1);
  }
} catch (e) {
  console.error("[APPSTATE FAIL]", e.message);
  process.exit(1);
}

// ================= LOGIN LIB =================
let login;
try {
  login = require("@dongdev/fca-unofficial");
  console.log("[LIB] @dongdev/fca-unofficial");
} catch {
  login = require("ws3-fca");
  console.log("[LIB] ws3-fca");
}

// ================= GROQ =================
let groqClient = null;
try {
  const Groq = require("groq-sdk");
  if (process.env.GROQ_API_KEY) groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch {}

// ================= LOAD COMMANDS =================
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
    } catch (e) {
      console.log(`[CMD ERROR] ${f}: ${e.message}`);
    }
  });
  console.log(`[CMDS] ${Object.keys(cmds).length} commands loaded`);
}

// ================= ADMIN CONFIG =================
const MAIN_ADMIN = "61593117279214"; // YOUR UID - TENGTENG👍🏿
const ADMIN_IDS = [MAIN_ADMIN, "61595947850770"];

function isAdmin(senderID) {
  return ADMIN_IDS.includes(String(senderID));
}

// ================= CHECK DISABLED COMMANDS =================
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

// ================= CHECK ADMINONLY =================
function isAdminOnlyEnabled() {
  try {
    const paths = [
      path.join(__dirname, "adminonly.json"),
      path.join(__dirname, "scripts/cmds/cache/adminonly.json"),
      path.join(__dirname, "cache/adminonly.json")
    ];
    for (let p of paths) {
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, "utf8"));
        if (data.enabled === true || data.on === true || data.status === true) return true;
        for (let v of Object.values(data)) if (v === true) return true;
      }
    }
  } catch {}
  return false;
}

// ================= START BOT =================
function startBot() {
  loadCommands();
  login({ appState, selfListen: false }, (err, api) => {
    if (err) {
      console.error("[LOGIN FAIL]", err.error || err.message);
      return setTimeout(startBot, 30000);
    }

    console.log("=================================");
    console.log("✅ TENGTENG👍🏿 ONLINE! FULL INDEX");
    console.log("✅ Admin No-Prefix: ON");
    console.log("✅ AutoReact 😆: ON");
    console.log("✅ Disable System: ON");
    console.log("✅ AdminOnly: ON");
    console.log("=================================");

    // ===== OWNER NAME OVERRIDE TENGSAMA -> TENGTENG👍🏿 =====
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

    api.setOptions({ listenEvents: true, selfListen: false, logLevel: "silent" });

    api.listenMqtt((err, event) => {
      if (err) {
        if (JSON.stringify(err).includes("1357004")) return;
        console.log("[RECONNECT]");
        try { api.removeAllListeners(); } catch {}
        return setTimeout(startBot, 10000);
      }

      try {
        if (event.type === "message" || event.type === "message_reply") {
          let body = (event.body || "").trim();
          if (!body) return;

          const senderID = String(event.senderID);
          const threadID = event.threadID;
          const messageID = event.messageID;
          const isAdminUser = isAdmin(senderID);

          // ===== AUTO REACT 😆 TO ADMIN ONLY - FIXED WITH THREADID =====
          if (isAdminUser) {
            try {
              api.setMessageReaction("😆", messageID, threadID, (err) => {
                if (!err) console.log(`[REACT] 😆 to admin ${senderID}`);
              });
            } catch (e) {
              console.log("[REACT ERROR]", e.message);
            }
          }

          // ===== COMMAND DETECTION =====
          let commandName = null;
          let args = [];
          let isCommand = false;

          // 1. With prefix !
          if (body.startsWith("!")) {
            const split = body.slice(1).trim().split(/ +/);
            commandName = split.shift().toLowerCase();
            args = split;
            isCommand = true;
          } 
          // 2. Admin no-prefix (can use without !)
          else if (isAdminUser) {
            const split = body.split(/ +/);
            const maybeCmd = split[0].toLowerCase();
            if (cmds[maybeCmd]) {
              commandName = maybeCmd;
              args = split.slice(1);
              isCommand = true;
              console.log(`[ADMIN NOPREFIX] ${senderID} used ${commandName}`);
            }
          }

          if (isCommand && commandName) {
            // ===== CHECK DISABLED =====
            if (isDisabled(commandName) && commandName !== "disable" && !commandName.includes("enable")) {
              if (!isAdminUser) {
                return api.sendMessage(`❌ Command !${commandName} is DISABLED by Master TENGTENG👍🏿!\nContact admin to enable!\nUse !disable list to see list`, threadID);
              }
            }

            // ===== CHECK ADMINONLY =====
            if (isAdminOnlyEnabled() && commandName !== "adminonly" && commandName !== "admin") {
              if (!isAdminUser) {
                return api.sendMessage(`❌ ADMIN ONLY ON 🔒\nOnly Master TENGTENG👍🏿 can use commands!\nOwner: ${MAIN_ADMIN}`, threadID);
              }
            }

            // ===== RUN COMMAND =====
            if (cmds[commandName]?.onStart) {
              try {
                cmds[commandName].onStart({ api, event, args, body, groq: groqClient });
              } catch (e) {
                console.log(`[CMD RUN ERROR] ${commandName}: ${e.message}`);
              }
            }
          } else {
            // ===== NOPREFIX & AUTOREACT FROM CMDS FOLDER =====
            if (cmds["noprefix"]?.onChat) {
              try { cmds["noprefix"].onChat({ api, event, groq: groqClient }); } catch {}
            }
            // Don't call autoreact here - we already handled in index
          }
        }
      } catch (e) {
        console.log("[EVENT ERROR]", e.message);
      }
    });
  });
}

// ================= HTTP SERVER FOR RAILWAY =================
http.createServer((_, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("TENGTENG ALIVE - FULL INDEX RUNNING");
}).listen(process.env.PORT || 3000, () => {
  console.log(`[HTTP] Server running on port ${process.env.PORT || 3000}`);
});

startBot();
