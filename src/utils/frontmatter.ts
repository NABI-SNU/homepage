import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import type { RehypePlugin, RemarkPlugin } from '@astrojs/markdown-remark';

export const readingTimeRemarkPlugin: RemarkPlugin = () => {
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = Math.ceil(getReadingTime(textOnPage).minutes);

    if (typeof file?.data?.astro?.frontmatter !== 'undefined') {
      file.data.astro.frontmatter.readingTime = readingTime;
    }
  };
};

export const responsiveTablesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    if (!tree.children) return;

    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];

      if (child.type === 'element' && child.tagName === 'table') {
        tree.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: {
            style: 'overflow:auto',
          },
          children: [child],
        };

        i++;
      }
    }
  };
};

export const lazyImagesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    if (!tree.children) return;

    visit(tree, 'element', function (node) {
      if (node.tagName === 'img') {
        // Add lazy loading
        node.properties.loading = 'lazy';
        
        // Add decoding attribute for better performance
        node.properties.decoding = 'async';
        
        // Ensure width and height are present for better CLS
        if (!node.properties.width && !node.properties.height) {
          // Try to extract from style attribute
          const style = node.properties.style as string;
          if (style && style.includes('width:')) {
            const widthMatch = style.match(/width:\s*(\d+)%/);
            if (widthMatch) {
              // For percentage widths, set a reasonable default
              node.properties.width = '800';
              node.properties.height = '400';
            }
          } else {
            // Default dimensions for images without explicit width/height
            node.properties.width = '800';
            node.properties.height = '400';
          }
        }
      }
    });
  };
};
