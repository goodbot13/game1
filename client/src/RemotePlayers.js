export default class RemotePlayers {
  constructor() {
    this.data = new Map();
    this.initializing = new Map();
  }

  setInitialising(id) {
    this.initializing.set(id);
  }

  isInitialising(id) {
    return this.initializing.has(id);
  }

  removeInitialising(id) {
    this.initializing.delete(id);
  }

  put(id, player) {
    this.data.set(id, player);
  }

  has(id) {
    return this.data.has(id);
  }

  get(id) {
    return this.data.get(id);
  }

  remove(id) {
    this.data.delete(id);
  }
}