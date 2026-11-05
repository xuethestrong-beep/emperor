const Groq = require("groq-sdk");

let login;
try { 
  let fca = require("ws3-fca");
  login = fca.default || fca.login || fca;
} catch { 
  login = require("fca-unofficial"); 
}

let appState = JSON.parse(process.env.APPSTATE);
let groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

console.log("STARTING FENG GROQ BOT...");
console.log("GROQ KEY OK?", !!process.env.GROQ_API_KEY);

login({ appState }, (err, api) => {
  if (err) {
    console.log("LOGIN FAIL", err.error?.slice(0,200));
    return process.exit(0);
  }

  console.log("FENG LOGGED IN AS", api.getCurrentUserID());
  require("http").createServer((_,r)=>r.end("OK")).listen(process.env.PORT||3000);

  api.setOptions({ listenEvents: true, selfListen: false });
  
  api.listenMqtt((err, event) => {
    if (err || !event.body) return;
    if (event.senderID == api.getCurrentUserID()) return;

    const body = event.body;
    if (!body.toLowerCase().includes("feng")) return;

    console.log("GOT:", body);

    // instant reply so you know it's alive
    api.sendMessage("Feng is thinking haha...", event.threadID);

    groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are Feng, 20yo guy from Laoag, chill funny short 5-15 words Taglish haha lods gagi. Never say AI." },
        { role: "user", content: body.replace(/feng/gi,"").trim() || "hi" }
      ],
      max_tokens: 80,
      temperature: 0.8
    }).then(c => {
      let reply = c.choices[0].message.content;
      console.log("REPLYING:", reply);
      api.sendMessage(reply, event.threadID);
    }).catch(e => {
      console.log("GROQ ERR:", e.message);
      api.sendMessage("Feng: groq error lods - " + e.message.slice(0,100), event.threadID);
    });
  });
});
