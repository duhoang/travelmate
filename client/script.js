import storyText from './assets/sample_story';

const form = document.querySelector('form');
const cover = document.querySelector('#cover')
const book = document.querySelector('#book');
const storySummary = document.querySelector('#prompt');
const artStyle = document.querySelector('#artstyle');
let paragraphs = [];
let illustrations = [];
let image2image = false;
let prevImage = null;

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

  const promptString = `Write a concised visual description of an image that summarizes this story: ${data.get('prompt') || EX_STORY}. The visual description should only include physical characteristics of the characters and scene.`;



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

  image2image = false;

  form.classList.add("disabled");
  
  const storyPrompt = `write a short children story about ${data.get('prompt')}, and include one visual description for each paragraph. The visual descriptions should be labeled "Illustration:" and be concised and only include physical characteristics of the characters and the scene.`;

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

  const prompt = `${artStyle.value || EX_ARTSTYLE}. ${desc}`;

  elm.getElementsByClassName('loading_gif')[0].style.display = "block";
  
  const response = await fetch(`https://create-a-story.onrender.com/stablediff${image2image ? 'img2img' : ''}`, {
  //const response = await fetch(`http://localhost:4000/stablediff${image2image ? 'img2img' : ''}`, {
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

    image2image = true;

    elm.getElementsByClassName('loading_gif')[0].style.display = "none";
    
    elm.getElementsByClassName('img_container')[0].style.backgroundImage=`url(data:image/png;base64,${data.images.artifacts[0].base64})`;
  }
}

const parseIntoBook = (txt) => {
  let separateContent = txt.split('\n\n').filter((p) => { return p.length; });
  paragraphs = [];
  illustrations = []

  separateContent.forEach((p) => {
    let temp = p.trim().split('Illustration:');
    paragraphs.push(temp[0]);
    illustrations.push(temp[1]);
  });

  createBook(paragraphs, illustrations);
}

const createBook = (paragraphs, illustrations) => {
 
  book.innerHTML = "";

  book.classList.remove("hide-book");

  const maxlength = Math.min(paragraphs.length, illustrations.length);
  
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
    return `<div class="next_btn nav_btn" data-index="${-1}">Retry ↺</div>`;
  return `<div class="next_btn nav_btn" data-index="${index+1}">Next →</div>`;
}

const onClickNav = (ev) => {
  showSpread(ev.target.getAttribute("data-index"));
}

const showSpread = (index) => {

  if (index==="-1") {
    book.classList.add("hide-book");
    form.classList.remove("disabled");
    return;
  };

  const spreads = document.getElementsByClassName("spread");

  [].forEach.call(spreads, (elm) => {
    elm.style.display = parseInt(elm.getAttribute("data-index")) <= parseInt(index) ? "flex" : "none";
    if (elm.getAttribute("data-index") === index && elm.getElementsByClassName('img_container')[0].style.backgroundImage === "") {
      generateIllustration(illustrations[index], elm);
    }
  })
  
}

generatePreview();
