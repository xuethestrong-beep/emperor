module.exports = {
  config: { name: "kick", version: "1.0", author: "Emperor", role: 1, shortDescription: "Kick user" },
  onStart: async function({ api, event, args }) {
    const id = Object.keys(event.mentions)[0] || args[1];
    if (!id) return api.sendMessage("👑 Tag someone to kick! Ex: !kick @user", event.threadID);
    api.removeUserFromGroup(id, event.threadID, (err) => {
      if (err) return api.sendMessage("❌ Can't kick! Bot needs admin.", event.threadID);
      api.sendMessage("👑 Kicked successfully! 👢", event.threadID);
    });
  }
};
