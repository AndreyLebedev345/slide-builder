/**
 * AI Agent Tools for Slide Builder
 * 
 * This module provides OpenAI function calling compatible tools
 * for managing presentation slides through an AI agent.
 */

/**
 * Get all available tools for the slide builder
 */
export function getSlideBuilderTools() {
  return [
    addSlideTool(),
    changeThemeTool(),
    // Future tools will be added here:
    // updateSlideTool(),
    // deleteSlideTool(),
    // getSlideContentTool(),
    // reorderSlideTool(),
    // getCurrentSlideIndexTool(),
    // navigateToSlideTool(),
    // getAllSlidesTool(),
    // clearAllSlidesTool(),
    // duplicateSlideTool(),
  ];
}

/**
 * Tool: Add a new slide to the presentation
 */
function addSlideTool() {
  return {
    type: 'function',
    function: {
      name: 'add_slide',
      description: 'Add a new slide to the presentation. Supports various content types including titles, bullet points, code blocks, images, and custom HTML.',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'HTML content for the slide. Examples: "<h1>Title</h1><p>Text</p>", "<h2>Topic</h2><ul><li>Point 1</li><li>Point 2</li></ul>", "<pre><code>console.log(\'Hello\')</code></pre>"'
          },
          position: {
            type: 'number',
            description: 'Optional index where to insert the slide (0-based). If not provided, adds to the end.'
          },
          slideType: {
            type: 'string',
            enum: ['title', 'content', 'bullets', 'code', 'image', 'two-column', 'custom'],
            description: 'Type of slide to create. Helps with formatting suggestions.'
          },
          notes: {
            type: 'string',
            description: 'Optional speaker notes for the slide. Will be added as <aside class="notes">...</aside>'
          }
        },
        required: ['content'],
        additionalProperties: false
      }
    }
  };
}

/**
 * Tool: Change the presentation theme
 */
function changeThemeTool() {
  return {
    type: 'function',
    function: {
      name: 'change_theme',
      description: 'Change the visual theme of the presentation. Each theme has different color schemes and typography styles.',
      parameters: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
            enum: ['black', 'white', 'league', 'beige', 'night', 'serif', 'simple', 'solarized', 'moon', 'dracula', 'sky', 'blood'],
            description: 'The theme to apply. Options: black (default - black bg, white text, blue links), white (white bg, black text, blue links), league (gray bg, white text, blue links), beige (beige bg, dark text, brown links), night (black bg, thick white text, orange links), serif (cappuccino bg, gray text, brown links), simple (white bg, black text, blue links), solarized (cream bg, dark green text, blue links), moon (dark blue bg, thick grey text, blue links), dracula (dracula color scheme), sky (blue bg, thin dark text, blue links), blood (dark bg, thick white text, red links)'
          }
        },
        required: ['theme'],
        additionalProperties: false
      }
    }
  };
}

/**
 * Execute a tool function call on the slide builder
 */
export async function executeSlideToolCall(slideAPI, toolName, args) {
  switch (toolName) {
    case 'add_slide':
      // Build the slide HTML
      let slideHTML = args.content;
      
      // Add speaker notes if provided
      if (args.notes) {
        slideHTML += `\n<aside class="notes">${args.notes}</aside>`;
      }
      
      // Call the slideAPI to add the slide
      if (window.slideAPI && window.slideAPI.addSlide) {
        window.slideAPI.addSlide(slideHTML, args.position);
        
        const position = args.position !== undefined ? args.position : 'end';
        return {
          success: true,
          message: `Slide added at position: ${position}`,
          slideType: args.slideType || 'custom'
        };
      } else {
        return {
          success: false,
          message: 'Slide API not available. Make sure the presentation is loaded.'
        };
      }

    case 'change_theme':
      // Call the slideAPI to change theme
      if (window.slideAPI && window.slideAPI.changeTheme) {
        const result = window.slideAPI.changeTheme(args.theme);
        if (result) {
          return {
            success: true,
            message: `Theme changed to: ${args.theme}`
          };
        } else {
          return {
            success: false,
            message: `Failed to change theme to: ${args.theme}`
          };
        }
      } else {
        return {
          success: false,
          message: 'Theme change API not available.'
        };
      }

    // Future tool implementations will go here
    // case 'update_slide':
    //   ...
    // case 'delete_slide':
    //   ...
    
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Example slide templates for common use cases
 */
export const SLIDE_TEMPLATES = {
  title: (title, subtitle = '', author = '') => `
    <h1>${title}</h1>
    ${subtitle ? `<h3>${subtitle}</h3>` : ''}
    ${author ? `<p>${author}</p>` : ''}
  `,
  
  bullets: (title, points = []) => `
    <h2>${title}</h2>
    <ul>
      ${points.map(point => `<li>${point}</li>`).join('\n      ')}
    </ul>
  `,
  
  code: (title, code, language = '') => `
    <h2>${title}</h2>
    <pre><code${language ? ` class="language-${language}"` : ''} data-trim data-noescape>
${code}
    </code></pre>
  `,
  
  twoColumn: (title, leftContent, rightContent) => `
    <h2>${title}</h2>
    <div style="display: flex; align-items: center;">
      <div style="flex: 1;">
        ${leftContent}
      </div>
      <div style="flex: 1;">
        ${rightContent}
      </div>
    </div>
  `,
  
  image: (title, imageSrc, caption = '') => `
    <h2>${title}</h2>
    <img src="${imageSrc}" alt="${caption || title}" style="max-width: 80%;">
    ${caption ? `<p><small>${caption}</small></p>` : ''}
  `
};

/**
 * Example usage with OpenAI
 * 
 * ```javascript
 * import { getSlideBuilderTools, executeSlideToolCall } from './slide-tools';
 * 
 * const tools = getSlideBuilderTools();
 * 
 * // Make a request with tools
 * const response = await openai.chat.completions.create({
 *   model: 'gpt-4',
 *   messages: [
 *     { role: 'user', content: 'Add a title slide for my presentation about JavaScript' }
 *   ],
 *   tools: tools,
 *   tool_choice: 'auto'
 * });
 * 
 * // Execute any tool calls
 * if (response.choices[0].message.tool_calls) {
 *   for (const toolCall of response.choices[0].message.tool_calls) {
 *     const result = await executeSlideToolCall(
 *       window.slideAPI,
 *       toolCall.function.name,
 *       JSON.parse(toolCall.function.arguments)
 *     );
 *     console.log(`Tool ${toolCall.function.name} result:`, result);
 *   }
 * }
 * ```
 */