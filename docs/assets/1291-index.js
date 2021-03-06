/**
 * compare 2 array
 * ```js
 * isEqualArray([1,2,3,4],[1,2,3,4]) // true
 * isEqualArray([1,2,3,4],[1,2,3])   // false
 * isEqualArray([5,1,2,3],[1,2,3,5]) // false
 * isEqualArray([],[]) // true
 * ```
 * @param {any[]} before
 * @param {any[]} after
 * @returns {boolean}
 */
/**
 * Determine if the value is considered a function
 * @param {any} value
 */
const isFunction = (value) => typeof value == "function";

/**
 * Determines if the value is considered an object
 * @param {any} value
 */
const isObject = (value) => typeof value == "object";

const KEY = Symbol("");
const GLOBAL_ID = Symbol("");
const FROM_PROP = {
    id: 1,
    className: 1,
    checked: 1,
    value: 1,
    selected: 1,
};
const WITH_ATTR = {
    list: 1,
    type: 1,
    size: 1,
    form: 1,
    width: 1,
    height: 1,
    src: 1,
};
const EMPTY_PROPS = {};
const EMPTY_CHILDREN = [];
const TYPE_TEXT = 3;
const TYPE_ELEMENT = 1;
const $ = document;
const vdom = Symbol();
/**
 * @typedef {object} vdom
 * @property {any} type
 * @property {symbol} vdom
 * @property {Object.<string,any>} props
 * @property {import("./internal").flatParamMap} [children]
 * @property {any} [key]
 * @property {boolean} [raw]
 * @property {boolean} [shadow]
 */

/**
 * @param {any} type
 * @param {object} [p]
 * @param  {...any} children
 * @returns {vdom}
 */
function h(type, p, ...children) {
    let props = p || EMPTY_PROPS;

    children = flat(props.children || children, type == "style");

    if (!children.length) {
        children = EMPTY_CHILDREN;
    }

    return {
        vdom,
        type,
        props,
        children,
        key: props.key,
        shadow: props.shadowDom,
        //@ts-ignore
        raw: type.nodeType == TYPE_ELEMENT,
    };
}

/**
 * @param {vdom} vnode
 * @param {Element} node
 * @param {Symbol|string} [id]
 */
let render = (vnode, node, id = GLOBAL_ID) => diff(id, node, vnode);

/**
 * Create or update a node
 * Node: The declaration of types through JSDOC does not allow to compress
 * the exploration of the parameters
 * @param {any} id
 * @param {any} node
 * @param {any} vnode
 * @param {boolean} [isSvg]
 */
function diff(id, node, vnode, isSvg) {
    let isNewNode;
    // If the node maintains the source vnode it escapes from the update tree
    if (node && node[id] && node[id].vnode == vnode) return node;
    // Injecting object out of Atomico context
    if (vnode && vnode.type && vnode.vdom != vdom) return node;

    // The process only continues when you may need to create a node
    if (vnode != null || !node) {
        isSvg = isSvg || vnode.type == "svg";
        isNewNode =
            vnode.type != "host" &&
            (vnode.raw
                ? node != vnode.type
                : node
                ? node.localName != vnode.type
                : !node);

        if (isNewNode) {
            let nextNode;
            if (vnode.type != null) {
                nextNode = vnode.raw
                    ? vnode.type
                    : isSvg
                    ? $.createElementNS(
                          "http://www.w3.org/2000/svg",
                          vnode.type
                      )
                    : $.createElement(
                          vnode.type,
                          vnode.is ? { is: vnode.is } : null
                      );
            } else {
                return $.createTextNode(vnode + "");
            }

            node = nextNode;
        }
    }
    if (node.nodeType == TYPE_TEXT) {
        vnode += "";
        if (node.data != vnode) {
            node.data = vnode || "";
        }
        return node;
    }

    let oldVNode = node[id] ? node[id].vnode : EMPTY_PROPS;
    let oldVnodeProps = oldVNode.props || EMPTY_PROPS;
    let oldVnodeChildren = oldVNode.children || EMPTY_CHILDREN;
    let handlers = isNewNode || !node[id] ? {} : node[id].handlers;

    if (vnode.shadow) {
        if (!node.shadowRoot) {
            node.attachShadow({ mode: "open" });
        }
    }

    if (vnode.props != oldVnodeProps) {
        diffProps(node, oldVnodeProps, vnode.props, handlers, isSvg);
    }

    if (vnode.children != oldVnodeChildren) {
        let nextParent = vnode.shadow ? node.shadowRoot : node;
        diffChildren(id, nextParent, vnode.children, isSvg);
    }

    node[id] = { vnode, handlers };

    return node;
}
/**
 *
 * @param {any} id
 * @param {Element|Node} parent
 * @param {import("./internal").flatParamMap} children
 * @param {boolean} isSvg
 */
