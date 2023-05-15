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

function typeText(element, text) {
  let index = 0;

  let words = text.split(" ");

  let interval = setInterval(() => {
    if (index < words.length) {
      element.innerHTML += `${words[index]} `;
      index++;
      chatBody.scrollTop = chatBody.scrollHeight;
    
      shapeObject.style.height = `${chatBody.scrollHeight - 32}px`;
    } else {
      clearInterval(interval);
    }
  }, 50)
}

const moveShapeObject = () => {
  shapeObject.style.height = `${chatBody.scrollTop + contentBody.clientHeight - 32}px`;
  blurBody.style.height = `${Math.min(chatBody.scrollTop + 32, contentBody.clientHeight) + 32}px`;
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

  const response = await fetch('http://localhost:4000', {
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
  const response = await fetch(`http://localhost:4000/${isPotrait ? "images" : "stablediff"}`, {
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

const startChat = (txt) => {

  let p = document.createElement('p');
  chatBody.appendChild(p);

  loader.style.display = "none";
  typeText(p, txt);
}

const createBubble = (txt) => {
  let p = document.createElement('p');
  chatBody.appendChild(p);
  p.classList.add('question');
  p.innerHTML = txt;
  chatBody.scrollTop = chatBody.scrollHeight;
  shapeObject.style.height = `${chatBody.scrollHeight - 32}px`;
}

const askTopics = (index) => {
  console.log(topics[index]);
  createBubble(topics[index]);
  talkToAssistant(`${topics[index]}. Give your answer with ${currentCity} as your context. And reply as if you are ${currentPerson}`, startChat);
}

const createTourGuide = (name) => {

  currentPerson = name;
  const photoPrompt = `${name}, photograph, portrait, color`;
  getPhoto(photoPrompt, tourguide, true);

  const prompt = `Introduce yourself to the user as if you are ${name}.  And talk about who you are and your connection to ${currentCity}. And welcome the user to ${currentCity}. Then ask them if they have any questions about ${currentCity} for you.`
  talkToAssistant(prompt, startChat);
}

const handleSubmit = async(e) => {
  e.preventDefault();
  const data = new FormData(form);


  const prompt = data.get('prompt');

  if (prompt=== "")
    return;
  
  talkToAssistant(`${prompt}. Give your answer with ${currentCity} as your context. And reply as if you are ${currentPerson}`, startChat);

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
