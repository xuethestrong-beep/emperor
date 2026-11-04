module.exports = {
  config: {
    name: "restart",
    version: "1.0",
    author: "Emperor",
    role: 2, // admin only
    shortDescription: "Restart bot"
  },
  onStart: async function({ api, event, config }) {
    // Only owner can restart
    if (event.senderID != config.ownerID && !config.adminIDs?.includes(event.senderID)) {
      return api.sendMessage("👑 Only Emperor Owner can restart!", event.threadID);
    }
    api.sendMessage("👑 Restarting Emperor...", event.threadID, () => process.exit(1));
  }
};
