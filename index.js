const pino = require("pino");
let qrcode = require("qrcode-terminal");
const PastebinAPI = require("pastebin-js");
const path = require('path');
pastebin = new PastebinAPI("EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL");
const fs = require("fs-extra");
if (fs.existsSync('./auth_info_baileys')) {
  fs.emptyDirSync(__dirname + '/auth_info_baileys');
  require('child_process').exec('rm -rf auth_info_baileys')
  console.log('Run The Script Again');
  setTimeout(() => {
    console.log(' ')
  }, 100);
  setTimeout(() => {
    console.log('P')
  }, 300);
  setTimeout(() => {
    console.log('a')
  }, 500);
  setTimeout(() => {
    console.log('s')
  }, 700);
  setTimeout(() => {
    console.log('i')
  }, 900);
  setTimeout(() => {
    console.log('n')
  }, 1100);
  setTimeout(() => {
    console.log('d')
  }, 1300);
  setTimeout(() => {
    console.log('u')
  }, 1500);
  setTimeout(() => {
    console.log(' ')
  }, 1700);
  setTimeout(() => {
    console.log('L')
  }, 1900);
  setTimeout(() => {
    console.log('k')
  }, 2100);
  setTimeout(() => {
    console.log('')
  }, 2300);
  setTimeout(() => {
    console.log('')
  }, 2500);
  setTimeout(() => {
    console.log('')
  }, 2700);
  setTimeout(() => {
    console.log('')
  }, 2900);
  setTimeout(() => {
    process.exit()
  }, 3000)
};
setTimeout(() => {
  const { default: makeWASocket, useMultiFileAuthState, Browsers, delay, makeInMemoryStore, } = require("@adiwajshing/baileys");
  const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
  async function Secktor() {
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys')
    try {
      let session = makeWASocket({
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
        auth: state
      });
      session.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect, qr } = s;
        if (connection == "open") {
          await delay(500);
          let unique = fs.readFileSync(__dirname + '/auth_info_baileys/creds.json')
          var c = Buffer.from(unique).toString('base64')

          console.log('SESSION-ID=> ' + c)
          console.log('\nDon\'t provide your SESSION_ID to anyone otherwise that user can access your account.\nThanks')
          let cc = `*💃- 𝚀𝚄𝙴𝙴𝙽 𝙽𝙸𝙻𝚄 -💃*\n\n_Hey , Welcome To Queen Nilu Whatsapp Bot Md_\n\n◍ Github-https://github.com/janithsadanuwan/QueenNilu\n◍Youtube - www.youtube.com/c/janithsadanuwan\n\n⚠️ Don'T send session Vode To anyone⚠️`

          await session.sendMessage(session.user.id, { text: c });
          await session.sendMessage(session.user.id, { text: cc });
          await require('child_process').exec('rm -rf auth_info_baileys')
          process.exit(1)
        }
        session.ev.on('creds.update', saveCreds)
        if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode != 401
        ) {
          Secktor();
        }
      });
    } catch (err) {
      // console.log(err);
      await require('child_process').exec('rm -rf auth_info_baileys')
      process.exit(1)
    }
  }
  Secktor();
}, 3000)
