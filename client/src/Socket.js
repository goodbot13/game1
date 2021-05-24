export default class Socket {
  constructor(game) {
    this.game = game;
    this.socket = new io.connect('http://localhost:2002');

    console.log(this.socket);

    this.socket.on('setId', ({ id }) => {
      game.player.id = id;
      game.player.local = true;
      console.log('setId', id);
    });

    this.socket.on('deletePlayer', ({ id }) => {
      console.log('deletePlayer', id);
    });

    this.socket.on('remoteData', ({ model, color, x, y, z, heading, pb }) => {
      console.log(model);
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

    console.log({
      model: game.player.model, 
      color: game.player.color, 
      x: game.player.object.position.x, 
      y: game.player.object.position.y, 
      z: game.player.object.position.z, 
      heading: game.player.object.rotation.y,
      pb: game.player.object.rotation.x
    })
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
}