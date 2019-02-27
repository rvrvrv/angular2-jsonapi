import { BOOK_PUBLISHED, BOOK_TITLE } from './author.fixture';

export function getSampleBook(i: number, authorId: string, templateId: string|null = null, editionsIds: string[] = []) {
  const editionsData = editionsIds.map((id) => {
    return { id, type: 'books' };
  });
  const templateData = (!!templateId) ? { id: templateId, type: 'books' } : null;
  return {
    id: `${i}`,
    type: 'books',
    attributes: {
      date_published: BOOK_PUBLISHED,
      title: BOOK_TITLE,
      created_at: '2016-09-26T21:12:41Z',
      updated_at: '2016-09-26T21:12:41Z'
    },
    relationships: {
      template: {
        links: {
          self: `/v1/books/${i}/relationships/template`,
          related: `/v1/books/${i}/template`
        },
        data: templateData,
      },
      editions: {
        links: {
          self: `/v1/books/${i}/relationships/editions`,
          related: `/v1/books/${i}/editions`
        },
        data: editionsData,
      },
      chapters: {
        links: {
          self: `/v1/books/${i}/relationships/chapters`,
          related: `/v1/books/${i}/chapters`
        }
      },
      firstChapter: {
        links: {
          self: `/v1/books/${i}/relationships/firstChapter`,
          related: `/v1/books/${i}/firstChapter`
        }
      },
      author: {
        links: {
          self: `/v1/books/${i}/relationships/author`,
          related: `/v1/books/${i}/author`
        },
        data: {
          id: authorId,
          type: 'authors'
        }
      }
    },
    links: {
      self: `/v1/books/${i}`
    }
  };
}
