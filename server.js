const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const rooms = {}; 

const POOLS = {
  '華語流行': [
    "周杰倫 擱淺", "周杰倫 七里香", "周杰倫 晴天", "周杰倫 稻香", "周杰倫 夜曲",
    "告五人 好不容易", "告五人 披星戴月的想你", "告五人 愛人錯過", "告五人 帶我去找夜生活", "告五人 醜人多作怪",
    "林俊傑 那些你很冒險的夢", "林俊傑 修煉愛情", "林俊傑 不為誰而作的歌", "林俊傑 可惜沒如果", "林俊傑 江南",
    "鄧紫棋 倒數", "鄧紫棋 光年之外", "鄧紫棋 泡沫", "鄧紫棋 來自天堂的魔鬼", "鄧紫棋 句號",
    "韋禮安 如果可以", "韋禮安 慢慢等", "韋禮安 還是會", "韋禮安 女孩", "韋禮安 因為是你",
    "周興哲 以後別做朋友", "周興哲 你，好不好", "周興哲 怎麼了", "周興哲 如果雨之後", "周興哲 永不失聯的愛",
    "八三夭 想見你想見你想見你", "八三夭 東區東區", "八三夭 顛倒世界", "八三夭 我不想改變世界我只想不被世界改變", "八三夭 致青春",
    "茄子蛋 閣愛妳一擺", "茄子蛋 浪子回頭", "茄子蛋 浪流連", "茄子蛋 愛情你比我想的閣較偉大", "茄子蛋 恰似你的溫柔",
    "田馥甄 小幸運", "田馥甄 魔鬼中的天使", "田馥甄 寂寞寂寞就好", "田馥甄 日常", "田馥甄 無人知曉",
    "陳奕迅 孤勇者", "陳奕迅 十年", "陳奕迅 愛情轉移", "陳奕迅 淘汰", "陳奕迅 浮誇"
  ],
  'K-POP': [
    "BLACKPINK How You Like That", "BLACKPINK Kill This Love", "BLACKPINK DDU-DU DDU-DU", "BLACKPINK Pink Venom", "BLACKPINK Shut Down",
    "BTS Butter", "BTS Dynamite", "BTS Boy With Luv", "BTS Fake Love", "BTS Blood Sweat & Tears",
    "TWICE FANCY", "TWICE Feel Special", "TWICE The Feels", "TWICE TT", "TWICE What Is Love",
    "NewJeans Hype Boy", "NewJeans OMG", "NewJeans Ditto", "NewJeans Super Shy", "NewJeans Attention",
    "aespa Next Level", "aespa Savage", "aespa Drama", "aespa Spicy", "aespa Illusion",
    "IVE I AM", "IVE LOVE DIVE", "IVE After LIKE", "IVE ELEVEN", "IVE Baddie",
    "LE SSERAFIM UNFORGIVEN", "LE SSERAFIM ANTIFRAGILE", "LE SSERAFIM FEARLESS", "LE SSERAFIM Perfect Night", "LE SSERAFIM Eve Psyche",
    "(G)I-DLE Nxde", "(G)I-DLE TOMBOY", "(G)I-DLE Queencard", "(G)I-DLE LATATA", "(G)I-DLE Super Lady",
    "SEVENTEEN Super", "SEVENTEEN HOT", "SEVENTEEN Don't Wanna Cry", "SEVENTEEN VERY NICE", "SEVENTEEN Clap",
    "Stray Kids God's Menu", "Stray Kids MANIAC", "Stray Kids S-Class", "ITZY WANNABE", "Jungkook Seven"
  ],
  '動漫神曲': [
    "YOASOBI アイドル", "YOASOBI 夜に駆ける", "YOASOBI 怪物", "YOASOBI 祝福", "YOASOBI 群青",
    "LiSA 紅蓮華", "LiSA 炎", "LiSA crossing field", "LiSA oath sign", "LiSA Catch the Moment",
    "Aimer 残響散歌", "Aimer Brave Shine", "Aimer I beg you", "Aimer RE:I AM", "Aimer ninelie",
    "米津玄師 KICK BACK", "米津玄師 Lemon", "米津玄師 ピースサイン", "米津玄師 Orion", "米津玄師 LOSER",
    "RADWIMPS 前前前世", "RADWIMPS スパークル", "RADWIMPS なんでもないや", "RADWIMPS グランドエスケープ", "RADWIMPS 愛にできることはまだあるかい",
    "King Gnu SPECIALZ", "King Gnu 白日", "King Gnu 逆夢", "King Gnu 一途", "King Gnu BOY",
    "Official髭男dism ミックスナッツ", "Official髭男dism Cry Baby", "Official髭男dism Pretender", "Official髭男dism 宿命", "Official髭男dism イエスタデイ",
    "キタニタツヤ 青のすみか", "Vaundy CHAINSAW BLOOD", "Creepy Nuts Bling-Bang-Bang-Born", "TK from 凛として時雨 unravel", "FLOW GO!!!",
    "SPYAIR サクラミツツキ", "SPYAIR イマジネーション", "藍井エイル IGNITE", "藍井エイル INNOCENCE", "藍井エイル シリウス",
    "KANA-BOON シルエット", "いきものがかり ブルーバード", "YUI again", "高橋洋子 残酷な天使のテーゼ", "和田光司 Butter-Fly"
  ],
  '流行英語': [
    "Taylor Swift Cruel Summer", "Taylor Swift Anti-Hero", "Taylor Swift Blank Space", "Taylor Swift Shake It Off", "Taylor Swift Love Story",
    "Ed Sheeran Shape of You", "Ed Sheeran Perfect", "Ed Sheeran Bad Habits", "Ed Sheeran Thinking Out Loud", "Ed Sheeran Photograph",
    "Bruno Mars Uptown Funk", "Bruno Mars That's What I Like", "Bruno Mars Just the Way You Are", "Bruno Mars Locked Out of Heaven", "Bruno Mars 24K Magic",
    "Adele Rolling in the Deep", "Adele Someone Like You", "Adele Hello", "Adele Easy On Me", "Adele Set Fire to the Rain",
    "Coldplay Viva La Vida", "Coldplay Yellow", "Coldplay Something Just Like This", "Coldplay A Sky Full of Stars", "Coldplay Fix You",
    "Dua Lipa Don't Start Now", "Dua Lipa Levitating", "Dua Lipa Dance The Night", "Dua Lipa New Rules", "Dua Lipa Physical",
    "Justin Bieber Peaches", "Justin Bieber Sorry", "Justin Bieber Love Yourself", "Justin Bieber Baby", "Justin Bieber Ghost",
    "The Weeknd Blinding Lights", "The Weeknd Starboy", "The Weeknd Save Your Tears", "The Weeknd The Hills", "The Weeknd Can't Feel My Face",
    "Harry Styles As It Was", "Harry Styles Watermelon Sugar", "Harry Styles Sign of the Times", "Harry Styles Adore You", "Harry Styles Late Night Talking",
    "Billie Eilish bad guy", "Billie Eilish everything i wanted", "Billie Eilish Therefore I Am", "Billie Eilish ocean eyes", "Billie Eilish happier than ever"
  ]
};

