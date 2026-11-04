module.exports = {
  config: {
    name: "xiao",
    version: "1.0",
    author: "Emperor",
    role: 0,
    shortDescription: "Bot info"
  },
  onStart: async function({ api, event }) {
    api.sendMessage(`👑 xiao Bot\nPrefix: !\nOwner: xiao\nStatus: Online 24/7\nCommands: Use !help`, event.threadID);
  }
};
