if(!window.customElements) {
	function getConstructorText(cls) {
		if(cls.prototype.constructor) {
			let source = (cls.prototype.constructor+"").replace(/\n/g," "),
				start = source.indexOf("constructor"),
				count = 1,
				end = 0;
			if(start>=0) {
				source = source.substring(start+11).trim();
				start = source.indexOf("{");
				source = source.substring(start+1);
				while(count!=0 && end<source.length) {
					if(source[end]==="{") {
						count++;
					} else if(source[end]==="}") {
						count--;
					}
					end++;
				}
				return source.substring(0,--end);
			}
		}
		return "";
	}
	const customElements = window.customElements = {};
	const promises = {};
	Object.defineProperty(customElements,"define",{enumerable:false,configurable:true,writable:true,value:(name,constructor,options={}) => {
		const promise = (customElements[name] && customElements[name] instanceof Promise ?  customElements[name] : null);
		customElements[name] = constructor;
		!promise || promise.resolve();
	}});
	Object.defineProperty(customElements,"get",{enumerable:false,configurable:true,writable:true,value:(name) => {
		if(!customElements[name] || customElements[name] instanceof Promise) {
			return;
		}
		return customElements[name];
	}});
	Object.defineProperty(customElements,"when",{enumerable:false,configurable:true,writable:true,value:(name) => {
		if(!promises[name]) {
			let resolver;
			promises[name] = new Promise((resolve) => resolver = resolve);
			promises[name].resolve = resolver;
		}
		customElements[name] || (customElements[name] = promises[name]);
		return promises[name];
	}});
	__createElement = document.createElement;
	document.createElement = (tagName,options={}) => {
		const ctor = customElements.get(tagName),
			el = __createElement.call(document,tagName);
		if(ctor) {
			if(ctor.create) {
				ctor.create(null,el);
			} else {
				Object.setPrototypeOf(el,ctor.prototype);
				const source = getConstructorText(ctor);
				!source || (Function(source.replace("super()","true"))).call(el);
			}
		}
		!el.adoptedCallback || el.adoptedCallback(null,document);
		return el;
	}
	__adoptNode = document.adoptNode;
	document.adoptNode = function(node) {
		const owner = node.ownerDocument;
		__adoptNode.call(document,node);
		!node.adoptedCallback || node.adoptedCallback(owner,document);
		return node;
	};

	(function() {
		const observer = new MutationObserver(mutations => {
			for(let mutation of mutations) {
				const target = mutation.target;
				if(mutation.type==="childList") {
					for(let child of [].slice.call(mutation.addedNodes)) {
						const ctor = customElements.get(child.localName);
						if(ctor && !(child instanceof ctor)) {
							if(ctor.create) {
								ctor.create(null,child);
							} else {
								Object.setPrototypeOf(el,ctor.prototype);
								const source = getConstructorText(ctor);
								!source || (Function(source.replace("super()","true"))).call(child);
							}
						}
						!child.connectedCallback || child.connectedCallback.call(child);
					}
					for(let child of [].slice.call(mutation.removedNodes)) {
						!child.disconnectedCallback || child.disconnectedCallback.call(child);
					}
				} else if(mutation.type==="attributes" && target.attributeChangedCallback) {
					target.attributeChangedCallback(target.attributeName,target.oldValue,target.getAttribute(target.attributeName),target.attributeNamespace);
				}
			}
		});
		observer.observe(document,{childList: true, subtree: true, attributes: true});
	})();
}
document.registerTlxComponent = function(tagName,cls) { customElements.define(tagName,cls); } // deprecating Nov 2017, v0.1.6