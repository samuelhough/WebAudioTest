var Mediator = (function(PubSub){
	if(!PubSub || typeof PubSub !== 'function'){ 
		throw "Simple PubSub.js required";
	}
	
	
	function Noop(){}
	var getSet = {
		set: function(key, value){
			this.__sharedVals[key] = value;
			this.emit('change:'+key, value);
		},
		get: function(key){
			return this.__sharedVals[key];
		}
	};
	
	function Mediator(options){
		if(!this instanceof Mediator){ return new Mediator(); }
		this.__shared_events = {};
		this.__sharedVals = {};
		this.__events = {};
	
	}
	Mediator.prototype = PubSub.prototype;
	
	Mediator.prototype.register = function(child){
		Noop.prototype = PubSub.prototype;
		child.prototype = new Noop();
		child.prototype.set = getSet.set;
		child.prototype.get = getSet.get;
		child.prototype.__sharedVals = this.__sharedVals;
		child.prototype.__events = this.__shared_events;
	}
	
	return Mediator;
}(PubSub));