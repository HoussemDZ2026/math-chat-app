/**
 * chat.js - واجهة التفاعل والدردشة الخاصة بالتلميذ
 * تدير هذه الشيفرة إرسال واستقبال الرسائل، رفع ملفات الصوت والصور، والتحقق من الاشتراكات.
 */

// إعدادات الاتصال بـ Supabase Edge Function
const SUPABASE_FUNC_URL = "https://odpudbmhjpancdgzcuhk.supabase.co/functions/v1/rapid-processor";
const SUPABASE_ANON_KEY = "sb_publishable_c4kC3SkqWwkmknTT7u9j8Q_-eKnEx4o";

// تهيئة واجهة المستخدم عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    initChat();
    setupDownloadButton();
});

// متغيرات عامة لإدارة حالة الدردشة
let isRecording = false;
let mediaRecorder;
let audioChunks = [];

function initChat() {
    const sendButton = document.getElementById("send-btn");
    const messageInput = document.getElementById("message-input");
    const imageInput = document.getElementById("image-input");
    const recordButton = document.getElementById("record-btn");

    // حدث إرسال رسالة نصية
    sendButton.addEventListener("click", () => {
        handleSendMessage();
    });

    // إرسال الرسالة عند الضغط على Enter
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    });

    // حدث رفع صورة تمرين رياضيات
    imageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            appendUserImageMessage(file);
            // هنا يتم إرسال الصورة للخلفية لمعالجتها عبر solve.js
            sendImageToBackend(file);
        }
    });

    // حدث تسجيل الصوت لشرح السؤال شفهياً
    recordButton.addEventListener("click", () => {
        toggleVoiceRecording();
    });
}

// معالجة وإرسال الرسالة النصية
async function handleSendMessage() {
    const messageInput = document.getElementById("message-input");
    const text = messageInput.value.trim();
    
    if (text === "") return;

    // 1. عرض رسالة التلميذ في الواجهة فوراً
    appendMessage("user", text);
    messageInput.value = "";

    // 2. إظهار مؤشر الكتابة للأستاذ حسام
    const typingIndicator = showTypingIndicator();

    try {
        // 3. إرسال السؤال إلى Supabase Edge Function مباشرة
        const response = await fetch(SUPABASE_FUNC_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ message: text }) // الدالة تستقبل متغير باسم message
        });
        
        const data = await response.json();
        
        // إزالة مؤشر الكتابة وعرض رد الأستاذ
        typingIndicator.remove();
        
        if (data.answer) {
            appendMessage("bot", data.answer);
        } else if (data.error) {
            appendMessage("bot", "حدث خطأ أثناء معالجة السؤال، يرجى المحاولة مجددًا.");
            console.error("Function error:", data.error);
        } else {
            appendMessage("bot", "لم أتمكن من فهم الإجابة بشكل صحيح، أعد صياغة السؤال يا بني.");
        }
    } catch (error) {
        typingIndicator.remove();
        appendMessage("bot", "عذراً يا بني، حدث خطأ في الاتصال بالأستاذ حسام. تأكد من اتصالك بالإنترنت!");
        console.error("Error communicating with tutor:", error);
    }
}

// عرض الرسائل في شاشة المحادثة
function appendMessage(sender, text) {
    const chatContainer = document.getElementById("chat-container");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender === "user" ? "user-message" : "bot-message");
    
    // دعم تنسيق النصوص البسيط للرموز الرياضية
    messageDiv.innerText = text;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// عرض الصورة المرفوعة في الدردشة كرسالة
function appendUserImageMessage(file) {
    const chatContainer = document.getElementById("chat-container");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "user-message", "image-message");

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "تمرين رياضيات مرفوع";
    img.style.maxWidth = "200px";
    img.style.borderRadius = "8px";

    messageDiv.appendChild(img);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// إظهار حركة "جاري الكتابة..." للأستاذ حسام
function showTypingIndicator() {
    const chatContainer = document.getElementById("chat-container");
    const indicator = document.createElement("div");
    indicator.classList.add("message", "bot-message", "typing-indicator");
    indicator.innerText = "الأستاذ حسام يكتب الآن...";
    chatContainer.appendChild(indicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return indicator;
}

// إدارة تسجيل الصوت (شرح التلميذ للمسألة صوتياً)
async function toggleVoiceRecording() {
    const recordButton = document.getElementById("record-btn");
    
    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                sendAudioToBackend(audioBlob);
                appendMessage("user", "🎤 أرسل تسجيلًا صَوْتِيًّا يشرح التمرين...");
            };

            mediaRecorder.start();
            isRecording = true;
            recordButton.classList.add("recording");
            recordButton.innerText = "🛑 إيقاف التسجيل";
        } catch (err) {
            alert("يرجى السماح بالوصول إلى الميكروفون لتسجيل سؤالك شفهياً.");
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        recordButton.classList.remove("recording");
        recordButton.innerText = "🎤 تسجيل سؤالك";
    }
}

// محاكاة إرسال الملفات للخلفية
function sendImageToBackend(file) {
    console.log("جاري معالجة صورة التمرين ورفعها للسيرفر...", file.name);
}

function sendAudioToBackend(blob) {
    console.log("جاري إرسال التسجيل الصوتي للأستاذ...", blob.size);
}

// إدارة زر تحميل التطبيق مباشرة
function setupDownloadButton() {
    const downloadBtn = document.getElementById("download-app-btn");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            // توجيه التلميذ لتحميل نسخة التطبيق APK للهواتف
            window.location.href = "/downloads/math-chat-app.apk";
        });
    }
}
