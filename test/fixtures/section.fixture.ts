export function getSampleSection(
  sectionId: string,
  chapterId: string,
  content: string = 'Dummy content',
  parentSectionId: string = '0') {
  return {
    id: sectionId,
    type: 'sections',
    attributes: {
      content,
      created_at: '2016-10-01T12:54:32Z',
      updated_at: '2016-10-01T12:54:32Z'
    },
    relationships: {
      children: {
        data: [
          {
            type: 'sections',
            id: '2'
          }
        ]
      },
      parent: {
        data: {
          type: 'sections',
          id: parentSectionId || '0'
        }
      },
      chapter: {
        data: {
          id: chapterId,
          type: 'chapters'
        }
      },
      firstParagraph: {
        data: {
          id: '1',
          type: 'paragraphs'
        }
      }
    }
  };
}
