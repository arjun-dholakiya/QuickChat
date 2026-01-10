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

// Create message element
const createMessageElement = (content, ...classes) => {
  const div = document.createElement('div');
  div.classList.add('message', ...classes);
  div.innerHTML = content;
  return div;
};

// Generate bot response
const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector('.text-box');

  chatHistory.push({
    role: 'user',
    parts: [{ text: userData.message }]
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    messageElement.innerText = 'Server is starting, please wait...';

    const limitedHistory = chatHistory.slice(-5);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: limitedHistory }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Quota exceeded. Please try again later.');
      }
      throw new Error(data?.error?.message || 'Server error');
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from AI service.');
    }

    messageElement.innerText = text.trim();

    chatHistory.push({
      role: 'model',
      parts: [{ text }]
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      messageElement.innerText =
        'Server is waking up. Please send your message again.';
    } else {
      messageElement.innerText = err.message;
    }
    messageElement.style.color = '#ff0000';
  } finally {
    incomingMessageDiv.classList.remove('thinking');
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
  }
};

// Handle outgoing messages
const handleOutgoingMessage = (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  if (!text) return;

  userData.message = text;
  messageInput.value = '';

  const messageContent = `<div class="text-box"></div>`;

  const outgoingMessageDiv = createMessageElement(
    messageContent,
    'user-message'
  );

  outgoingMessageDiv.querySelector('.text-box').textContent = text;
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });

  setTimeout(() => {
    const botMessageContent = `
      <img src="https://cdn-icons-png.flaticon.com/512/4712/4712027.png" class="chat-icon">
      <div class="text-box">
        <div class="thinking-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;

    const incomingMessageDiv = createMessageElement(
      botMessageContent,
      'bot-message',
      'thinking'
    );

    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

// Send on Enter key
messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && messageInput.value.trim()) {
    handleOutgoingMessage(e);
  }
});

// Emoji picker (no emoji comments)
const picker = new EmojiMart.Picker({
  theme: 'light',
  skinTonePosition: 'none',
  previewPosition: 'none',
  onEmojiSelect: (emoji) => {
    const { selectionStart, selectionEnd } = messageInput;
    messageInput.setRangeText(
      emoji.native,
      selectionStart,
      selectionEnd,
      'end'
    );
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

sendMessageButton.addEventListener('click', handleOutgoingMessage);
chatbotToggler.addEventListener('click', () =>
  document.body.classList.toggle('show-chatbot')
);
closeChatbot.addEventListener('click', () =>
  document.body.classList.remove('show-chatbot')
);
