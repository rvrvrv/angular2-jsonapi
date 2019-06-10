import { Book } from './book.model';
import { JsonApiModelConfig } from '../../src/decorators/json-api-model-config.decorator';
import { JsonApiModel } from '../../src/models/json-api.model';
import { Attribute } from '../../src/decorators/attribute.decorator';
import { HasMany } from '../../src/decorators/has-many.decorator';
import { PageMetaData } from './page-meta-data';
import { JsonModelConverter } from '../../src/converters/json-model/json-model.converter';
import { NestedAttribute } from '../../src/decorators/nested-attribute.decorator';
import { School } from './school.model';

@JsonApiModelConfig({
  type: 'authors',
  meta: PageMetaData,
})
export class Author extends JsonApiModel {
  @Attribute()
  name: string;

  @Attribute({
    serializedName: 'dob'
  })
  dateOfBirth: Date;

  @Attribute()
  createdAt: Date;

  @Attribute()
  updatedAt: Date;

  @HasMany()
  books: Book[];

  @NestedAttribute({ converter: new JsonModelConverter<any>(School) })
  school: School;
}
