class TonicRouter extends Tonic { /* global Tonic */
  constructor () {
    super()

    const that = this

    if (TonicRouter.patched) return
    TonicRouter.patched = true

    const createEvent = function (type) {
      const orig = window.history[type]
      return function (...args) {
        that.reset()

        const value = orig.call(this, ...args)
        window.dispatchEvent(new window.Event(type.toLowerCase()))

        const nodes = document.getElementsByTagName('tonic-router')
        for (const node of nodes) node.reRender()
        return value
      }
    }

    window.addEventListener('popstate', e => this.reRender(p => p))

    window.history.pushState = createEvent('pushState')
    window.history.replaceState = createEvent('replaceState')
  }

  stylesheet () {
    return `
      tonic-router {
        display: none;
      }

      tonic-router.tonic--show {
        display: block;
      }
    `
  }

  reset () {
    TonicRouter.matches = false
    const contentTags = document.getElementsByTagName('tonic-router')
    Array.from(contentTags).forEach(tag => tag.classList.remove('tonic--show'))
  }

  willConnect () {
    this.template = document.createElement('template')
    this.template.innerHTML = this.innerHTML
  }

  updated () {
    if (!this.classList.contains('tonic--show')) return
    const event = new window.Event('match')
    this.dispatchEvent(event)
  }

  render () {
    const none = this.hasAttribute('none')

    if (none) {
      if (TonicRouter.matches) return
      this.classList.add('tonic--show')
      return this.template.content
    }

    const path = this.getAttribute('path')
    const keys = []
    const matcher = TonicRouter.matcher(path, keys)
    const match = matcher.exec(window.location.pathname)

    if (match) {
      TonicRouter.matches = true

      match.slice(1).forEach((m, i) => {
        this.props[keys[i].name] = m
      })

      this.classList.add('tonic--show')
      return this.template.content
    }

    return ''
  }
}

TonicRouter.matches = false
TonicRouter.matcher = (() => {
  //
  // Most of this was lifted from the path-to-regex project which can
  // be found here -> https://github.com/pillarjs/path-to-regexp
  //
  const DEFAULT_DELIMITER = '/'
  const DEFAULT_DELIMITERS = './'

  const PATH_REGEXP = new RegExp([
    '(\\\\.)',
    '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
  ].join('|'), 'g')

  function parse (str, options) {
    let tokens = []
    let key = 0
    let index = 0
    let path = ''
    let defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER
    let delimiters = (options && options.delimiters) || DEFAULT_DELIMITERS
    let pathEscaped = false
    let res

    while ((res = PATH_REGEXP.exec(str)) !== null) {
      let m = res[0]
      let escaped = res[1]
      let offset = res.index
      path += str.slice(index, offset)
      index = offset + m.length

      // Ignore already escaped sequences.
      if (escaped) {
        path += escaped[1]
        pathEscaped = true
        continue
      }

      let prev = ''
      let next = str[index]
      let name = res[2]
      let capture = res[3]
      let group = res[4]
      let modifier = res[5]

      if (!pathEscaped && path.length) {
        let k = path.length - 1

        if (delimiters.indexOf(path[k]) > -1) {
          prev = path[k]
          path = path.slice(0, k)
        }
      }

      if (path) {
        tokens.push(path)
        path = ''
        pathEscaped = false
      }

      let partial = prev !== '' && next !== undefined && next !== prev
      let repeat = modifier === '+' || modifier === '*'
      let optional = modifier === '?' || modifier === '*'
      let delimiter = prev || defaultDelimiter
      let pattern = capture || group

      tokens.push({
        name: name || key++,
        prefix: prev,
        delimiter: delimiter,
        optional: optional,
        repeat: repeat,
        partial: partial,
        pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
      })
    }

    if (path || index < str.length) {
      tokens.push(path + str.substr(index))
    }

    return tokens
  }

  function escapeString (str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
  }

  function escapeGroup (group) {
    return group.replace(/([=!:$/()])/g, '\\$1')
  }

  function flags (options) {
    return options && options.sensitive ? '' : 'i'
  }

  function regexpToRegexp (path, keys) {
    if (!keys) return path

    const groups = path.source.match(/\((?!\?)/g)

    if (groups) {
      for (let i = 0; i < groups.length; i++) {
        keys.push({
          name: i,
          prefix: null,
          delimiter: null,
          optional: false,
          repeat: false,
          partial: false,
          pattern: null
        })
      }
    }

    return path
  }

  function arrayToRegexp (path, keys, options) {
    let parts = []

    for (let i = 0; i < path.length; i++) {
      parts.push(pathToRegexp(path[i], keys, options).source)
    }

    return new RegExp('(?:' + parts.join('|') + ')', flags(options))
  }

  function stringToRegexp (path, keys, options) {
    return tokensToRegExp(parse(path, options), keys, options)
  }

  function tokensToRegExp (tokens, keys, options) {
    options = options || {}

    let strict = options.strict
    let end = options.end !== false
    let delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER)
    let delimiters = options.delimiters || DEFAULT_DELIMITERS
    let endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|')
    let route = ''
    let isEndDelimited = tokens.length === 0

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i]

      if (typeof token === 'string') {
        route += escapeString(token)
        isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1
      } else {
        let prefix = escapeString(token.prefix)
        let capture = token.repeat
          ? '(?:' + token.pattern + ')(?:' + prefix + '(?:' + token.pattern + '))*'
          : token.pattern

        if (keys) keys.push(token)

        if (token.optional) {
          if (token.partial) {
            route += prefix + '(' + capture + ')?'
          } else {
            route += '(?:' + prefix + '(' + capture + '))?'
          }
        } else {
          route += prefix + '(' + capture + ')'
        }
      }
    }

    if (end) {
      if (!strict) route += '(?:' + delimiter + ')?'

      route += endsWith === '$' ? '$' : '(?=' + endsWith + ')'
    } else {
      if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?'
      if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')'
    }

    return new RegExp('^' + route, flags(options))
  }

  function pathToRegexp (path, keys, options) {
    if (path instanceof RegExp) {
      return regexpToRegexp(path, keys)
    }

    if (Array.isArray(path)) {
      return arrayToRegexp(/** @type {!Array} */ (path), keys, options)
    }

    return stringToRegexp(/** @type {string} */ (path), keys, options)
  }

  return pathToRegexp
})()

Tonic.add(TonicRouter)
