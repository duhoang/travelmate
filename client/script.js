const form = document.querySelector('form');
const chatBody = document.querySelector('#chat-body');
const contentBody = document.querySelector('#content-body');
let shapeObject = document.querySelector('#circle');
const blurBody = document.querySelector('#body-blur');
const cityName = document.querySelector('#city-name');
const background = document.querySelector('#background');
const tourguide = document.querySelector('#mate-photo');
const loader = document.querySelector('.loader');

let currentCity = '';
let currentPerson = '';

const topics = ["What are some popular attractions in this area?", "What's good to eat around here?", "Can you recommend some nice hotels in the area?", "Where can I find some transportation nearby?"]

function typeText(element, text, callback = ()=>{}) {
  let index = 0;

  let words = text.split(" ");

  let interval = setInterval(() => {
    if (index < words.length) {
      element.innerHTML += `${words[index]} `;
      index++;
      chatBody.scrollTop = chatBody.scrollHeight;
      shapeObject.style.height = `${chatBody.scrollHeight - 64}px`;
    } else {
      clearInterval(interval);
      callback();
    }
  }, 50)
}

const moveShapeObject = () => {
  shapeObject.style.height = `${chatBody.scrollTop + contentBody.clientHeight - 96}px`;
  blurBody.style.height = `${Math.min(chatBody.scrollTop + 32, contentBody.clientHeight) + 96}px`;
}

const locationFound = (position) => {
  const prompt = `What is the city or town at this latitude: ${position.coords.latitute} , and longitute: ${position.coords.longitude} ? Reply will only the name.`;
  talkToAssistant(prompt, populateCity);
}

const locationDenied = (error) => {
  console.log(error);
}

const talkToAssistant = async(prompt, callback) => {

  loader.style.display = "flex";

  const response = await fetch('https://travelmate-ai.onrender.com', {
  //const response = await fetch('http://localhost:4000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt
    })
  })

  if (response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();
    callback(parsedData);
  } 
}

const getPhoto = async(prompt, elm, isPotrait = false) => {
  
  const response = await fetch(`https://travelmate-ai.onrender.com/${isPotrait ? "images" : "stablediff"}`, {
  //const response = await fetch(`http://localhost:4000/${isPotrait ? "images" : "stablediff"}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt
    })
  })

  if (response.ok) {
    const data = await response.json();

    const isPortrait = !!(data && data.image); 
    if (isPortrait) {
      elm.style.backgroundImage = `url(${data.image.data[0].url})`;
    } else {
      elm.style.backgroundImage = `url(data:image/png;base64,${data.images.artifacts[0].base64})`;
    }
  }
}

const populateCity = (city) => {
  cityName.innerHTML = city;

  currentCity = city;

  const str = city.split(" ");

  let index = str.reduce((acc, curr, i)=>{
      if(curr.length > str[acc].length){
      return i
      }
      return acc;
  }, 0)

  if (city.length > 24 || str[index] > 12) {
    cityName.classList.add("small-text");
  } else {
    cityName.classList.remove("small-text");
  }

  const photoPrompt = `A beautiful, picturesque, editorial photograph of this travel desination: ${city}`;
  getPhoto(photoPrompt, background);

  const prompt = `Give me the name of a famous person from ${city}. Reply with only their name.`
  talkToAssistant(prompt, createTourGuide);
}

let chatIndex;
let sentences;

const startChat = (txt) => {

  loader.style.display = "none";

  sentences = txt.split('\n');

  chatIndex = 0;

  chatFormat();
}

const formatRec = (txt) => {
  let a = document.createElement('a');
  chatBody.appendChild(a);
  let textLink = txt.split("http");
  a.innerHTML += textLink[0].replace("*", "");
  a.href = `http${textLink[1]}`;
  a.target = "_blank";
  a.classList.add('chat-link');
  let image = document.createElement('span');
  a.prepend(image);

  getPhoto(textLink[0].replace("*", ""), image);

  chatBody.scrollTop = chatBody.scrollHeight;
  shapeObject.style.height = `${chatBody.scrollHeight - 32}px`;

  let interval = setInterval(() => {
    chatFormat();
    clearInterval(interval);
  }, 30);
}

const chatFormat = () => {

  if (chatIndex >= sentences.length)
    return;

  sentences[chatIndex].trim();

  if (sentences[chatIndex].length > 0) {

    if (sentences[chatIndex].includes('http') && sentences[chatIndex].includes('*')) {
      formatRec(sentences[chatIndex])
    } else {
      let p = document.createElement('p');
      chatBody.appendChild(p);
      typeText(p, sentences[chatIndex], chatFormat);
    }
    
    chatIndex++;
  } else {

    chatIndex++;
    chatFormat();
  }
}

const createBubble = (txt) => {
  let p = document.createElement('p');
  chatBody.appendChild(p);
  p.classList.add('question');
  p.innerHTML = txt;
  chatBody.scrollTop = chatBody.scrollHeight;
  shapeObject.style.height = `${chatBody.scrollHeight - 32}px`;
}

const questionFormat = (txt) => {
  const context = `Give your answer with ${currentCity} as your context. And reply as if you are ${currentPerson}`;
  const format = `For any recommendations, each recommendation on a new line with a "*" at the beginning, then the name, and their website URL. And follow by a friendly banter in a separate paragraph.`;
  talkToAssistant(`${txt}. ${context}. ${format}`, startChat);
}

const askTopics = (index) => {
  createBubble(topics[index]);
  questionFormat(topics[index]);
}

const createTourGuide = (name) => {

  currentPerson = name;
  const photoPrompt = `${name}, photograph, portrait, color`;
  getPhoto(photoPrompt, tourguide, true);

  const prompt = `Introduce yourself to the user as if you are ${name}.  And talk about who you are and your connection to ${currentCity}. And welcome the user to ${currentCity}. Then ask them if they have any questions about ${currentCity} for you.`
  talkToAssistant(prompt, startChat);

  tourguide.classList.add('showMate');
  
}

const handleSubmit = async(e) => {
  e.preventDefault();
  const data = new FormData(form);


  const prompt = data.get('prompt');

  if (prompt=== "")
    return;
  
  questionFormat(prompt);

  document.getElementById("prompt").value = "";

  createBubble(prompt);
}





navigator.geolocation.getCurrentPosition(locationFound, locationDenied);
chatBody.addEventListener("scroll", moveShapeObject);

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e)=>{
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
})

document.querySelectorAll('.topic').forEach(function(node, index) {
  node.addEventListener("click", () => {askTopics(index)});
});
