module.exports = {
  config: { name: "out", aliases: ["leave"], version: "1.0", author: "Emperor", role: 0, shortDescription: "Bot leaves GC" },
  onStart: async function({ api, event }) {
    api.sendMessage("👑 Emperor leaving... Goodbye! 👑", event.threadID, () => {
      api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);
    });
  }
};
