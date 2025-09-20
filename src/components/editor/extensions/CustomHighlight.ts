
import { Mark } from '@tiptap/core';
import { v4 as uuidv4 } from 'uuid';

export interface HighlightOptions {
  multicolor: boolean,
  HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: {
      setHighlight: (attributes?: { 'data-highlight-id': string }) => ReturnType,
      toggleHighlight: (attributes?: { 'data-highlight-id': string }) => ReturnType,
      unsetHighlight: () => ReturnType,
    }
  }
}

export const CustomHighlight = Mark.create<HighlightOptions>({
  name: 'highlight',
  addOptions() {
    return {
      multicolor: false,
      HTMLAttributes: {},
    }
  },
  addAttributes() {
    return {
      'data-highlight-id': {
        default: null,
        parseHTML: element => element.getAttribute('data-highlight-id'),
        renderHTML: attributes => {
          if (!attributes['data-highlight-id']) {
            return {}
          }
          return {
            'data-highlight-id': attributes['data-highlight-id'],
            'style': 'background-color: #fef08a; padding: 1px 0; border-radius: 2px;',
          }
        },
      },
    }
  },
  parseHTML() {
    return [{ tag: 'mark' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['mark', HTMLAttributes, 0]
  },
  addCommands() {
    return {
      setHighlight: attributes => ({ commands }) => {
        const highlightId = attributes?.['data-highlight-id'] || uuidv4();
        return commands.setMark(this.name, { 'data-highlight-id': highlightId })
      },
      toggleHighlight: attributes => ({ commands }) => {
        const highlightId = attributes?.['data-highlight-id'] || uuidv4();
        return commands.toggleMark(this.name, { 'data-highlight-id': highlightId })
      },
      unsetHighlight: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },
})