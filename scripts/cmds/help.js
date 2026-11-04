module.exports = {
  config: { name: "help", aliases: ["menu"], version: "1.0", author: "Emperor", role: 0, category: "info" },
  onStart: async function({ api, event, cmds, config }) {
    let msg = "👑 xiao Commands:\n";
    const unique = new Set();
    for (const [name, cmd] of cmds) {
      if (!unique.has(cmd.config.name)) {
        unique.add(cmd.config.name);
        msg += `${config.prefix}${cmd.config.name} - ${cmd.config.shortDescription || ""}\n`;
      }
    }
    api.sendMessage(msg, event.threadID);
  }
};
