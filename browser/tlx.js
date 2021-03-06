(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
	const tlx = require("./src/tlx-core.js");
	require("./src/tlx-render.js");
	require("./src/tlx-directives.js");
	require("./src/tlx-reactive.js");
	require("./src/tlx-component.js");
})();
},{"./src/tlx-component.js":2,"./src/tlx-core.js":3,"./src/tlx-directives.js":4,"./src/tlx-reactive.js":5,"./src/tlx-render.js":6}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
(function() {

	/* Copyright 2017, AnyWhichWay, Simon Y. Blackwell, MIT License
	 
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
	
	Portions of hyperx code Copyright (c) 2015, James Halliday BSD Clause 2
	All rights reserved.

	Redistribution and use in source and binary forms, with or without modification,
	are permitted provided that the following conditions are met:

	Redistributions of source code must retain the above copyright notice, this list
	of conditions and the following disclaimer.

	Redistributions in binary form must reproduce the above copyright notice, this
	list of conditions and the following disclaimer in the documentation and/or
	other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
	ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	
	*/
	
	//var attrToProp = require('hyperscript-attribute-to-property')


	var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4,
		ATTR_KEY = 5, ATTR_KEY_W = 6,
		ATTR_VALUE_W = 7, ATTR_VALUE = 8,
		ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10,
		ATTR_EQ = 11, ATTR_BREAK = 12,
		COMMENT = 13,
		tlx;
	
	
	
	function hyperx(h, opts={}) {
		const concat = opts.concat || function (a, b) {
			return String(a) + String(b);
		};
		//if (opts.attrToProp !== false) {
		//  h = attrToProp(h)
		//}

		return function (strings,...values) {
			if(!strings) {
				throw new TypeError("tlx must be called with an HTML Element or used to interploate a string literal.");
			}
			if(tlx.render && strings instanceof HTMLElement) {
				// should improve to ensure &gt; and &lt; are inside ${ }
				const node = strings;
				let html = strings.outerHTML.replace(/&gt;/g,">").replace(/&lt;/g,"<");
				if(values[0]!==true) html = html.replace(/\${/g,"\\${");//.replace(/`/g,"\\`")
				node.state = this;
				const vnode = Function("scope","with(scope) { return tlx`"+html+"`; }").call(strings,this);
				if(this && this!==window) {
					vnode.attributes.state = (tlx.options.reactive && tlx.activate ? tlx.activate(this) : this);
				}
				vnode.node = node;
				tlx.render(vnode,node);
				return;
			}
			var state = TEXT, reg = "",
				arglen = arguments.length,
				parts = [];
			function quot (state) {
				return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ;
			}
			var hasOwn = Object.prototype.hasOwnProperty;
			function has (obj, key) { return hasOwn.call(obj, key); }

			var closeRE = RegExp("^(" + [
				"area", "base", "basefont", "bgsound", "br", "col", "command", "embed",
				"frame", "hr", "img", "input", "isindex", "keygen", "link", "meta", "param",
				"source", "track", "wbr", "!--",
				// SVG TAGS
				"animate", "animateTransform", "circle", "cursor", "desc", "ellipse",
				"feBlend", "feColorMatrix", "feComposite",
				"feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap",
				"feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR",
				"feGaussianBlur", "feImage", "feMergeNode", "feMorphology",
				"feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile",
				"feTurbulence", "font-face-format", "font-face-name", "font-face-uri",
				"glyph", "glyphRef", "hkern", "image", "line", "missing-glyph", "mpath",
				"path", "polygon", "polyline", "rect", "set", "stop", "tref", "use", "view",
				"vkern"
				].join("|") + ")(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$");
			function selfClosing (tag) { return closeRE.test(tag); }
			function strfn(x) {
				if (typeof x === "function") {
					return x;
				} else if (typeof x === "string") {
					return x;
				} else if (x && typeof x === "object") {
					return x;
				} else {
					return concat("", x);
				}
			}
			function parse(str) {
				var res = [];
				if (state === ATTR_VALUE_W) {
					state = ATTR;
				}
				for (var i = 0; i < str.length; i++) {
					var c = str.charAt(i);
					if (state === TEXT && c === "<") {
						if (reg.length) {
							res.push([TEXT, reg]);
						}
						reg = "";
						state = OPEN;
					} else if (c === ">" && !quot(state) && state !== COMMENT) {
						if (state === OPEN) {
							res.push([OPEN,reg]);
						}
						else if (state === ATTR_KEY) {
							res.push([ATTR_KEY,reg]);
						}
						else if (state === ATTR_VALUE && reg.length) {
							res.push([ATTR_VALUE,reg]);
						}
						res.push([CLOSE]);
						reg = "";
						state = TEXT;
					} else if (state === COMMENT && /-$/.test(reg) && c === "-") {
						if (opts.comments) {
							res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)],[CLOSE]);
						}
						reg = "";
						state = TEXT;
					} else if (state === OPEN && /^!--$/.test(reg)) {
						if (opts.comments) {
							res.push([OPEN, reg],[ATTR_KEY,"comment"],[ATTR_EQ]);
						}
						reg = c;
						state = COMMENT;
					} else if (state === TEXT || state === COMMENT) {
						reg += c;
					} else if (state === OPEN && /\s/.test(c)) {
						res.push([OPEN, reg]);
						reg = "";
						state = ATTR;
					} else if (state === OPEN) {
						reg += c;
					} else if (state === ATTR && /[^\s"'=/]/.test(c)) {
						state = ATTR_KEY;
						reg = c;
					} else if (state === ATTR && /\s/.test(c)) {
						if (reg.length) {
							res.push([ATTR_KEY,reg]);
						}
						res.push([ATTR_BREAK]);
					} else if (state === ATTR_KEY && /\s/.test(c)) {
						res.push([ATTR_KEY,reg]);
						reg = "";
						state = ATTR_KEY_W;
					} else if (state === ATTR_KEY && c === "=") {
						res.push([ATTR_KEY,reg],[ATTR_EQ]);
						reg = "";
						state = ATTR_VALUE_W;
					} else if (state === ATTR_KEY) {
						reg += c;
					} else if ((state === ATTR_KEY_W || state === ATTR) && c === "=") {
						res.push([ATTR_EQ]);
						state = ATTR_VALUE_W;
					} else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
						res.push([ATTR_BREAK]);
						if (/[\w-]/.test(c)) {
							reg += c;
							state = ATTR_KEY;
						} else {
							state = ATTR;
						}
					} else if (state === ATTR_VALUE_W && c === '"') {
						state = ATTR_VALUE_DQ;
					} else if (state === ATTR_VALUE_W && c === "'") {
						state = ATTR_VALUE_SQ;
					} else if (state === ATTR_VALUE_DQ && c === '"') {
						res.push([ATTR_VALUE,reg],[ATTR_BREAK]);
						reg = "";
						state = ATTR;
					} else if (state === ATTR_VALUE_SQ && c === "'") {
						res.push([ATTR_VALUE,reg],[ATTR_BREAK]);
						reg = "";
						state = ATTR;
					} else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
						state = ATTR_VALUE;
						i--;
					} else if (state === ATTR_VALUE && /\s/.test(c)) {
						res.push([ATTR_VALUE,reg],[ATTR_BREAK]);
						reg = "";
						state = ATTR;
					} else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ) {
						reg += c;
					}
				}
				if (state === TEXT && reg.length) {
					res.push([TEXT,reg]);
					reg = "";
				} else if (state === ATTR_VALUE && reg.length) {
					res.push([ATTR_VALUE,reg]);
					reg = "";
				} else if (state === ATTR_VALUE_DQ && reg.length) {
					res.push([ATTR_VALUE,reg]);
					reg = "";
				} else if (state === ATTR_VALUE_SQ && reg.length) {
					res.push([ATTR_VALUE,reg]);
					reg = "";
				} else if (state === ATTR_KEY) {
					res.push([ATTR_KEY,reg]);
					reg = "";
				}
				return res;
			}
			for (let i = 0; i < strings.length; i++) {
				if (i < arglen - 1) {
					let arg = arguments[i+1],
						p = parse(strings[i]),
						xstate = state;
					if (xstate === ATTR_VALUE_DQ) {
						xstate = ATTR_VALUE;
					} else if (xstate === ATTR_VALUE_SQ) {
						xstate = ATTR_VALUE;
					} else if (xstate === ATTR_VALUE_W) {
						xstate = ATTR_VALUE;
					} else if (xstate === ATTR) {
						xstate = ATTR_KEY;
					}
					p.push([ VAR, xstate, arg ]);
					parts.push.apply(parts, p);
				} else {
					parts.push.apply(parts, parse(strings[i]));
				}
			}

			var tree = [null,{},[]],
				stack = [[tree,-1]];
			for (let i = 0; i < parts.length; i++) {
				let cur = stack[stack.length-1][0],
					p = parts[i], s = p[0];
				if (s === OPEN && /^\//.test(p[1])) {
					var ix = stack[stack.length-1][1];
					if (stack.length > 1) {
						stack.pop();
						stack[stack.length-1][0][2][ix] = h(
								cur[0], cur[1], cur[2].length ? cur[2] : undefined
						);
					}
				} else if (s === OPEN) {
					let c = [p[1],{},[]];
					cur[2].push(c);
					stack.push([c,cur[2].length-1]);
				} else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
					let key = "",
						copyKey;
					for (; i < parts.length; i++) {
						if (parts[i][0] === ATTR_KEY) {
							key = concat(key, parts[i][1]);
						} else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
							if (typeof parts[i][2] === "object" && !key) {
								for (copyKey in parts[i][2]) {
									if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
										cur[1][copyKey] = parts[i][2][copyKey];
									}
								}
							} else {
								key = concat(key, parts[i][2]);
							}
						} else {
							break;
						}
					}
					if (parts[i][0] === ATTR_EQ) {
						i++;
					}
					let j = i;
					for (; i < parts.length; i++) {
						if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
							if (!cur[1][key]) {
								cur[1][key] = strfn(parts[i][1]);
							} else {
								parts[i][1]==="" ||(cur[1][key] = concat(cur[1][key], parts[i][1])); // AnyWhichWay added parts[i][1]===""
							}
						} else if (parts[i][0] === VAR
								&& (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
							if (!cur[1][key]) {
								cur[1][key] = strfn(parts[i][2]);
							} else {
								parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2])); // AnyWhichWay added parts[i][1]===""
							}
						} else {
							if (key.length && !cur[1][key] && i === j
									&& (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
								// https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
								// empty string is falsy, not well behaved value in browser
								cur[1][key] = key.toLowerCase();
							}
							if (parts[i][0] === CLOSE) {
								i--;
							}
							break;
						}
					}
				} else if (s === ATTR_KEY) {
					cur[1][p[1]] = true;
				} else if (s === VAR && p[1] === ATTR_KEY) {
					cur[1][p[2]] = true;
				} else if (s === CLOSE) {
					if (selfClosing(cur[0]) && stack.length) {
						let ix = stack[stack.length-1][1];
						stack.pop();
						stack[stack.length-1][0][2][ix] = h(
								cur[0], cur[1], cur[2].length ? cur[2] : undefined
						);
					}
				} else if (s === VAR && p[1] === TEXT) {
					if (p[2] === undefined || p[2] === null) {
						p[2] = "";
					} else if (!p[2]) {
						p[2] = concat("", p[2]);
					}
					if (Array.isArray(p[2][0])) {
						cur[2].push.apply(cur[2], p[2]);
					} else {
						cur[2].push(p[2]);
					}
				} else if (s === TEXT) {
					cur[2].push(p[1]);
				} else if (s === ATTR_EQ || s === ATTR_BREAK) {
					// no-op
				} else {
					throw new Error("unhandled: " + s);
				}
			}

			if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
				tree[2].shift();
			}

			if (tree[2].length > 2 || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
				throw new Error("multiple root elements must be wrapped in an enclosing tag");
			}

			if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === "string" && Array.isArray(tree[2][0][2])) {
				tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2]);
			}
			return tree[2][0];
		};
	}
	
	class VNode {
		constructor(config) {
			Object.assign(this,config);
		}
		getElementsByTagName(name) {
			let elements = [];
			if(this.nodeName===name) {
				elements.push(this);
			}
			for(let child of this.children) {
				const nodes = (Array.isArray(child) ? child : (child ? [child] : []));
				for(let node of nodes) {
					typeof(node)!=="object" || (elements = elements.concat(node.getElementsByTagName(name)));
				}
			}
			return elements;
		}
	}
	class VText extends VNode {
		constructor(config) {
			super(config);
		}
	}

	const hCompress = (h) => {
		if(!h) {
			return {};
		}
			if(h.compressed) {
				return h;
			}
			h.compressed = true;
			if(h.attributes) {
				for(let key in h.attributes) {
					h.attributes[key] = tlx.fromJSON(h.attributes[key]);
				}
			}
			const children = [];
			if(h.children) {
				for(let child of h.children) {
					const type = typeof(child);
					if(type==="string") {
						let text = child.replace(/[ \r\n\t]+/g," ");
						if(/\S/.test(text)) {
							if(text[0]===" " && text[1]===" ") {
								text = text.trimLeft() + " ";
							}
							if(text[text.length-1]===" " && text[text.length-2]===" ") {
								text = text.trimRight() + " ";
							}
							children.push(new VText(({text,parent:h})));
						}
					} else if(["boolean","number"].includes(type)) {
						children.push(new VText({text:child+"",parent:h}));
					} else if(Array.isArray(child)) {
						for(let item of child) {
							item.parent = h;
							children.push(hCompress(item));
						}
					} else if(child) {
						child.parent = h;
						children.push(hCompress(child));
					}
				}
				h.children = children;
			}
			return h;
		},
		h = (nodeName, attributes, ...args) => {
			// patch for Preact and React
			if(attributes) {
				for(let name in attributes) {
					if(name.indexOf("on")===0) {
						let f = attributes[name];
						if(typeof(f)==="string") { // convert on handler strings into functions
							try {
								f = Function("return " + f)();
								if(typeof(f)==="function") {
									attributes[name] = f;
								}
							} catch(e) { true; }
						}
						if(typeof(f)==="function" && typeof(React)!=="undefined") {
							delete attributes[name];
							name = `on${name[2].toUpperCase()}${name.substring(3)}`; // convert to mixed case
							attributes[name] = f;
						}
					}
				}
			}

			if(typeof(React)!=="undefined") {
				return React.createElement(nodeName,attributes,...args);
			}
			if(typeof(preact)!=="undefined") {
				return preact.h(nodeName,attributes, ...args);
			}
			let children = args.length ? [].concat(...args).filter(item => item!=null) : [];
			return new VNode({nodeName,attributes,children});
		};
	tlx = hyperx(h);
	tlx.fromJSON = (value) => {
		if(typeof(value)==="string") {
			try { value = JSON.parse(value.replace(/&quot;/g,'"'));	} catch(e) { true; }
		}
		return value;
	};
	tlx.getAttribute = (element,name) => {
		let instancename = name;
		if(name.indexOf("-")>=0) {
			const parts = name.split("-");
			instancename = parts[0];
			for(let i=1;i<parts.length;i++) {
				const part = parts[i];
				instancename += (part[0].toUpperCase() + part.toLowerCase().substring(1))
			}
		}
		const desc = Object.getOwnPropertyDescriptor(element,instancename);
		return (desc ? desc.value : tlx.fromJSON(element.getAttribute(name)));
	};
	tlx.getAttributes = (element) => {
		const attributes = {};
		for(let attribute of [].slice.call(element.attributes)) {
			attributes[attribute.name] = element[attribute.name] || tlx.fromJSON(attribute.value);
		}
		return attributes;
	};
	tlx.h = h;
	tlx.hCompress = hCompress;
	tlx.options = {};
	tlx.setAttribute = (element,name,value) => {
		let instancename = name;
		// camelcase name
		if(name.indexOf("-")>=0) {
			const parts = name.split("-");
			instancename = parts[0];
			for(let i=1;i<parts.length;i++) {
				const part = parts[i];
				instancename += (part[0].toUpperCase() + part.toLowerCase().substring(1))
			}
		}
		value = tlx.fromJSON(value);
		let type = typeof(value);
		// assume all camelCase names need to be added directly to element
		instancename===name || (element[instancename] = value);
		if(name==="options" && type==="string") {
			value = value.split(",");
			type = typeof(value);
		}
		if(value && type==="object") {
			element[instancename] = value;
		} else if(type==="function") {
			element[instancename] = value;
		} else if(!(element instanceof HTMLSelectElement) || name!=="value") {
			element.setAttribute(name,value);
		}
		if(element.type==="checkbox" && name==="value" && value) {
			requestAnimationFrame(() => element.checked = true);
		} else if(element.type==="select-one" && name==="value") {
			for(let option of [].slice.call(element.options)) {
				tlx.fromJSON(value)!==tlx.fromJSON(option.value) || requestAnimationFrame(() => option.selected = true);
			}
		} else if(element.type==="select-multiple" && name==="value" && Array.isArray(value)) {
			for(let option of [].slice.call(element.options)) {
				!value.includes(tlx.fromJSON(option.value)) || requestAnimationFrame(() => option.selected = true);
			}
		} 
	}
	tlx.VNode = VNode;
	tlx.VText = VText;
		
	if(typeof(module)!=="undefined") {
		module.exports = tlx;
	}
	if(typeof(window)!=="undefined") {
		window.tlx = tlx;
	}
}).call(this);
},{}],4:[function(require,module,exports){
(function(tlx) {
	"use strict";
	tlx.directives = {
		VNode: {
			"t-if": (value,vnode) => {
				if(!value) {
					vnode.children = null;
				}
			},
			"t-for": (value,vnode,node) => {
				if(typeof(value)==="string") {
					const [key,op] = value.replace(/\</g,"\\<").split(" "),
						newchildren = [];
					if(op==="of") {
						const target = value.substring(value.indexOf(" of ")+4),
							array = JSON.parse(target);
						let extras = {array};
						for(let index=0;index<array.length;index++) {
							extras = Object.assign({},extras);
							extras.index = index;
							extras.value = array[index];
							extras[key] = array[index];
							for(let child of vnode.children) {
								const newchild = Object.assign(Object.create(Object.getPrototypeOf(child)),child);
								if(child.attributes) {
									newchild.attributes = Object.assign({},child.attributes);
									newchild.attributes.state = extras
								} else {
									newchild.state = extras;
								}
								newchildren.push(newchild);
							}
						}
					} else if(op==="in") {
						const target = value.substring(value.indexOf(" in ")+4),
							object = JSON.parse(target);
						for(let property in object) {
							let extras = {object};
							for(let child of vnode.children) {
								extras = Object.assign({},extras);
								extras.key = property;
								extras[key] = property;
								const newchild = Object.assign(Object.create(Object.getPrototypeOf(child)),child);
								if(child.attributes) {
									newchild.attributes = Object.assign({},child.attributes);
									newchild.attributes.state = extras
								} else {
									newchild.state = extras;
								}
								newchildren.push(newchild);
							}
						}
					}
					vnode.children = newchildren;
				}
			},
			"t-foreach": (value,vnode,node) => {
				const object = value,
					newchildren = [];
				if(Array.isArray(value)) {
					for(let key=0;key<object.length;key++) {
						const value = object[key];
						for(let child of vnode.children) {
							const newchild = Object.assign(Object.create(Object.getPrototypeOf(child)),child);
							if(child.attributes) {
								newchild.attributes = Object.assign({},child.attributes);
								newchild.attributes.state = {value,key,object};
							} else {
								newchild.state = {value,key,object};
							}
							newchildren.push(newchild);
						}
					}
				} else {
					for(let key in object) {
						const value = object[key];
						for(let child of vnode.children) {
							const newchild = Object.assign(Object.create(Object.getPrototypeOf(child)),child);
							if(child.attributes) {
								newchild.attributes = Object.assign({},child.attributes);
								newchild.attributes.state = {value,key,object};
							}  else {
								newchild.state = {value,key,object};
							}
						}
					}
				}
				vnode.children = newchildren;
			}
		},
		HTMLElement: {
			"t-if": (value,vnode,node) => {
				if(!value) {
					while(node.lastChild) {
						node.removeChild(node.lastChild);
					}
				}
			},
			"t-on": (value,vnode,node) => {
				node.removeAttribute("t-on");
				for(let event in value) {
					//node.addEventListener(event,(event) => {
					//	value[event](event);
					//});
					node["on"+event] = (e) => {
						setTimeout(() => value[event](e));
					}
				}
			}
		}
	};
}(tlx));
},{}],5:[function(require,module,exports){
(function(tlx) {
	"use strict";
	HTMLElement.prototype.linkState = function(property) {
		const f = function(event) {
			const target = event.target;
			if([HTMLInputElement,HTMLTextAreaElement,HTMLSelectElement,HTMLAnchorElement].some(cls => target instanceof cls)) {
				let value;
				if(target.type==="checkbox") {
					value = target.checked;
				}
				else if(target.type==="select-multiple") {
					value = [];
					for(let option of [].slice.call(target.options)) {
						!option.selected || value.push(tlx.fromJSON(option.value));
					}
				} else {
					value = tlx.fromJSON(target.value);
				}
				const parts = property.split(".");
				let state = this;
				property = parts.pop(); // get final property
				for(let key of parts) {
					state = state[key] || {};
				} // walk tree
				state[property] = value; // set property
			}
		};
		return f.bind(tlx.getState(this)||(this.state={}));
	};
	HTMLElement.prototype.setState = function(state) {
		this.state || (tlx.options.active ? tlx.activate({}) : {});
		Object.assign(this.state,state);
	};
	tlx.activate = (object) => {
		if(!object || typeof(object)!=="object" || object.tlxDependents) {
			return object;
		}
		const dependents = {},
			proxy = new Proxy(object,{
				get: (target,property) => {
					if(property==="tlxDependents") {
						return dependents;
					}
					const value = target[property],
						type = typeof(value);
					if(tlx._NODE && type!=="function" && type!=="undefined") {
						dependents[property] || (dependents[property] = new Set());
						dependents[property].add(tlx._NODE);
					}
					return value;
				},
				set: (target,property,value) => {
					const oldvalue = target[property];
					if(oldvalue!==value) {
						const type = typeof(value);
						!value || type!=="object" || value.tlxDependents || (value = tlx.activate(value));
						if(typeof(oldvalue)===type==="object") {
							const olddependents = oldvalue.tlxDependents,
								newdependents = value.tlxDependents;
							if(olddependents) {
								for(let key in olddependents) {
									newdependents[key] = olddependents[key];
								}
							}
						}
						target[property] = value;
						if(dependents[property]) {
							for(let dependent of dependents[property]) {
								if(!dependent.ownerElement && !dependent.parentElement) {
									dependents[property].delete(dependent);
								} else {
									dependent.vnode.node = dependent;
									tlx.render(dependent.vnode);
									dependent.vnode.node = null;
								}
							}
						}
					}
					return true;
				}
			});
		for(let key in object) {
			object[key] = tlx.activate(object[key]);
		}
		return proxy;
	};
	tlx.getState = (node) => { // force resolution of parent states first
		if(!node) {
			return;
		}
		if(node.state) {
			return node.state;
		}
		return tlx.getState(node.parentElement||node.ownerElement);
	};
	tlx.options || (tlx.options={});
	tlx.options.reactive = true;
		
}(tlx));
},{}],6:[function(require,module,exports){
(function(tlx) {
	
const resolve = function(template,node,extras={},nonReactive) { // walk up the DOM tree for state data, n=node,p=property,e=extras
	if(typeof(template)==="string" && template.indexOf("${")>=0) {
	const code = // left align, 2 char indent, single char variables to reduce size since templates not minimized
`let _tlx_state=n.state;
while(!_tlx_state && n && n.parentElement||n.ownerElement) { n = n.parentElement||n.ownerElement; _tlx_state = !n || n.state; }
if(!_tlx_state) return;
do{
try {
with(e){with(_tlx_state){return $.parse__template__;}}
}catch(err){
if(err instanceof ReferenceError){
const p=err.message.split(" ")[0];
let prnt=n.parentElement||n.ownerElement,v;
while(prnt){
_tlx_state = prnt.state;
if(_tlx_state && typeof(_tlx_state)==="object" && p in _tlx_state){v=_tlx_state[p];break;}
prnt=prnt.parentElement||prnt.ownerElement;
}
if(typeof(v)==="undefined") return; 
else e[p]=v;
}else throw(err);
}
}while(true)`.replace(/__template__/g,"`"+template+"`");
	tlx._NODE = (nonReactive ? null : node);
	let value = new Function("n","$","e",code).call(node,node,tlx.$,extras);
	tlx._NODE = null;
	return tlx.fromJSON(value);
	}
	return tlx.fromJSON(template);
};

	tlx.render = (vnode,target,parent,extras) => {
		function renderVNode(vnode,node,parent) {
			if(vnode instanceof tlx.VText) {
				const text = vnode.text;
				node || (node = document.createTextNode(text));
				!vnode.state || (node.state = vnode.state);
				!extras || (node.tlxExtras = extras);
				extras = node.tlxExtras;
				!parent || node.parentNode===parent || parent.appendChild(node);
				const value = resolve(text,node,extras);
				if(typeof(value)==="undefined") {
					parent && parent.removeChild(node); // should not happen, but does!
				} else {
					requestAnimationFrame(() => node.data = (typeof(value)==="string" ? value.replace(/&#(\d+);/g, function(match, dec) {
						return String.fromCharCode(dec);
					}) : value));
				}
				return node;
			}
			node || (node = document.createElement(vnode.nodeName));
			node.vnode = vnode;
			!extras || (node.tlxExtras = extras);
			extras = node.tlxExtras;
			!parent || node.parentNode===parent || parent.appendChild(node);
			if(["template","script"].includes(vnode.nodeName)) {
				return node;
			}
			const attributes = vnode.attributes || {},
			handled = {},
			component = (typeof(customElements)!=="undefined" ? customElements.get(node.localName) : null);
		let value;
		
		if(attributes.state) {
			const value = resolve(attributes.state,node,extras);
			node.state = (tlx.options.reactive && tlx.options.activate ? tlx.options.activate(value) : value);
			handled.state = node.state;
		}
		if(component) {
			const attrs = Object.assign({},component.attributes,attributes);
			!node.state || delete attrs.state;
			tlx.render(tlx.hCompress(node.render(attrs)),null,node,extras); //component.create(node)
		} else {
				if(attributes.type) {
					const value = resolve(attributes.type,node,extras);
					tlx.setAttribute(node,"type",value);
					handled.type = value;
				}
				if(attributes.options) {
					const value =  resolve(attributes.options,node,extras);
					tlx.setAttribute(node,"options",value);
					handled.options = value;
				}
				if(attributes.value) {
					value =  resolve(attributes.value,node,extras,true);
					tlx.setAttribute(node,"value",value);
					node.value = value;
					handled.value = value;
				}
				for(let name in attributes) {
					if(typeof(handled[name])==="undefined") {
						const value = handled[name] = resolve(attributes[name],node,extras);
						if(!tlx.directives || !tlx.directives.VNode || !(tlx.directives.VNode[name] || tlx.directives.HTMLElement[name])) {
							tlx.setAttribute(node,name,value,extras);
						}
					}
				}
				if(tlx.directives && tlx.directives.VNode) {
					const directives =  tlx.directives.VNode;
					for(let name in attributes) {
						!directives[name] || directives[name](handled[name],vnode,node);
					}
				}
			}
			const children = vnode.children||[];
			for(let child of children) {
				Array.isArray(child) || (child = [child]); // not sure why this needs to happen sometimes, child should never be an array
				for(let vnode of child) {
					const childnode = renderVNode(vnode,null,node);
					if(!childnode) {
						return;
					}
					childnode.vnode = vnode;
				}
			}
			if(typeof(value)!=="undefined") {
				tlx.setAttribute(node,"value",value,extras);
			}
	
			if(tlx.directives && tlx.directives.HTMLElement) {
				const directives =  tlx.directives.HTMLElement;
				for(let name in attributes) {
					!directives[name] || directives[name](handled[name] || resolve(attributes[name],node),vnode,node,extras);
				}
			}
			if([HTMLInputElement,HTMLTextAreaElement].some(cls => node instanceof cls)) {
				node.focus();
				try { node.selectionStart = node.value.length; } catch(e) { true; }
			}
			return node;
		}
		tlx.hCompress(vnode);
		let node = vnode.node;
		if(node) {
			while(node.lastChild) {
				node.removeChild(node.lastChild);
			}
		}
		node = renderVNode(vnode,node,parent);
		if(target && target!==node) {
			target.appendChild(node);
		}
		return node;
	};
	tlx.resolve = (template,node,extras={},nonReactive) => {
		if(template && typeof(template)=="object") {
			for(let key in template) {
				template[key] = tlx.resolve(template[key],node,Object.assign({},extras),nonReactive);
			}
			return template;
		} else {
			return resolve(template,node,extras={},nonReactive);
		}
	};
	tlx._NODE = null;
	tlx.$ = {
			parse(strings,...values) {
				if(values.length===1 && strings.filter(item => item.length>0).length===0) {
					return values[0];
				}
				let result = "";
				for(let i=0;i<strings.length;i++) {
					result += (strings[i] + (i<values.length ? (values[i] && typeof(values[i])==="object" ? JSON.stringify(values[i]) : values[i]) : ""));
				}
				return result;
			},
			parseValues(strings,...values) {
				return values;
			}
	};
	document.tlxRender = (data={},embedded,rerender) => {
		!rerender || (document.tlxRender.rendered = false);
		document.tlxRender.rendered || setTimeout(() => tlx.bind(data)(document.body,embedded));
		document.tlxRender.rendered = true;
	}
}(tlx));
},{}]},{},[1]);