function diffChildren(id, parent, children, isSvg) {
    let keyes = children._;
    let childrenLenght = children.length;
    let childNodes = parent.childNodes;
    let childNodesLength = childNodes.length;
    let index = keyes
        ? 0
        : childNodesLength > childrenLenght
        ? childrenLenght
        : childNodesLength;

    for (; index < childNodesLength; index++) {
        let childNode = childNodes[index];

        if (keyes) {
            let key = childNode[KEY];
            if (keyes.has(key)) {
                keyes.set(key, childNode);
                continue;
            }
        }

        index--;
        childNodesLength--;
        childNode.remove();
    }
    for (let i = 0; i < childrenLenght; i++) {
        let child = children[i];
        let indexChildNode = childNodes[i];
        let key = keyes ? child.key : i;
        let childNode = keyes ? keyes.get(key) : indexChildNode;

        if (keyes && childNode) {
            if (childNode != indexChildNode) {
                parent.insertBefore(childNode, indexChildNode);
            }
        }

        if (keyes && child.key == null) continue;

        let nextChildNode = diff(id, childNode, child, isSvg);

        if (!childNode) {
            if (childNodes[i]) {
                parent.insertBefore(nextChildNode, childNodes[i]);
            } else {
                parent.appendChild(nextChildNode);
            }
        } else if (nextChildNode != childNode) {
            parent.replaceChild(nextChildNode, childNode);
        }
    }
}

/**
 *
 * @param {Node} node
 * @param {Object} props
 * @param {Object} nextProps
 * @param {boolean} isSvg
 * @param {Object} handlers
 **/
function diffProps(node, props, nextProps, handlers, isSvg) {
    for (let key in props) {
        if (!(key in nextProps)) {
            setProperty(node, key, props[key], null, isSvg, handlers);
        }
    }
    for (let key in nextProps) {
        setProperty(node, key, props[key], nextProps[key], isSvg, handlers);
    }
}

function setProperty(node, key, prevValue, nextValue, isSvg, handlers) {
    key = key == "class" && !isSvg ? "className" : key;
    // define empty value
    prevValue = prevValue == null ? null : prevValue;
    nextValue = nextValue == null ? null : nextValue;

    if (key in node && FROM_PROP[key]) {
        prevValue = node[key];
    }

    if (nextValue === prevValue || key == "shadowDom") return;

    if (
        key[0] == "o" &&
        key[1] == "n" &&
        (isFunction(nextValue) || isFunction(prevValue))
    ) {
        setEvent(node, key, nextValue, handlers);
    } else if (key == "key") {
        node[KEY] = nextValue;
    } else if (key == "ref") {
        if (nextValue) nextValue.current = node;
    } else if (key == "style") {
        let style = node.style;

        prevValue = prevValue || "";
        nextValue = nextValue || "";

        let prevIsObject = isObject(prevValue);
        let nextIsObject = isObject(nextValue);

        if (prevIsObject) {
            for (let key in prevValue) {
                if (nextIsObject) {
                    if (!(key in nextValue)) setPropertyStyle(style, key, null);
                } else {
                    break;
                }
            }
        }

        if (nextIsObject) {
            for (let key in nextValue) {
                let value = nextValue[key];
                if (prevIsObject && prevValue[key] === value) continue;
                setPropertyStyle(style, key, value);
            }
        } else {
            style.cssText = nextValue;
        }
    } else {
        if (
            (!isSvg && !WITH_ATTR[key] && key in node) ||
            isFunction(nextValue) ||
            isFunction(prevValue)
        ) {
            node[key] = nextValue == null ? "" : nextValue;
        } else if (nextValue == null) {
            node.removeAttribute(key);
        } else {
            node.setAttribute(
                key,
                isObject(nextValue) ? JSON.stringify(nextValue) : nextValue
            );
        }
    }
}

