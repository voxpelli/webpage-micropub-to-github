'use strict';

const deepFreeze = function (obj) {
  Object.keys(obj).forEach(key => {
    const item = obj[key];
    if (typeof item === 'object' && !Object.isFrozen(item)) {
      obj[key] = deepFreeze(item);
    }
  });
  return Object.freeze(obj);
};

module.exports = {
  deepFreeze
};
