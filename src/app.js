import "./stylesheets/main.css";
import "./stylesheets/animate.css";

// Small helpers you might want to keep
import "./helpers/context_menu.js";
import "./helpers/external_links.js";

// ----------------------------------------------------------------------------
// Everything below is just to show you how it works. You can delete all of it.
// ----------------------------------------------------------------------------

import { remote, net } from "electron";
import jetpack from "fs-jetpack";
import { greet } from "./hello_world/hello_world";
import env from "env";
import * as xmlToJSON from "xmlToJSON";
import * as nhso from "./nhso";

const { Reader } = require('@dogrocker/thaismartcardreader')

const escpos = require('escpos');

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());
const myReader = new Reader()
const Store = require('electron-store');
const schema = {
	nhso: {
		cardNo: '',
		token: ''
	}
};
const store = new Store({schema});

let CARDNO = '';
let TOKEN = '';


var cardStatus = false;
var cPerson = {
  'cid': '',
  'name': '',
  'dob': ''
};
var pageError1 = '';
var pageError2 = '';
var pageError3 = '';


// Holy crap! This is browser window with HTML and stuff, but I can read
// files from disk like it's node.js! Welcome to Electron world :)
const manifest = appDir.read("package.json", "json");

const osMap = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux"
};

var forms = document.getElementById('settingForm');

function animateCSS(element, animationName, callback) {
  const node = document.querySelector(element)
  node.classList.add('animated', 'faster')
  node.classList.add('animated', animationName)

  function handleAnimationEnd() {
      node.classList.remove('animated', animationName)
      node.removeEventListener('animationend', handleAnimationEnd)

      if (typeof callback === 'function') callback()
  }

  node.addEventListener('animationend', handleAnimationEnd)
}

let page0 = document.getElementById('page0');
let page1 = document.getElementById('page1');
let page2 = document.getElementById('page2');
let page3 = document.getElementById('page3');

function goToPage(pageId){
  let page = document.getElementById(pageId);
  animateCSS('#page0','slideOutUp',()=>{
    page0.classList.remove('pageActive');
    page.classList.add('pageActive');
    animateCSS('#'+pageId,'slideInUp');
  });
  activePage(pageId);
}

function back(src){
  let page = src.srcElement.dataset.page;
  animateCSS('#'+page,'slideOutDown', () => {
    document.querySelector('#'+page).classList.remove('pageActive');
    page0.classList.add('pageActive');
    animateCSS('#page0','slideInDown');
  });
}

function backWithPageId(page){
  animateCSS('#'+page,'slideOutDown', () => {
    document.querySelector('#'+page).classList.remove('pageActive');
    page0.classList.add('pageActive');
    animateCSS('#page0','slideInDown');
  });
}

document.getElementById('linkPage1').addEventListener('click', (src)=>{
  goToPage('page1');
});
document.getElementById('linkPage2').addEventListener('click', (src)=>{
  goToPage('page2');
});
document.getElementById('linkPage3').addEventListener('click', (src)=>{
  goToPage('page3');
});

document.getElementById('linkPage4').addEventListener('click', (src)=>{
  animateCSS('#page0','slideOutUp',()=>{
    page0.classList.remove('pageActive');
    page4.classList.add('pageActive');
    animateCSS('#page4','slideInUp');
  });
});

document.getElementById('back1').addEventListener('click', (src)=>{
  back(src);
});
document.getElementById('back2').addEventListener('click', (src)=>{
  back(src);
});
document.getElementById('back3').addEventListener('click', (src)=>{
  back(src);
});

function initForm() {
  let data = store.get('nhso');
  if(data === undefined){
    store.set('nhso', {
      cardNo: '',
      token: ''
    });
  } else {
    CARDNO = data.cardNo;
    TOKEN = data.token;
    document.getElementById('txtCardNo').value = data.cardNo;
    document.getElementById('txtToken').value = data.token;
  }
}

forms.addEventListener('submit', event => {
  let cardNo = document.getElementById('txtCardNo').value;
  let token = document.getElementById('txtToken').value;
  store.set('nhso', {
    cardNo: cardNo,
		token: token
  });
  // back to home page
  animateCSS('#page4','slideOutDown', () => {
    document.querySelector('#page4').classList.remove('pageActive');
    page0.classList.add('pageActive');
    animateCSS('#page0','slideInDown');
  });
  event.preventDefault()
})

async function getNhso(cid){
  let data = await nhso(CARDNO,TOKEN, cid);
  printSlipCRight(data);
  //console.log('======NHSO RESPONSE DATA=====', data);
}

