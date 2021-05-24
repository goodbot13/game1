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
  Raycaster, 
  Scene,
  TextureLoader,
  Vector2,
  WebGLRenderer 
} from 'three';

import Clock from './Clock';
import Player from './Player';
import Animations from './Animations';

// hack for FBX Loader
import * as THREE from 'three';
import RemotePlayers from './RemotePlayers';
import GameSocket from './GameSocket';
import SpeechBubble from './SpeechBubble';

window.THREE = THREE;


class Renderer {
  constructor() {
    this.player = null;
    this.joystick = null;
    this.environment = null;
    this.socket = null;
    this.chatSocketId = null;
    this.colliders = [];
    window.remote = this.remotePlayers = new RemotePlayers();

    this.scene = new Scene();
    this.scene.fog = new Fog(0xFFB6C1, 4000, 14000);

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

    window.addEventListener('mousedown', (e) => this.onMouseDown(e), false);
  }

  loadEnvironment() {
    const assets = './assets/';

    this.FBXLoader.load(`${assets}fbx/town.fbx`, (object) => {
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
        this.player = new Player(null, this);
        this.player.init(() => {
          this.scene.add(this.player.object);
          this.socket = new GameSocket(this); 

          this.speechBubble = new SpeechBubble(this, null);
          this.speechBubble.init();

          $('.loader').fadeOut(500);
        });
      });
    });
  }

  initControls() {
    this.joystick = new JoyStick({
      onMove: this.onMove,
      game: this
    });
  }

  onMouseDown(e) {
    if (!this.remotePlayers.data.size || !this.speechBubble) {
      return;
    }

    const mouse = new Vector2();

    mouse.x = (e.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = (e.clientY / this.renderer.domElement.clientHeight) * 2 - 1;

    const raycaster = new Raycaster();

    raycaster.setFromCamera(mouse, this.camera);

    const colliders = [...this.remotePlayers.data.values()].map((player) => player.collider);
    const intersect = raycaster.intersectObjects(colliders);

    if (intersect.length) {
      const intersectsWith = intersect[0].object;
      const intersectsPlayer = [...this.remotePlayers.data.values()].filter((player) => player.collider === intersectsWith)[0];

      if (intersectsPlayer) {
        this.speechBubble.player = intersectsPlayer;
        this.scene.add(this.speechBubble.mesh);
        this.chatSocketId = intersectsPlayer.id;
        this.player.setActiveCamera(this.player.cameras.chat);
        $('.messageWrapper').show();
      }
    }
  }

  onChatMessage(message, id) {
    const player = this.remotePlayers.get(id);
    this.speechBubble.player = player;
    this.speechBubble.update(message);
    this.scene.add(this.speechBubble.mesh);
  }

  initPlayer(playerData) {
    const player = new Player(playerData, this);

    player.init(() => {
      this.remotePlayers.removeInitialising(playerData.id);
      this.remotePlayers.put(playerData.id, player);
      this.scene.add(player.object);
    });
  }

  initLights() {
    let light = new HemisphereLight(0xffffff, 0x222222);
    light.position.set(0, 200, 0);
    
    this.scene.add(light);
    
    light = new DirectionalLight(0xffb6c1);
    light.position.set( 30, 100, 40 );
    light.target.position.set( 0, 0, 0 );
    light.castShadow = true;

		const lightSize = 500;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 500;
		light.shadow.camera.left = light.shadow.camera.bottom = -lightSize;
		light.shadow.camera.right = light.shadow.camera.top = lightSize;

    light.shadow.bias = 0.01;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    this.scene.add(light);

    this.sun = light;
  }

  onMove(forward, turn) {
    turn = -turn;

    const { actionName } = this.player;

    $('.messageWrapper').hide();

    if (forward > 0.3) {
      if (actionName !== 'Walking' || actionName !== 'Running') {
        this.player.setAction('Walking');
        this.player.setActiveCamera(this.player.cameras.back);
      }
    } else if (forward < -0.3) {
      if (actionName !== 'Walking Backwards') {
        this.player.setAction('Walking Backwards');
        this.player.setActiveCamera(this.player.cameras.front);
      }
    } else {
      forward = 0;

      if (Math.abs(turn) > 0.1) {
        if (actionName !== 'Turn') {
          this.player.setAction('Turn');
        }
      } else if (actionName !== 'Idle') {
        this.player.setAction('Idle');
        this.player.setActiveCamera(this.player.cameras.back);
      }
    }

    // stays still
    if (forward === 0 && turn === 0) {
      this.player.move = null;
    } else {
      this.player.move = { forward, turn };
    }

    this.socket.updatePlayer();
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

  loop() {
    window.requestAnimationFrame(() => this.loop());

    const delta = Clock.getDelta();

    this.renderPlayer(delta);   
    
    [...this.remotePlayers.data.values()].forEach((player) => player.mixer.update(delta));

    if (this.speechBubble) {
      this.speechBubble.show(this.player.object.position);
    }

		this.sun.position.copy(this.camera.position);
		this.sun.position.y += 10;

    this.renderer.render(this.scene, this.camera);
  }
}

setTimeout(() => {
  const renderer = new Renderer();
  renderer.loop();
  window.renderer = renderer;
  window.Animations = Animations;
}, 100);
