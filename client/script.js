import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

const INIT_IMAGE = "teen gohan, anime, dragonball z";

const imagePromptBase = {
  position: ' upper body, centered',
  expressions: {
    wave: ' waving, smilling,',
    thinking: 'hand on chin, eyebrow raised',
    talking: 'talking, open mouth',
    contemplating: 'crossed-arm, heads down, squinty eyes',
  }
};

const EXPRESSIONS = ["thinking", "talking", "contemplating"];

let imagePrompt = `${imagePromptBase.expressions.wave}, ${imagePromptBase.position}`;

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
      element.textContent = '';
    }

  }, 300)
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20)
}

function generateUniqueID(){
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStript(isAi, value, uniqueId){
  return (
    `
      <div class="wrapper ${isAi && 'ai'}">
        <div class="chat">
          <div class="profile">
            <img
              src="${isAi ? bot : user}"
              alt="${isAi ? 'bot' : 'user'}"
            />
          </div>
          <div class="message" id=${uniqueId}>${value}</div>
        </div>
      </div>
    `
  )
}

const handleSubmit = async(e) => {
  e.preventDefault();

  const expression = EXPRESSIONS[Math.floor(Math.random()*EXPRESSIONS.length)];

  imagePrompt = `${expression}, ${imagePromptBase.position}`;

  console.log(imagePrompt);

  generateImage();

  const data = new FormData(form);

  if (data.get('prompt') === "")
    return;
  
  chatContainer.innerHTML += chatStript(false, data.get('prompt'));

  document.getElementById("prompt").value = "";

  const uniqueId = generateUniqueID();

  chatContainer.innerHTML += chatStript(true, " ", uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  const response = await fetch('https://friendly-ai.onrender.com', {
  //const response = await fetch('http://localhost:4000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: data.get('prompt')
    })
  })

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  if (response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();

    typeText(messageDiv, parsedData);
  } else {
    const err = await response.text();

    messageDiv.innerHTML = "Something went wrong";
  }

  
 
  
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e)=>{
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
})

const generateImage = async(e) => {
  const persona = document.getElementsByName("persona");

  document.getElementById('loading_gif').style.display = "block";

  if (!persona[0].value) 
    persona[0].value = INIT_IMAGE;

  const response = await fetch('https://friendly-ai.onrender.com', {
  //const response = await fetch('http://localhost:4000/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: `${persona[0].value}, ${imagePrompt}`,
    })
  })

  if (response.ok) {
    const data = await response.json();

    document.getElementById('loading_gif').style.display = "none";

    document.getElementById('app').style.backgroundImage=`url(${data.image.data[0].url})`;

  } else {
    const err = await response.text();

    console.log(err);

  }
}

generateImage();


