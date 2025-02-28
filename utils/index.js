1:var __createBinding = this && this.__createBinding || (Object.create ? function (_0x2ec542, _0x343352, _0x509ecb, _0x3fbc7a) {
2:  if (_0x3fbc7a === undefined) {
3:    _0x3fbc7a = _0x509ecb;
4:  }
5:  var _0x10699e = Object.getOwnPropertyDescriptor(_0x343352, _0x509ecb);
6:  if (!_0x10699e || ("get" in _0x10699e ? !_0x343352.__esModule : _0x10699e.writable || _0x10699e.configurable)) {
7:    _0x10699e = {
8:      'enumerable': true,
9:      'get': function () {
10:        return _0x343352[_0x509ecb];
11:      }
12:    };
13:  }
14:  Object.defineProperty(_0x2ec542, _0x3fbc7a, _0x10699e);
15:} : function (_0x5ab263, _0x22ff5c, _0x357afc, _0x53931b) {
16:  if (_0x53931b === undefined) {
17:    _0x53931b = _0x357afc;
18:  }
19:  _0x5ab263[_0x53931b] = _0x22ff5c[_0x357afc];
20:});
21:var __setModuleDefault = this && this.__setModuleDefault || (Object.create ? function (_0x3e8010, _0x206e93) {
22:  Object.defineProperty(_0x3e8010, "default", {
23:    'enumerable': true,
24:    'value': _0x206e93
25:  });
26:} : function (_0x45b5e0, _0x39e8b4) {
27:  _0x45b5e0['default'] = _0x39e8b4;
28:});
29:var __importStar = this && this.__importStar || function (_0x109aba) {
30:  if (_0x109aba && _0x109aba.__esModule) {
31:    return _0x109aba;
32:  }
33:  var _0x2de687 = {};
34:  if (_0x109aba != null) {
35:    for (var _0x2c671e in _0x109aba) if (_0x2c671e !== "default" && Object.prototype.hasOwnProperty.call(_0x109aba, _0x2c671e)) {
36:      __createBinding(_0x2de687, _0x109aba, _0x2c671e);
37:    }
38:  }
39:  __setModuleDefault(_0x2de687, _0x109aba);
40:  return _0x2de687;
41:};
42:var __importDefault = this && this.__importDefault || function (_0x1edd0a) {
43:  return _0x1edd0a && _0x1edd0a.__esModule ? _0x1edd0a : {
44:    'default': _0x1edd0a
45:  };
46:};
47:Object.defineProperty(exports, "__esModule", {
48:  'value': true
49:});
50:const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
51:const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
52:const logger = logger_1['default'].child({});
53:logger.level = "silent";
54:const pino = require("pino");
55:const boom_1 = require('@hapi/boom');
56:const conf = require("./set");
57:let fs = require("fs-extra");
58:let path = require("path");
59:const FileType = require('file-type');
60:const {
61:  Sticker,
62:  createSticker,
63:  StickerTypes
64:} = require("wa-sticker-formatter");
65:const {
66:  verifierEtatJid,
67:  recupererActionJid
68:} = require("./bdd/antilien");
69:const {
70:  atbverifierEtatJid,
71:  atbrecupererActionJid
72:} = require("./bdd/antibot");
73:let evt = require(__dirname + "/framework/zokou");
74:const {
75:  isUserBanned,
76:  addUserToBanList,
77:  removeUserFromBanList
78:} = require("./bdd/banUser");
79:const {
80:  addGroupToBanList,
81:  isGroupBanned,
82:  removeGroupFromBanList
83:} = require("./bdd/banGroup");
84:const {
85:  isGroupOnlyAdmin,
86:  addGroupToOnlyAdminList,
87:  removeGroupFromOnlyAdminList
88:} = require("./bdd/onlyAdmin");
89:let {
90:  reagir
91:} = require(__dirname + "/framework/app");
92:var session = conf.session.replace(/Zokou-MD-WHATSAPP-BOT;;;=>/g, '');
93:const prefixe = conf.PREFIXE;
94:async function authentification() {
95:  try {
96:    if (!fs.existsSync(__dirname + "/scan/creds.json")) {
97:      console.log("connexion en cour ...");
98:      await fs.writeFileSync(__dirname + "/scan/creds.json", atob(session), "utf8");
99:    } else if (fs.existsSync(__dirname + "/scan/creds.json") && session != "zokk") {
100:      await fs.writeFileSync(__dirname + "/scan/creds.json", atob(session), "utf8");
101:    }
102:  } catch (_0x18ab95) {
103:    console.log("Session Invalid " + _0x18ab95);
104:    return;
105:  }
106:}
107:authentification();
108:0x0;
109:const store = baileys_1.makeInMemoryStore({
110:  'logger': pino().child({
111:    'level': "silent",
112:    'stream': "store"
113:  })
114:});
115:setTimeout(() => {
116:  async function _0x4b6795() {
117:    0x0;
118:    const {
119:      version: _0x34ccc2,
120:      isLatest: _0x1cf390
121:    } = await baileys_1.fetchLatestBaileysVersion();
122:    0x0;
123:    const {
124:      state: _0x32f9a7,
125:      saveCreds: _0x5171fb
126:    } = await baileys_1.useMultiFileAuthState(__dirname + "/scan");
127:    0x0;
128:    const _0x13bf45 = {
129:      'version': _0x34ccc2,
130:      'logger': pino({
131:        'level': "silent"
132:      }),
133:      'browser': ["Bmw-Md", "safari", '1.0.0'],
134:      'printQRInTerminal': true,
135:      'fireInitQueries': false,
136:      'shouldSyncHistoryMessage': true,
137:      'downloadHistory': true,
138:      'syncFullHistory': true,
139:      'generateHighQualityLinkPreview': true,
140:      'markOnlineOnConnect': false,
141:      'keepAliveIntervalMs': 0x7530,
142:      'auth': {
143:        'creds': _0x32f9a7.creds,
144:        'keys': baileys_1.makeCacheableSignalKeyStore(_0x32f9a7.keys, logger)
145:      },
146:      'getMessage': async _0x167ce3 => {
147:        if (store) {
148:          const _0x5cee3a = await store.loadMessage(_0x167ce3.remoteJid, _0x167ce3.id, undefined);
149:          return _0x5cee3a.message || undefined;
150:        }
151:        return {
152:          'conversation': "An Error Occurred, Repeat Command!"
153:        };
154:      }
155:    };
156:    0x0;
157:    const _0xf78a87 = baileys_1["default"](_0x13bf45);
158:    store.bind(_0xf78a87.ev);
159:    _0xf78a87.ev.on("call", async _0x5c5612 => {
160:      if (conf.ANTICALL === "yes") {
161:        const _0x9c9367 = _0x5c5612[0x0].id;
162:        const _0x5999a8 = _0x5c5612[0x0].from;
163:        await _0xf78a87.rejectCall(_0x9c9367, _0x5999a8);
164:        await _0xf78a87.sendMessage(_0x5999a8, {
165:          'text': "```❌📞 AM HANS MD.., MY OWNER IS NOT ALLOWED FOR CALL NOW OR DROP YOUR SMS.. 🤫❌NO MORE CALL MY OWNER OK``` ."
166:        });
167:      }
168:    });
169:    const _0x3b0c51 = _0x3cee04 => new Promise(_0x326269 => setTimeout(_0x326269, _0x3cee04));
170:    let _0x55baa2 = 0x0;
171:    if (conf.AUTO_REACT_STATUS === "yes") {
172:      console.log("AUTO_REACT_STATUS is enabled. Listening for status updates...");
173:      _0xf78a87.ev.on("messages.upsert", async _0x44a0f9 => {
174:        const {
175:          messages: _0x1481eb
176:        } = _0x44a0f9;
177:        for (const _0x373afc of _0x1481eb) {
178:          if (_0x373afc.key && _0x373afc.key.remoteJid === 'status@broadcast') {
179:            console.log("Detected status update from:", _0x373afc.key.remoteJid);
180:            const _0x2bbe1a = Date.now();
181:            if (_0x2bbe1a - _0x55baa2 < 0x1388) {
182:              console.log("Throttling reactions to prevent overflow.");
183:              continue;
184:            }
185:            const _0x4251ce = _0xf78a87.user && _0xf78a87.user.id ? _0xf78a87.user.id.split(':')[0x0] + "@s.whatsapp.net" : null;
186:            if (!_0x4251ce) {
187:              console.log("Bot's user ID not available. Skipping reaction.");
188:              continue;
189:            }
190:            await _0xf78a87.sendMessage(_0x373afc.key.remoteJid, {
191:              'react': {
192:                'key': _0x373afc.key,
193:                'text': '🤎'
194:              }
195:            }, {
196:              'statusJidList': [_0x373afc.key.participant, _0x4251ce]
197:            });
198:            _0x55baa2 = Date.now();
199:            console.log("Successfully reacted to status update by " + _0x373afc.key.remoteJid);
200:            await _0x3b0c51(0x7d0);
201:          }
202:        }
203:      });
204:    }
205:    _0xf78a87.ev.on('messages.upsert', async _0x1a40f6 => {
206:      const {
207:        messages: _0x845c93
208:      } = _0x1a40f6;
209:      const _0x4c77a4 = _0x845c93[0x0];
210:      if (!_0x4c77a4.message) {
211:        return;
212:      }
213:      const _0x2cd9f2 = _0x38cce1 => {
214:        if (!_0x38cce1) {
215:          return _0x38cce1;
216:        }
217:        if (/:\d+@/gi.test(_0x38cce1)) {
218:          0x0;
219:          let _0xd4f5af = baileys_1.jidDecode(_0x38cce1) || {};
220:          return _0xd4f5af.user && _0xd4f5af.server && _0xd4f5af.user + '@' + _0xd4f5af.server || _0x38cce1;
221:        } else {
222:          return _0x38cce1;
223:        }
224:      };
225:      0x0;
226:      var _0x38342d = baileys_1.getContentType(_0x4c77a4.message);
227:      var _0x1eacba = _0x38342d == "conversation" ? _0x4c77a4.message.conversation : _0x38342d == "imageMessage" ? _0x4c77a4.message.imageMessage?.["caption"] : _0x38342d == "videoMessage" ? _0x4c77a4.message.videoMessage?.["caption"] : _0x38342d == "extendedTextMessage" ? _0x4c77a4.message?.['extendedTextMessage']?.["text"] : _0x38342d == "buttonsResponseMessage" ? _0x4c77a4?.["message"]?.['buttonsResponseMessage']?.["selectedButtonId"] : _0x38342d == "listResponseMessage" ? _0x4c77a4.message?.['listResponseMessage']?.["singleSelectReply"]?.["selectedRowId"] : _0x38342d == "messageContextInfo" ? _0x4c77a4?.["message"]?.["buttonsResponseMessage"]?.["selectedButtonId"] || _0x4c77a4.message?.["listResponseMessage"]?.["singleSelectReply"]?.["selectedRowId"] || _0x4c77a4.text : '';
228:      var _0x56ba16 = _0x4c77a4.key.remoteJid;
229:      var _0x4f6687 = _0x2cd9f2(_0xf78a87.user.id);
230:      var _0x2a538e = _0x4f6687.split('@')[0x0];
231:      const _0x3c4e15 = _0x56ba16?.["endsWith"]("@g.us");
232:      var _0x69d221 = _0x3c4e15 ? await _0xf78a87.groupMetadata(_0x56ba16) : '';
233:      var _0x3c3b49 = _0x3c4e15 ? _0x69d221.subject : '';
234:      var _0x1c3443 = _0x4c77a4.message.extendedTextMessage?.['contextInfo']?.["quotedMessage"];
235:      var _0x5873c2 = _0x2cd9f2(_0x4c77a4.message?.['extendedTextMessage']?.["contextInfo"]?.["participant"]);
236:      var _0x19b3a0 = _0x3c4e15 ? _0x4c77a4.key.participant ? _0x4c77a4.key.participant : _0x4c77a4.participant : _0x56ba16;
237:      if (_0x4c77a4.key.fromMe) {
238:        _0x19b3a0 = _0x4f6687;
239:      }
240:      var _0x14b190 = _0x3c4e15 ? _0x4c77a4.key.participant : '';
241:      const {
242:        getAllSudoNumbers: _0x1ca1a4
243:      } = require("./bdd/sudo");
244:      const _0x5ee29f = _0x4c77a4.pushName;
245:      const _0x35aea0 = await _0x1ca1a4();
246:      const _0x4bd789 = [_0x2a538e, "254710772666", '254710772666', "254710772666", '254710772666', conf.NUMERO_OWNER].map(_0x174895 => _0x174895.replace(/[^0-9]/g) + "@s.whatsapp.net");
247:      const _0x10d0ac = _0x4bd789.concat(_0x35aea0);
248:      const _0x5a78ec = _0x10d0ac.includes(_0x19b3a0);
249:      var _0x28f623 = ["254710772666", '254710772666', "254710772666', '254710772666'].map(_0x2d41e2 => _0x2d41e2.replace(/[^0-9]/g) + "@s.whatsapp.net").includes(_0x19b3a0);
250:      function _0x5c197a(_0x1fe138) {
251:        _0xf78a87.sendMessage(_0x56ba16, {
252:          'text': _0x1fe138
253:        }, {
254:          'quoted': _0x4c77a4
255:        });
256:      }
257:      console.log("\tHANS MD");
258:      console.log("=========== written message===========");
259:      if (_0x3c4e15) {
260:        console.log("message provenant du groupe : " + _0x3c3b49);
261:      }
262:      console.log("message envoyé par : [" + _0x5ee29f + " : " + _0x19b3a0.split("@s.whatsapp.net")[0x0] + " ]");
263:      console.log("type de message : " + _0x38342d);
264:      console.log("------ contenu du message ------");
265:      console.log(_0x1eacba);
266:      function _0x20cfa6(_0x5c77ff) {
267:        let _0x29ebda = [];
268:        for (_0x1a40f6 of _0x5c77ff) {
269:          if (_0x1a40f6.admin == null) {
270:            continue;
271:          }
272:          _0x29ebda.push(_0x1a40f6.id);
273:        }
274:        return _0x29ebda;
275:      }
276:      var _0x4963fd = conf.ETAT;
277:      if (_0x4963fd == 0x1) {
278:        await _0xf78a87.sendPresenceUpdate('available', _0x56ba16);
279:      } else {
280:        if (_0x4963fd == 0x2) {
281:          await _0xf78a87.sendPresenceUpdate("composing", _0x56ba16);
282:        } else if (_0x4963fd == 0x3) {
283:          await _0xf78a87.sendPresenceUpdate('recording', _0x56ba16);
284:        } else {
285:          await _0xf78a87.sendPresenceUpdate("unavailable", _0x56ba16);
286:        }
287:      }
288:      const _0x514529 = _0x3c4e15 ? await _0x69d221.participants : '';
289:      let _0x228f82 = _0x3c4e15 ? _0x20cfa6(_0x514529) : '';
290:      const _0x4f0765 = _0x3c4e15 ? _0x228f82.includes(_0x19b3a0) : false;
291:      var _0x4575b7 = _0x3c4e15 ? _0x228f82.includes(_0x4f6687) : false;
292:      const _0x4503ad = _0x1eacba ? _0x1eacba.trim().split(/ +/).slice(0x1) : null;
293:      const _0x362812 = _0x1eacba ? _0x1eacba.startsWith(prefixe) : false;
294:      const _0x2c0823 = _0x362812 ? _0x1eacba.slice(0x1).trim().split(/ +/).shift().toLowerCase() : false;
295:      const _0x45b7c9 = conf.URL.split(',');
296:      function _0x45f23f() {
297:        const _0x94fd28 = Math.floor(Math.random() * _0x45b7c9.length);
298:        const _0x4de2cd = _0x45b7c9[_0x94fd28];
299:        return _0x4de2cd;
300:      }
301:      var _0x4aaf08 = {
302:        'superUser': _0x5a78ec,
303:        'dev': _0x28f623,
304:        'verifGroupe': _0x3c4e15,
305:        'mbre': _0x514529,
306:        'membreGroupe': _0x14b190,
307:        'verifAdmin': _0x4f0765,
308:        'infosGroupe': _0x69d221,
309:        'nomGroupe': _0x3c3b49,
310:        'auteurMessage': _0x19b3a0,
311:        'nomAuteurMessage': _0x5ee29f,
312:        'idBot': _0x4f6687,
313:        'verifZokouAdmin': _0x4575b7,
314:        'prefixe': prefixe,
315:        'arg': _0x4503ad,
316:        'repondre': _0x5c197a,
317:        'mtype': _0x38342d,
318:        'groupeAdmin': _0x20cfa6,
319:        'msgRepondu': _0x1c3443,
320:        'auteurMsgRepondu': _0x5873c2,
321:        'ms': _0x4c77a4,
322:        'mybotpic': _0x45f23f
323:      };
324:      if (_0x4c77a4.message.protocolMessage && _0x4c77a4.message.protocolMessage.type === 0x0 && conf.ADM.toLocaleLowerCase() === "yes") {
325:        if (_0x4c77a4.key.fromMe || _0x4c77a4.message.protocolMessage.key.fromMe) {
326:          console.log("Message supprimer me concernant");
327:          return;
328:        }
329:        console.log("Message supprimer");
330:        let _0x333ff2 = _0x4c77a4.message.protocolMessage.key;
331:        try {
332:          const _0x4e7c03 = fs.readFileSync("./store.json", 'utf8');
333:          const _0x498f6c = JSON.parse(_0x4e7c03);
334:          let _0x56f259 = _0x498f6c.messages[_0x333ff2.remoteJid];
335:          let _0x4c2542;
336:          for (let _0x5a20fe = 0x0; _0x5a20fe < _0x56f259.length; _0x5a20fe++) {
337:            if (_0x56f259[_0x5a20fe].key.id === _0x333ff2.id) {
338:              _0x4c2542 = _0x56f259[_0x5a20fe];
339:              break;
340:            }
341:          }
342:          if (_0x4c2542 === null || !_0x4c2542 || _0x4c2542 === "undefined") {
343:            console.log("Message non trouver");
344:            return;
345:          }
346:          await _0xf78a87.sendMessage(_0x4f6687, {
347:            'image': {
348:              'url': "./media/deleted-message.jpg"
349:            },
350:            'caption': "        *Deleted message detected*\n\n 🚮 Deleted by @" + _0x4c2542.key.participant.split('@')[0x0] + '​',
351:            'mentions': [_0x4c2542.key.participant]
352:          }).then(() => {
353:            _0xf78a87.sendMessage(_0x4f6687, {
354:              'forward': _0x4c2542
355:            }, {
356:              'quoted': _0x4c2542
357:            });
358:          });
359:        } catch (_0x150864) {
360:          console.log(_0x150864);
361:        }
362:      }
363:      if (_0x4c77a4.key && _0x4c77a4.key.remoteJid === "status@broadcast" && conf.AUTO_READ_STATUS === "yes") {
364:        await _0xf78a87.readMessages([_0x4c77a4.key]);
365:      }
366:      if (_0x4c77a4.key && _0x4c77a4.key.remoteJid === 'status@broadcast' && conf.AUTO_DOWNLOAD_STATUS === "yes") {
367:        if (_0x4c77a4.message.extendedTextMessage) {
368:          var _0x36c5f4 = _0x4c77a4.message.extendedTextMessage.text;
369:          await _0xf78a87.sendMessage(_0x4f6687, {
370:            'text': _0x36c5f4
371:          }, {
372:            'quoted': _0x4c77a4
373:          });
374:        } else {
375:          if (_0x4c77a4.message.imageMessage) {
376:            var _0x2b36fa = _0x4c77a4.message.imageMessage.caption;
377:            var _0x4fc842 = await _0xf78a87.downloadAndSaveMediaMessage(_0x4c77a4.message.imageMessage);
378:            await _0xf78a87.sendMessage(_0x4f6687, {
379:              'image': {
380:                'url': _0x4fc842
381:              },
382:              'caption': _0x2b36fa
383:            }, {
384:              'quoted': _0x4c77a4
385:            });
386:          } else {
387:            if (_0x4c77a4.message.videoMessage) {
388:              var _0x2b36fa = _0x4c77a4.message.videoMessage.caption;
389:              var _0x3e4f07 = await _0xf78a87.downloadAndSaveMediaMessage(_0x4c77a4.message.videoMessage);
390:              await _0xf78a87.sendMessage(_0x4f6687, {
391:                'video': {
392:                  'url': _0x3e4f07
393:                },
394:                'caption': _0x2b36fa
395:              }, {
396:                'quoted': _0x4c77a4
397:              });
398:            }
399:          }
400:        }
401:      }
402:      if (!_0x28f623 && _0x56ba16 == "120363158701337904@g.us") {
403:        return;
404:      }
405:      if (_0x1eacba && _0x19b3a0.endsWith("s.whatsapp.net")) {
406:        const {
407:          ajouterOuMettreAJourUserData: _0x139c64
408:        } = require("./bdd/level");
409:        try {
410:          await _0x139c64(_0x19b3a0);
411:        } catch (_0x4fef17) {
412:          console.error(_0x4fef17);
413:        }
414:      }
415:      try {
416:        if (_0x4c77a4.message[_0x38342d].contextInfo.mentionedJid && (_0x4c77a4.message[_0x38342d].contextInfo.mentionedJid.includes(_0x4f6687) || _0x4c77a4.message[_0x38342d].contextInfo.mentionedJid.includes(conf.NUMERO_OWNER + '@s.whatsapp.net'))) {
417:          if (_0x56ba16 == "120363158701337904@g.us") {
418:            return;
419:          }
420:          ;
421:          if (_0x5a78ec) {
422:            console.log('hummm');
423:            return;
424:          }
425:          let _0x16fd3c = require("./bdd/mention");
426:          let _0x2684f2 = await _0x16fd3c.recupererToutesLesValeurs();
427:          let _0x55c188 = _0x2684f2[0x0];
428:          if (_0x55c188.status === "non") {
429:            console.log("mention pas actifs");
430:            return;
431:          }
432:          let _0x4ff8a1;
433:          if (_0x55c188.type.toLocaleLowerCase() === 'image') {
434:            _0x4ff8a1 = {
435:              'image': {
436:                'url': _0x55c188.url
437:              },
438:              'caption': _0x55c188.message
439:            };
440:          } else {
441:            if (_0x55c188.type.toLocaleLowerCase() === "video") {
442:              _0x4ff8a1 = {
443:                'video': {
444:                  'url': _0x55c188.url
445:                },
446:                'caption': _0x55c188.message
447:              };
448:            } else {
449:              if (_0x55c188.type.toLocaleLowerCase() === 'sticker') {
450:                let _0x211a47 = new Sticker(_0x55c188.url, {
451:                  'pack': conf.NOM_OWNER,
452:                  'type': StickerTypes.FULL,
453:                  'categories': ['🤩', '🎉'],
454:                  'id': "12345",
455:                  'quality': 0x46,
456:                  'background': "transparent"
457:                });
458:                const _0x15ae5e = await _0x211a47.toBuffer();
459:                _0x4ff8a1 = {
460:                  'sticker': _0x15ae5e
461:                };
462:              } else if (_0x55c188.type.toLocaleLowerCase() === 'audio') {
463:                _0x4ff8a1 = {
464:                  'audio': {
465:                    'url': _0x55c188.url
466:                  },
467:                  'mimetype': "audio/mp4"
468:                };
469:              }
470:            }
471:          }
472:          _0xf78a87.sendMessage(_0x56ba16, _0x4ff8a1, {
473:            'quoted': _0x4c77a4
474:          });
475:        }
476:      } catch (_0x41a38a) {}
477:      try {
478:        const _0x77b943 = await verifierEtatJid(_0x56ba16);
479:        if (_0x1eacba.includes("https://") && _0x3c4e15 && _0x77b943) {
480:          console.log("lien detecté");
481:          var _0x23b27c = _0x3c4e15 ? _0x228f82.includes(_0x4f6687) : false;
482:          if (_0x5a78ec || _0x4f0765 || !_0x23b27c) {
483:            console.log("je fais rien");
484:            return;
485:          }
486:          ;
487:          const _0x57d055 = {
488:            'remoteJid': _0x56ba16,
489:            'fromMe': false,
490:            'id': _0x4c77a4.key.id,
491:            'participant': _0x19b3a0
492:          };
493:          var _0x4e639a = "lien detected, \n";
494:          var _0x59ee8f = new Sticker("https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif", {
495:            'pack': 'Zoou-Md',
496:            'author': conf.OWNER_NAME,
497:            'type': StickerTypes.FULL,
498:            'categories': ['🤩', '🎉'],
499:            'id': '12345',
500:            'quality': 0x32,
501:            'background': "#000000"
502:          });
503:          await _0x59ee8f.toFile("st1.webp");
504:          var _0x360ce2 = await recupererActionJid(_0x56ba16);
505:          if (_0x360ce2 === 'remove') {
506:            _0x4e639a += "message deleted \n @" + _0x19b3a0.split('@')[0x0] + " removed from group.";
507:            await _0xf78a87.sendMessage(_0x56ba16, {
508:              'sticker': fs.readFileSync("st1.webp")
509:            });
510:            0x0;
511:            baileys_1.delay(0x320);
512:            await _0xf78a87.sendMessage(_0x56ba16, {
513:              'text': _0x4e639a,
514:              'mentions': [_0x19b3a0]
515:            }, {
516:              'quoted': _0x4c77a4
517:            });
518:            try {
519:              await _0xf78a87.groupParticipantsUpdate(_0x56ba16, [_0x19b3a0], 'remove');
520:            } catch (_0x1f8622) {
521:              console.log("antiien ") + _0x1f8622;
522:            }
523:            await _0xf78a87.sendMessage(_0x56ba16, {
524:              'delete': _0x57d055
525:            });
526:            await fs.unlink("st1.webp");
527:          } else {
528:            if (_0x360ce2 === "delete") {
529:              _0x4e639a += "message deleted \n @" + _0x19b3a0.split('@')[0x0] + " avoid sending link.";
530:              await _0xf78a87.sendMessage(_0x56ba16, {
531:                'text': _0x4e639a,
532:                'mentions': [_0x19b3a0]
533:              }, {
534:                'quoted': _0x4c77a4
535:              });
536:              await _0xf78a87.sendMessage(_0x56ba16, {
537:                'delete': _0x57d055
538:              });
539:              await fs.unlink("st1.webp");
540:            } else {
541:              if (_0x360ce2 === "warn") {
542:                const {
543:                  getWarnCountByJID: _0x929622,
544:                  ajouterUtilisateurAvecWarnCount: _0x10aad9
545:                } = require('./bdd/warn');
546:                let _0x3c1839 = await _0x929622(_0x19b3a0);
547:                let _0x4ee8dc = conf.WARN_COUNT;
548:                if (_0x3c1839 >= _0x4ee8dc) {
549:                  var _0x3dce1e = "link detected , you will be remove because of reaching warn-limit";
550:                  await _0xf78a87.sendMessage(_0x56ba16, {
551:                    'text': _0x3dce1e,
552:                    'mentions': [_0x19b3a0]
553:                  }, {
554:                    'quoted': _0x4c77a4
555:                  });
556:                  await _0xf78a87.groupParticipantsUpdate(_0x56ba16, [_0x19b3a0], "remove");
557:                  await _0xf78a87.sendMessage(_0x56ba16, {
558:                    'delete': _0x57d055
559:                  });
560:                } else {
561:                  var _0x5dfdea = _0x4ee8dc - _0x3c1839;
562:                  var _0x28f434 = "Link detected , your warn_count was upgrade ;\n rest : " + _0x5dfdea + " ";
563:                  await _0x10aad9(_0x19b3a0);
564:                  await _0xf78a87.sendMessage(_0x56ba16, {
565:                    'text': _0x28f434,
566:                    'mentions': [_0x19b3a0]
567:                  }, {
568:                    'quoted': _0x4c77a4
569:                  });
570:                  await _0xf78a87.sendMessage(_0x56ba16, {
571:                    'delete': _0x57d055
572:                  });
573:                }
574:              }
575:            }
576:          }
577:        }
578:      } catch (_0x250d7f) {
579:        console.log("bdd err " + _0x250d7f);
580:      }
581:      try {
582:        const _0x2b5683 = _0x4c77a4.key?.['id']?.["startsWith"]('BAES') && _0x4c77a4.key?.['id']?.["length"] === 0x10;
583:        const _0x301449 = _0x4c77a4.key?.['id']?.["startsWith"]("BAE5") && _0x4c77a4.key?.['id']?.['length'] === 0x10;
584:        if (_0x2b5683 || _0x301449) {
585:          if (_0x38342d === 'reactionMessage') {
586:            console.log("Je ne reagis pas au reactions");
587:            return;
588:          }
589:          ;
590:          const _0x3dc4cd = await atbverifierEtatJid(_0x56ba16);
591:          if (!_0x3dc4cd) {
592:            return;
593:          }
594:          ;
595:          if (_0x4f0765 || _0x19b3a0 === _0x4f6687) {
596:            console.log("je fais rien");
597:            return;
598:          }
599:          ;
600:          const _0x263ebd = {
601:            'remoteJid': _0x56ba16,
602:            'fromMe': false,
603:            'id': _0x4c77a4.key.id,
604:            'participant': _0x19b3a0
605:          };
606:          var _0x4e639a = "bot detected, \n";
607:          var _0x59ee8f = new Sticker("https://raw.githubusercontent.com/djalega8000/Zokou-MD/main/media/remover.gif", {
608:            'pack': "Zoou-Md",
609:            'author': conf.OWNER_NAME,
610:            'type': StickerTypes.FULL,
611:            'categories': ['🤩', '🎉'],
612:            'id': '12345',
613:            'quality': 0x32,
614:            'background': "#000000"
615:          });
616:          await _0x59ee8f.toFile("st1.webp");
617:          var _0x360ce2 = await atbrecupererActionJid(_0x56ba16);
618:          if (_0x360ce2 === "remove") {
619:            _0x4e639a += "message deleted \n @" + _0x19b3a0.split('@')[0x0] + " removed from group.";
620:            await _0xf78a87.sendMessage(_0x56ba16, {
621:              'sticker': fs.readFileSync("st1.webp")
622:            });
623:            0x0;
624:            baileys_1.delay(0x320);
625:            await _0xf78a87.sendMessage(_0x56ba16, {
626:              'text': _0x4e639a,
627:              'mentions': [_0x19b3a0]
628:            }, {
629:              'quoted': _0x4c77a4
630:            });
631:            try {
632:              await _0xf78a87.groupParticipantsUpdate(_0x56ba16, [_0x19b3a0], 'remove');
633:            } catch (_0x3acf25) {
634:              console.log("antibot ") + _0x3acf25;
635:            }
636:            await _0xf78a87.sendMessage(_0x56ba16, {
637:              'delete': _0x263ebd
638:            });
639:            await fs.unlink('st1.webp');
640:          } else {
641:            if (_0x360ce2 === "delete") {
642:              _0x4e639a += "message delete \n @" + _0x19b3a0.split('@')[0x0] + " Avoid sending link.";
643:              await _0xf78a87.sendMessage(_0x56ba16, {
644:                'text': _0x4e639a,
645:                'mentions': [_0x19b3a0]
646:              }, {
647:                'quoted': _0x4c77a4
648:              });
649:              await _0xf78a87.sendMessage(_0x56ba16, {
650:                'delete': _0x263ebd
651:              });
652:              await fs.unlink("st1.webp");
653:            } else {
654:              if (_0x360ce2 === "warn") {
655:                const {
656:                  getWarnCountByJID: _0x5ae1fd,
657:                  ajouterUtilisateurAvecWarnCount: _0x3a3227
658:                } = require("./bdd/warn");
659:                let _0x19cb19 = await _0x5ae1fd(_0x19b3a0);
660:                let _0x347a13 = conf.WARN_COUNT;
661:                if (_0x19cb19 >= _0x347a13) {
662:                  var _0x3dce1e = "bot detected ;you will be remove because of reaching warn-limit";
663:                  await _0xf78a87.sendMessage(_0x56ba16, {
664:                    'text': _0x3dce1e,
665:                    'mentions': [_0x19b3a0]
666:                  }, {
667:                    'quoted': _0x4c77a4
668:                  });
669:                  await _0xf78a87.groupParticipantsUpdate(_0x56ba16, [_0x19b3a0], "remove");
670:                  await _0xf78a87.sendMessage(_0x56ba16, {
671:                    'delete': _0x263ebd
672:                  });
673:                } else {
674:                  var _0x5dfdea = _0x347a13 - _0x19cb19;
675:                  var _0x28f434 = "bot detected , your warn_count was upgrade ;\n rest : " + _0x5dfdea + " ";
676:                  await _0x3a3227(_0x19b3a0);
677:                  await _0xf78a87.sendMessage(_0x56ba16, {
678:                    'text': _0x28f434,
679:                    'mentions': [_0x19b3a0]
680:                  }, {
681:                    'quoted': _0x4c77a4
682:                  });
683:                  await _0xf78a87.sendMessage(_0x56ba16, {
684:                    'delete': _0x263ebd
685:                  });
686:                }
687:              }
688:            }
689:          }
690:        }
691:      } catch (_0x4e1246) {
692:        console.log(".... " + _0x4e1246);
693:      }
694:      if (_0x362812) {
695:        const _0x51c016 = evt.cm.find(_0x5dce6c => _0x5dce6c.nomCom === _0x2c0823);
696:        if (_0x51c016) {
697:          try {
698:            if (conf.MODE.toLocaleLowerCase() != 'yes' && !_0x5a78ec) {
699:              return;
700:            }
701:            if (!_0x5a78ec && _0x56ba16 === _0x19b3a0 && conf.PM_PERMIT === 'yes') {
702:              _0x5c197a("You don't have acces to commands here");
703:              return;
704:            }
705:            if (!_0x5a78ec && _0x3c4e15) {
706:              let _0x513f7a = await isGroupBanned(_0x56ba16);
707:              if (_0x513f7a) {
708:                return;
709:              }
710:            }
711:            if (!_0x4f0765 && _0x3c4e15) {
712:              let _0x8faddc = await isGroupOnlyAdmin(_0x56ba16);
713:              if (_0x8faddc) {
714:                return;
715:              }
716:            }
717:            if (!_0x5a78ec) {
718:              let _0x415719 = await isUserBanned(_0x19b3a0);
719:              if (_0x415719) {
720:                _0x5c197a("You are banned from bot commands");
721:                return;
722:              }
723:            }
724:            reagir(_0x56ba16, _0xf78a87, _0x4c77a4, _0x51c016.reaction);
725:            _0x51c016.fonction(_0x56ba16, _0xf78a87, _0x4aaf08);
726:          } catch (_0x4da9ad) {
727:            console.log("😡😡 " + _0x4da9ad);
728:            _0xf78a87.sendMessage(_0x56ba16, {
729:              'text': "😡😡 " + _0x4da9ad
730:            }, {
731:              'quoted': _0x4c77a4
732:            });
733:          }
734:        }
735:      }
736:    });
737:    const {
738:      recupevents: _0x3917c8
739:    } = require("./bdd/welcome");
740:    _0xf78a87.ev.on("group-participants.update", async _0x2d4ff0 => {
741:      console.log(_0x2d4ff0);
742:      let _0x1f7dd8;
743:      try {
744:        _0x1f7dd8 = await _0xf78a87.profilePictureUrl(_0x2d4ff0.id, "image");
745:      } catch {
746:        _0x1f7dd8 = '';
747:      }
748:      try {
749:        const _0x442c6f = await _0xf78a87.groupMetadata(_0x2d4ff0.id);
750:        if (_0x2d4ff0.action == "add" && (await _0x3917c8(_0x2d4ff0.id, 'welcome')) == 'on') {
751:          let _0x4cf3d4 = "*HANS WELCOME MESSAGE*";
752:          let _0x80123d = _0x2d4ff0.participants;
753:          for (let _0x466772 of _0x80123d) {
754:            _0x4cf3d4 += " \n❒ *Hey* 🖐️ @" + _0x466772.split('@')[0x0] + " WELCOME TO OUR GROUP. \n\n";
755:          }
756:          _0x4cf3d4 += "❒ *READ THE GROUP DESCRIPTION TO AVOID GETTING REMOVED* ";
757:          _0xf78a87.sendMessage(_0x2d4ff0.id, {
758:            'image': {
759:              'url': _0x1f7dd8
760:            },
761:            'caption': _0x4cf3d4,
762:            'mentions': _0x80123d
763:          });
764:        } else {
765:          if (_0x2d4ff0.action == "remove" && (await _0x3917c8(_0x2d4ff0.id, "goodbye")) == 'on') {
766:            let _0x450444 = "one or somes member(s) left group;\n";
767:            let _0x1a2615 = _0x2d4ff0.participants;
768:            for (let _0x18ab7f of _0x1a2615) {
769:              _0x450444 += '@' + _0x18ab7f.split('@')[0x0] + "\n";
770:            }
771:            _0xf78a87.sendMessage(_0x2d4ff0.id, {
772:              'text': _0x450444,
773:              'mentions': _0x1a2615
774:            });
775:          } else {
776:            if (_0x2d4ff0.action == "promote" && (await _0x3917c8(_0x2d4ff0.id, "antipromote")) == 'on') {
777:              if (_0x2d4ff0.author == _0x442c6f.owner || _0x2d4ff0.author == conf.NUMERO_OWNER + "@s.whatsapp.net" || _0x2d4ff0.author == decodeJid(_0xf78a87.user.id) || _0x2d4ff0.author == _0x2d4ff0.participants[0x0]) {
778:                console.log("Cas de superUser je fais rien");
779:                return;
780:              }
781:              ;
782:              await _0xf78a87.groupParticipantsUpdate(_0x2d4ff0.id, [_0x2d4ff0.author, _0x2d4ff0.participants[0x0]], "demote");
783:              _0xf78a87.sendMessage(_0x2d4ff0.id, {
784:                'text': '@' + _0x2d4ff0.author.split('@')[0x0] + " has violated the anti-promotion rule, therefore both " + _0x2d4ff0.author.split('@')[0x0] + " and @" + _0x2d4ff0.participants[0x0].split('@')[0x0] + " have been removed from administrative rights.",
785:                'mentions': [_0x2d4ff0.author, _0x2d4ff0.participants[0x0]]
786:              });
787:            } else {
788:              if (_0x2d4ff0.action == "demote" && (await _0x3917c8(_0x2d4ff0.id, "antidemote")) == 'on') {
789:                if (_0x2d4ff0.author == _0x442c6f.owner || _0x2d4ff0.author == conf.NUMERO_OWNER + '@s.whatsapp.net' || _0x2d4ff0.author == decodeJid(_0xf78a87.user.id) || _0x2d4ff0.author == _0x2d4ff0.participants[0x0]) {
790:                  console.log("Cas de superUser je fais rien");
791:                  return;
792:                }
793:                ;
794:                await _0xf78a87.groupParticipantsUpdate(_0x2d4ff0.id, [_0x2d4ff0.author], "demote");
795:                await _0xf78a87.groupParticipantsUpdate(_0x2d4ff0.id, [_0x2d4ff0.participants[0x0]], 'promote');
796:                _0xf78a87.sendMessage(_0x2d4ff0.id, {
797:                  'text': '@' + _0x2d4ff0.author.split('@')[0x0] + " has violated the anti-demotion rule by removing @" + _0x2d4ff0.participants[0x0].split('@')[0x0] + ". Consequently, he has been stripped of administrative rights.",
798:                  'mentions': [_0x2d4ff0.author, _0x2d4ff0.participants[0x0]]
799:                });
800:              }
801:            }
802:          }
803:        }
804:      } catch (_0x47770e) {
805:        console.error(_0x47770e);
806:      }
807:    });
808:    async function _0x4eb9f4() {
809:      const _0x3457b1 = require("node-cron");
810:      const {
811:        getCron: _0x54a16a
812:      } = require("./bdd/cron");
813:      let _0x561332 = await _0x54a16a();
814:      console.log(_0x561332);
815:      if (_0x561332.length > 0x0) {
816:        for (let _0x3c4a60 = 0x0; _0x3c4a60 < _0x561332.length; _0x3c4a60++) {
817:          if (_0x561332[_0x3c4a60].mute_at != null) {
818:            let _0x244c17 = _0x561332[_0x3c4a60].mute_at.split(':');
819:            console.log("etablissement d'un automute pour " + _0x561332[_0x3c4a60].group_id + " a " + _0x244c17[0x0] + " H " + _0x244c17[0x1]);
820:            _0x3457b1.schedule(_0x244c17[0x1] + " " + _0x244c17[0x0] + " * * *", async () => {
821:              await _0xf78a87.groupSettingUpdate(_0x561332[_0x3c4a60].group_id, "announcement");
822:              _0xf78a87.sendMessage(_0x561332[_0x3c4a60].group_id, {
823:                'image': {
824:                  'url': "./media/chrono.webp"
825:                },
826:                'caption': "Hello, it's time to close the group; sayonara."
827:              });
828:            }, {
829:              'timezone': 'Africa/Nairobi'
830:            });
831:          }
832:          if (_0x561332[_0x3c4a60].unmute_at != null) {
833:            let _0x1eb276 = _0x561332[_0x3c4a60].unmute_at.split(':');
834:            console.log("etablissement d'un autounmute pour " + _0x1eb276[0x0] + " H " + _0x1eb276[0x1] + " ");
835:            _0x3457b1.schedule(_0x1eb276[0x1] + " " + _0x1eb276[0x0] + " * * *", async () => {
836:              await _0xf78a87.groupSettingUpdate(_0x561332[_0x3c4a60].group_id, 'not_announcement');
837:              _0xf78a87.sendMessage(_0x561332[_0x3c4a60].group_id, {
838:                'image': {
839:                  'url': "./media/chrono.webp"
840:                },
841:                'caption': "Good morning; It's time to open the group."
842:              });
843:            }, {
844:              'timezone': "Africa/Nairobi"
845:            });
846:          }
847:        }
848:      } else {
849:        console.log("Les crons n'ont pas été activés");
850:      }
851:      return;
852:    }
853:    _0xf78a87.ev.on('contacts.upsert', async _0x4da5ba => {
854:      const _0x56ea0e = _0x4ecac0 => {
855:        for (const _0x96d882 of _0x4ecac0) {
856:          if (store.contacts[_0x96d882.id]) {
857:            Object.assign(store.contacts[_0x96d882.id], _0x96d882);
858:          } else {
859:            store.contacts[_0x96d882.id] = _0x96d882;
860:          }
861:        }
862:        return;
863:      };
864:      _0x56ea0e(_0x4da5ba);
865:    });
866:    _0xf78a87.ev.on('connection.update', async _0x27d47d => {
867:      const {
868:        lastDisconnect: _0x13d461,
869:        connection: _0x34734f
870:      } = _0x27d47d;
871:      if (_0x34734f === "connecting") {
872:        console.log("ℹ️ Hans is connecting...");
873:      } else {
874:        if (_0x34734f === "open") {
875:          console.log("✅ Hans Connected to WhatsApp! ☺️");
876:          console.log('--');
877:          0x0;
878:          await baileys_1.delay(0xc8);
879:          console.log("------");
880:          0x0;
881:          await baileys_1.delay(0x12c);
882:          console.log("------------------/-----");
883:          console.log("Hans Md is Online 🕸\n\n");
884:          console.log("Loading Bmw Commands ...\n");
885:          fs.readdirSync(__dirname + "/commandes").forEach(_0x38cb02 => {
886:            if (path.extname(_0x38cb02).toLowerCase() == '.js') {
887:              try {
888:                require(__dirname + "/commandes/" + _0x38cb02);
889:                console.log(_0x38cb02 + " Installed Successfully✔️");
890:              } catch (_0x44f1d2) {
891:                console.log(_0x38cb02 + " could not be installed due to : " + _0x44f1d2);
892:              }
893:              0x0;
894:              baileys_1.delay(0x12c);
895:            }
896:          });
897:          0x0;
898:          baileys_1.delay(0x2bc);
899:          var _0x1793b6;
900:          if (conf.MODE.toLocaleLowerCase() === "yes") {
901:            _0x1793b6 = "public";
902:          } else if (conf.MODE.toLocaleLowerCase() === 'no') {
903:            _0x1793b6 = "private";
904:          } else {
905:            _0x1793b6 = "undefined";
906:          }
907:          console.log("Commands Installation Completed ✅");
908:          await _0x4eb9f4();
909:          if (conf.DP.toLowerCase() === 'yes') {
910:            let _0xac2a75 = " ⁠⁠⁠⁠\n╔═━━━━════━━━─━─➳ \n│🌏 *ʜᴀɴs-ᴍᴅ-ɪs-ᴄᴏɴɴᴇᴄᴛᴇᴅ-ᴏɴ-ʏᴏᴜʀ-ᴡʜᴀᴛsᴀᴘᴘ*\n╚═━━━━════━━━─━─➳\n│💫 ᴘʀᴇғɪx: *[ " + prefixe + " ]*\n│⭕ ᴍᴏᴅᴇ: *" + _0x1793b6 + "*\n╚═━━━━════━━━─━─➳\n\n                \n                \n                 ";
911:            await _0xf78a87.sendMessage(_0xf78a87.user.id, {
912:              'text': _0xac2a75
913:            });
914:          }
915:          await _0xf78a87.sendMessage(_0xf78a87.user.id, {
916:              text: `🤖 *BlackSky-MD Status Update*\n\n📋 Status: Connected\n⏰ Time: ${new Date().toLocaleString()}\n🔧 Version: 1.0.0\n\n📝 Details:\n• WhatsApp connection established\n• Running on Heroku platform\n• Bot is ready to receive commands\n\n💡 Type .menu to see available commands.`
917:          });
918:        } else {
919:          if (_0x34734f == "close") {
920:            let _0x5377aa = new boom_1.Boom(_0x13d461?.["error"])?.["output"]["statusCode"];
921:            if (_0x5377aa === baileys_1.DisconnectReason.badSession) {
922:              console.log("Session id error, rescan again...");
923:            } else {
924:              if (_0x5377aa === baileys_1.DisconnectReason.connectionClosed) {
925:                console.log("!!! connexion fermée, reconnexion en cours ...");
926:                _0x4b6795();
927:              } else {
928:                if (_0x5377aa === baileys_1.DisconnectReason.connectionLost) {
929:                  console.log("connection error 😞 ,,, trying to reconnect... ");
930:                  _0x4b6795();
931:                } else {
932:                  if (_0x5377aa === baileys_1.DisconnectReason?.["connectionReplaced"]) {
933:                    console.log("connexion réplacée ,,, une sesssion est déjà ouverte veuillez la fermer svp !!!");
934:                  } else {
935:                    if (_0x5377aa === baileys_1.DisconnectReason.loggedOut) {
936:                      console.log("vous êtes déconnecté,,, veuillez rescanner le code qr svp");
937:                    } else {
938:                      if (_0x5377aa === baileys_1.DisconnectReason.restartRequired) {
939:                        console.log("redémarrage en cours ▶️");
940:                        _0x4b6795();
941:                      } else {
942:                        console.log("redemarrage sur le coup de l'erreur  ", _0x5377aa);
943:                        const {
944:                          exec: _0x188683
945:                        } = require("child_process");
946:                        _0x188683("pm2 restart all");
947:                      }
948:                    }
949:                  }
950:                }
951:              }
952:            }
953:            console.log("hum " + _0x34734f);
954:            _0x4b6795();
955:          }
956:        }
957:      }
958:    });
959:    _0xf78a87.ev.on("creds.update", _0x5171fb);
960:    _0xf78a87.downloadAndSaveMediaMessage = async (_0x306150, _0x98a048 = '', _0x4765b9 = true) => {
961:      let _0xad6cf = _0x306150.msg ? _0x306150.msg : _0x306150;
962:      let _0xcde04d = (_0x306150.msg || _0x306150).mimetype || '';
963:      let _0x4e1b46 = _0x306150.mtype ? _0x306150.mtype.replace(/Message/gi, '') : _0xcde04d.split('/')[0x0];
964:      0x0;
965:      const _0x513757 = await baileys_1.downloadContentFromMessage(_0xad6cf, _0x4e1b46);
966:      let _0x5af7e5 = Buffer.from([]);
967:      for await (const _0x2851db of _0x513757) {
968:        _0x5af7e5 = Buffer.concat([_0x5af7e5, _0x2851db]);
969:      }
970:      let _0x36e709 = await FileType.fromBuffer(_0x5af7e5);
971:      let _0x557b00 = './' + _0x98a048 + '.' + _0x36e709.ext;
972:      await fs.writeFileSync(_0x557b00, _0x5af7e5);
973:      return _0x557b00;
974:    };
975:    _0xf78a87.awaitForMessage = async (_0x3e7712 = {}) => {
976:      return new Promise((_0x3c8632, _0x549ecd) => {
977:        if (typeof _0x3e7712 !== "object") {
978:          _0x549ecd(new Error("Options must be an object"));
979:        }
980:        if (typeof _0x3e7712.sender !== "string") {
981:          _0x549ecd(new Error("Sender must be a string"));
982:        }
983:        if (typeof _0x3e7712.chatJid !== 'string') {
984:          _0x549ecd(new Error("ChatJid must be a string"));
985:        }
986:        if (_0x3e7712.timeout && typeof _0x3e7712.timeout !== "number") {
987:          _0x549ecd(new Error("Timeout must be a number"));
988:        }
989:        if (_0x3e7712.filter && typeof _0x3e7712.filter !== "function") {
990:          _0x549ecd(new Error("Filter must be a function"));
991:        }
992:        const _0x39bb52 = _0x3e7712?.['timeout'] || undefined;
993:        const _0x1bd0f3 = _0x3e7712?.["filter"] || (() => true);
994:        let _0x3f7ab5 = undefined;
995:        let _0x245871 = _0xa71890 => {
996:          let {
997:            type: _0x55f553,
998:            messages: _0x2ddd1d
999:          } = _0xa71890;
1000:          if (_0x55f553 == "notify") {
1001:            for (let _0x4e8040 of _0x2ddd1d) {
1002:              const _0x5568a9 = _0x4e8040.key.fromMe;
1003:              const _0x170153 = _0x4e8040.key.remoteJid;
1004:              const _0x51296e = _0x170153.endsWith("@g.us");
1005:              const _0x27e770 = _0x170153 == "status@broadcast";
1006:              const _0x4ba8a1 = _0x5568a9 ? _0xf78a87.user.id.replace(/:.*@/g, '@') : _0x51296e || _0x27e770 ? _0x4e8040.key.participant.replace(/:.*@/g, '@') : _0x170153;
1007:              if (_0x4ba8a1 == _0x3e7712.sender && _0x170153 == _0x3e7712.chatJid && _0x1bd0f3(_0x4e8040)) {
1008:                _0xf78a87.ev.off("messages.upsert", _0x245871);
1009:                clearTimeout(_0x3f7ab5);
1010:                _0x3c8632(_0x4e8040);
1011:              }
1012:            }
1013:          }
1014:        };
1015:        _0xf78a87.ev.on('messages.upsert', _0x245871);
1016:        if (_0x39bb52) {
1017:          _0x3f7ab5 = setTimeout(() => {
1018:            _0xf78a87.ev.off('messages.upsert', _0x245871);
1019:            _0x549ecd(new Error("Timeout"));
1020:          }, _0x39bb52);
1021:        }
1022:      });
1023:    };
1024:    return _0xf78a87;
1025:  }
1026:  let _0x5ead48 = require.resolve(__filename);
1027:  fs.watchFile(_0x5ead48, () => {
1028:    fs.unwatchFile(_0x5ead48);
1029:    console.log("mise à jour " + __filename);
1030:    delete require.cache[_0x5ead48];
1031:    require(_0x5ead48);
1032:  });
1033:  _0x4b6795();
1034:}, 0x1388);