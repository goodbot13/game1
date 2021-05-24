export default class RemotePlayers {
  constructor() {
    this.data = new Map();
  }

  put(id, player) {
    this.data.set(id, player);
  }

  get(id) {
    return this.data.get(id);
  }
}