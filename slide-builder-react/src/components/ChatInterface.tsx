import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import OpenAI from 'openai';
import { getSlideBuilderTools, executeSlideToolCall, type SlideAPI } from '@/lib/slide-tools';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatInterfaceProps {
  slideAPI: SlideAPI;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ slideAPI }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Auto-resize textarea when input changes (including from prompt buttons)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Get API key from localStorage
      let apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        apiKey = prompt('Please enter your OpenAI API key:');
        if (!apiKey) {
          throw new Error('OpenAI API key is required');
        }
        localStorage.setItem('openai_api_key', apiKey);
      }

      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Only for development!
      });

      const tools = getSlideBuilderTools();
      
      // Build input array for Responses API
      const inputMessages: any[] = [];
      
      // Add conversation history
      messages.forEach(msg => {
        inputMessages.push({
          role: msg.role,
          content: msg.content
        });
      });
      
      // Add current user message
      inputMessages.push({
        role: 'user',
        content: userMessage
      });

      // Developer instructions for the slide builder agent
      const DEVELOPER_INSTRUCTIONS = `# Identity
You are a presentation slide builder assistant with access to tools for creating and managing slides.

## Current Presentation State
- Total slides: ${slideAPI.getTotalSlides()}
- Currently viewing: Slide ${slideAPI.getCurrentSlideIndex() + 1} (index: ${slideAPI.getCurrentSlideIndex()})

## PERSISTENCE AND ITERATIVE TOOL USE
You are an agent - please keep going until the user's query is completely resolved. You can:
1. Call tools to inspect the current state (e.g., get_all_slides)
2. Based on the results, decide what actions to take
3. Call more tools to modify slides as needed
4. Continue iterating until the task is complete

For example:
- If asked to "improve the current slide", first use get_all_slides to see it, then update_slide with improvements
- If asked to "add slides about X", you might first check existing slides, then add new ones that complement them

## TOOL CALLING
- ALWAYS use get_all_slides first to understand the current presentation before making changes
- When user says "update this slide" or "edit current slide", use index ${slideAPI.getCurrentSlideIndex()}
- When user asks for multiple slides (e.g., "add 3 slides"), call add_slide multiple times
- Each slide should be a separate add_slide tool call

## PLANNING
You MUST plan extensively before each function call, and reflect extensively on the outcomes of the previous function calls.

## Available Tools
- get_all_slides: Get the HTML content of all slides
- get_total_slides: Get the total number of slides
- replace_all_slides: Replace entire presentation with new slides
- clear_all_slides: Clear all slides from the presentation
- update_slide: Update a specific slide by index
- delete_slide: Delete a specific slide by index
- add_slide: Create new slides with HTML content
- change_theme: Switch between presentation themes

## Themes
Available themes: black (default), white, league, beige, night, serif, simple, solarized, moon, dracula, sky, blood

## HTML Guidelines
- Use proper HTML formatting
- Keep content concise and readable
- One main idea per slide
- Use appropriate heading levels (h1 for titles, h2 for slide headers)
- Use inline styles for layout when needed`;

      console.log('[ChatInterface] Starting iterative tool execution');
      
      // Keep track of all tool results for context
      const conversationMessages = [...inputMessages];
      const maxIterations = 10; // Prevent infinite loops
      let currentIteration = 0;
      
      while (currentIteration < maxIterations) {
        currentIteration++;
        console.log(`[ChatInterface] Iteration ${currentIteration}`);
        
        // Make request to OpenAI Responses API
        const response = await (openai as any).responses.create({
          model: 'gpt-4.1',
          instructions: DEVELOPER_INSTRUCTIONS,
          input: conversationMessages,
          tools: tools.map(t => ({
            type: t.type,
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters
          })),
          tool_choice: 'auto',
        });

        console.log('[ChatInterface] Response:', response);

        // Process the output array
        const output = response.output || [];
        const outputText = response.output_text || '';
        
        let hasToolCalls = false;
        const toolCallsWithResults: any[] = [];
        
        // Process each output item
        for (const item of output) {
          console.log('[ChatInterface] Processing output item:', item);
          
          if (item.type === 'text' && item.content) {
            // Assistant's text response
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: item.content 
            }]);
            // Add to conversation for next iteration
            conversationMessages.push({
              role: 'assistant',
              content: item.content
            });
          } else if (item.type === 'function_call' || item.type === 'custom_tool_call' || item.type === 'tool_call') {
            hasToolCalls = true;
            // Tool call
            try {
              const toolName = item.name || item.function?.name;
              const toolArgs = item.arguments ? JSON.parse(item.arguments) : 
                             item.input ? JSON.parse(item.input) : {};
              
              console.log('[ChatInterface] Executing tool:', toolName, toolArgs);
              
              const result = await executeSlideToolCall(
                slideAPI,
                toolName,
                toolArgs
              );
              
              // Store the tool call and its result
              toolCallsWithResults.push({
                name: toolName,
                args: toolArgs,
                result: result
              });
              
              // Show tool result in UI
              setMessages(prev => [...prev, {
                role: 'system',
                content: result.success ? `✓ ${result.message}` : `✗ ${result.message}`
              }]);
            } catch (error) {
              console.error('Error executing tool:', error);
              const errorResult = {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
              };
              
              toolCallsWithResults.push({
                name: item.name || item.function?.name,
                args: item.arguments || item.input || {},
                result: errorResult
              });
              
              setMessages(prev => [...prev, {
                role: 'system',
                content: `Error: ${errorResult.message}`
              }]);
            }
          }
        }
        
        // If we had tool calls, add them and their results to the conversation
        if (hasToolCalls && toolCallsWithResults.length > 0) {
          // Add a system message with tool results for the next iteration
          const toolResultsMessage = `Tool execution results:\n${toolCallsWithResults.map(t => 
            `- ${t.name}: ${JSON.stringify(t.result)}`
          ).join('\n')}`;
          
          conversationMessages.push({
            role: 'system',
            content: toolResultsMessage
          });
          
          console.log(`[ChatInterface] Added ${toolCallsWithResults.length} tool results to conversation`);
        }
        
        // If there's final output text and no more tool calls, we're done
        if (!hasToolCalls) {
          if (outputText && !output.some((item: any) => item.type === 'text')) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: outputText 
            }]);
          }
          break; // Exit the loop - task is complete
        }
        
        // Continue to next iteration with tool results
        console.log(`[ChatInterface] Continuing to next iteration with tool results in conversation`);
      }
      
      if (currentIteration >= maxIterations) {
        console.warn('[ChatInterface] Reached maximum iterations limit');
        setMessages(prev => [...prev, {
          role: 'system',
          content: 'Maximum iterations reached. Task may be incomplete.'
        }]);
      }

    } catch (error) {
      console.error('Error calling AI:', error);
      
      // Check if it's a 404 (Responses API not available)
      if (error instanceof Error && error.message.includes('404')) {
        console.log('[ChatInterface] Responses API not available, falling back to Chat Completions API');
        
        // Fallback to Chat Completions API
        try {
          const openai = new OpenAI({
            apiKey: localStorage.getItem('openai_api_key') || '',
            dangerouslyAllowBrowser: true
          });
          
          const tools = getSlideBuilderTools();
          
          // Build messages for Chat Completions API
          const chatMessages = [
            {
              role: 'system' as const,
              content: `You are a presentation slide builder assistant.
              
Current state: ${slideAPI.getTotalSlides()} slides, viewing slide ${slideAPI.getCurrentSlideIndex() + 1}.

IMPORTANT: When user asks for multiple slides, call add_slide multiple times.
Always use get_all_slides first to understand the current presentation.`
            },
            ...messages,
            { role: 'user' as const, content: input.trim() }
          ];
          
          const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: chatMessages,
            tools: tools as any,
            tool_choice: 'auto',
            temperature: 0.7
          });
          
          const message = response.choices[0].message;
          
          if (message.content) {
            setMessages(prev => [...prev, { role: 'assistant', content: message.content || '' }]);
          }
          
          if (message.tool_calls) {
            for (const toolCall of message.tool_calls) {
              try {
                const func = 'function' in toolCall ? toolCall.function : null;
                if (!func) continue;
                
                const args = JSON.parse(func.arguments);
                const result = await executeSlideToolCall(slideAPI, func.name, args);
                
                setMessages(prev => [...prev, {
                  role: 'system',
                  content: result.success ? `✓ ${result.message}` : `✗ ${result.message}`
                }]);
              } catch (err) {
                console.error('Tool execution error:', err);
              }
            }
          }
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
          throw fallbackError;
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-medium text-gray-700">Assistant</h2>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-end p-4">
            <div className="space-y-2">
              <p className="text-gray-400 text-sm text-center mb-4">How can I help you with your presentation?</p>
              <button
                type="button"
                onClick={() => {
                  setInput("Create a title slide for my presentation");
                  textareaRef.current?.focus();
                }}
                className="w-full text-left text-sm p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <p className="text-gray-700">Create a title slide for my presentation</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput("Add 3 slides about our product features");
                  textareaRef.current?.focus();
                }}
                className="w-full text-left text-sm p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <p className="text-gray-700">Add 3 slides about our product features</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInput("Change the theme to something more professional");
                  textareaRef.current?.focus();
                }}
                className="w-full text-left text-sm p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <p className="text-gray-700">Change the theme to something more professional</p>
              </button>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-4">
            <div ref={scrollAreaRef} className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "mb-4",
                  message.role === 'user' && "text-right"
                )}
              >
                {message.role === 'user' && (
                  <div className="inline-block max-w-[80%] text-left">
                    <p className="text-xs text-gray-500 mb-1">You</p>
                    <div className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                      {message.content}
                    </div>
                  </div>
                )}
                {message.role === 'assistant' && (
                  <div className="max-w-[80%]">
                    <p className="text-xs text-gray-500 mb-1">Assistant</p>
                    <div className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-200">
                      {message.content}
                    </div>
                  </div>
                )}
                {message.role === 'system' && (
                  <div className="max-w-[80%]">
                    <div className="inline-block px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
              {isLoading && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Assistant</p>
                  <div className="inline-flex gap-1">
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 mt-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2 items-end"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Message..."
            disabled={isLoading}
            className="flex-1 resize-none border border-gray-200 rounded-md px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-0 overflow-y-auto"
            style={{
              minHeight: '36px',
              maxHeight: '200px'
            }}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            size="icon"
            variant="ghost"
            className="h-9 w-9 hover:bg-gray-100 flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (
              <Send className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;