/**
 *
 * @param {Node} node
 * @param {string} type
 * @param {function} [nextHandler]
 * @param {object} handlers
 */
function setEvent(node, type, nextHandler, handlers) {
    // get the name of the event to use
    type = type.slice(type[2] == "-" ? 3 : 2);
    // add handleEvent to handlers
    if (!handlers.handleEvent) {
        /**
         * {@link https://developer.mozilla.org/es/docs/Web/API/EventTarget/addEventListener#The_value_of_this_within_the_handler}
         **/
        handlers.handleEvent = (event) =>
            handlers[event.type].call(node, event);
    }
    if (nextHandler) {
        // create the subscriber if it does not exist
        if (!handlers[type]) {
            node.addEventListener(type, handlers);
        }
        // update the associated event
        handlers[type] = nextHandler;
    } else {
        // 	delete the associated event
        if (handlers[type]) {
            node.removeEventListener(type, handlers);
            delete handlers[type];
        }
    }
}

function setPropertyStyle(style, key, value) {
    let method = "setProperty";
    if (value == null) {
        method = "removeProperty";
        value = null;
    }
    if (~key.indexOf("-")) {
        style[method](key, value);
    } else {
        style[key] = value;
    }
}
/**
 * @param {Array<any>} children
 * @param {boolean} saniate - If true, children only accept text strings
 * @param {import("./internal").flatParamMap} map
 * @returns {any[]}
 */
function flat(children, saniate, map = []) {
    for (let i = 0; i < children.length; i++) {
        let child = children[i];
        if (child) {
            if (Array.isArray(child)) {
                flat(child, saniate, map);
                continue;
            }
            if (child.key != null) {
                if (!map._) map._ = new Map();

                map._.set(child.key, 0);
            }
        }
        let type = typeof child;
        child =
            child == null ||
            type == "boolean" ||
            type == "function" ||
            (type == "object" && (child.vdom != vdom || saniate))
                ? ""
                : child;
        if (saniate) {
            map[0] = (map[0] || "") + child;
        } else {
            map.push(child);
        }
    }
    return map;
}

const HOOK_MOUNT = 1;

const HOOK_MOUNTED = 2;

const HOOK_UPDATE = 3;

const HOOK_UPDATED = 4;

const HOOK_UNMOUNT = 5;

/**
 * @type {{index?:number,ref?:any}}
 */
const HOOK_CURRENT = {};

/**
 * @template T
 * @callback reducer
 * @param {T} state
 * @param {number} type
 * @returns {T}
 */

/**
 * @template T
 * @typedef {[(state:T,type:number )=>T,T]} hook
 */

/**
 * @template T
 * @param {hook<T>} hook
 * @param {number} type
 */
function update(hook, type) {
    hook[0] && (hook[1] = hook[0](hook[1], type));
}

/**
 * @template T
 * @param {Object.<number,hook<any>>} hooks
 * @param {number} type
 */
function updateAll(hooks, type) {
    for (let i in hooks) update(hooks[i], type);
}
/**
 *
 * @param {()=>void} render
 * @param {any} host
 */
function createHooks(render, host) {
    /**
     * @type {Object.<number,hook<any>>}
     **/
    let hooks = {};

    let mounted;

    let hook = {
        use,
        load,
        updated,
        unmount,
    };

    let ref = { hook, host, render };
    /**
     * @template T,R
     * @param {(param:T)=>R} callback
     * @param {T} param
     * @returns {R}
     */
    function load(callback, param) {
        HOOK_CURRENT.index = 0;
        HOOK_CURRENT.ref = ref;
        let resolve = callback(param);
        HOOK_CURRENT.ref = 0;
        return resolve;
    }
    /**
     * @template T
     * @param {reducer<T>} reducer
     * @param {T} state
     */
    function use(reducer, state) {
        let index = HOOK_CURRENT.index++;
        let mount;
        // record the hook and the initial state of this
        if (!hooks[index]) {
            hooks[index] = [null, state];
            mount = 1;
        }
        // The hook always receives the last reduce.
        hooks[index][0] = reducer;

        update(hooks[index], mount ? HOOK_MOUNT : HOOK_UPDATE);

        return hooks[index];
    }
    function updated() {
        let type = mounted ? HOOK_UPDATED : HOOK_MOUNTED;
        mounted = 1;
        updateAll(hooks, type);
    }
    function unmount() {
        updateAll(hooks, HOOK_UNMOUNT);
    }
    return hook;
}

