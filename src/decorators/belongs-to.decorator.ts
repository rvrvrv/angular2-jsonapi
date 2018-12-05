import { BelongsToMetadata } from '../interfaces/relationship_metadata.interface';

export function BelongsTo(config: any = {}) {
  return function (target: any, propertyName: string) {
    const annotations: BelongsToMetadata = Reflect.getMetadata('BelongsTo', target) || [];

    annotations.push({
      propertyName,
      relationship: config.key || propertyName
    });

    Reflect.defineMetadata('BelongsTo', annotations, target);
  };
}
