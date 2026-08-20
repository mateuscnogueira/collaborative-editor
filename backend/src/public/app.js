let socket = null;
let userId = null;
let onlineUsers = [];

const connectButton = document.getElementById("connectButton");

const userInput = document.getElementById("userId");

const editor = document.getElementById("editor");

const textarea = document.getElementById("documentContent");

const logs = document.getElementById("logs");

const usersList = document.getElementById("users");

function addLog(message) {
    const div = document.createElement("div");

    div.className = "log";

    div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

    logs.appendChild(div);

    logs.scrollTop = logs.scrollHeight;
}

function renderUsers() {
    usersList.innerHTML = "";

    onlineUsers.forEach(user => {

        const li = document.createElement("li");

        li.textContent = user;

        usersList.appendChild(li);
    });
}

function addUser(user) {
    if (!onlineUsers.includes(user)) {
        onlineUsers.push(user);
    }
    renderUsers();
}

function removeUser(user) {
    onlineUsers = onlineUsers.filter(item => item !== user);
    renderUsers();

}

connectButton.onclick = () => {

    userId = userInput.value.trim();

    if (!userId) {

        alert("Digite um nome.");

        return;
    }

    socket = new WebSocket(`ws://localhost:3000?userId=${userId}`);

    socket.onopen = () => {

        addLog("Conectado ao servidor.");

        document.getElementById("login").hidden = true;

        editor.hidden = false;
    };

    socket.onmessage = (event) => {

        const data = JSON.parse(event.data);

        switch(data.type) {

            case "system":
                addLog(data.message);
                break;

            case "user-connected":
                addUser(data.userId);
                addLog(data.message);
                break;

            case "user-disconnected":
                removeUser(data.userId);
                addLog(data.message);
                break;

            case "text-change":
                textarea.value = data.content;
                break;

            case "document-state":
                textarea.value = data.content;
                addLog("Documento sincronizado.");
                break;
        }
    };

    socket.onclose = () => {
        addLog("Desconectado do servidor.");
    };
};

textarea.addEventListener("input", () => {

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const message = {
            type: "text-change",
            documentId: "document-001",
            userId,
            content: textarea.value,
            cursorPosition: textarea.selectionStart,
            timestamp: new Date().toISOString()
        };

        socket.send(JSON.stringify(message));
    }
);