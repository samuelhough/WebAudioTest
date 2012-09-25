function PubSub(log){
	if(!this instanceof PubSub){
		return new PubSub();
	}
	this.logMe = log || false;
	this.__events = {};
}

PubSub.prototype.__defaultScope = (function(window){
	if(!window) return {};
	return window;
}(window));

PubSub.prototype.on = function(event, fn, scope){
	if(!this.__events[event]){ this.__events[event] = []; }
	
	
	this.__events[event].push({
		fn: fn,
		scope: scope || this.__defaultScope,
	});
	
	return true;
}
PubSub.prototype.log = function(){
	console.log(arguments);
}
PubSub.prototype.emit = function(event, data){
	if(!this.__events[event]){
		return false;
	}
	//this.log(arguments); 
	
	var args = [];	
	
	if(arguments.length > 1){
		for(var cur = 1, len = arguments.length; cur < len; cur ++){
			args.push(arguments[cur]);
		}
	}
	
	this.emitToListeners(event, args);
	
	return true;
}

PubSub.prototype.emitToListeners = function(event, args){	
	var oneEvent = null;
	for(cur = 0, len = this.__events[event].length; cur < len; cur ++){
		oneEvent = this.__events[event][cur];
		try {
			oneEvent.fn.apply(oneEvent.scope, args);	
		} catch(e){
			console.log("Err: "+ event + " " + args);
			console.log(oneEvent);
			console.log(e);
		}
	}
	return true;
}

PubSub.prototype.destroyListeners = function(channel){
	if(this.__events[channel]){ 
		delete this.__events[channel];
		return true;
	} else {
		return false;
	}
}
