import { HasManyMetadata } from '../interfaces/relationship_metadata.interface';

export function HasMany(config: any = {}) {
  return function (target: any, propertyName: string) {
    const annotations: HasManyMetadata = Reflect.getMetadata('HasMany', target) || [];

    annotations.push({
      propertyName,
      relationship: config.key || propertyName
    });

    Reflect.defineMetadata('HasMany', annotations, target);
  };
}
