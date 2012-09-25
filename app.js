var app = new Mediator();



// Canvas Object
function Canvas(id, W, H){
	this.set('width', W);
	this.set('height', H);
	
	this.width = W;
	this.height = H;
	this.sqrt = Math.sqrt(this.width * this.height);
	this.canvas = document.getElementById(id);
	this.canvas.width = W;
	this.canvas.height = H;
	this.ctx = this.canvas.getContext('2d');
	this.ctx.fillStyle = "#000000"
	//this.createBG("#000000");
	
	this.wMult = W / 1024;
	this.grid= [];
	
	this.createBG();
	this.registerListeners();
}
app.register(Canvas);
Canvas.prototype.registerListeners = function(){
	this.on('AudioData', this.drawAudio, this);
	this.on('RenderBall', this.renderBall, this);
	this.on('ClearCanvas', this.clear, this);
}
Canvas.prototype.createBG = function(bgColor){
	this.ctx.fillStyle = bgColor;
	this.ctx.fillRect(0,0,this.width,this.height);
	this.bg = this.ctx.getImageData(0,0,this.width, this.height);
}
Canvas.prototype.clear = function(){
	this.ctx.clearRect(0,0,this.width, this.height);

}
Canvas.prototype.renderBall = function(ball){

	this.ctx.fillStyle = ball.color;
	this.ctx.beginPath();
	this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2, false); 
	this.ctx.closePath();
	this.ctx.fill();
}
Canvas.prototype.drawAudio = function(byteData){
		
	var color, size, pos;
	this.grid = [];
	for(var cur = 0, len = byteData.length; cur < len; cur ++){
		size = this.getSize(cur, byteData[cur]);
		pos = this.getPos(cur, byteData[cur]);
		this.ctx.fillStyle = this.getColor(cur, byteData[cur]);
		this.ctx.fillRect(pos.x, pos.y, size.w, size.h);
		this.grid.push({ x: pos.x, y: pos.y, w: size.w, h: size.h });
	}
	this.set('grid', this.grid);
}
Canvas.prototype.getColor = function(index, value){
	var r,
		g,
		b;
	
	r = value * 2;
	g = value * 1.2;
	b = value;
	return "rgb("+r+","+g+","+b+")";
}
Canvas.prototype.getPos = function(index, value){
	var x, y;
	
	
	
	return {
		x: index * this.wMult,
		y:  value
	}
}
Canvas.prototype.getSize = function(index, value){
	var w,h;
	
	w = (255 / value) * 10;
	h = value;
	
	
	return {
		w:  w,
		h:  h
	}
}

// CSS3d Transformer
function Transformer(elId){
	this.on('AudioData', this.changePerspective, this);
	this.el = document.getElementById(elId);

}
app.register(Transformer);
Transformer.prototype.changePerspective = function(value){
	var val = "rotateY("+90 * (this.get('mouseX') / window.innerWidth) + "deg)";
//	console.log(val);
	val = "rotateY("+this.get('AverageFreq')+"deg)"
	//console.log(val);
	this.el.style.webkitTransform = val; //"rotate(90deg)"

}


//Math Converter 
function MathF(){
	this.on('AudioData', this.setValues, this);
	this.avgs = [0];
	this.maxAvg = 100;
}
app.register(MathF);
MathF.prototype.setValues = function(Arr){
	var avg = this.setAverage( this.findAvg(Arr));
	this.set('AverageFreq',avg);
//	this.set('TopFreq', this.findTopVal(Arr));
}
MathF.prototype.findAvg = function(arr){
	var total = 0;
	for(var cur = 0, len = arr.length; cur < len; cur ++){
		total += arr[cur];
	}
	return Math.round(total / len);
}
MathF.prototype.setAverage = function(val){
	if(this.avgs.length > this.maxAvg){
		this.avgs.shift();
	}
	this.avgs.push(val);
	return this.findAvg(this.avgs);
}
MathF.prototype.findTopVal = function(arr){
	var topVal = 0, i = 0;
	for(var cur = 0, len = arr.length; cur < len; cur ++){
		if(arr[cur] > topval){ 
			topVal = arr[cur]; 
			i = cur;
		}
		
	}
	return {
		value: topVal,
		index: i
	}
}

