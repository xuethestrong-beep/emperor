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
} catch(e) {
  console.log("APPSTATE missing");
  process.exit(1);
}

const personalities = {
  normal: "You are Feng, 20yo guy from Laoag, chill funny human, short 5-15 words, say haha lods gagi, Taglish.",
  cold: "You are Feng, cold dry, reply 1-4 words.",
  sweet: "You are Feng, sweet bf, call baby mahal.",
  savage: "You are Feng, savage funny roast.",
  bastos: "You are Feng, dirty funny flirty.",
  conyo: "You are Feng, conyo like omg literally.",
  emo: "You are Feng, emo sad boy pagod na ko."
};

let currentP = "normal";

login({ appState }, (err, api) => {
  // NO AUTO RETRY - IF ERROR, JUST STOP!
  if (err) {
    console.log("LOGIN FAIL:", err.error);
    console.log("PAUSE RAILWAY! Dont retry! Wait until Nov 6!");
    process.exit(0); // STOP, DONT RETRY
  }

  console.log("V24 NO AUTO RETRY - Logged as", api.getCurrentUserID());
  require("http").createServer((a,b)=>b.end("V24 Alive")).listen(process.env.PORT||3000);
  
  api.setOptions({ 
    listenEvents: false, 
    selfListen: false, 
    logLevel: "silent",
    autoMarkDelivery: false,
    autoMarkRead: false
  });

  const listen = api.listenMqtt || api.listen;
  
  listen((err, event) => {
    if (err) {
      console.log("Listen error:", err.message);
      return; // DONT RETRY HERE TOO
    }
    if (event.type !== "message") return;
    if (!event.body || !event.body.toLowerCase().includes("feng")) return;

    setTimeout(async () => {
      try {
        const Groq = require("groq-sdk");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: personalities[currentP] },
            { role: "user", content: event.body.replace(/feng/gi,"").trim()||"hi" }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.85,
          max_tokens: 40
        });
        let reply = completion.choices[0]?.message?.content || "haha";
        api.sendMessage(reply.slice(0,150), event.threadID);
      } catch(e) {}
    }, 3000);
  });
});