/**
 * The Any type avoids the validation of prop types
 * @type {null}
 **/
const Any = null;

/**
 * Attributes considered as valid boleanos
 * @type {Array<true|1|""|"1"|"true">}
 **/
const TRUE_VALUES = [true, 1, "", "1", "true"];

/**
 * Constructs the setter and getter of the associated property
 * only if it is not defined in the prototype
 * @param {Object} proto
 * @param {string} prop
 * @param {any} schema
 * @param {Object.<string,any>} attrs
 * @param {Object.<string,any>} values
 */
function setPrototype(proto, prop, schema, attrs, values) {
    if (!(prop in proto)) {
        /**@type {Schema} */
        let { type, reflect, event, value, attr = getAttr(prop) } =
            isObject(schema) && schema != Any ? schema : { type: schema };

        let isCallable = !(type == Function || type == Any);

        Object.defineProperty(proto, prop, {
            set(newValue) {
                let oldValue = this[prop];

                let { error, value } = filterValue(
                    type,
                    isCallable && isFunction(newValue)
                        ? newValue(oldValue)
                        : newValue
                );

                if (error && value != null) {
                    throw `The value defined for prop '${prop}' must be of type '${type.name}'`;
                }

                if (oldValue == value) return;

                this._props[prop] = value;

                this._update();

                this.updated.then(() => {
                    if (event) dispatchEvent(this, event);

                    if (reflect) {
                        this._ignoreAttr = attr;
                        reflectValue(this, type, attr, this[prop]);
                        this._ignoreAttr = null;
                    }
                });
            },
            get() {
                return this._props[prop];
            },
        });

        if (value != null) {
            values[prop] = value;
        }

        attrs[attr] = prop;
    }
}

/**
 * Dispatch an event
 * @param {Element} node - DOM node to dispatch the event
 * @param {Event} event - Event to dispatch on node
 */
const dispatchEvent = (node, { type, ...eventInit }) =>
    node.dispatchEvent(new CustomEvent(type, eventInit));

/**
 * Transform a Camel Case string to a Kebab case
 * @param {string} prop - string to apply the format
 * @returns {string}
 */
const getAttr = (prop) => prop.replace(/([A-Z])/g, "-$1").toLowerCase();

/**
 * reflects an attribute value of the given element as context
 * @param {Element} context
 * @param {any} type
 * @param {string} attr
 * @param {any} value
 */
const reflectValue = (context, type, attr, value) =>
    value == null || (type == Boolean && !value)
        ? context.removeAttribute(attr)
        : context.setAttribute(
              attr,
              isObject(value)
                  ? JSON.stringify(value)
                  : type == Boolean
                  ? ""
                  : value
          );

/**
 * Filter the values based on their type
 * @param {any} type
 * @param {any} value
 * @returns {{error?:boolean,value:any}}
 */
function filterValue(type, value) {
    if (type == Any) return { value };

    try {
        if (type == Boolean) {
            value = TRUE_VALUES.includes(value);
        } else if (typeof value == "string") {
            value =
                type == Number
                    ? Number(value)
                    : type == Object || type == Array
                    ? JSON.parse(value)
                    : value;
        }
        if ({}.toString.call(value) == `[object ${type.name}]`) {
            return { value, error: type == Number && Number.isNaN(value) };
        }
    } catch (e) {}

    return { value, error: true };
}

/**
 * Type any, used to avoid type validation.
 * @typedef {null} Any
 */

/**
 * Interface used by dispatchEvent to automate event firing
 * @typedef {Object} Event
 * @property {string} type - type of event to dispatch.
 * @property {boolean} [bubbles] - indicating whether the event bubbles. The default is false.
 * @property {boolean} [cancelable] - indicating whether the event will trigger listeners outside of a shadow root.
 * @property {boolean} [composed] - indicating whether the event will trigger listeners outside of a shadow root.
 * @property {boolean} [detail] - indicating whether the event will trigger listeners outside of a shadow root.
 */

