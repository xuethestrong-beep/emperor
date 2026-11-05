const fs = require("fs");
const path = require("path");
let fca, login;
try {
  fca = require("ws3-fca");
  login = fca.default || fca.login || fca;
} catch(e) {
  fca = require("fca-unofficial");
  login = fca;
}

let appState;
try {
  appState = JSON.parse(process.env.APPSTATE);
} catch(e) { console.log("APPSTATE ERROR"); process.exit(1); }

const personalities = {
  normal: "You are Feng, 20yo guy from Laoag, chill funny human, short 5-15 words, say haha lods gagi, Taglish, never say As an AI.",
  cold: "You are Feng, cold dry, reply 1-4 words: k ok whatever ge.",
  sweet: "You are Feng, sweet bf, call baby mahal miss u.",
  savage: "You are Feng, savage funny roast.",
  bastos: "You are Feng, dirty funny flirty.",
  conyo: "You are Feng, conyo like omg literally.",
  emo: "You are Feng, emo sad boy pagod na ko."
};

let currentP = "normal";
const pFile = path.join(__dirname, "p.txt");
if (fs.existsSync(pFile)) { try { currentP = fs.readFileSync(pFile, "utf8").trim(); } catch(e) {} }

function startBot() {
login({ appState }, (err, api) => {
  if (err) {
    console.log("LOGIN FAIL - WAIT 24H!:", err.error?.slice(0,200));
    return; // DONT AUTO RETRY WHEN BANNED!
  }
  console.log("V23 ANTI-BAN - Logged as", api.getCurrentUserID());
  require("http").createServer((a,b)=>b.end("Feng V23")).listen(process.env.PORT||3000);
  // ANTI-BAN OPTIONS
  api.setOptions({ 
    listenEvents: false, 
    selfListen: false, 
    logLevel: "silent",
    autoMarkDelivery: false,
    autoMarkRead: false,
    updatePresence: false
  });

  const listen = api.listenMqtt || api.listen;
  listen((err, event) => {
    if (err) return;
    if (event.type !== "message") return;
    let body = (event.body || "").trim();
    if (!body || event.senderID == api.getCurrentUserID()) return;
    if (!body.toLowerCase().includes("feng")) return;

    // ANTI-BAN: DELAY 3-6 SECONDS LIKE HUMAN TYPING
    const delay = Math.floor(Math.random()*3000)+3000;
    setTimeout(async () => {
      try {
        const Groq = require("groq-sdk");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: personalities[currentP] },
            { role: "user", content: body.replace(/feng/gi,"").trim()||"hi" }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.85,
          max_tokens: 40
        });
        let reply = completion.choices[0]?.message?.content || "haha";
        reply = reply.slice(0,150);
        api.sendMessage(reply, event.threadID);
      } catch(e) { console.log(e.message.slice(0,50)); }
    }, delay);
  });
});
}
startBot();
