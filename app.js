const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");
const messageSubmitButton = document.getElementById("button");
const resetButton = document.getElementById("reset-button");
const resetImage = resetButton.querySelector("img");
const deleteChoice = document.getElementById('choice')

function setInputHeight() {
    const lineHeight = parseFloat(window.getComputedStyle(messageInput).lineHeight);
    const padding = parseFloat(window.getComputedStyle(messageInput).paddingTop) + parseFloat(window.getComputedStyle(messageInput).paddingBottom);
    const border = parseFloat(window.getComputedStyle(messageInput).borderTopWidth) + parseFloat(window.getComputedStyle(messageInput).borderBottomWidth);
    const lines = messageInput.value.split('\n').length;

    messageInput.style.height = `${lineHeight * lines}px`
    messageSubmitButton.style.height = `${lineHeight + padding + border}px`
}


function colorQuotes(message) {
    let formattedMessage = '';
    let quote = false;
    for (let i = 0; i < message.length; i++) {
        const character = message[i];
        if (character !== '"') {
            formattedMessage += character;
            continue;
        }
        if (!quote) {
            quote = true;
            formattedMessage += '<span class="quote">"';
        } else {
            quote = false;
            formattedMessage += '"</span>';
        }
    }
    return formattedMessage;
}

function formatMessage(message) {
    const text = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const out = colorQuotes(text).replace(/\n/g, "<br>")
    return out == '' ? '[error]' : out
}


function displayMessage(message) {
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message");

    if (message.role === "assistant") {
        messageContainer.classList.add("assistant");
    } else if (message.role === "user") {
        messageContainer.classList.add("user");
    }

    // Replace newlines with <br> tags
    const formattedMessage = formatMessage(message.content);
    messageContainer.innerHTML = `<p class="content">${formattedMessage}</p>`;
    messagesDiv.insertBefore(messageContainer, messagesDiv.firstChild);
}


function displayHistory(history) {
    messagesDiv.innerHTML = "";
    history.forEach(displayMessage);
}

function clearHistory() {

}

function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}

let historyID = getCookie('historyID');
if (!historyID) historyID = ''

fetch('https://87f8-72-49-59-104.ngrok.io/getHistory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: historyID })
})
    .then(response => response.json())
    .then(data => {
        const response = data.response;
        historyID = response[0]
        console.log(`historyID: ${historyID}`)
        document.cookie = `historyID=${historyID}`;
        displayHistory(response[1])
    })
    .catch(error => {
        console.error(error)
        const errorMessage = { "role": "assistant", "content": error.message }
        displayMessage(errorMessage);
    });


setInputHeight()

function handleFormSubmit(event) {
    event.preventDefault();
    if (messageInput.disabled) {
        return; // do nothing if message input field is disabled
    }
    const message = messageInput.value.trim();
    if (message) {
        displayMessage({ "role": "user", "content": message });
        messageInput.value = "";
        setInputHeight()

        // Disable the message input field
        messageInput.disabled = true;

        // Send input data to server and handle response
        fetch('https://87f8-72-49-59-104.ngrok.io/getResponse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: historyID, message: message })
        })
            .then(response => response.json())
            .then(data => {
                displayMessage(data.response);
            })
            .catch(error => {
                console.error(error)
                displayMessage({ "role": "assistant", "content": error.message });
            })
            .finally(() => {
                // Re-enable the message input field after the server responds or errors
                messageInput.disabled = false;
                messageInput.focus();
            });
    }
}

function resetConversation() {
    fetch('https://87f8-72-49-59-104.ngrok.io/resetConversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: historyID })
    })
        .then(response => response.json())
        .then(data => {
            while (messagesDiv.firstChild) {
                messagesDiv.removeChild(messagesDiv.lastChild);
            }
            displayHistory(data.response);
        })
        .catch(error => {
            console.error(error)
            displayMessage({ "role": "assistant", "content": error.message });
        })
        .finally(() => {
            resetButton.className = '';
        });
}

messageInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter' && !event.shiftKey && !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
        event.preventDefault(); // prevent line break
        handleFormSubmit(event); // process the form submission
    }
});

messageInput.addEventListener('input', setInputHeight);

messageForm.addEventListener("submit", handleFormSubmit);

resetButton.addEventListener("click", function () {
    if (!resetButton.className) {
        resetButton.className = 'hidden'
        document.getElementById('choice').className = ''
    }
});

document.getElementById('confirm').addEventListener("click", () => {
    resetButton.className = 'spin'
    deleteChoice.className = 'hidden'
    resetConversation()
})
document.getElementById('cancel').addEventListener("click", () => {
    resetButton.className = ''
    deleteChoice.className = 'hidden'
})

// deleteChoice.children.forEach((child) => {
//     console.log(child)
// })

deleteChoice.className = 'hidden'