async function fetchAppleMusicPreview(keyword) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(keyword)}&country=tw&media=music&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.results && data.results.length > 0) ? data.results[0].previewUrl : null;
  } catch (error) {
    console.error("Apple API 抓取失敗:", error);
    return null;
  }
}

app.get('/', (req, res) => { res.sendFile(__dirname + '/index.html'); });

function broadcastRoomState(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  const safeRoom = { ...room };
  delete safeRoom.playTimeout;
  delete safeRoom.votingTimeout;
  delete safeRoom.globalLoadingTimeout;
  delete safeRoom.singlePlayerIdleTimer;
  
  safeRoom.players = {};
  for (const uid in room.players) {
    safeRoom.players[uid] = { ...room.players[uid] };
    delete safeRoom.players[uid].offlineTimer;
  }

  io.to(roomId).emit('room_state_update', safeRoom);
}

function resetSinglePlayerIdleTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  
  if (room.singlePlayerIdleTimer) {
    clearTimeout(room.singlePlayerIdleTimer);
    room.singlePlayerIdleTimer = null;
  }
  
  if (room.state === 'LOBBY' && Object.keys(room.players).length === 1) {
    const singleUserId = Object.keys(room.players)[0];
    room.singlePlayerIdleTimer = setTimeout(() => {
      removePlayer(roomId, singleUserId, '單人閒置超過 10 分鐘，已自動關閉房間進入休眠。');
    }, 10 * 60 * 1000);
  }
}

