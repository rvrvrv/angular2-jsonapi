import * as moment from 'moment';

export function Attribute(config: any = {}) {
  return function(target: any, propertyName: string) {

    const serialize = (dataType: any, value: any) => {
      if (dataType === Date || dataType === 'Date') {
        return moment(value).format(moment.defaultFormatUtc);
      }
      return value;
    };

    const deserialize = (dataType: any, value: any) => {
      if (dataType === Date || dataType === 'Date') {
        return moment(value).toDate();
      }
      return value;
    };

    let saveAnnotations = function(hasDirtyAttributes: boolean, oldValue: any, newValue: any, isNew: boolean) {
      let annotations = Reflect.getMetadata('Attribute', target) || {};
      let targetType = Reflect.getMetadata('design:type', target, propertyName);

      hasDirtyAttributes = typeof oldValue === 'undefined' && !isNew ? false : hasDirtyAttributes;
      annotations[propertyName] = {
        hasDirtyAttributes: hasDirtyAttributes,
        oldValue: oldValue,
        newValue: newValue,
        serialisationValue: serialize(targetType, newValue),
      };
      Reflect.defineMetadata('Attribute', annotations, target);
    };

    let getter = function() {
      return this['_' + propertyName];
    };

    let setter = function(newVal: any) {
      let targetType = Reflect.getMetadata('design:type', target, propertyName);
      let convertedValue = deserialize(targetType, newVal);
      if (convertedValue !== this['_' + propertyName]) {
        saveAnnotations(true, this['_' + propertyName], newVal, !this.id);
        this['_' + propertyName] = convertedValue;
      }
    };

    if (delete target[propertyName]) {
      saveAnnotations(false, undefined, target[propertyName], target.id);
      Object.defineProperty(target, propertyName, {
        get: getter,
        set: setter,
        enumerable: true,
        configurable: true
      });
    }
  };
}
