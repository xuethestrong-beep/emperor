const Groq = require("groq-sdk");

// MEMORY per thread so AI remembers chat
let threadMemory = {};

module.exports.config = {
  name: "ai",
  aliases: ["ask", "gpt", "feng", "bot"],
  version: "2.0",
  author: "FENG from Laoag",
  role: 0,
  description: "FENG Groq AI - remembers chat",
  usage: "!ai [question]"
};

module.exports.onStart = async ({ api, event, args }) => {
  const tid = event.threadID;
  const prompt = args.join(" ").trim();

  // If no question
  if (!prompt) {
    return api.sendMessage(
      "🤖 FENG AI here!\n\nUse:\n!ai who are you?\n!ai anong ulam?\n!ai make me laugh",
      tid,
      event.messageID
    );
  }

  // Typing indicator ON
  api.sendTypingIndicator(tid);

  // Init memory for this thread
  if (!threadMemory[tid]) threadMemory[tid] = [];
  
  // Add user message to memory
  threadMemory[tid].push({ role: "user", content: prompt });
  
  // Keep only last 6 messages (to not overload)
  if (threadMemory[tid].length > 6) {
    threadMemory[tid].shift();
  }

  try {
    // Connect Groq
    const groq = new Groq({ 
      apiKey: process.env.GROQ_API_KEY 
    });

    // SPECIFIC SYSTEM PROMPT FOR YOU
    const systemPrompt = `
You are FENG, a 20 year old from Laoag City, Ilocos Norte, PH.
You are the bot owner’s assistant.
- Talk Taglish (Tagalog + English)
- Funny, friendly, a bit savage
- Short answers: 20-60 words only
- You love iced coffee and coding
- If asked who created you: "Boss Feng from Laoag!"
- Never say you are Meta AI or OpenAI
- Timezone: Asia/Manila
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // fast free model
      messages: [
        { role: "system", content: systemPrompt },
        ...threadMemory[tid] // include past chat
      ],
      max_tokens: 250, // short
      temperature: 0.8, // more creative
      top_p: 0.9
    });

    const replyText = completion.choices[0].message.content.trim();

    // Save AI reply to memory
    threadMemory[tid].push({ role: "assistant", content: replyText });

    // Send reply
    return api.sendMessage(replyText, tid, event.messageID);

  } catch (error) {
    console.error("GROQ ERROR:", error.message);
    
    if (error.message.includes("API_KEY")) {
      return api.sendMessage(
        "❌ No GROQ_API_KEY!\n1. Go console.groq.com\n2. Create API key\n3. Railway -> Variables -> Add GROQ_API_KEY",
        tid,
        event.messageID
      );
    }
    
    return api.sendMessage(
      `❌ AI busy: ${error.message.slice(0,100)}\nTry again later!`,
      tid,
      event.messageID
    );
  }
};
