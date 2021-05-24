import { 
  AnimationMixer,
  BoxGeometry,
  Color, 
  CubeTextureLoader, 
  DirectionalLight, 
  Fog, 
  GridHelper, 
  HemisphereLight, 
  Mesh, 
  MeshBasicMaterial, 
  MeshPhongMaterial, 
  Object3D, 
  PerspectiveCamera, 
  PlaneBufferGeometry, 
  Scene,
  TextureLoader,
  Vector3,
  WebGLRenderer 
} from 'three';

import Clock from './Clock';
import Player from './Player';
import Animations from './Animations';

// hack for FBX Loader
import * as THREE from 'three';
import RemotePlayers from './RemotePlayers';
import Socket from './Socket';
window.THREE = THREE;


class Renderer {
  constructor() {
    this.player = null;
    this.joystick = null;
    this.environment = null;
    this.colliders = [];
    this.players = new RemotePlayers();

    this.scene = new Scene();
    this.scene.fog = new Fog(0x646464, 5000, 12000);

    this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 14000);
    this.camera.position.set(30, 150, 500);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap = true;

    // hacked loader
    this.FBXLoader = new THREE.FBXLoader();
    this.textureLoader = new TextureLoader();

    document.querySelector('body').appendChild(this.renderer.domElement);
    
    this.initLights();
    this.loadEnvironment();
    this.initControls();
  }

  loadEnvironment() {
    const assets = './assets/';

    /* this.FBXLoader.load(`${assets}fbx/town.fbx`, (object) => {
			this.environment = object;
			this.scene.add(object);
            
			object.traverse((child) => {
				if (child.isMesh) {
					if (child.name.startsWith("proxy")){
						this.colliders.push(child);
						child.material.visible = false;
					} else {
						child.castShadow = true;
						child.receiveShadow = true;
					}
				}
			});
			
			const tLoader = new CubeTextureLoader();
			tLoader.setPath(`${assets}/images/`);

			const textureCube = tLoader.load([
				'px.jpg', 'nx.jpg',
				'py.jpg', 'ny.jpg',
				'pz.jpg', 'nz.jpg'
			]);

			this.scene.background = textureCube;

      Animations.loadNext(this.FBXLoader, assets, () => {
        this.player = new Player();
        this.player.init(() => {
          this.scene.add(this.player.object);
        });
      });
    }); */

    Animations.loadNext(this.FBXLoader, assets, () => {
      this.player = new Player(null, this);
      this.player.init(() => {
        this.scene.add(this.player.object);
        this.socket = new Socket(this);
      });
    });
  }

  initControls() {
    this.joystick = new JoyStick({
      onMove: this.onMove,
      game: this
    });
  }

  initLights() {
    let light = new HemisphereLight(0xffffff, 0x222222);
    light.position.set(0, 200, 0);
    
    this.scene.add(light);
    
    light = new DirectionalLight(0xffb6c1);
    light.position.set(0, 100, 100);
    light.castShadow = true;
    light.shadow.camera.top = 180;
    light.shadow.camera.bottom = -100;
    light.shadow.camera.left = -120;
    light.shadow.camera.right = 120;

    this.scene.add(light);
  }

  onMove(forward, turn) {
    turn = -turn;

    const { actionName } = this.player;

    if (forward > 0.3) {
      if (actionName !== 'Walking' || actionName !== 'Running') {
        this.player.setAction('Walking');
      }
    } else if (forward < -0.3) {
      if (actionName !== 'Walking Backwards') {
        this.player.setAction('Walking Backwards')
      }
    } else {
      forward = 0;

      if (Math.abs(turn) > 0.1) {
        if (actionName !== 'Turn') {
          this.player.setAction('Turn');
        }
      } else if (actionName !== 'Idle') {
        this.player.setAction('Idle');
      }
    }

    // stays still
    if (forward === 0 && turn === 0) {
      this.player.move = null;
    } else {
      this.player.move = { forward, turn };
    }
  }

  renderPlayer(delta) {
    if (!this.player) {
      return;
    }

    if (!this.player.mixer) {
      return;
    }

    this.player.mixer.update(delta);

    if (this.player.action === 'Walking') {
      const ellapsedTime = Date.now() - this.player.actionTime;

      if (ellapsedTime > 1000 && this.player.move.forward > 0) {
        this.player.setAction('Running');
      }
    }

    this.player.animateMove(delta, this.colliders);

    if (this.player.cameras && this.player.cameras.active) {
      this.camera.position.lerp(
        this.player.cameras.active.getWorldPosition(new THREE.Vector3()),
        0.065
      );

      const pos = this.player.object.position.clone();
      pos.y += 200;
      this.camera.lookAt(pos);
    }
  }

  renderOtherPlayers() {

  }

  loop() {
    window.requestAnimationFrame(() => this.loop());

    const delta = Clock.getDelta();

    this.renderPlayer(delta);    

    this.renderer.render(this.scene, this.camera);

    /* console.log(this.player.object.position) */
  }
}

setTimeout(() => {
  const renderer = new Renderer();
  renderer.loop();
  window.renderer = renderer;
  window.Animations = Animations;
}, 100)