function removePlayer(roomId, userId, kickMsg = null) {
  const room = rooms[roomId];
  if (!room || !room.players[userId]) return;

  if (kickMsg && room.players[userId].socketId) {
    io.to(room.players[userId].socketId).emit('error_to_home', kickMsg);
  }

  delete room.players[userId];
  delete room.scores[userId];
  delete room.votes[userId];

  const remaining = Object.keys(room.players);
  if (remaining.length === 0) {
    if (room.singlePlayerIdleTimer) clearTimeout(room.singlePlayerIdleTimer);
    if (room.playTimeout) clearTimeout(room.playTimeout);
    if (room.votingTimeout) clearTimeout(room.votingTimeout);
    if (room.globalLoadingTimeout) clearTimeout(room.globalLoadingTimeout);
    delete rooms[roomId];
  } else {
    if (room.hostId === userId) {
      room.hostId = remaining[0]; 
    }
    broadcastRoomState(roomId);
    resetSinglePlayerIdleTimer(roomId);
  }
}

function handlePlayerOffline(roomId, userId) {
  const room = rooms[roomId];
  if (!room || !room.players[userId]) return;
  
  const p = room.players[userId];
  p.status = 'OFFLINE';

  if (room.state === 'LOBBY') {
    p.isReady = false;
  }
  
  broadcastRoomState(roomId);
  resetSinglePlayerIdleTimer(roomId);
}

function handlePlayerOnline(roomId, userId, socketId) {
  const room = rooms[roomId];
  if (!room || !room.players[userId]) return false; 
  
  const p = room.players[userId];
  p.status = 'ONLINE';
  p.socketId = socketId;
  
  broadcastRoomState(roomId);
  if (room.state === 'LOADING') checkDownloadProgress(roomId);
  resetSinglePlayerIdleTimer(roomId);
  return true;
}

function checkDownloadProgress(roomId) {
  const room = rooms[roomId];
  if (!room || room.state !== 'LOADING') return;
  
  const playerIds = Object.keys(room.players);
  if (playerIds.length === 0) return;

  const allLoaded = playerIds.every(uid => room.players[uid].isLoaded);
  
  if (allLoaded) {
    if (room.globalLoadingTimeout) clearTimeout(room.globalLoadingTimeout);
    
    room.state = 'PLAYING';
    room.phaseEndTime = Date.now() + (room.settings.duration * 1000); 
    broadcastRoomState(roomId);
    io.to(roomId).emit('START_PLAYING_MUSIC');
    
    room.playTimeout = setTimeout(() => {
      if(rooms[roomId]) {
        rooms[roomId].state = 'VOTING';
        rooms[roomId].phaseEndTime = Date.now() + 20000;
        broadcastRoomState(roomId);
        
        rooms[roomId].votingTimeout = setTimeout(() => {
          calculateVotes(roomId);
        }, 20000); 
      }
    }, room.settings.duration * 1000);
  }
}