// Audio Module
function Audio(id){
	this.audio = document.getElementById(id);
	this.audioContext = new webkitAudioContext();
	this.registerListeners();
}
app.register(Audio);
Audio.prototype.registerListeners = function(){
	var self = this;	
	window.addEventListener('load', function(){
		self.init();
		self.emit("AudioLoaded");
	}, false);
	this.on('UpdateAudioData', this.update, this);
}
Audio.prototype.init = function(){	
	this.analyser = this.audioContext.createAnalyser();
	this.source = this.audioContext.createMediaElementSource(this.audio);
	this.source.connect(this.analyser);
	this.analyser.connect(this.audioContext.destination);
	this.audio.play();
	
}
Audio.prototype.update = function(){
	
	var freqByteData = new Uint8Array(this.analyser.frequencyBinCount);
	this.analyser.getByteFrequencyData(freqByteData);
	this.emit("AudioData", freqByteData);
	
}





function Renderer(){
	this.on('AudioLoaded', function(){
		this.emit("PlayAudio");
		this.render();
	}, this);
	this.calls = 0;
	
	this.on('stop', function(){
		this.stop = true;
	}, this);
}
app.register(Renderer);
Renderer.prototype.render = function(){
	this.emit("ClearCanvas");
	this.emit("UpdateAudioData");
	this.emit("AnimateBall");
	
	var self = this;
	requestAnimFrame(function(){ self.render(); });
}


function Mouse(){
	var body = document.getElementsByTagName('body');
	var self = this;
	body[0].onmousemove = function(ev){
		self.updateMouse(ev);
	}	
}
app.register(Mouse);
Mouse.prototype.updateMouse = function(ev){
	this.set('mouseX',ev.clientX);
	this.set('mouseY',ev.clientY);
}


function Ball(){
	var self = this;
	this.x = 10;
	this.y = 10;
	this.radius = 10;
	this.color = "#FFFFFF"
	
	this.vx = 0;
	this.vy = 0;
	this.gravity = 0.2;
	this.speed = 1;
	this.on("AnimateBall", this.move, this);
	this.on('moveLeft', this.moveLeft,this);
	this.on('moveRight', this.moveRight, this);
	this.on('jump', this.jump, this);
}
app.register(Ball);

Ball.prototype.moveLeft = function(){
	this.vx -= this.speed;
}

Ball.prototype.moveRight = function(){
	this.vx += this.speed;
}

Ball.prototype.jump = function(){
	this.vy -= this.speed;
}
Ball.prototype.move = function(){
	this.detectCollision();
	this.vy += this.gravity;
	this.y += this.vy;
	this.x += this.vx;
	
	if(this.y > this.get('height')){dd
		this.y = -10;
	}
	if(this.x < 0 ){
		this.x = this.get('width');
	}
	if(this.x > this.get('width')){
		this.x = -5;
	}
	
	
	
	this.render();
}
Ball.prototype.detectCollision = function(){
	var grid = this.get("grid"), oneGrid = null;
	
	for(var cur = 0, len = grid.length; cur < len; cur ++){
		oneGrid = grid[cur];
		if(this.x >= oneGrid.x && this.x <= oneGrid.x + oneGrid.w ){
			if(this.y >= oneGrid.y && this.y <= oneGrid.y + oneGrid.h){
			
				if(this.y - this.radius > oneGrid.y){
					this.y = oneGrid.y- (this.radius*2);
				} else {
					this.vy = -(this.vy*.8);
					this.vx = this.vx * 0.8;
				}
			}
		}
	}
}
Ball.prototype.render = function(){
	this.emit('RenderBall', this);

}

function Keyboard(){
	this.listenForKeys();
}
app.register(Keyboard);
Keyboard.prototype.listenForKeys = function(){
	var self = this;
	window.onkeypress = function(e){
		self.keypress(e);
	}

}
Keyboard.prototype.keypress = function(e){
	switch(e.which){
		case 100:
			this.emit('moveRight');
			break;
		case 97:
			this.emit('moveLeft');
			break;
		case 32:
			this.emit('jump');
			break;
	
	}
}

var canvas = new Canvas('stage',window.innerWidth,window.innerHeight);


var audio = new Audio('music');
var renderer = new Renderer();
var mouse = new Mouse();
var transformer = new Transformer('stage');
var math = new MathF();
//var ball = new Ball();
//var keys = new Keyboard();


