// Initialize the history variable with some sample messages
let history = [
    "Hello, how can I assist you?",
    "What's your name?",
    "AI assistant."
];

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");

function displayMessage(message) {
    messagesDiv.insertAdjacentHTML("beforeend", `<p>${message}</p>`);
}

function displayHistory() {
    messagesDiv.innerHTML = "";
    history.forEach(displayMessage);
}

displayHistory();

function handleFormSubmit(event) {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        history.push(message);
        displayMessage(`You inputted: ${message}`);
        messageInput.value = "";

        // Send input data to server and handle response
        fetch('http://localhost:5000/getResponse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: message })
        })
            .then(response => response.json())
            .then(data => {
                const response = data.response;
                history.push(response);
                displayMessage(response);
            })
            .catch(error => console.error(error));
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

messageForm.addEventListener("submit", handleFormSubmit);