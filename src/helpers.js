import Stellar from './core';

const helpers = {};

// Temporary wrapper for console.log
helpers.debug = function () {
  let client = window && Stellar.forms.debug('client');
  let server = Stellar.forms.debug('server');

  if (arguments[0]) {
    let msg = '[Stellar.forms] !!! Arguments were passed to internal debug function,'
            + ' this is likely not correct! (usage: debug()("message here"))';
    if (console.warn) {
      console.warn(msg);
    } else {
      console.log(msg);
    }
  }

  if (client || server) {
    // Return a binding to be invoked with ()
    // Maintains line numbering
    return console.log.bind(console);
  } else {
    return function () {};
  }
};

export default helpers;
