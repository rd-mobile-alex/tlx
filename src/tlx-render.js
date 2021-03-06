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