function initSmartCard(){

  myReader.on('device-activated', async (event) => {
    console.log('Device-Activated')
    console.log(event.name)
  })

  myReader.on('error', async (err) => {
    console.log(err)
  })

  myReader.on('image-reading', (percent) => {
    console.log(percent)
  })

  myReader.on('card-removed', (err) => {
    console.log('== card remove ==');

    cardStatus = false;

  })

  myReader.on('card-inserted', async (person) => {

    console.log(person);
    const cid = await person.getCid()
    const thName = await person.getNameTH()
    const dob = await person.getDoB()
    console.log(`CitizenID: ${cid}`)
    console.log(`THName: ${thName.prefix} ${thName.firstname} ${thName.lastname}`)
    console.log(`DOB: ${dob.day}/${dob.month}/${dob.year}`);

    cPerson.cid = `${cid}`;
    cPerson.name = `${thName.prefix} ${thName.firstname} ${thName.lastname}`;
    cPerson.dob = `${dob.day}/${dob.month}/${dob.year}`;

    cardStatus = true;

  })

  myReader.on('device-deactivated', () => { console.log('device-deactivated') })
}

function activePage(page) {
  if(page === 'page1'){
    if(cardStatus == false){
      console.log('Please insert smart card.');
      setTimeout(function(){
        backWithPageId('page1');
      }, 10000);
      return;
    }
    getNhso(cPerson.cid);
  }
  if(page === 'page2'){
    console.log('page2');
  }
  if(page === 'page3'){
    console.log('page3');
  }
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';

  for(var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    }
    else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}

function dateTh(date) {
  var day = date.substring(6,8);
  var month = date.substring(4,6);
  var year = date.substring(0,4);
  return day+'/'+month+'/'+year;
}

function printSlipCRight(ret) {

  const lbNameHospital = 'โรงพยาบาลขอนแก่น';
  const lbHRights = 'ข้อมูลสิทธิการรักษา';
  const lbName = 'ชื่อ - สกุล';
  const txtName = ret.data['title_name']._text+ret.data['fname']._text+' '+ret.data['lname']._text;
  const lbRights = 'สิทธิการรักษา';
  const txtRights = ret.data['maininscl_name']._text;
  const lbDateRights = 'วันที่เริ่มใช้สิทธิ์';
  const txtDateRights = dateTh(ret.data['startdate']._text);
  const lbHospital = 'หน่วยบริการหลัก';
  const txtHospital = ret.data['hmain_name']._text;  

  var canvas = document.createElement('canvas');

  canvas.width = '310';
  canvas.height = '585';
  var x = canvas.width / 2;

  var maxWidth = 300;
  var lineHeight = 40;

  var ctx = canvas.getContext('2d');

  ctx.textAlign = 'center';
  ctx.fillStyle = "black";

  var img = new Image();
  img.addEventListener('load', function() {

    ctx.drawImage(img, x-52, 0, 102, 93);

    var h = 100;
    ctx.font = '52px TH Sarabun New , sans-serif';
    ctx.fillText(lbNameHospital, x, h+35);
    ctx.font = '42px TH Sarabun New , sans-serif';
    ctx.fillText(lbHRights, x, h+85);
    ctx.font = '32px TH Sarabun New , sans-serif';
    ctx.fillText(lbName, x, h+125);
    ctx.font = '36px TH Sarabun New , sans-serif';
    ctx.fillText(txtName, x, h+165);
    ctx.font = '32px TH Sarabun New , sans-serif';
    ctx.fillText(lbRights, x, h+205);
    ctx.font = '36px TH Sarabun New , sans-serif';
    ctx.fillText(txtRights, x, h+245);
    ctx.font = '32px TH Sarabun New , sans-serif';
    ctx.fillText(lbDateRights, x, h+285);
    ctx.font = '36px TH Sarabun New , sans-serif';
    ctx.fillText(txtDateRights, x, h+325);
    ctx.font = '32px TH Sarabun New , sans-serif';
    ctx.fillText(lbHospital, x, h+365);
    ctx.font = '34px TH Sarabun New , sans-serif';
    wrapText(ctx, txtHospital, x, h+410, maxWidth, lineHeight);
  
    const url = canvas.toDataURL('image/png', 0.8);
    
    //const device = new escpos.USB();
    const device = new escpos.Network('10.3.42.77');
    const printer = new escpos.Printer(device);
  
    escpos.Image.load(url, function(image){
  
      device.open(function(){
    
        printer
        .align('ct')
        .raster(image)
        .text('')
        .cut()
        .close();
    
      });
    
    });

  }, false);
  img.src = '../resources/kkh_logo.png'; // Set source path
}


initForm();
initSmartCard();


