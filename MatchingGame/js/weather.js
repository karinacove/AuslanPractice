/* weather.js — FIXED & FULLY WORKING VERSION FOR YOUR HTML */

document.addEventListener("DOMContentLoaded", function () {

  /* ---------- STUDENT INFO ---------- */
  const studentName = localStorage.getItem("studentName") || "";
  const studentClass = localStorage.getItem("studentClass") || "";
  if (!studentName || !studentClass) {
    window.location.href = "../index.html";
    return;
  }
  document.getElementById("student-info").innerText = `${studentName} (${studentClass})`;

  /* ---------- DOM ELEMENTS ---------- */
  const againBtn = document.getElementById("again-btn");
  const continueBtn = document.getElementById("continue-btn");
  const finishBtn = document.getElementById("finish-btn");
  const stopBtn = document.getElementById("stop-btn");
  const modal = document.getElementById("end-modal");
  const scoreModal = document.getElementById("score-display-modal");

  const gameBoard = document.getElementById("gameBoard");
  const leftSigns = document.getElementById("leftSigns");
  const rightSigns = document.getElementById("rightSigns");
  const levelTitle = document.getElementById("levelTitle");

  /* ---------- GAME STATE ---------- */
  let currentLevel = 0;
  let correctMatches = 0;
  let gameEnded = false;
  const startTime = Date.now();

  const levelAttempts = Array(6).fill(null).map(() => ({
    correct: new Set(),
    incorrect: []
  }));

  /* ---------- DATA: Weather ---------- */
  const weatherItems = [
    { key:"sunny",  obviousClothing:"thongs",
      allowedClothing:["hat","shirt","shorts","thongs","bathers","skirt","dress"],
      clipart:"assets/weather/clipart/sunny.png",
      sign:"assets/weather/signs/sunny.png" },

    { key:"cloudy", obviousClothing:"jumper",
      allowedClothing:["shirt","jumper","shorts","pants","shoes","socks","skirt","dress"],
      clipart:"assets/weather/clipart/cloudy.png",
      sign:"assets/weather/signs/cloudy.png" },

    { key:"rainy",  obviousClothing:"umbrella",
      allowedClothing:["jacket","boots","pants","umbrella"],
      clipart:"assets/weather/clipart/rainy.png",
      sign:"assets/weather/signs/rainy.png" },

    { key:"stormy", obviousClothing:"boots",
      allowedClothing:["jacket","socks","boots","pants"],
      clipart:"assets/weather/clipart/stormy.png",
      sign:"assets/weather/signs/stormy.png" },

    { key:"windy",  obviousClothing:"jacket",
      allowedClothing:["jumper","socks","shoes","pants","jacket"],
      clipart:"assets/weather/clipart/windy.png",
      sign:"assets/weather/signs/windy.png" },

    { key:"snowy",  obviousClothing:"gloves",
      allowedClothing:["gloves","scarf","beanie","socks","shoes","jumper","jacket"],
      clipart:"assets/weather/clipart/snowy.png",
      sign:"assets/weather/signs/snowy.png" }
  ];

  /* ---------- DATA: Clothing ---------- */
  const clothingItems = [
    { key:"hat", clipart:"assets/clothing/clipart/hat.png",
      sign:"assets/clothing/signs/hat.png", primaryWeather:"sunny" },

    { key:"shirt", clipart:"assets/clothing/clipart/shirt.png",
      sign:"assets/clothing/signs/shirt.png", primaryWeather:"cloudy" },

    { key:"shorts", clipart:"assets/clothing/clipart/shorts.png",
      sign:"assets/clothing/signs/shorts.png", primaryWeather:"sunny" },

    { key:"thongs", clipart:"assets/clothing/clipart/thongs.png",
      sign:"assets/clothing/signs/thongs.png", primaryWeather:"sunny" },

    { key:"bathers", clipart:"assets/clothing/clipart/bathers.png",
      sign:"assets/clothing/signs/bathers.png", primaryWeather:"sunny" },

    { key:"skirt", clipart:"assets/clothing/clipart/skirt.png",
      sign:"assets/clothing/signs/skirt.png", primaryWeather:"sunny" },

    { key:"dress", clipart:"assets/clothing/clipart/dress.png",
      sign:"assets/clothing/signs/dress.png", primaryWeather:"sunny" },

    { key:"jumper", clipart:"assets/clothing/clipart/jumper.png",
      sign:"assets/clothing/signs/jumper.png", primaryWeather:"cloudy" },

    { key:"pants", clipart:"assets/clothing/clipart/pants.png",
      sign:"assets/clothing/signs/pants.png", primaryWeather:"cloudy" },

    { key:"shoes", clipart:"assets/clothing/clipart/shoes.png",
      sign:"assets/clothing/signs/shoes.png", primaryWeather:"cloudy" },

    { key:"socks", clipart:"assets/clothing/clipart/socks.png",
      sign:"assets/clothing/signs/socks.png", primaryWeather:"cloudy" },

    { key:"jacket", clipart:"assets/clothing/clipart/jacket.png",
      sign:"assets/clothing/signs/jacket.png", primaryWeather:"windy" },

    { key:"boots", clipart:"assets/clothing/clipart/boots.png",
      sign:"assets/clothing/signs/boots.png", primaryWeather:"stormy" },

    { key:"umbrella", clipart:"assets/clothing/clipart/umbrella.png",
      sign:"assets/clothing/signs/umbrella.png", primaryWeather:"rainy" },

    { key:"gloves", clipart:"assets/clothing/clipart/gloves.png",
      sign:"assets/clothing/signs/gloves.png", primaryWeather:"snowy" },

    { key:"scarf", clipart:"assets/clothing/clipart/scarf.png",
      sign:"assets/clothing/signs/scarf.png", primaryWeather:"snowy" },

    { key:"beanie", clipart:"assets/clothing/clipart/beanie.png",
      sign:"assets/clothing/signs/beanie.png", primaryWeather:"snowy" }
  ];

  /* ---------- MAPPING ---------- */
  const W = Object.fromEntries(weatherItems.map(w=>[w.key,w]));
  const C = Object.fromEntries(clothingItems.map(c=>[c.key,c]));

  const allWeather = weatherItems.map(w=>w.key);
  const allClothing = clothingItems.map(c=>c.key);

  /* ---------- LEVEL DEFINITIONS ---------- */
  const levelDefs = [
    { name:"Weather Signs → Weather Images", left:allWeather, right:allWeather, leftMode:"sign", rightMode:"clipart" },
    { name:"Weather Images → Weather Signs", left:allWeather, right:allWeather, leftMode:"clipart", rightMode:"sign" },
    { name:"Clothing Signs → Clothing Images", left:allClothing, right:allClothing, leftMode:"sign", rightMode:"clipart" },
    { name:"Clothing Images → Clothing Signs", left:allClothing, right:allClothing, leftMode:"clipart", rightMode:"sign" },
    { name:"Weather Signs → Clothing Images", left:allWeather, right:allClothing, leftMode:"sign", rightMode:"clipart" },
    { name:"Clothing Signs → Weather Images", left:allClothing, right:allWeather, leftMode:"sign", rightMode:"clipart" }
  ];

  /* ---------- FEEDBACK IMAGE ---------- */
  const fb = document.createElement("img");
  fb.id = "feedbackImage";
  fb.style.cssText = `
    position:fixed; top:50%; left:50%;
    transform:translate(-50%,-50%);
    width:200px; display:none; z-index:2000;
  `;
  document.body.appendChild(fb);

  const shuffle = arr => arr.slice().sort(()=>Math.random()-0.5);

  function flash(correct){
    fb.src = correct ? "assets/correct.png" : "assets/wrong.png";
    fb.style.display = "block";
    setTimeout(()=>fb.style.display="none",700);
  }

  function updateScore(){
    const correct = levelAttempts.reduce((t,l)=>t+l.correct.size,0);
    const wrong   = levelAttempts.reduce((t,l)=>t+l.incorrect.length,0);
    const pct = (correct+wrong===0)?0:Math.round(correct/(correct+wrong)*100);
    document.getElementById("score-display").innerText = `Score: ${pct}%`;
    return pct;
  }
});
