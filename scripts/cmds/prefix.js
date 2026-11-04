module.exports = {
  config: { name: "prefix", version: "1.0", author: "Emperor", role: 0, shortDescription: "Show prefix" },
  onStart: async function({ api, event, config }) {
    api.sendMessage(`👑 My prefix is: ${config.prefix}\nExample: ${config.prefix}help`, event.threadID);
  }
};
