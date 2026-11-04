module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "cmds", "h"],
    version: "5.0",
    author: "xiao",
    role: 0,
    shortDescription: "Beautiful help menu",
    category: "info"
  },
  onStart: async function({ api, event, args, cmds, config }) {
    const prefix = config.prefix || "!";
    
    // If user typed !help <command> -> show details
    if (args[1]) {
      const cmd = cmds.get(args[1].toLowerCase());
      if (!cmd) return api.sendMessage(`❌ Command "${args[1]}" not found!`, event.threadID);
      const c = cmd.config;
      return api.sendMessage(
`╭─ ${c.name.toUpperCase()} ─╮
│ Name: ${c.name}
│ Aliases: ${c.aliases ? c.aliases.join(", ") : "None"}
│ Version: ${c.version || "1.0"}
│ Author: ${c.author || "xiao"}
│ Category: ${c.category || "other"}
│ Description: ${c.shortDescription || "No desc"}
│
│ Usage: ${prefix}${c.name} ${c.guide || ""}
╰──────────────╯`, event.threadID);
    }

    // Group commands
    const categories = {};
    const seen = new Set();
    for (const [name, cmd] of cmds) {
      if (seen.has(cmd.config.name)) continue;
      seen.add(cmd.config.name);
      const cat = (cmd.config.category || "other").toLowerCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd.config.name);
    }

    let msg = ` ⋆｡°✩ xiao ✩°｡⋆\n`;
    msg += `╭────────────────╮\n`;
    msg += `│ 👑 Owner: Feng\n`;
    msg += `│ ⚙️ Prefix: ${prefix}\n`;
    msg += `│ 📚 Total: ${seen.size} cmds\n`;
    msg += `│ 💫 Status: Online\n`;
    msg += `╰────────────────╯\n\n`;

    const icons = {
      music: "🎧",
      ai: "🤖",
      media: "🎬",
      info: "📖",
      fun: "🎮",
      economy: "💰",
      admin: "👑",
      other: "📦"
    };

    for (const [cat, list] of Object.entries(categories)) {
      const icon = icons[cat] || "✦";
      msg += `${icon} ${cat.toUpperCase()} ──\n`;
      // Make 2 columns
      const formatted = list.map(n => `${prefix}${n}`).join(" • ");
      msg += `  ${formatted}\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━\n`;
    msg += `📌 Tip: ${prefix}help <cmd> for info\n`;
    msg += `🌸 Example: ${prefix}help sing\n`;
    msg += `━━━━━━━━━━━━━━━━━`;

    api.sendMessage(msg, event.threadID);
  }
};
