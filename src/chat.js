import { executeSlideToolCall } from './slide-tools.js';

// Chat message history
let messageHistory = [];

// Initialize chat functionality
export function initChat() {
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');

  if (!chatInput || !sendBtn || !chatMessages) return;

  // Send message on button click
  sendBtn.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
      sendMessage(message);
      chatInput.value = '';
    }
  });

  // Send message on Enter key
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (message) {
        sendMessage(message);
        chatInput.value = '';
      }
    }
  });
}

// Add message to chat display
function addMessageToChat(content, sender = 'user') {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.textContent = content;
  
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message to AI agent
async function sendMessage(message) {
  // Add user message to chat
  addMessageToChat(message, 'user');
  
  // Add to message history
  messageHistory.push({ role: 'user', content: message });
  
  // Show typing indicator
  showTypingIndicator();
  
  try {
    // Call the AI agent API
    const response = await callAIAgent(messageHistory);
    
    // Remove typing indicator
    hideTypingIndicator();
    
    // Process the response
    if (response.output) {
      let aiMessage = '';
      let hasReadSlides = false;
      let hasModifiedSlides = false;
      
      for (const item of response.output) {
        if (item.type === 'text' && item.text) {
          aiMessage = item.text;
          // Add AI message to chat
          addMessageToChat(aiMessage, 'assistant');
          // Add to history
          messageHistory.push({ role: 'assistant', content: aiMessage });
        } else if (item.type === 'tool_call') {
          // Execute the tool call
          try {
            const args = JSON.parse(item.arguments);
            console.log(`Executing tool: ${item.name}`, args);
            
            const result = await executeSlideToolCall(
              window.slideAPI,
              item.name,
              args
            );
            
            // Track what the AI did
            if (item.name === 'get_all_slides') {
              hasReadSlides = true;
            } else if (['replace_all_slides', 'add_slide', 'update_slide'].includes(item.name)) {
              hasModifiedSlides = true;
            }
            
            // Show tool execution result
            if (result.success) {
              // Don't show verbose messages for read operations
              if (item.name === 'get_all_slides') {
                console.log('Read slides:', result);
                addMessageToChat(`📖 Read ${result.count} slides`, 'system');
              } else if (item.name === 'get_total_slides') {
                console.log('Total slides:', result.total);
              } else {
                addMessageToChat(`✓ ${result.message}`, 'system');
              }
            } else {
              addMessageToChat(`✗ ${result.message}`, 'system');
            }
          } catch (error) {
            console.error('Error executing tool:', error);
            addMessageToChat(`Error executing tool: ${error.message}`, 'system');
          }
        }
      }
      
      // Check if AI only read slides without modifying
      if (hasReadSlides && !hasModifiedSlides) {
        const userMessage = messageHistory[messageHistory.length - 1]?.content || message;
        const isReducing = /reduce|condense|make it \d+|shorten|\d+ slides/i.test(userMessage);
        const isCreating = /create|make.*presentation|build/i.test(userMessage);
        
        if (isReducing || isCreating) {
          console.warn('AI read slides but did not modify. Forcing completion...');
          addMessageToChat('⚠️ Completing the task...', 'system');
          
          // Extract number of slides if specified
          const slideMatch = userMessage.match(/(\d+)\s*slides?/i);
          const targetSlides = slideMatch ? parseInt(slideMatch[1]) : 3;
          
          // Force the AI to complete with a very explicit message
          const forceMessage = isReducing 
            ? `You MUST use replace_all_slides RIGHT NOW with exactly ${targetSlides} slides. Example: replace_all_slides(["<h1>Title</h1>", "<h2>Main Points</h2>", "<h2>Conclusion</h2>"])`
            : `You MUST use replace_all_slides RIGHT NOW with the new presentation slides.`;
          
          messageHistory.push({
            role: 'system',
            content: forceMessage
          });
          
          // Retry immediately
          const retryResponse = await callAIAgent(messageHistory);
          
          // Process retry response
          if (retryResponse.output) {
            for (const item of retryResponse.output) {
              if (item.type === 'tool_call') {
                try {
                  const args = JSON.parse(item.arguments);
                  console.log(`Retry - Executing tool: ${item.name}`, args);
                  const result = await executeSlideToolCall(window.slideAPI, item.name, args);
                  if (result.success) {
                    addMessageToChat(`✓ ${result.message}`, 'system');
                  }
                } catch (error) {
                  console.error('Retry error:', error);
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    hideTypingIndicator();
    console.error('Error calling AI agent:', error);
    addMessageToChat('Sorry, there was an error processing your request.', 'system');
  }
}

// Show typing indicator
function showTypingIndicator() {
  const chatMessages = document.getElementById('chat-messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message assistant typing';
  typingDiv.id = 'typing-indicator';
  typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Call AI agent API
async function callAIAgent(messages) {
  const apiKey = localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    // Prompt for API key
    const key = prompt('Please enter your OpenAI API key:');
    if (key) {
      localStorage.setItem('openai_api_key', key);
      return callAIAgent(messages);
    } else {
      throw new Error('OpenAI API key is required');
    }
  }
  
  // For client-side implementation, we'll call OpenAI directly
  // In production, this should go through your backend
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Only for development!
  });
  
  // Get the tools
  const { getSlideBuilderTools } = await import('./slide-tools.js');
  const tools = getSlideBuilderTools();
  
  // System message with instructions
  const systemMessage = {
    role: 'system',
    content: `You are a presentation slide builder. You MUST complete every task.

    MANDATORY WORKFLOW - YOU MUST DO BOTH STEPS:
    1. FIRST: Call get_all_slides()
    2. SECOND: Call replace_all_slides(array_of_slides)
    
    YOU ONLY HAVE THESE TOOLS:
    - get_all_slides: Read slides (step 1)
    - replace_all_slides: Replace with new slides (step 2)
    
    NEVER STOP AFTER STEP 1. ALWAYS DO STEP 2.
    
    For "reduce to 3 slides" or "make it 3 slides":
    Call: replace_all_slides(["<h1>Combined Title</h1>", "<h2>All Main Points</h2><ul><li>...</li></ul>", "<h2>Conclusion</h2>"])
    
    For "create presentation on X":
    Call: replace_all_slides(["<h1>Title about X</h1>", "<h2>Point 1</h2>", "<h2>Point 2</h2>", ...])
    
    YOU MUST ALWAYS CALL replace_all_slides AFTER get_all_slides.
    NEVER EXPLAIN WITHOUT DOING. ALWAYS COMPLETE THE TASK.`
  };
  
  // Create the API request
  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // Using more capable model for better instruction following
    messages: [systemMessage, ...messages],
    tools: tools,
    tool_choice: 'auto',
    temperature: 0.3 // Lower temperature for more deterministic behavior
  });
  
  // Format the response
  const message = response.choices[0].message;
  const output = [];
  
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
  
  return { output };
}