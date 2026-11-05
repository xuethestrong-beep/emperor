const fs = require("fs");
const path = require("path");
const BANK_FILE = path.join(__dirname, "bank.json");

function loadBank() {
  if (!fs.existsSync(BANK_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(BANK_FILE)); } catch { return {}; }
}
function saveBank(data) { fs.writeFileSync(BANK_FILE, JSON.stringify(data, null, 2)); }
function getUser(id) {
  const bank = loadBank();
  if (!bank[id]) bank[id] = { wallet: 1000, bank: 0, lastDaily: 0, lastWork: 0, lastInterest: Date.now() };
  if (!bank[id].lastDaily) bank[id].lastDaily = 0;
  if (!bank[id].lastWork) bank[id].lastWork = 0;
  if (!bank[id].lastInterest) bank[id].lastInterest = Date.now();
  return { all: bank, user: bank[id] };
}

module.exports.config = {
  name: "bank",
  version: "2.0 DAILY+INTEREST",
  role: 0,
  description: "Bank with daily and interest"
};

module.exports.onStart = async ({ api, event, args }) => {
  const id = event.senderID;
  const type = (args[0]||"").toLowerCase();
  const threadID = event.threadID;

  let { all, user } = getUser(id);

  // Interest - 5% per 24h on bank balance
  const now = Date.now();
  const hoursSinceInterest = (now - user.lastInterest) / (1000*60*60);
  if (hoursSinceInterest >= 24 && user.bank > 0) {
    const interest = Math.floor(user.bank * 0.05);
    user.bank += interest;
    user.lastInterest = now;
    saveBank(all);
    api.sendMessage(`💰 INTEREST! Bank earned +$${interest} (5%)!\nNew Bank: $${user.bank}`, threadID);
  }

  if (!type || type === "bal") {
    return api.sendMessage(
`🏦 FENG BANK v2 🏦
Wallet: $${user.wallet}
Bank: $${user.bank} (5% interest per day!)
Total: $${user.wallet + user.bank}

💸 EARN:
!bank daily - $500 daily reward
!bank work - $100 every 10 mins
!bank deposit 500
!bank withdraw 500
!bank top
!bank interest - check interest`,
      threadID, event.messageID
    );
  }

  if (type === "daily") {
    const diff = now - user.lastDaily;
    const oneDay = 24*60*60*1000;
    if (diff < oneDay) {
      const left = oneDay - diff;
      const h = Math.floor(left/(1000*60*60));
      const m = Math.floor((left%(1000*60*60))/(1000*60));
      return api.sendMessage(`⏰ Daily already claimed! Come back in ${h}h ${m}m`, threadID, event.messageID);
    }
    user.wallet += 500;
    user.lastDaily = now;
    saveBank(all);
    return api.sendMessage(`✅ DAILY CLAIMED! +$500\nWallet: $${user.wallet}`, threadID, event.messageID);
  }

  if (type === "work") {
    const diff = now - user.lastWork;
    const tenMin = 10*60*1000;
    if (diff < tenMin) {
      const left = tenMin - diff;
      const s = Math.floor(left/1000);
      return api.sendMessage(`⏰ Pagod ka pa master! Rest ${s}s`, threadID, event.messageID);
    }
    const jobs = ["Nag deliver ka ng Jollibee", "Naglinis ka sa Laoag City Hall", "Nag code ka ng bot", "Nag tinda ka ng empanada"];
    const job = jobs[Math.floor(Math.random()*jobs.length)];
    const earn = Math.floor(Math.random()*100)+50;
    user.wallet += earn;
    user.lastWork = now;
    saveBank(all);
    return api.sendMessage(`💼 ${job}! +$${earn}\nWallet: $${user.wallet}`, threadID, event.messageID);
  }

  if (type === "deposit" || type === "dep") {
    let amt = args[1]==="all" ? user.wallet : parseInt(args[1]);
    if (isNaN(amt) || amt <=0) return api.sendMessage("Use: !bank deposit 500 or !bank deposit all", threadID, event.messageID);
    if (user.wallet < amt) return api.sendMessage(`Kulang wallet! $${user.wallet} lang`, threadID, event.messageID);
    user.wallet -= amt; user.bank += amt;
    saveBank(all);
    return api.sendMessage(`✅ Deposited $${amt}\nWallet: $${user.wallet}\nBank: $${user.bank}`, threadID, event.messageID);
  }

  if (type === "withdraw" || type === "with") {
    let amt = args[1]==="all" ? user.bank : parseInt(args[1]);
    if (isNaN(amt) || amt <=0) return api.sendMessage("Use: !bank withdraw 500", threadID, event.messageID);
    if (user.bank < amt) return api.sendMessage(`Kulang bank! $${user.bank} lang`, threadID, event.messageID);
    user.bank -= amt; user.wallet += amt;
    saveBank(all);
    return api.sendMessage(`✅ Withdrew $${amt}\nWallet: $${user.wallet}\nBank: $${user.bank}`, threadID, event.messageID);
  }

  if (type === "top") {
    const allData = loadBank();
    let sorted = Object.entries(allData).sort((a,b) => (b[1].wallet+b[1].bank)-(a[1].wallet+a[1].bank)).slice(0,10);
    let msg = "🏆 TOP 10 RICHEST 🏆\n\n";
    sorted.forEach(([uid, d], i) => { msg += `${i+1}. ${uid.slice(-4)} - $${d.wallet+d.bank} (W:$${d.wallet} B:$${d.bank})\n`; });
    return api.sendMessage(msg, threadID, event.messageID);
  }

  if (type === "interest") {
    const nextIn = 24 - Math.floor((now-user.lastInterest)/(1000*60*60));
    const earn = Math.floor(user.bank*0.05);
    return api.sendMessage(`💰 Bank: $${user.bank}\nNext interest in ${nextIn}h: +$${earn} (5%)`, threadID, event.messageID);
  }
};