io.on('connection', (socket) => {
  socket.on('create_room', ({ userId, userName }) => {
    const finalName = userName || '天飛巴庫';
    const roomId = Math.floor(1000 + Math.random() * 9000).toString(); 

    rooms[roomId] = { 
      hostId: userId, state: 'LOBBY', players: {},
      settings: { duration: 15, category: '混合隨機' }, 
      undercoverId: null, votes: {},
      civilianSong: '', undercoverSong: '',
      playedSongs: [], scores: {}, lastResult: null, // 💡 新增 lastResult 記憶最後一次結算狀態
      phaseEndTime: null, playTimeout: null, votingTimeout: null, globalLoadingTimeout: null,
      singlePlayerIdleTimer: null
    };
    rooms[roomId].players[userId] = { name: finalName, socketId: socket.id, status: 'ONLINE', isReady: false, isLoaded: false };
    rooms[roomId].scores[userId] = 0; 

    socket.join(roomId);
    socket.emit('room_joined', roomId);
    broadcastRoomState(roomId);
    resetSinglePlayerIdleTimer(roomId);
  });

  socket.on('join_room', ({ roomId, userId, userName }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error_to_home', '找不到這個房間碼！');

    if (room.players[userId]) {
      handlePlayerOnline(roomId, userId, socket.id);
    } else {
      if (room.state !== 'LOBBY') return socket.emit('error_msg', '遊戲正在進行中，無法加入！');
      room.players[userId] = { name: userName || '天飛巴庫', socketId: socket.id, status: 'ONLINE', isReady: false, isLoaded: false };
      if (room.scores[userId] === undefined) room.scores[userId] = 0; 
    }
    socket.join(roomId);
    socket.emit('room_joined', roomId);
    broadcastRoomState(roomId);
    resetSinglePlayerIdleTimer(roomId);
  });

  socket.on('wake_up', ({ roomId, userId }) => {
    const success = handlePlayerOnline(roomId, userId, socket.id);
    if (!success) socket.emit('error_to_home', '你已被房主踢出房間或房間已解散！');
  });

  socket.on('go_background', ({ roomId, userId }) => {
    handlePlayerOffline(roomId, userId);
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      for (const userId in room.players) {
        if (room.players[userId].socketId === socket.id) {
          handlePlayerOffline(roomId, userId);
          break;
        }
      }
    }
  });

  socket.on('leave_room', ({ roomId, userId }) => {
    removePlayer(roomId, userId);
  });

  socket.on('kick_player', ({ roomId, targetUserId, hostId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === hostId) {
      removePlayer(roomId, targetUserId, '你已被房主請出房間！');
    }
  });

  socket.on('update_settings', ({ roomId, userId, settings }) => {
    const room = rooms[roomId];
    if (room && room.hostId === userId) {
      room.settings = settings;
      broadcastRoomState(roomId);
      resetSinglePlayerIdleTimer(roomId);
    }
  });

  socket.on('toggle_ready', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isReady = !room.players[userId].isReady;
      broadcastRoomState(roomId);
      resetSinglePlayerIdleTimer(roomId);
    }
  });

  socket.on('cancel_ready', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isReady = false;
      broadcastRoomState(roomId);
    }
  });

  socket.on('start_game', async ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === userId) {
      room.state = 'LOADING';
      room.votes = {}; 
      if (room.singlePlayerIdleTimer) { clearTimeout(room.singlePlayerIdleTimer); room.singlePlayerIdleTimer = null; }
      io.to(roomId).emit('game_starting');

      const playerIds = Object.keys(room.players);
      room.undercoverId = playerIds[Math.floor(Math.random() * playerIds.length)];
      
      let pool = [];
      if (room.settings.category === '混合隨機') {
        Object.values(POOLS).forEach(arr => pool = pool.concat(arr));
      } else {
        pool = POOLS[room.settings.category];
      }

      let availablePool = pool.filter(song => !room.playedSongs.includes(song));
      if (availablePool.length < 2) {
        room.playedSongs = [];
        availablePool = [...pool];
      }

      const shuffled = [...availablePool].sort(() => 0.5 - Math.random());
      const isFirstCivilian = Math.random() > 0.5;
      const civilianQuery = isFirstCivilian ? shuffled[0] : shuffled[1];
      const undercoverQuery = isFirstCivilian ? shuffled[1] : shuffled[0];

      room.playedSongs.push(civilianQuery, undercoverQuery);
      room.civilianSong = civilianQuery;
      room.undercoverSong = undercoverQuery;

      const [civilianUrl, undercoverUrl] = await Promise.all([
        fetchAppleMusicPreview(civilianQuery), fetchAppleMusicPreview(undercoverQuery)
      ]);

      if (!civilianUrl || !undercoverUrl) {
        room.state = 'LOBBY';
        io.to(roomId).emit('error_msg', 'Apple API 抓歌失敗，請重新開始。');
        resetSinglePlayerIdleTimer(roomId);
        return;
      }

      playerIds.forEach(uid => {
        room.players[uid].isLoaded = false;
        const targetUrl = (uid === room.undercoverId) ? undercoverUrl : civilianUrl;
        io.to(room.players[uid].socketId).emit('PRELOAD_MUSIC', targetUrl);
      });

      room.globalLoadingTimeout = setTimeout(() => {
        const currentRoom = rooms[roomId];
        if (currentRoom && currentRoom.state === 'LOADING') {
            Object.keys(currentRoom.players).forEach(uid => {
                if (!currentRoom.players[uid].isLoaded) {
                    removePlayer(roomId, uid, '下載音樂超時，你已被移出房間！');
                }
            });
            checkDownloadProgress(roomId);
        }
      }, 10000);
    }
  });

  socket.on('music_loaded', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isLoaded = true;
      io.to(roomId).emit('PLAYER_LOADED', userId);
      checkDownloadProgress(roomId);
    }
  });

  socket.on('submit_vote', ({ roomId, userId, targetId }) => {
    const room = rooms[roomId];
    if (room) {
      if (targetId === null) delete room.votes[userId]; 
      else room.votes[userId] = targetId;
    }
  });

  function calculateVotes(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.state = 'LOBBY';
    room.phaseEndTime = null;

    let voteCounts = {};
    for (let voter in room.votes) {
      let target = room.votes[voter];
      if (room.players[target]) { 
        voteCounts[target] = (voteCounts[target] || 0) + 1;
      }
    }

    let maxVotes = 0;
    let eliminated = [];
    for (let target in voteCounts) {
      if (voteCounts[target] > maxVotes) {
        maxVotes = voteCounts[target];
        eliminated = [target];
      } else if (voteCounts[target] === maxVotes) {
        eliminated.push(target); 
      }
    }

    if (maxVotes === 0) eliminated = [];

    const undercoverDied = eliminated.includes(room.undercoverId);
    const winner = undercoverDied ? '平民勝利' : '臥底勝利';
    
    if (winner === '平民勝利') {
      Object.keys(room.players).forEach(uid => {
        if (uid !== room.undercoverId) {
          room.scores[uid] = (room.scores[uid] || 0) + 1;
        }
      });
    } else {
      if (room.players[room.undercoverId]) {
        room.scores[room.undercoverId] = (room.scores[room.undercoverId] || 0) + 3;
      }
    }

    const eliminatedData = eliminated.map(id => ({
      name: room.players[id]?.name || '未知',
      isUndercover: id === room.undercoverId
    }));
    
    const undercoverName = room.players[room.undercoverId]?.name || '未知';

    // 💡 記憶這局結算結果
    const resultData = { winner, eliminatedData, undercoverName, civilianSong: room.civilianSong, undercoverSong: room.undercoverSong };
    room.lastResult = resultData;

    io.to(roomId).emit('GAME_RESULT', resultData);

    Object.values(room.players).forEach(p => p.isReady = false);
    broadcastRoomState(roomId);
    resetSinglePlayerIdleTimer(roomId);
  }
});

http.listen(3000, () => console.log('伺服器在 port 3000 苟延殘喘中'));