const fs = require("fs");
const path = require("path");
const login = require("ws3-fca");

let appState;
try {
  if (process.env.APPSTATE) appState = JSON.parse(process.env.APPSTATE);
  else appState = JSON.parse(fs.readFileSync(path.join(__dirname, "appstate.json"), "utf8"));
} catch (e) { console.log("No appstate"); }

// PERSONALITIES - SMART HUMAN META
const personalities = {
  normal: "You are Feng, 20yo guy from Laoag City, Ilocos. Real human, not AI. Chill, funny, short texting like Messenger. Use haha, lods, gagi sometimes. Taglish. Never say As an AI. 5-15 words only, 1 sentence.",
  cold: "You are Feng, cold, dry, nonchalant. Reply 1-4 words only: k, ok, whatever, ge, bahala ka. Annoyed, short.",
  sweet: "You are Feng, sweet clingy bf, soft, caring, call baby, mahal, love, miss u, ingat ka. Short, sweet, human.",
  savage: "You are Feng, savage tropa, roasts funny but not too toxic. Like bobo mo haha jk.",
  bastos: "You are Feng, manyak funny friend, green jokes, flirty funny but not explicit.",
  conyo: "You are Feng, conyo rich kid, like omg literally super as in you know?",
  emo: "You are Feng, emo sad boy, pagod na ko, life sucks, dramatic but short."
};

let currentP = "normal";
const pFile = path.join(__dirname, "p.txt");
if (fs.existsSync(pFile)) { try { currentP = fs.readFileSync(pFile, "utf8").trim(); } catch(e) {} }

const chatMemory = new Map();
function getMemory(tid) {
  if (!chatMemory.has(tid)) chatMemory.set(tid, []);
  return chatMemory.get(tid);
}

login({ appState }, (err, api) => {
  if (err) return console.error(err);
  console.log("V17 FINAL GROQ HUMAN - " + currentP);
  require("http").createServer((a,b)=>b.end("V17 Groq Alive")).listen(process.env.PORT||3000);
  api.setOptions({ listenEvents: true, selfListen: false, logLevel: "silent" });
  const botID = api.getCurrentUserID();
  process.on("unhandledRejection", e => console.log("Caught", e.message?.slice(0,80)));

  api.listen(async (err, event) => {
    try {
      if (err) return;
      if (event.type !== "message" && event.type !== "message_reply") return;
      let body = (event.body || "").trim();
      if (!body || event.senderID == botID) return;

      const lower = body.toLowerCase();
      const hasFeng = lower.includes("feng");
      let isReplyToBot = event.type === "message_reply";
      if (!hasFeng && !isReplyToBot) return;

      // PERSONALITY COMMAND
      if (lower.includes("personality")) {
        if (lower.includes("list")) {
          await api.sendMessage("Personalities:\nnormal - chill friend\ncold - dry k ok\nsweet - sweet bf\nsavage - roasts\nbastos - dirty funny\nconyo - conyo\nemo - sad boy\n\nUse: feng personality cold", event.threadID).catch(()=>{});
          return;
        }
        for (const p in personalities) {
          if (lower.includes(p)) {
            currentP = p;
            fs.writeFileSync(pFile, p);
            await api.sendMessage(`Feng is now ${p} 😈`, event.threadID).catch(()=>{});
            return;
          }
        }
      }

      let prompt = body.replace(/feng/gi, "").trim() || "hi";
      const mem = getMemory(event.threadID);
      mem.push(`User: ${prompt}`);
      if (mem.length > 6) mem.shift();

      try {
        const Groq = require("groq-sdk");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: personalities[currentP] + ` Recent chat: ${mem.join(" | ")}` },
            { role: "user", content: prompt }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.85,
          max_tokens: 45
        });

        let reply = completion.choices[0]?.message?.content || "haha";
        reply = reply.replace(/\*\*/g, "").slice(0, 200);
        
        mem.push(`Feng: ${reply}`);
        if (mem.length > 6) mem.shift();

        await api.sendMessage(reply, event.threadID, event.messageID).catch(async () => {
          await api.sendMessage(reply, event.threadID).catch(()=>{});
        });

      } catch (e) {
        console.log("Groq error:", e.message.slice(0,150));
        await api.sendMessage("gagi lag wait lang haha", event.threadID).catch(()=>{});
      }
    } catch (e) { console.log("Loop error", e.message.slice(0,80)); }
  });
});
