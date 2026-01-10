const chatBody = document.querySelector('.chatbot-body');
const messageInput = document.querySelector('.message-input');
const sendMessageButton = document.querySelector('#send-message');
const chatbotToggler = document.querySelector('#chatbot-toggler');
const closeChatbot = document.querySelector('#close-chatbot');

// API setup
const API_URL = 'https://quickchat-f5jc.onrender.com/chat';

const userData = {
  message: null
};

const chatHistory = [];

// Createe message element with dynamic classes & return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement('div');
  div.classList.add('message', ...classes);
  div.innerHTML = content;
  return div;
};

// Generate Response using bot API
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector('.text-box');

  chatHistory.push({
    role: 'user',
    parts: [{ text: userData.message }]
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    messageElement.innerText = '⏳ Waking up server...';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('⚠️ Quota exceeded. Try later.');
      }
      throw new Error(data?.error?.message || 'Server error');
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('⚠️ No response from AI');

    messageElement.innerText = text.trim();

    chatHistory.push({
      role: 'model',
      parts: [{ text }]
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      messageElement.innerText = '⏳ Server is waking up. Please send again.';
    } else {
      messageElement.innerText = err.message;
    }
    messageElement.style.color = '#ff0000';
  } finally {
    incomingMessageDiv.classList.remove('thinking');
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
  }
};

// Handle Outgoing user messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  if (!text) return;

  userData.message = text;
  messageInput.value = '';

  // Create and display user message
  const messageContent = `<div class="text-box"><p></p></div>`;

  const outgoingMessageDiv = createMessageElement(
    messageContent,
    'user-message'
  );
  outgoingMessageDiv.querySelector('.text-box').textContent = userData.message;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });

  // Simulate bot response with thinking indicator after a delay
  setTimeout(() => {
    const messageContent = `<img src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" alt="Bot Icon" class="chat-icon">
        <div class="text-box">
          <div class="thinking-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>`;

    const incomingMessageDiv = createMessageElement(
      messageContent,
      'bot-message',
      'thinking'
    );
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Handle Enter key press for sending messages
messageInput.addEventListener('keydown', (e) => {
  const userMessage = e.target.value.trim();
  if (e.key === 'Enter' && userMessage) {
    handleOutgoingMessage(e);
  }
});

// Initialize emoji Picker & handle emoji selection
const picker = new EmojiMart.Picker({
  theme: 'light',
  skinTonePosition: 'none',
  previewPosition: 'none',
  onEmojiSelect: (emoji) => {
    const { selectionStart: start, selectionEnd: end } = messageInput;
    messageInput.setRangeText(emoji.native, start, end, 'end');
    messageInput.focus();
  },
  onClickOutside: (e) => {
    if (e.target.id === 'emoji-picker') {
      document.body.classList.toggle('show-emoji-picker');
    } else {
      document.body.classList.remove('show-emoji-picker');
    }
  }
});

document.querySelector('.chatbot-footer').appendChild(picker);
sendMessageButton.addEventListener('click', (e) => handleOutgoingMessage(e));
chatbotToggler.addEventListener('click', () =>
  document.body.classList.toggle('show-chatbot')
);
closeChatbot.addEventListener('click', () =>
  document.body.classList.remove('show-chatbot')
);
