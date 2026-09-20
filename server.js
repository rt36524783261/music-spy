const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const rooms = {}; 
const disconnectTimers = {}; 

const POOLS = {
  '華語流行': [
    "周杰倫 擱淺", "告五人 好不容易", "林俊傑 那些你很冒險的夢", 
    "鄧紫棋 倒數", "韋禮安 如果可以", "周興哲 以後別做朋友", 
    "八三夭 想見你想見你想見你", "盧廣仲 刻在我心底的名字", 
    "田馥甄 小幸運", "陳奕迅 孤勇者"
  ],
  'K-POP': [
    "BLACKPINK How You Like That", "BTS Butter", "TWICE FANCY", 
    "NewJeans Hype Boy", "aespa Next Level", "IVE I AM", 
    "LE SSERAFIM UNFORGIVEN", "GIDLE Nxde", "JISOO FLOWER", "Jungkook Seven"
  ],
  '動漫神曲': [
    "YOASOBI Idol", "LiSA Gurenge", "Aimer Zankyou Sanka", 
    "Kenshi Yonezu KICK BACK", "RADWIMPS Zenzenzense", "King Gnu SPECIALZ", 
    "Official HIGE DANdism Mixed Nuts", "Tatsuya Kitani Ao no Sumika", 
    "Vaundy Chainsaw Blood", "Creepy Nuts Bling-Bang-Bang-Born"
  ],
  '流行英語': [
    "Taylor Swift Cruel Summer", "Ed Sheeran Shape of You", "Bruno Mars Uptown Funk", 
    "Adele Rolling in the Deep", "Coldplay Viva La Vida", "Dua Lipa Don't Start Now", 
    "Justin Bieber Peaches", "The Weeknd Blinding Lights", "Harry Styles As It Was", "Billie Eilish bad guy"
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

io.on('connection', (socket) => {
  console.log(`連線建立: ${socket.id}`);

  socket.on('create_room', ({ userId, userName }) => {
    const finalName = userName || '天飛巴庫';
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase(); 

    rooms[roomId] = { 
      hostId: userId, state: 'LOBBY', players: {},
      settings: { duration: 15, category: '混合隨機' }, 
      undercoverId: null, votes: {},
      civilianSong: '', undercoverSong: '' 
    };
    rooms[roomId].players[userId] = { name: finalName, socketId: socket.id, status: 'ONLINE', isReady: false, isLoaded: false };

    socket.join(roomId);
    socket.emit('room_joined', roomId);
    io.to(roomId).emit('room_state_update', rooms[roomId]);
  });

  socket.on('join_room', ({ roomId, userId, userName }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error_msg', '找不到這個房間碼！');

    if (room.players[userId]) {
      clearTimeout(disconnectTimers[userId]); 
      room.players[userId].socketId = socket.id; 
      room.players[userId].status = 'ONLINE';
    } else {
      room.players[userId] = { name: userName || '天飛巴庫', socketId: socket.id, status: 'ONLINE', isReady: false, isLoaded: false };
    }
    socket.join(roomId);
    socket.emit('room_joined', roomId);
    io.to(roomId).emit('room_state_update', room);
  });

  socket.on('leave_room', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      if (room.hostId === userId) {
        io.to(roomId).emit('room_destroyed');
        delete rooms[roomId];
      } else {
        delete room.players[userId];
        socket.leave(roomId);
        io.to(roomId).emit('room_state_update', room);
      }
    }
  });

  socket.on('update_settings', ({ roomId, userId, settings }) => {
    const room = rooms[roomId];
    if (room && room.hostId === userId) {
      room.settings = settings;
      io.to(roomId).emit('room_state_update', room);
    }
  });

  socket.on('toggle_ready', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isReady = !room.players[userId].isReady;
      io.to(roomId).emit('room_state_update', room);
    }
  });

  socket.on('start_game', async ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.hostId === userId) {
      room.state = 'PRELOADING';
      room.votes = {}; 
      io.to(roomId).emit('game_starting');

      const playerIds = Object.keys(room.players);
      room.undercoverId = playerIds[Math.floor(Math.random() * playerIds.length)];
      
      let pool = [];
      if (room.settings.category === '混合隨機') {
        Object.values(POOLS).forEach(arr => pool = pool.concat(arr));
      } else {
        pool = POOLS[room.settings.category];
      }

      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      const isFirstCivilian = Math.random() > 0.5;
      const civilianQuery = isFirstCivilian ? shuffled[0] : shuffled[1];
      const undercoverQuery = isFirstCivilian ? shuffled[1] : shuffled[0];

      room.civilianSong = civilianQuery;
      room.undercoverSong = undercoverQuery;

      const [civilianUrl, undercoverUrl] = await Promise.all([
        fetchAppleMusicPreview(civilianQuery), fetchAppleMusicPreview(undercoverQuery)
      ]);

      if (!civilianUrl || !undercoverUrl) {
        io.to(roomId).emit('error_msg', 'Apple API 抓歌失敗，請重新開始。');
        return;
      }

      room.loadedCount = 0;
      playerIds.forEach(uid => {
        room.players[uid].isLoaded = false;
        const targetUrl = (uid === room.undercoverId) ? undercoverUrl : civilianUrl;
        io.to(room.players[uid].socketId).emit('PRELOAD_MUSIC', targetUrl);
      });
    }
  });

  socket.on('music_loaded', ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (room && room.players[userId]) {
      room.players[userId].isLoaded = true;
      room.loadedCount = Object.values(room.players).filter(p => p.isLoaded === true).length;
      
      if (room.loadedCount === Object.keys(room.players).length) {
        io.to(roomId).emit('START_PLAYING', room.settings.duration);
        
        setTimeout(() => {
          io.to(roomId).emit('START_VOTING');
          
          setTimeout(() => {
            calculateVotes(roomId);
          }, 20000 + 1000); 

        }, room.settings.duration * 1000 + 1000);
      }
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

    let voteCounts = {};
    for (let voter in room.votes) {
      let target = room.votes[voter];
      voteCounts[target] = (voteCounts[target] || 0) + 1;
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

    const undercoverDied = eliminated.includes(room.undercoverId);
    const winner = undercoverDied ? '平民勝利' : '臥底勝利';
    
    // 👇 修改這裡：改成打包包含身分屬性的物件陣列
    const eliminatedData = eliminated.map(id => ({
      name: room.players[id]?.name || '未知',
      isUndercover: id === room.undercoverId
    }));
    
    const undercoverName = room.players[room.undercoverId]?.name || '未知';

    io.to(roomId).emit('GAME_RESULT', { 
      winner, 
      eliminatedData, // 替換原本的 eliminatedNames
      undercoverName,
      civilianSong: room.civilianSong,
      undercoverSong: room.undercoverSong
    });

    Object.values(room.players).forEach(p => p.isReady = false);
    io.to(roomId).emit('room_state_update', room);
  }

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      for (const userId in room.players) {
        if (room.players[userId].socketId === socket.id) {
          room.players[userId].status = 'OFFLINE';
          io.to(roomId).emit('room_state_update', room); 
          disconnectTimers[userId] = setTimeout(() => {
            delete room.players[userId];
            io.to(roomId).emit('room_state_update', room); 
            if (Object.keys(room.players).length === 0) delete rooms[roomId];
          }, 30000); 
          break;
        }
      }
    }
  });
});

http.listen(3000, () => console.log('伺服器在 port 3000 苟延殘喘中'));