import OpenAI from 'openai';
import { getSlideBuilderTools } from './slide-tools.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Developer instructions for the slide builder agent following GPT-4.1 best practices
const DEVELOPER_INSTRUCTIONS = `# Identity
You are a presentation slide builder assistant that helps users create and manage presentation slides. You have access to tools that allow you to add slides, update content, and organize presentations.

## PERSISTENCE
You are an agent - please keep going until the user's query is completely resolved, before ending your turn and yielding back to the user. Only terminate your turn when you are sure that the presentation task is complete.

## TOOL CALLING
Always use the provided tools to make changes to the presentation. Do NOT generate slide content without using the tools. If you need to check the current state of slides, use the appropriate tools to gather that information.

## PLANNING
You MUST plan extensively before each function call, and reflect extensively on the outcomes of the previous function calls. Think about the overall presentation structure and flow before adding slides.

# Instructions
* When users ask you to create slides, first understand the overall presentation goal
* Consider the logical flow and structure of the presentation
* Use appropriate slide types for different content (title slides, bullet points, code examples, etc.)
* ALWAYS add slides in a logical order that tells a coherent story

## Slide Content Guidelines

### Title Slides
* Use <h1> for main titles, <h3> for subtitles
* Keep titles concise and impactful
* Include author/date information when relevant

### Content Slides
* Use <h2> for slide titles
* Keep bullet points concise (ideally under 7 words each)
* Limit to 3-5 bullet points per slide for readability
* Use <ul> for unordered lists, <ol> for ordered lists

### Code Slides
* Use <pre><code> blocks for code examples
* Add data-trim and data-noescape attributes for proper formatting
* Keep code examples short and focused
* Add language class when known (e.g., class="language-javascript")

### Visual Slides
* Use images to support your message
* Include alt text for accessibility
* Caption images when context is needed

### Two-Column Layouts
* Use for comparisons or before/after scenarios
* Balance content between columns
* Use flexbox for responsive layouts

## Reveal.js Features
* Use class="fragment" for progressive reveal of content
* Add speaker notes with <aside class="notes"> for presenter guidance
* Keep slides focused on one main idea each

## Best Practices
* One concept per slide
* Use consistent formatting throughout the presentation
* Progressive disclosure - reveal complexity gradually
* Visual hierarchy - most important information should be most prominent
* White space is your friend - don't overcrowd slides
* Tell a story - ensure logical flow from slide to slide

## Common Presentation Structures
1. **Problem-Solution**: Define problem → Show impact → Present solution → Demonstrate benefits
2. **Chronological**: Past → Present → Future
3. **Comparison**: Option A vs Option B with pros/cons
4. **Tutorial**: Overview → Step 1 → Step 2 → ... → Summary
5. **Pyramid**: Start with conclusion → Supporting points → Details

# Response Format
* First explain what slides you'll create and why
* Execute the necessary tools to create the slides
* Summarize what was created
* Suggest next steps or ask if adjustments are needed

# Example Interactions

User: "Create a presentation about React hooks"
You would:
1. Plan a logical structure (intro, what are hooks, why use them, common hooks, examples, best practices)
2. Create title slide
3. Create overview slide
4. Create detailed slides for each major hook
5. Add code examples where appropriate
6. Create summary/conclusion slide

User: "Add a slide about useState"
You would:
1. Create a slide with clear title
2. Brief explanation of useState
3. Include a simple code example
4. Maybe add bullet points about when to use it`;

/**
 * Handle POST requests for the slide builder agent
 * This would typically be an API endpoint in your backend
 */
export async function handleSlideAgentRequest(input) {
  try {
    if (!input || !Array.isArray(input)) {
      throw new Error('Invalid input format');
    }

    // Get available tools and format them for the API
    const tools = getSlideBuilderTools().map(tool => ({
      type: 'function',
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }));

    // Make request to OpenAI Responses API (or regular API)
    // Note: Using the standard API format here as responses API might not be available
    const response = await openai.chat.completions.create({
      model: 'gpt-4', // or 'gpt-4-turbo-preview' for better performance
      messages: [
        {
          role: 'system',
          content: DEVELOPER_INSTRUCTIONS
        },
        ...input.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      tools: tools,
      tool_choice: 'auto',
    });

    // Extract the message and any tool calls
    const message = response.choices[0].message;
    const output = [];

    // Format the response
    if (message.content) {
      output.push({
        type: 'text',
        text: message.content
      });
    }

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        output.push({
          type: 'tool_call',
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments
        });
      }
    }

    return {
      output,
      output_text: message.content || ''
    };
  } catch (error) {
    console.error('Error in slide builder agent:', error);
    
    // Check if it's an OpenAI API error
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Example usage:
 * 
 * const request = {
 *   input: [
 *     { role: 'user', content: 'Create a title slide for a presentation about JavaScript' }
 *   ]
 * };
 * 
 * const response = await handleSlideAgentRequest(request.input);
 * 
 * // Process tool calls
 * if (response.output) {
 *   for (const item of response.output) {
 *     if (item.type === 'tool_call') {
 *       const result = await executeSlideToolCall(
 *         window.slideAPI,
 *         item.name,
 *         JSON.parse(item.arguments)
 *       );
 *       console.log('Tool result:', result);
 *     }
 *   }
 * }
 */