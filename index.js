const fs = require("fs");
const path = require("path");
const login = require("ws3-fca");

// ===== CONFIG =====
let config = {};
try {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
} catch(e) {
  config = {
    prefix: "!",
    admin: ["61593117279214"],
    adminIDs: ["61593117279214"],
    owner: "xuethestrong-beep",
    ownerName: "Feng Xiluo",
    ownerID: "61593117279214",
    botName: "Emperor",
    autoReact: true,
    autoReactFor: "owner",
    autoReactEmoji: "😆"
  };
}

// ===== APPSTATE AUTO FIND =====
let appStatePath = "./appstate.json";
if (fs.existsSync("./fbstate.json")) appStatePath = "./fbstate.json";
else if (fs.existsSync("./appstate.json")) appStatePath = "./appstate.json";
else if (fs.existsSync("./appstate.txt")) appStatePath = "./appstate.txt";
else if (fs.existsSync("./fbstate.json")) appStatePath = "./fbstate.json";

console.log(`[Emperor] Using state: ${appStatePath}`);

if (!fs.existsSync(appStatePath)) {
  console.log(`[ERROR] No appstate file found! Please upload appstate.json`);
}

// ===== LOAD COMMANDS =====
const cmdsPath = "./scripts/cmds";
const cmds = new Map();

try {
  const files = fs.readdirSync(cmdsPath);
  files.forEach(file => {
    if (file.endsWith(".js")) {
      try {
        delete require.cache[require.resolve(path.join(__dirname, cmdsPath, file))];
        const cmd = require(path.join(__dirname, cmdsPath, file));
        if (cmd.config && cmd.config.name) {
          cmds.set(cmd.config.name.toLowerCase(), cmd);
          if (cmd.config.aliases) {
            cmd.config.aliases.forEach(alias => {
              cmds.set(alias.toLowerCase(), cmd);
            });
          }
        }
      } catch(err) {
        console.log(`[SKIP] ${file}: ${err.message}`);
      }
    }
  });
  console.log(`[Emperor] Loaded ${cmds.size} commands`);
} catch(e) {
  console.log(`[ERROR] cmds folder: ${e.message}`);
}

// ===== LOGIN =====
let appState;
try {
  appState = JSON.parse(fs.readFileSync(appStatePath, "utf8"));
} catch(e) {
  try {
    appState = JSON.parse(fs.readFileSync(appStatePath, "utf8").toString());
  } catch(e2) {
    console.error("Failed to read appstate:", e2.message);
    appState = [];
  }
}

login({ appState }, (err, api) => {
  if (err) {
    console.error("[LOGIN ERROR]", err);
    return;
  }

  console.log("[Emperor] Bot Started! 👑");
  api.setOptions({ listenEvents: true, selfListen: false, logLevel: "silent" });

  api.listen(async (err, event) => {
   
