const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");
const messageSubmitButton = document.getElementById("button");
const resetButton = document.getElementById("reset-button");
const resetImage = resetButton.querySelector("img");
const deleteChoice = document.getElementById('choice')

const server = "https://48ca-72-49-59-104.ngrok.io"

function setInputHeight() {
    const style = getComputedStyle(messageInput);
    messageInput.style.height = '1px'
    let height = messageInput.scrollHeight;
    height -= parseInt(style.paddingTop) + parseInt(style.paddingBottom);
    messageInput.style.height = `${height}px`
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

    button = undefined;

    if (message.role === "assistant") {
        messageContainer.classList.add("assistant");
    } else if (message.role === "user") {
        messageContainer.classList.add("user");
    }

    // Replace newlines with <br> tags
    const formattedMessage = formatMessage(message.content);
    messageContainer.innerHTML = `<p class="content">${formattedMessage}</p>`;
    if (message.role === "user") {
        button = messageContainer.insertBefore(document.createElement("button"), messageContainer.firstChild)
    } else if (message.role === "assistant") {
        button = messageContainer.appendChild(document.createElement("button"))
    }
    buttonSetup(button)
    messagesDiv.insertBefore(messageContainer, messagesDiv.firstChild);
    const style = getComputedStyle(messageContainer);
    const height = parseInt(style.height) + parseInt(style.paddingTop)
    moveMessagesAnim(height);
}

function moveMessagesAnim(height) {
    messagesDiv.style.setProperty('--size', `${height}px`);
    const children = Array.from(messagesDiv.children);
    children.forEach((child) => {
        child.classList.add("move-up");
    });
    setTimeout(function () {
        children.forEach((child) => {
            child.classList.remove("move-up");
        });
    }, 500);
}

function buttonSetup(button) {
    if (Array.from(button.parentElement.classList).includes('user')) {
        button.className = 'revert'
        button.textContent = "Revert"
        button.addEventListener('click', () => { // why is this not creating an event listener
            if (button.textContent !== 'Revert') {
                revertTo(button)
                button.textContent = 'Revert'
            } else if (Array.from(messagesDiv.firstChild.classList).includes('assistant')) {
                button.textContent = 'Really?'
            }
        });
        button.addEventListener('mouseleave', () => {
            button.textContent = "Revert"
        })
    } else {
        button.className = 'copy'
        button.textContent = "Copy"
        button.addEventListener('click', () => { // but this is
            navigator.clipboard.writeText(button.parentElement.firstChild.firstChild.data);
            button.textContent = "Copied"
        });
        button.addEventListener('mouseleave', () => {
            button.textContent = "Copy"
        })
    }
}


function displayHistory(history) {
    messagesDiv.innerHTML = "";
    history.forEach(displayMessage);
}

let historyID = localStorage.getItem('historyID');
if (!historyID) historyID = ''

fetch(`${server}/getHistory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: historyID })
})
    .then(response => response.json())
    .then(data => {
        const response = data.response;
        historyID = response[0]
        console.log(`historyID: ${historyID}`)
        localStorage.setItem("historyID", historyID)
        displayHistory(response[1])
    })
    .catch(error => {
        console.error(error)
        const errorMessage = { "role": "assistant", "content": error.message }
        displayMessage(errorMessage);
    });


setInputHeight()
messageSubmitButton.style.height = `${messageInput.scrollHeight}px`

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
        fetch(`${server}/getResponse`, {
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
    fetch(`${server}/resetConversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: historyID })
    })
        .then(response => response.json())
        .then(data => {
            while (messagesDiv.firstChild) {
                messagesDiv.removeChild(messagesDiv.firstChild);
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

function revertTo(item) {
    const messages = Array.from(messagesDiv.children);
    index = messages.indexOf(item.parentElement);
    const topMessage = messages[index+1].getBoundingClientRect().bottom
    const bottom = messagesDiv.getBoundingClientRect().bottom
        - parseInt(getComputedStyle(messagesDiv).paddingBottom);
    const heightChange = topMessage - bottom;
    console.log(topMessage, bottom, heightChange)
    for (i = 0; i < index + 1; i++) {
        const style = getComputedStyle(messagesDiv.firstChild);
        messagesDiv.removeChild(messagesDiv.firstChild);
    }
    messagesDiv.scrollTop = 0
    moveMessagesAnim(heightChange)
}

deleteChoice.className = 'hidden'