/**
 * @typedef {Object} Schema
 * @property {any} [type] - data type to be worked as property and attribute
 * @property {string} [attr] - allows customizing the name as an attribute by skipping the camelCase format
 * @property {boolean} [reflect] - reflects property as attribute of node
 * @property {Event} [event] - Allows to emit an event every time the property changes
 * @property {any} [value] - defines a default value when instantiating the component
 */

/**
 *
 * @param {any} component
 * @param {typeof HTMLElement} [Base]
 */
function c(component, Base = HTMLElement) {
    /**
     * @type {Object.<string,string>}
     */
    let attrs = {};
    /**
     * @type {Object.<string,string>}
     */
    let values = {};

    let { props } = component;

    class Element extends Base {
        constructor() {
            super();

            this._ignoreAttr = null;
            /**
             * Stores the state of the values that will be consumed by this._update
             * @type {Object.<string,any>}
             */
            this._props = {};
            /**
             * Promise that will be when connectedCallback is executed
             * @type {Promise<null>}
             */
            this.mounted = new Promise((resolve) => (this.mount = resolve));
            /**
             * Promise that will be when disconnectedCallback is executed
             * @type {Promise<null>}
             */
            this.unmounted = new Promise((resolve) => (this.unmount = resolve));

            for (let prop in values) this[prop] = values[prop];

            this._setup();

            this._update();
        }
        async _setup() {
            let id = Symbol();
            let hooks = createHooks(() => this._update(), this);

            this.update = () => {
                render(hooks.load(component, { ...this._props }), this, id);
                hooks.updated();
            };

            await this.unmounted;

            hooks.unmount();
        }
        async _update() {
            if (!this._prevent) {
                this._prevent = true;
                /**@type {()=>void} */
                let resolveUpdate;
                this.updated = new Promise(
                    (resolve) => (resolveUpdate = resolve)
                );

                await this.mounted;

                this.update();

                this._prevent = false;

                resolveUpdate();
            }
        }

        connectedCallback() {
            this.mount();
        }
        disconnectedCallback() {
            this.unmount();
        }
        /**
         *
         * @param {string} attr
         * @param {(string|null)} oldValue
         * @param {(string|null)} value
         */
        attributeChangedCallback(attr, oldValue, value) {
            if (attr === this._ignoreAttr || oldValue === value) return;
            // Choose the property name to send the update
            this[attrs[attr]] = value;
        }
    }

    for (let prop in props) {
        setPrototype(Element.prototype, prop, props[prop], attrs, values);
    }

    Element.observedAttributes = Object.keys(attrs);

    return Element;
}

var style = ":host{display:inline-block;position:relative;width:auto;height:auto;}svg{display:block;}g,circle{transition:1s ease all;}.centered{width:100%;height:100%;position:absolute;top:0px;left:0px;display:flex;align-items:center;justify-content:center;}";

const DataCircleProgress = ({
  size,
  parts,
  progress,
  brSize,
  brSizeState = brSize,
  brColor,
  brColorCero,
  brColorNegative,
  brColorPositive,
}) => {
  const radio = 40;
  const arco = Math.PI * 2 * radio;
  const deg90 = arco / 4;
  const sizeProgress = Math.abs((arco / parts) * progress);
  const sizeDiff = arco - sizeProgress;
  const strokeState =
    progress == 0
      ? brColorCero
      : progress > 0
      ? brColorPositive
      : brColorNegative;
  return (
    h('host', { shadowDom: true,}
      , h('style', null, style)
      , h('svg', { width: size, viewBox: "0 0 100 100"   ,}
        , h('circle', {
          cx: "50",
          cy: "50",
          r: radio,
          stroke: brColor,
          'stroke-width': brSize,
          fill: "transparent",}
        )
        , h('g', {
          transform: "scale(-1,1)",
          'transform-origin': "center",
          style: progress > 0 ? "opacity:1" : "opacity:1",}
        
          , circle({
            radio,
            brSize: brSizeState,
            stroke: strokeState,
            dasharray:
              progress > 0 ? "0," + arco : sizeProgress + "," + sizeDiff,
            deg90,
          })
        )
        , h('g', { style: progress > 0 ? "opacity:1" : "opacity:1",}
          , circle({
            radio,
            brSize: brSizeState,
            stroke: strokeState,
            dasharray:
              progress > 0 ? sizeProgress + "," + sizeDiff : "0," + arco,
            deg90,
          })
        )
      )
      , h('div', { class: "centered",}
        , h('slot', null)
      )
    )
  );
};

