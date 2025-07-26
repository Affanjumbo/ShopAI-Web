  // Current time for initial messages
  document.getElementById('current-time').textContent = getCurrentTime();
  document.getElementById('current-time2').textContent = getCurrentTime();

  function getCurrentTime() {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Chat functionality
  document.addEventListener('DOMContentLoaded', function() {
      const sendButton = document.getElementById('sendButton');
      const userInput = document.getElementById('userInput');
      const chatMessages = document.getElementById('chatMessages');
      const chatOptions = document.querySelectorAll('.chat-option');
      const chatTitle = document.getElementById('chatTitle');

      // Set current chat type
      let currentChatType = 'ai';
      
      // Chat option selection
      chatOptions.forEach(option => {
          option.addEventListener('click', function() {
              // Remove active class from all options
              chatOptions.forEach(opt => opt.classList.remove('active'));
              // Add active class to clicked option
              this.classList.add('active');
              // Update current chat type
              currentChatType = this.dataset.chatType;
              // Update chat title
              chatTitle.textContent = this.querySelector('span').textContent;
              // Add system message
              addMessage(`You're now chatting with ${this.querySelector('span').textContent}. How can we help?`, 'bot');
          });
      });

      // Send message function
      function sendMessage() {
          const message = userInput.value.trim();
          if (message) {
              addMessage(message, 'user');
              userInput.value = '';
              
              // Show typing indicator
              showTypingIndicator();
              
              // Simulate bot response after delay
              setTimeout(() => {
                  // Remove typing indicator
                  removeTypingIndicator();
                  
                  // Generate appropriate response based on chat type
                  const response = generateBotResponse(message, currentChatType);
                  addMessage(response, 'bot');
              }, 1500);
          }
      }

      // Show typing indicator
      function showTypingIndicator() {
          const typingDiv = document.createElement('div');
          typingDiv.className = 'typing-indicator';
          typingDiv.id = 'typingIndicator';
          typingDiv.innerHTML = `
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
          `;
          chatMessages.appendChild(typingDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      // Remove typing indicator
      function removeTypingIndicator() {
          const typingIndicator = document.getElementById('typingIndicator');
          if (typingIndicator) {
              typingIndicator.remove();
          }
      }

      // Generate bot response based on chat type
      function generateBotResponse(message, chatType) {
          const responses = {
              ai: [
                  "I can help with that. Based on our products, here's what I recommend...",
                  "Thanks for your question! As an AI assistant, I can tell you that...",
                  "For AI-related queries: " + message + ", here's the information I found...",
                  "Our AI system suggests checking these options..."
              ],
              sales: [
                  "Our sales team can help you with special offers. Would you like to hear about our current promotions?",
                  "For sales inquiries, we have these options available...",
                  "Our best deals right now include...",
                  "I can connect you with a sales representative if you'd like?"
              ],
              order: [
                  "For order #" + (Math.floor(Math.random() * 10000) + 1000) + ", the current status is: In Transit",
                  "Your order should arrive within 3-5 business days.",
                  "We can track your order if you provide the order number.",
                  "For order-related issues, we can process replacements if needed."
              ],
              returns: [
                  "You can initiate returns within 30 days of delivery through your account page.",
                  "Our return policy requires items to be in original condition with packaging.",
                  "For returns, please ensure you have your order number ready.",
                  "We offer free returns for defective products."
              ],
              general: [
                  "For general questions, you might find our FAQ section helpful.",
                  "We're happy to help with your question about: " + message,
                  "Many customers ask about this. Here's what you need to know...",
                  "Let me find the right information to answer your question."
              ]
          };

          // Special responses for specific questions
          if (message.toLowerCase().includes('order status')) {
              return "Your order #" + (Math.floor(Math.random() * 10000) + 1000) + " is out for delivery and should arrive today!";
          }
          if (message.toLowerCase().includes('return')) {
              return "You can initiate returns through your account page. Items must be returned within 30 days in original condition.";
          }
          if (message.toLowerCase().includes('delivery')) {
              return "We offer standard (3-5 days), express (2 days), and same-day delivery in select areas. Delivery fees vary.";
          }
          if (message.toLowerCase().includes('recommend')) {
              return "Based on popular choices, I recommend: Premium Wireless Headphones ($129), Smart Fitness Band ($59), and Leather Wallet ($45).";
          }

          // Default response based on chat type
          const typeResponses = responses[chatType] || responses.ai;
          return typeResponses[Math.floor(Math.random() * typeResponses.length)];
      }

      // Add message to chat
      function addMessage(text, sender) {
          const messageDiv = document.createElement('div');
          messageDiv.className = `message ${sender}`;
          messageDiv.innerHTML = `
              <p>${text}</p>
              <div class="message-time">${getCurrentTime()}</div>
          `;
          chatMessages.appendChild(messageDiv);
          chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      // Quick question function
      window.sendQuickQuestion = function(question) {
          addMessage(question, 'user');
          showTypingIndicator();
          
          setTimeout(() => {
              removeTypingIndicator();
              const response = generateBotResponse(question, currentChatType);
              addMessage(response, 'bot');
          }, 1500);
      }

      // Event listeners
      sendButton.addEventListener('click', sendMessage);
      userInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') sendMessage();
      });
  });

   // Navigation functionality
   document.addEventListener('DOMContentLoaded', function() {
    // Make cart icon clickable
    const cartIcon = document.querySelector('.notification a');
    cartIcon.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'my-cart.html';
    });
     // User profile click - navigate to account page
     const userProfile = document.querySelector('.user-profile');
     if (userProfile) {
         userProfile.addEventListener('click', function() {
             window.location.href = 'account.html';
         });
     }
    // Make user profile dropdown items clickable
    const dropdownItems = document.querySelectorAll('.dropdown-menu a');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            if(target === 'logout.html') {
                // Handle logout
                console.log('Logging out...');
            } else {
                window.location.href = target;
            }
        });
    });

    // Highlight active menu item
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.side-nav a');
    menuItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        if(itemHref === currentPage) {
            item.classList.add('active');
        }
    });
});