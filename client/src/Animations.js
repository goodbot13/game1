export const POINTING_GESTURE = 'Pointing Gesture';
export const RUNNING = 'Running';
export const ACTION_TURN = 'Turn';
export const ACTION_WALKING_BACKWARDS = 'Walking Backwards';
export const ACTION_WALKING = 'Walking';

export default new class Animations {
  constructor() {
    this.array = ['Pointing Gesture', 'Running', 'Turn', 'Walking Backwards', 'Walking'];
    this.all = {}
  }

  put(action, animationObject) {
    this.all[action] = animationObject;
  }

  get(action) {
    action = this.all[action];

    if (!action) {
      throw Error("There is no actions with name", action);
    }

    return action;
  }

  loadNext(loader, assets, onDone) {
    const current = this.array.pop();
    
    loader.load(`${assets}fbx/anims/${current}.fbx`, (object) => {
      this.put(current, object.animations[0]);

      /* console.log('Loaded animation', current); */

      // recursively load until array length > 0
      if (this.array.length) {
        this.loadNext(loader, assets, onDone);
      } else {
        onDone();
      }
    });
  }
}