const circle = ({ radio, brSize, stroke, dasharray, deg90 }) => (
  h('circle', {
    cx: "50",
    cy: "50",
    r: radio,
    stroke: stroke,
    style: "transition:1s ease all"  ,
    'stroke-width': brSize,
    'stroke-dashoffset': deg90,
    'stroke-dasharray': dasharray,
    'stroke-linecap': "round",
    fill: "transparent",}
  )
);

DataCircleProgress.props = {
  progress: { type: Number, value: 0.5, reflect: true },
  parts: {
    type: Number,
    value: 1,
  },
  brColor: {
    type: String,
    value: "rgba(0,0,0,.1)",
  },
  brColorPositive: {
    type: String,
    value: "#1FE668",
  },
  brColorNegative: {
    type: String,
    value: "tomato",
  },
  brSize: {
    type: String,
    value: "6",
  },
  brSizeState: {
    type: String,
  },
  brColorCero: {
    type: String,
    value: "black",
  },
  size: {
    type: String,
    value: "100px",
  },
};

customElements.define("data-circle-progress", c(DataCircleProgress));

const DataSlotProgress = ({ cases, progress }) => {
  const slots = cases
    .split(/ *, */)
    .map((item) => {
      const test = item.match(/^ *([^\s]+) +([\d|.]+)(<|>){0,1}(=){0,1}$/);

      if (test) {
        const [, name, strN, case1, case2] = test;
        const value = Number(strN);
        const test1 = case1 && logic[case1](value);
        const test2 = case2 && logic[case2](value);
        return {
          name,
          test:
            test1 && test2
              ? (value) => test1(value) || test2(value)
              : test1 || test2,
        };
      }
    })
    .filter((value) => value);

  const slot = slots.find(({ test }) => test(progress));
  console.log(slot.name);
  return (
    h('host', { shadowDom: true,}
      , h('slot', { name: slot.name,})
    )
  );
};

const logic = {
  ">": (a) => (b) => a < b,
  "<": (a) => (b) => a > b,
  "=": (a) => (b) => a == b,
};

DataSlotProgress.props = {
  cases: String,
  progress: Number,
};

customElements.define("data-slot-progress", c(DataSlotProgress));

const DataIconArrow = ({
  type,
  size,
  color,
  transform,
  opacity,
}) => {
  return (
    h('host', { shadowDom: true,}
      , h('style', null, `g {opacity:${opacity}; transform-origin: center; transition:1s ease all; transform:${
        transform || "none"
      }}`)
      , type == "arrow" && (
        h('svg', { height: size, viewBox: "0 0 13 9"   ,}
          , h('g', null
            , h('path', {
              d: "M5.689,1.122a1,1,0,0,1,1.621,0l4.544,6.292A1,1,0,0,1,11.044,9H1.956a1,1,0,0,1-.811-1.585Z",
              fill: color,}
            )
          )
        )
      )
      , type == "equal" && (
        h('svg', { width: "11.001", height: size, viewBox: "0 0 11.001 8"   ,}
          , h('g', null
            , h('path', {
              d: "M-2073.6-1809a1.5,1.5,0,0,1-1.5-1.5,1.5,1.5,0,0,1,1.5-1.5h8a1.5,1.5,0,0,1,1.5,1.5,1.5,1.5,0,0,1-1.5,1.5Zm0-5a1.5,1.5,0,0,1-1.5-1.5,1.5,1.5,0,0,1,1.5-1.5h8a1.5,1.5,0,0,1,1.5,1.5,1.5,1.5,0,0,1-1.5,1.5Z",
              transform: "translate(2075.1 1817)" ,
              fill: color,}
            )
          )
        )
      )
    )
  );
};

DataIconArrow.props = {
  type: {
    type: String,
    value: "arrow",
  },
  size: {
    type: String,
    value: "10",
  },
  color: {
    type: String,
    value: "#1FE668",
  },
  transform: {
    type: String,
    value: "",
  },
  opacity: {
    type: Number,
    value: 1,
  },
};

