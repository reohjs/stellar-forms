import React from 'react';
import _ from 'lodash';
import Yup from 'yup';

import Stellar, {log} from './core';

export default class extends React.Component {
  render () {
    let {styles} = this.props;
    let childs = this.renderChildren();

    return (
      <form onSubmit={this.submit} style={styles}>
        {childs}
      </form>
    )
  }

  constructor (props) {
    super(props);
    this.state = {
      values: {},
      errors: {}
    };

    this.submit = this.submit.bind(this);
    this.validateField = this.validateField.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.isValid = this.isValid.bind(this);
    this.getErrors = this.getErrors.bind(this);
    // for some reason this is working without this... could be due to babel
    // this.onSetProps = this.onSetProps.bind(this);
    this.renderChildren = this.renderChildren.bind(this);
    this.setProps = this.setProps.bind(this);
    this.blur = this.blur.bind(this);

    if (props.submitter) {
      props.submitter.submit = this.submit;
    }
  }

  componentDidMount () {
    // validate form at startup, incase of autofill (lastpass etc.)
    setTimeout(() => {
      let data = Object.keys(this.state.values)[0];
      if (data) {
        log('[Stellar.forms]: Form has autofilled data, now validating. ', data);
        this.validateForm();
      }
    }, Stellar.forms.AUTOFILL_VALIDATION_DELAY);
  }

  submit (event) {
    if (event) event.stopPropagation();
    if (event) event.preventDefault();
    let {onValidSubmit, onInvalidSubmit} = this.props;
    let data = this.state.values;
    let errors = this.state.errors;

    //this.blur(); // Just in case a field doesn't blur before a submit

    if (this.state.isValid && typeof onValidSubmit === 'function') {
      onValidSubmit(data);
    }
    else if (typeof onInvalidSubmit === 'function') {
      onInvalidSubmit(errors, data);
    }
    // Generate form data
  }

  parentSubmit () {
    this.submit();
  }
  // sync input values
  updateValue (key) {
    return (event) => {
      log('[updateValue]: ', key, event);
      let {values} = this.state;
      values[key] = event.target.value;
      this.setState({values});
    }
  }

  validateField (key) {
    // Return callback for event props to use
    return (event) => {
      // validator => use this to maybe support validator's other than Joi in future
      let schema = this.props.schema || this.props.validator;
      let target = event.target; // Store DOM node
      let value = target.value; // Retrieve value from DOM node in SyntheticEvent
      let context = this.state.values; // Pass context for field matching
      log('[Stellar.forms] Running validation: ', schema, target, value, context, key);

      if (schema && Stellar.forms.validator === 'yup') {
        // Validate value
        schema[key].validate(value, {context}).then(v => {
          if (!v) {return}
          log('[StellarForm.validateField] Form values: ', v);
          this.validateForm();
        }).catch(error => {
          if (!error) {return}
          // Update values
          let {values} = this.state;
          values[key] = value;
          this.setState({values});
          log('[StellarForm.validateField] Form error: ', error);
          this.validateForm();
        })
        .catch(e => {
          console.log('[StellarForm.validateField]: ', e);
        })
      }
    }
  }

  // Validate entire form; only set isValid:true if all required fields are present
  validateForm () {
    let schema = Yup.object().shape(this.props.schema);
    let {values, errors} = this.state;

    schema.validate(values, {context: values, abortEarly: false}).then((value) => {
      if (!value) return;
      log('[StellarForm.validateForm]: ', value, values, errors);
      this.isValid(true, {});
    })
    .catch((error) => {
      if (!error) return;
      log('[!StellarForm.validateForm]: ', error, values, errors);
      let e = this.getErrors(error);
      // {field: {}}
      //this.setState({errors});
      this.isValid(false, e);
    })
    .catch((e) => {
      console.log('[StellarForm.validateForm] (error): ', e);
    });
  }

  isValid (flag, errors) {
    //let hasErrors = Object.keys(this.state.errors).length > 0;
    let {onValid, onInvalid} = this.props;
    /*if (flag && hasErrors) {
      // If value is valid but we stil have errors, don't modify state
      return;
    } else {*/
      this.setState({isValid: flag, errors});

      if (flag && onValid) {
        onValid();
      }
      else if (onInvalid) {
        onInvalid();
      }
    /*}*/

    return this.state.isValid;
  }

  getErrors (error) {
    let e = {};
    // {path, message} => {path: message, ...}
    error.inner.forEach(obj => {
      e[obj.path] = obj.message;
    });

    return e;
  }

  onSetProps (props, key) {
    /*debug()(
      '[Stellar.forms] Running onSetProps handlers with: [props: ', props,
      ', key:', key, ']');*/
    Stellar.forms._propHandlers.forEach((cb) => {
      cb(props, key, this);
    });
  }

  renderChildren () {
    let {children} = this.props;
    let {setProps} = this;

    return React.Children.map(children, function (child) {
      if (! child) {return;}
      let props = {};
      // Allows overwriting the onBlur prop name e.g. onDismiss
      if (child.props.name) {
        //debug()('[Stellar.forms] mapping child: ', child);
        props = setProps(child);
      }
      // bad - suppress react#7132 until 16.0
      // https://facebook.github.io/react/warnings/dont-call-proptypes.html
      //props.secret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

      return React.cloneElement(child, props);
    });
  }

  setProps (child) {
    let {config} = this.props || {};

    let key = child.props.name;
    let globalConfig = Stellar.forms._config[key];

    if (config) {
      config = config[key];
    }
    else if (globalConfig) {
      config = globalConfig;
    } else {
      config = {}
    }

    //debug()('config: ', config);

    let props = {};

    if (Stellar.forms.onBlur) {
      let onBlurKey = 'onBlur'; // default key
      if (config.onBlurKey) {
        onBlurKey = config.onBlurKey;
      }
      props[onBlurKey] = this.validateForm; // default callback, must be fn
      if (config.onBlur) {
        props[onBlurKey] = config.onBlur.bind(this, key);
      }
    }

    if (Stellar.forms.onChange) {
      let onChangeKey = 'onChange';
      if (config.onChangeKey) {
        onChangeKey = config.onChangeKey;
      }
      props[onChangeKey] = this.updateValue(key);
      if (config.onChange) {
        props[onChangeKey] = config.onChange.bind(this, key);
      }
      //props.value = this.state.values[key]; don't use controlled for now
    }

    /*if (Stellar.forms.useRefs) {
      let refKey = 'ref';
      props[refKey] = (input) => this[key] = input;
    }*/

    // Call external setProps handlers
    this.onSetProps(props, key);

    //debug()('[Stellar.forms] setting props: ', props, ' key: ', key);

    return props;
  }

  blur () {
    log('[Stellar.forms] blurred: ', this.refs.form);
    this.refs.form.blur();
  }
}
