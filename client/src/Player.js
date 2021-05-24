import { AnimationMixer, Object3D, Raycaster, TextureLoader, Vector3 } from "three";
import Animations from "./Animations";

export default class Player {
  constructor(options, game) {
    this.game = game;
    this.options = options;
    this.prevAction = null;
    this.move = null;
    this.cameras = null;
    this.mixer = null;
    this.id = null;
    this.init();
  }

  init(onInit) {
    if (this.options) {
      this.color = this.options.color;
      this.model = this.options.model;
      this.id = this.options.id;
    } else {
      this.color = ['Black', 'Brown', 'White'][Math.floor(Math.random() * 3)];
      this.model = [
        'BeachBabe', 
        'BusinessMan', 
        'Doctor', 
        'FireFighter', 
        'Housewife', 
        'Policeman', 
        'Prostitute', 
        'Punk', 
        'RiotCop', 
        'Roadworker', 
        'Robber', 
        'Sheriff', 
        'Streetman', 
        'Waitress'
      ][Math.floor(Math.random() * 14)];
    }
    
    const assets = './assets/';
    const FBXLoader = new THREE.FBXLoader();

    FBXLoader.load(`${assets}fbx/people/${this.model}.fbx`, (object) => {
      this.mixer = object.mixer = new AnimationMixer(object);
      object.name = this.model;
      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = false; 
        }
      });
      
      const textureLoader = new TextureLoader();
      textureLoader.load(`${assets}images/SimplePeople_${this.model}_${this.color}.png`, (texture) => { 
        object.traverse((child) => {
          if (child.isMesh) {
            child.material.map = texture;
          }
        });
      });

      this.mixer.clipAction(object.animations[0]).play();
      this.object = new Object3D();
      this.object.add(object);
      this.object.translateX(-100);
      this.object.translateZ(-500);
      this.object.rotateY(4.5);
      
      if (!this.options) {
        Animations.put('Idle', object.animations[0]);
        this.createCameras();
      }

      this.setAction('Idle');

      onInit();
    });
  }

  createCameras() {
    const create = (x, y, z) => {
      const obj = new Object3D();
      obj.position.set(x, y, z);
      obj.parent = this.object;

      return obj;
    }

    const front = create(112, 100, 600);
    const back = create(0, 300, -600);
    const wide = create(178, 139, 1665);
    const overhead = create(0, 400, 0);
    const collect = create(40, 82, 94);

    this.cameras = { front, back, wide, overhead, collect };
    this.setActiveCamera(back);
  }

  setActiveCamera(camera) {
    this.cameras.active = camera;
  }

  setAction(actionName) {
    if (this.actionName === 'Running' && actionName === 'Walking') {
      return;
    }

    if (this.actionName !== actionName) {
      const action = this.mixer.clipAction(Animations.get(actionName));
      action.time = 0;
      this.mixer.stopAllAction();
      this.action = actionName;
      this.actionTime = Date.now();
      this.actionName = actionName;
  
      action.fadeIn(0.4);	
      action.play();
    }
  }

  animateMove(delta, colliders) {
    if (!this.move) { 
      return;
    }

    const pos = this.object.position.clone();
    pos.y += 60;

    let dir = new Vector3();
    this.object.getWorldDirection(dir);

    if (this.move.forward < 0) {
      dir.negate();
    }

    let raycaster = new Raycaster(pos, dir);

    let blocked = false;

    if (colliders) {
      const intersect = raycaster.intersectObjects(colliders);

      if (intersect.length) {
        if (intersect[0].distance < 75) {
          blocked = true;
        }
      }
    }

    if (!blocked) {
      if (this.move.forward > 0) {
        const speed = this.actionName === 'Running' ? 450 : 175;
        this.object.translateZ(delta * speed);
      } else {
        this.object.translateZ(delta * -30);
      }
    }

    if (colliders) {
      // cast left
      dir.set(-1, 0, 0);
      dir.applyMatrix4(this.object.matrix);
      dir.normalize();

      raycaster = new Raycaster(pos, dir);

      let intersect = raycaster.intersectObjects(colliders);

      if (intersect.length) {
        if (intersect[0].distance < 50) {
          this.object.translateX(100 - intersect[0].distance);
        }
      }

      // cast right
      dir.set(1, 0, 0);
      dir.applyMatrix4(this.object.matrix);
      dir.normalize();

      raycaster = new Raycaster(pos, dir);

      intersect = raycaster.intersectObjects(colliders);

      if (intersect.length) {
        if (intersect[0].distance < 50) {
          this.object.translateX(intersect[0].distance - 100);
        }
      }
    }

    this.object.rotateY(delta * this.move.turn); 
    this.game.socket.updatePlayer();
  }
}