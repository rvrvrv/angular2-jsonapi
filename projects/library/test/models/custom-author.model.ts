import { Book } from './book.model';
import { JsonApiModelConfig } from '../../src/decorators/json-api-model-config.decorator';
import { JsonApiModel } from '../../src/models/json-api.model';
import { Attribute } from '../../src/decorators/attribute.decorator';
import { HasMany } from '../../src/decorators/has-many.decorator';
import { PageMetaData } from './page-meta-data';

export const AUTHOR_API_VERSION =    'v3';
export const AUTHOR_MODEL_ENDPOINT_URL =    'custom-author';

@JsonApiModelConfig({
  apiVersion: AUTHOR_API_VERSION,
  modelEndpointUrl: AUTHOR_MODEL_ENDPOINT_URL,
  type: 'authors',
  meta: PageMetaData
})
export class CustomAuthor extends JsonApiModel {
  @Attribute()
  name: string;

  @Attribute()
  dateOfBirth: Date;

  @Attribute()
  dateOfDeath: Date;

  @Attribute()
  createdAt: Date;

  @Attribute()
  updatedAt: Date;

  @HasMany()
  books: Book[];
}
