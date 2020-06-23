class Resource {
  static get MATCH_EXACT() {
    return 'exact';
  }

  static get MATCH_NAME() {
    return 'name';
  }

  static get MATCH_DIR() {
    return 'dir';
  }
  
  get matchType() {
    return this._matchType;
  }

  get path() {
    return this._props.path;
  }

  get dir() {
    return this._props.dir;
  }

  get base() {
    return this._props.base;
  }

  get name() {
    return this._props.name;
  }

  get ext() {
    return this._props.ext;
  }
  
  constructor(matchType, props) {
    if (!matchType) {
      throw new TypeError('`matchType required');
    }
    
    this._matchType = matchType;
    this._props = props || {};
  }
}

module.exports = exports = Resource;
