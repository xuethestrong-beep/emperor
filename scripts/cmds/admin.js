module.exports = {
  config: {
    name: "admin",
    version: "1.0",
    author: "Emperor",
    role: 0,
    shortDescription: "Admin list"
  },
  onStart: async function({ api, event, config }) {
    api.sendMessage(`👑 Admin Info:\nName: ${config.ownerName}\nUse !restart to restart bot (admin only)`, event.threadID);
  }
};
