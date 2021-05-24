import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, TextureLoader } from "three";

export default class SpeechBubble {
    constructor(game, player) {
      this.game = game;
      this.player = player;

      this.cfg = {
          font: 'Calibri',
          size: 26,
          padding: 10,
          color: '#222222',
          width: 256,
          height: 256
      }

      const geometry = new PlaneGeometry(150, 150);
      const material = new MeshBasicMaterial();

      this.mesh = new Mesh(geometry, material);
      game.scene.add(this.mesh);
    }

    init(message, onInit) {
      const loader = new TextureLoader();
      loader.load('assets/images/speech.png', (texture) => {
        this.img = texture.image;
        this.mesh.material.map = texture;
        this.mesh.material.transparent = true;
        this.mesh.material.needsUpdate = true;

        if (message) {
          this.update(message);
        }
        
        onInit && onInit();
      }, undefined, (error) => console.log(error));
    }

    update(message) {
      if (!this.mesh) {
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = this.cfg.width;
      canvas.height = this.cfg.height;

      this.context = canvas.getContext('2d');
      this.context.font = `${this.cfg.size}pt ${this.cfg.font}`;
      this.context.fillStyle = this.cfg.color;
      this.context.textAlign = 'center';
        
      this.mesh.material.map = new CanvasTexture(canvas);

      const background = this.img;

      this.context.clearRect(0, 0, this.cfg.width, this.cfg.height);
      this.context.drawImage(background, 0, 0, background.width, background.height, 0, 0, this.cfg.width, this.cfg.height);
      
      this.updateText(message, this.context);
      this.mesh.material.needsUpdate = true;
    }

    updateText(message, ctx) {
      this.mesh.visible = true;

      const words = message.split(' ');
      let line = '';
      const lines = [];
      const maxWidth = this.cfg.width - 2 * this.cfg.padding;
      const lineHeight = this.cfg.size + 8;
      
      words.forEach((word) => {
        const testLine = `${line}${word} `;
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth) {
          lines.push(line);
          line = `${word} `;
        } else {
          line = testLine;
        }
      });
      
      if (line != '') {
        lines.push(line);
      }
      
      let y = (this.cfg.height - lines.length * lineHeight) / 2;
      
      lines.forEach( function(line){
        ctx.fillText(line, 128, y);
        y += lineHeight;
      });
  }

  show(position) {
		if (!this.mesh || !this.player) {
			return;
		} 

		const { x, y, z } = this.player.object.position;
		this.mesh.position.set(x, y + 380, z);
		this.mesh.lookAt(position);
	}
} 