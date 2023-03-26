// Initialize the history variable with some sample messages
let history = [
    { "role": "assistant", "content": "Hello, how can I assist you?" },
    { "role": "user", "content": "What's your name?" },
    { "role": "assistant", "content": "My name is Jake." }
];

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");

function displayMessage(message) {
    messagesDiv.insertAdjacentHTML("beforeend", `<p>${message}</p>`);
}

function displayHistory() {
    messagesDiv.innerHTML = "";
    history.forEach(function (item) {
        if (item.role === "assistant")
            displayMessage(item.content);
        else if (item.role === "user")
            displayMessage("> " + item.content);
    });
}


displayHistory();

function handleFormSubmit(event) {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        history.push({ "role": "user", "content": message });
        displayMessage(`> ${message}`);
        messageInput.value = "";

        // Disable the message input field
        messageInput.disabled = true;

        // Send input data to server and handle response
        fetch('http://localhost:5000/getResponse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: message, history: history })
        })
            .then(response => response.json())
            .then(data => {
                const response = data.response;
                history.push({ "role": "assistant", "content": response });
                displayMessage(response);
                messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom after displaying server response
            })
            .catch(error => console.error(error))
            .finally(() => {
                // Re-enable the message input field after the server responds or errors
                messageInput.disabled = false;
                messageInput.focus();
            });
    }
}



messageForm.addEventListener("submit", handleFormSubmit);