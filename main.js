const URL = `/.netlify/functions/chat`;

let chatHistory = []; 

async function tanyaAI() {
    const inputField = document.getElementById('userInput');
    const chatWindow = document.getElementById('chat-window');
    const text = inputField.value.trim();

    if (!text) return;

    addMessage(text, 'user');
    chatHistory.push({ role: "user", parts: [{ text: text }] });
    
    inputField.value = '';
    inputField.style.height = 'auto'; 
    
    const loadingMsg = addMessage('Thinking...', 'ai');

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: chatHistory 
            })
        });

        const data = await response.json();

        if (data.error) {
            loadingMsg.innerText = "Error: " + data.error.message;
            return;
        }

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            const aiResponse = data.candidates[0].content.parts[0].text;
            chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });

            const textSpan = loadingMsg.querySelector('span');
            textSpan.innerHTML = marked.parse(aiResponse);

            Prism.highlightAllUnder(loadingMsg);

            setTimeout(() => { addCopyButtons(loadingMsg); }, 50);
        } else {
            loadingMsg.innerText = "Maaf, format jawaban tidak sesuai.";
        }

    } catch (error) {
        loadingMsg.innerText = "Gagal konek ke server.";
        // console.error("Detail Error:", error);
    }

    chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
}

function addMessage(text, sender) {
    const chatWindow = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.classList.add('message', sender);
    
    const textSpan = document.createElement('span');
    textSpan.innerText = text;
    div.appendChild(textSpan);
    
    if (sender === 'ai') {
        const voiceCont = document.createElement('div');
        voiceCont.classList.add('voice-controls');

        voiceCont.innerHTML = `
            <button class="speak-btn" title="Dengarkan/Stop">
                <svg class="icon-audio" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
                </svg>
            </button>
        `;

        const btn = voiceCont.querySelector('.speak-btn');
        btn.onclick = () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                setSpeakerIcon(btn); // Balik ke icon speaker
            } else {
                speakText(textSpan.innerText, btn);
            }
        };

        div.appendChild(voiceCont);
    }

    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return div;
}

function setSpeakerIcon(btn) {
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg>`;
}

function setStopIcon(btn) {
    btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 6h12v12H6z"></path></svg>`;
}

function speakText(text, btn) {
    window.speechSynthesis.cancel();
    if (!text || text === "Thinking...") return;

    const cleanText = text.replace(/[*#`]/g, '').replace(/<\/?[^>]+(>|$)/g, ""); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const voices = window.speechSynthesis.getVoices();
    const indoVoice = voices.find(voice => voice.lang.includes('id-ID'));
    if (indoVoice) utterance.voice = indoVoice;
    utterance.lang = 'id-ID';
    utterance.rate = 1.1;

    utterance.onstart = () => setStopIcon(btn);
    utterance.onend = () => setSpeakerIcon(btn);
    utterance.onerror = () => setSpeakerIcon(btn);

    window.speechSynthesis.speak(utterance);
}

function addCopyButtons(container) {
    const codeBlocks = container.querySelectorAll('pre');

    codeBlocks.forEach((block) => {
        if (block.querySelector('.copy-btn')) return;

        const button = document.createElement('button');
        button.innerText = 'Copy';
        button.classList.add('copy-btn');

        button.addEventListener('click', () => {
            const code = block.querySelector('code').innerText;
            
            navigator.clipboard.writeText(code).then(() => {
                button.innerText = 'Copied!';
                button.classList.add('copied');

                setTimeout(() => {
                    button.innerText = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
            });
        });

        block.appendChild(button);
    });
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); 
        tanyaAI(); 
    }
}

function resetChat() {
    window.speechSynthesis.cancel(); 
    chatHistory = []; 
    document.getElementById('chat-window').innerHTML = ''; 
    addMessage("Hallo!!", "ai");
}

document.getElementById('userInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

window.onbeforeunload = function() {
    window.speechSynthesis.cancel();
};