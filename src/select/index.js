class TonicSelect extends Tonic { /* global Tonic */
  defaults () {
    return {
      disabled: false,
      iconArrow: TonicSelect.svg.default(),
      width: '250px',
      radius: '2px'
    }
  }

  stylesheet () {
    return `
      tonic-select .tonic--wrapper {
        position: relative;
      }

      tonic-select .tonic--wrapper:before {
        content: '';
        width: 14px;
        height: 14px;
        opacity: 0;
        z-index: 1;
      }

      tonic-select.tonic--loading {
        pointer-events: none;
        transition: background 0.3s ease;
      }

      tonic-select.tonic--loading select {
        color: transparent;
        background-color: var(--tonic-window);
        border-color: var(--tonic-border);
      }

      tonic-select.tonic--loading .tonic--wrapper:before {
        margin-top: -8px;
        margin-left: -8px;
        display: block;
        position: absolute;
        bottom: 10px;
        left: 50%;
        opacity: 1;
        transform: translateX(-50%);
        border: 2px solid var(--tonic-medium);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear 0s infinite;
        transition: opacity 0.3s ease;
      }

      tonic-select select {
        color: var(--tonic-primary);
        font: 14px var(--tonic-monospace);
        background-color: var(--tonic-window);
        background-repeat: no-repeat;
        background-position: center right;
        border: 1px solid var(--tonic-border);
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        position: relative;
      }

      tonic-select select:not([multiple]) {
        padding: 10px 30px 10px 10px;
      }

      tonic-select select[disabled] {
        background-color: var(--tonic-background);
      }

      tonic-select label {
        color: var(--tonic-medium);
        font: 12px/14px var(--tonic-subheader);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding-bottom: 10px;
        display: block;
      }

      tonic-select[multiple] select {
        background-image: none !important;
      }

      tonic-select[multiple] select option {
        padding: 6px 10px;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `
  }

  get value () {
    const el = this.querySelector('select')

    if (this.props.multiple === 'true') {
      const value = [...el.options]
        .filter(el => el.selected)
        .map(el => el.getAttribute('value'))
      return value
    }

    return el.value
  }

  selectOptions (value) {
    const el = this.querySelector('select')
    const options = [...el.options]

    options.forEach(el => {
      el.selected = value.findIndex(v => v === el.value) > -1
    })
  }

  set value (value) {
    const multiSelect = (this.props.multiple === 'true') && Array.isArray(value)
    const el = this.root.querySelector('select')

    if (multiSelect) {
      this.selectOptions(value)
    } else if (!value) {
      value = el.selectedIndex
      el.selectedIndex = 0
    } else {
      el.value = value
    }
  }

  get option () {
    const node = this.querySelector('select')
    return node.options[node.selectedIndex]
  }

  get selectedIndex () {
    const node = this.querySelector('select')
    return node.selectedIndex
  }

  set selectedIndex (index) {
    const node = this.querySelector('select')
    node.selectedIndex = index
  }

  loading (state) {
    const method = state ? 'add' : 'remove'
    this.classList[method]('tonic--loading')
  }

  renderLabel () {
    if (!this.props.label) return ''
    return `<label>${this.props.label}</label>`
  }

  styles () {
    const {
      height,
      width,
      padding,
      radius,
      iconArrow
    } = this.props

    return {
      wrapper: {
        width
      },
      select: {
        width,
        height,
        borderRadius: radius,
        padding,
        backgroundImage: `url('${iconArrow}')`
      }
    }
  }

  connected () {
    const value = this.props.value

    if (Array.isArray(value)) {
      this.selectOptions(value)
    } else if (value) {
      const option = this.querySelector(`option[value="${value}"]`)
      if (option) option.setAttribute('selected', true)
    }
  }

  render () {
    const {
      width,
      height,
      disabled,
      required,
      multiple,
      theme,
      size,
      tabindex
    } = this.props

    const disabledAttr = disabled && disabled === 'true' ? `disabled="true"` : ''
    const multipleAttr = multiple && multiple === 'true' ? `multiple="true"` : ''
    const tabAttr = tabindex ? `tabindex="${tabindex}"` : ''
    const sizeAttr = size ? `size="${size}"` : ''

    if (width) this.style.width = width
    if (height) this.style.width = height
    if (theme) this.classList.add(`tonic--theme--${theme}`)
    if (tabindex) this.removeAttribute('tabindex')

    const attributes = [
      disabledAttr,
      multipleAttr,
      required,
      sizeAttr,
      tabAttr
    ].join(' ')

    return this.html`
      <div class="tonic--wrapper" styles="wrapper">
        ${this.renderLabel()}
        <select styles="select" ${attributes}>
          ${this.childNodes}
        </select>
      </div>
    `
  }
}

TonicSelect.svg = {}
TonicSelect.svg.toURL = s => `data:image/svg+xml;base64,${window.btoa(s)}`
TonicSelect.svg.default = () => TonicSelect.svg.toURL(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <path fill="#D7DBDD" d="M61.4,45.8l-11,13.4c-0.2,0.3-0.5,0.3-0.7,0l-11-13.4c-0.3-0.3-0.1-0.8,0.4-0.8h22C61.4,45,61.7,45.5,61.4,45.8z"/>
  </svg>
`)

Tonic.add(TonicSelect)
