import Stellar from './core';
import Yup from 'yup';

Yup.match = function (key, message, func) {
  message = message || 'Values do not match';
  func = func || function (value) {
    return value === this.options.context[key];
  }

  return Yup.mixed().test('match', message, func);
};

Stellar.forms.Yup = Yup;
