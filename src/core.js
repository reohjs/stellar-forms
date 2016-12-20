
const Stellar = window.Stellar || {};

Stellar.forms = {};

Stellar.forms.debug = false;
Stellar.forms._propHandlers = [];

Stellar.forms.onBlur = true;
Stellar.forms.onChange = true;

// Allow extension of setProps via handlers
Stellar.forms.onSetProps = function (func) {
  Stellar.forms._propHandlers.push(func);
};

Stellar.forms._config = {};

Stellar.forms.config = function (key, obj) {
  if (key) {
    if (obj) {
      this._config[key] = obj;
    } else {
      return this._config[key];
    }
  }
};

Stellar.forms.validator = 'yup';

Stellar.forms.AUTOFILL_VALIDATION_DELAY = 1000;

export default Stellar;


const log = console.log.bind(console);
if (!Stellar.forms.debug) window.log = function () {};

export {log};

const warn = console.warn.bind(console);
if (!Stellar.forms.debug) window.warn = function () {};

export {warn};