customElements.define("data-icon", c(DataIconArrow));

var n=function(t,s,r,e){var u;s[0]=0;for(var h=1;h<s.length;h++){var p=s[h++],a=s[h]?(s[0]|=p?1:2,r[s[h++]]):s[++h];3===p?e[0]=a:4===p?e[1]=Object.assign(e[1]||{},a):5===p?(e[1]=e[1]||{})[s[++h]]=a:6===p?e[1][s[++h]]+=a+"":p?(u=t.apply(a,n(t,a,r,["",null])),e.push(u),a[0]?s[0]|=2:(s[h-2]=0,s[h]=u)):e.push(a);}return e},t=new Map;function htm(s){var r=t.get(this);return r||(r=new Map,t.set(this,r)),(r=n(this,r.get(s)||(r.set(s,r=function(n){for(var t,s,r=1,e="",u="",h=[0],p=function(n){1===r&&(n||(e=e.replace(/^\s*\n\s*|\s*\n\s*$/g,"")))?h.push(0,n,e):3===r&&(n||e)?(h.push(3,n,e),r=2):2===r&&"..."===e&&n?h.push(4,n,0):2===r&&e&&!n?h.push(5,0,!0,e):r>=5&&((e||!n&&5===r)&&(h.push(r,0,e,s),r=6),n&&(h.push(r,n,0,s),r=6)),e="";},a=0;a<n.length;a++){a&&(1===r&&p(),p(a));for(var l=0;l<n[a].length;l++)t=n[a][l],1===r?"<"===t?(p(),h=[h],r=3):e+=t:4===r?"--"===e&&">"===t?(r=1,e=""):e=t+e[0]:u?t===u?u="":e+=t:'"'===t||"'"===t?u=t:">"===t?(p(),r=1):r&&("="===t?(r=5,s=e,e=""):"/"===t&&(r<5||">"===n[a][l+1])?(p(),3===r&&(h=h[0]),r=h,(h=h[0]).push(2,0,r),r=0):" "===t||"\t"===t||"\n"===t||"\r"===t?(p(),r=2):e+=t),3===r&&"!--"===e&&(r=4,h=h[0]);}return p(),h}(s)),r),arguments,[])).length>1?r:r[0]}

const html = htm.bind(h);

const DataIconArrow$1 = ({
  type,
  size,
  color,
  transform,
  opacity,
}) => {
  return html`
    <host shadowDom>
      <style>
        ${`g {opacity:${opacity}; transform-origin: center; transition:1s ease all; transform:${
          transform || "none"
        }}`}
      </style>
      ${type == "arrow" &&
      html` <svg height="${size}" viewBox="0 0 13 9">
        <g>
          <path
            d="M5.689,1.122a1,1,0,0,1,1.621,0l4.544,6.292A1,1,0,0,1,11.044,9H1.956a1,1,0,0,1-.811-1.585Z"
            fill="${color}"
          />
        </g>
      </svg>`}
      ${type == "equal" &&
      html`<svg width="11.001" height="${size}" viewBox="0 0 11.001 8">
        <g>
          <path
            d="M-2073.6-1809a1.5,1.5,0,0,1-1.5-1.5,1.5,1.5,0,0,1,1.5-1.5h8a1.5,1.5,0,0,1,1.5,1.5,1.5,1.5,0,0,1-1.5,1.5Zm0-5a1.5,1.5,0,0,1-1.5-1.5,1.5,1.5,0,0,1,1.5-1.5h8a1.5,1.5,0,0,1,1.5,1.5,1.5,1.5,0,0,1-1.5,1.5Z"
            transform="translate(2075.1 1817)"
            fill="${color}"
          />
        </g>
      </svg>`}
    </host>
  `;
};

DataIconArrow$1.props = {
  type: {
    type: String,
    value: "arrow",
  },
  size: {
    type: String,
    value: "10",
  },
  color: {
    type: String,
    value: "#1FE668",
  },
  transform: {
    type: String,
    value: "",
  },
  opacity: {
    type: Number,
    value: 1,
  },
};

customElements.define("data-icon-html", c(DataIconArrow$1));
