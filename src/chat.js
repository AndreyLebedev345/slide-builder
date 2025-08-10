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
            const result = await executeSlideToolCall(
              window.slideAPI,
              item.name,
              args
            );
            
            // Show tool execution result
            if (result.success) {
              addMessageToChat(`✓ ${result.message}`, 'system');
            } else {
              addMessageToChat(`✗ ${result.message}`, 'system');
            }
          } catch (error) {
            console.error('Error executing tool:', error);
            addMessageToChat(`Error executing tool: ${error.message}`, 'system');
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
    content: `You are a presentation slide builder assistant. You can create slides and customize the presentation appearance.
    
    Available tools:
    - add_slide: Create new slides with HTML content
    - change_theme: Switch between 12 different presentation themes
    
    Available themes:
    - black (default): Black background, white text, blue links
    - white: Clean white background, black text
    - league: Gray background, white text
    - beige: Warm beige background, dark text
    - night: Black background with orange accents
    - serif: Traditional cappuccino background
    - simple: Minimal white background
    - solarized: Cream colored with dark green text
    - moon: Dark blue background, grey text
    - dracula: Dracula color scheme
    - sky: Blue background, thin dark text
    - blood: Dark background with red links
    
    Keep responses concise. When creating slides:
    - Use proper HTML formatting
    - Keep content concise and readable
    - One main idea per slide
    - Use appropriate heading levels (h1 for titles, h2 for slide headers)`
  };
  
  // Create the API request
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Using smaller model for faster responses
    messages: [systemMessage, ...messages],
    tools: tools,
    tool_choice: 'auto',
    temperature: 0.7
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