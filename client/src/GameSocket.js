export default class GameSocket {
  constructor(game) { 
    this.game = game;

    const dev = 'http://localhost:3075';
    const prod = 'http://185.233.119.26:3075';

    this.socket = new io.connect(prod);
    this.socket.on('setId', ({ id }) => {
      game.player.id = id;
      game.player.local = true;
    });

    this.socket.on('deletePlayer', ({ id }) => {
      console.log('deletePlayer', id, game.remotePlayers.get(id));
      
      if (game.remotePlayers.has(id)) {
        const playerObject = game.remotePlayers.get(id).object;

        if (game.speechBubble.player?.object === playerObject) {
          game.speechBubble.mesh.visible = false;
          $('.messageWrapper').hide();
          game.player.setActiveCamera(game.player.cameras.back);
        }

        game.scene.remove(playerObject);
        game.remotePlayers.remove(id);
      } 
    });

    this.socket.on('remoteData', (pack) => {
      pack.forEach((playerData) => {
        if (playerData.id === game.player.id) {
          return;
        }

        if (!game.remotePlayers.has(playerData.id)) {
          if (!game.remotePlayers.isInitialising(playerData.id)) {
            game.remotePlayers.setInitialising(playerData.id);
            game.initPlayer(playerData);
          }
        } else {
          const player = game.remotePlayers.get(playerData.id);
          player.update(playerData);
        }
      });
    });

    this.socket.on('chat message', ({ message, id }) => {
      game.onChatMessage(message, id);
    });

    $('form').submit((e) => {
      this.sendChatMessage($('input').val());
      $('input').val('');
      $('.messageWrapper').hide();
      game.player.setActiveCamera(game.player.cameras.back);
      return false;
    });

    this.socket.emit('init', {
      model: game.player.model, 
      color: game.player.color, 
      x: game.player.object.position.x, 
      y: game.player.object.position.y, 
      z: game.player.object.position.z, 
      heading: game.player.object.rotation.y,
      pb: game.player.object.rotation.x
    });

    // ping
    window.pingId = setInterval(() => this.socket.emit('ping'), 2000);

    // pong
    this.socket.on('pong', () => {
      this.lastPong = Date.now();
    });
  }

  updatePlayer() {
    this.socket.emit('update', {
      x: this.game.player.object.position.x, 
      y: this.game.player.object.position.y, 
      z: this.game.player.object.position.z, 
      heading: this.game.player.object.rotation.y,
      pb: this.game.player.object.rotation.x,
      action: this.game.player.actionName
    });
  }

  sendChatMessage(message) {
    this.socket.emit('chat message', { id: this.game.chatSocketId, message });
  }
}