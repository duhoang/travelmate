import storyText from './assets/sample_story';

const form = document.querySelector('form');
const cover = document.querySelector('#cover')
const book = document.querySelector('#book');
const storySummary = document.querySelector('#prompt');
const artStyle = document.querySelector('#artstyle');
let paragraphs = [];

const EX_STORY = "There was a bunny name Fred. Who lives on a farm and goes on adventures with his barnyard friends.";

const EX_ARTSTYLE = "Children's illustration, cartoony, colorful";

storySummary.placeholder = `Ex. ${EX_STORY}`;
artStyle.placeholder = `Ex. ${EX_ARTSTYLE}`;

const generatePreview = async(e) => {
  
  const data = new FormData(form);

  if (data.get('prompt') === "") 
    storySummary.placeholder = `Ex. ${EX_STORY}`;

  if (data.get('artstyle') === "")
    artStyle.placeholder = `Ex. ${EX_ARTSTYLE}`;

  const promptString = `Describe the cover illustration of the following story: ${data.get('prompt') || EX_STORY}`;


  const response = await fetch('https://create-a-story.onrender.com', {
  //const response = await fetch('http://localhost:4000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: promptString
    })
  })

  if (response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();
    generateIllustration(parsedData, cover);
  } else {
    const err = await response.text();
    console.log(err);
  }
}

const handleSubmit = async(e) => {
  e.preventDefault();
  const data = new FormData(form);

  if (data.get('prompt') === "")
    return;


  form.classList.add("disabled");
  
  const storyPrompt = `write a short children story about ${data.get('prompt')}`;

  const response = await fetch('https://create-a-story.onrender.com', {
  //const response = await fetch('http://localhost:4000', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: storyPrompt
    })
  })


  if (response.ok) {
    const data = await response.json();
    const parsedData = data.bot.trim();

    parseIntoBook(parsedData);

    form.classList.remove("disabled");
  } else {
    const err = await response.text();
    form.classList.remove("disabled");
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e)=>{
  if (e.keyCode === 13) {
    //generatePreview();
  }
})

const generateIllustration = async(desc, elm) => {

  const prompt = `Create an illustration in the style of ${artStyle.value || EX_ARTSTYLE} without text, of this description: ${desc}`;

  const response = await fetch('https://create-a-story.onrender.com/images', {
  //const response = await fetch('http://localhost:4000/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
    })
  })

  if (response.ok) {
    
    const data = await response.json();

    elm.getElementsByClassName('loading_gif')[0].style.display = "none";

    elm.getElementsByClassName('img_container')[0].style.backgroundImage=`url(${data.image.data[0].url})`;
   

  } else {
    const err = await response.text();
  }
}

const parseIntoBook = (txt) => {
  paragraphs = txt.split('\n\n');
  console.log(paragraphs);
  createBook(paragraphs);
}

const createBook = (paragraphs) => {
 
  book.innerHTML = "";

  const maxlength = paragraphs.length;
  
  for (let i = 0; i < maxlength; i++) {
    book.innerHTML += createSpread(paragraphs[i], i, maxlength);
  }
  const nextBtns = document.getElementsByClassName("nav_btn");

  [].forEach.call(nextBtns, (elm) => {
    elm.addEventListener("click", onClickNav);
  });

  showSpread("0");
}

const createSpread = (txt, index, maxlength) => {
  return (
    `
      <div class="spread" data-index="${index}">
        <div class="page">
            <div class="text_container">
              ${txt}
            </div>
            ${getBackButton(index)}
          </div>
          <div class="page">
              <div class="img_container">
                <div class="loading_gif"></div>
              </div>

            ${getNextButton(index, maxlength)}
          </div>
      </div>
    `
  )
}

const getBackButton = (index) => {
  if (index <= 0 ) return "";
  return `<div class="back_btn nav_btn" data-index="${index-1}">← Back</div>`;
}

const getNextButton = (index, maxlength) => {
  if (index == maxlength - 1)
    return `<div class="next_btn nav_btn" data-index="${-1}">Retry</div>`;
  return `<div class="next_btn nav_btn" data-index="${index+1}">Next →</div>`;
}

const onClickNav = (ev) => {
  showSpread(ev.target.getAttribute("data-index"));
}

const showSpread = (index) => {

  if (index==="-1") {
    book.innerHTML = "";
    form.classList.remove("disabled");
  };

  const spreads = document.getElementsByClassName("spread");

  [].forEach.call(spreads, (elm) => {
    elm.style.display = parseInt(elm.getAttribute("data-index")) <= parseInt(index) ? "flex" : "none";

    if (elm.getAttribute("data-index") === index) {
      generateIllustration(paragraphs[index], elm);
    }
  })
  
}

generatePreview();
