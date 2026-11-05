const fs = require("fs");
const path = require("path");
const ADMIN_FILE = path.join(__dirname, "admins.json");

function loadAdmins() {
  if (!fs.existsSync(ADMIN_FILE)) return ["61593117279214"];
  try { return JSON.parse(fs.readFileSync(ADMIN_FILE)); } catch { return ["61593117279214"]; }
}

module.exports.config = {
  name: "add",
  aliases: ["adduser", "addmember", "invite"],
  version: "3.0 TENGSAMA",
  role: 2,
  description: "Add user to group - Master TENGSAMA"
};

module.exports.onStart = async ({ api, event, args }) => {
  try { api.setMessageReaction("😆", event.messageID, () => {}, true); } catch {}

  const MAIN_ADMIN = "61593117279214";
  const admins = loadAdmins();
  const isAdmin = admins.includes(event.senderID) || event.senderID === MAIN_ADMIN;
  
  if (!isAdmin) return api.sendMessage(`❌ Only Admins can add!`, event.threadID, event.messageID);

  const threadID = event.threadID;
  let targetIDs = [];

  // GET TARGETS
  if (Object.keys(event.mentions).length > 0) {
    targetIDs = Object.keys(event.mentions);
  } else if (event.type === "message_reply") {
    targetIDs = [event.messageReply.senderID];
  } else if (args[0]) {
    // Can add by ID: !add 615xxx or !add 615xxx 615yyy
    targetIDs = args.filter(id => !isNaN(id) && id.length > 5);
    if (targetIDs.length === 0) targetIDs = [args[0]];
  }

  if (targetIDs.length === 0) {
    return api.sendMessage(
`╔════════════════════╗
║ ➕ ADD TO GROUP ║
╚════════════════════╝

📝 Commands:
├─ !add @user - add 1 user
├─ !add @user @user2 - add multiple
├─ Reply + !add - add replied user
├─ !add 615xxxx - add by ID
└─ !add 615xxx 615yyy - add multiple IDs

🔐 Master: TENGSAMA
⚠️ Bot must be ADMIN!`,
      threadID, event.messageID
    );
  }

  let added = [];
  let failed = [];

  for (let id of targetIDs) {
    try {
      await api.addUserToGroup(id, threadID);
      added.push(id);
      // Small delay for multiple adds
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      failed.push({ id, error: e.message || "Failed" });
    }
  }

  let msg = `╔════════════════════╗\n║ ➕ ADD RESULT ║\n╚════════════════════╝\n\n`;

  if (added.length > 0) {
    msg += `✅ Added (${added.length}):\n`;
    added.forEach(id => msg += `├─ ${id}\n`);
    msg += `\n`;
  }

  if (failed.length > 0) {
    msg += `❌ Failed (${failed.length}):\n`;
    failed.forEach(f => {
      let reason = "Unknown";
      if (f.error.includes("blocked")) reason = "User blocked bot / privacy";
