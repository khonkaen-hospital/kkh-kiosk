const generator = require('generate-password');
const _generatePassword = require('password-generator');
const axios = require('axios').default;
const moment = require('moment');
const escpos = require('escpos');

var USERNAME = '',
    PASSWORD = '',
    EXPRIED = '',
    PRINTER_IP = '10.3.42.77';
    IS_INTERNAIL = 'in',
    PRINTER_TYPE = 'ip',
    TOKEN = '';
var apiUrl = 'http://iconnect.kkh.go.th:3008';

function setToken(api_url,token,printerIp, printerType='ip'){
  TOKEN = token;
  apiUrl = api_url;
  PRINTER_IP = printerIp;
  PRINTER_TYPE = printerType;
}

function getExpireDate(type,locale='en'){
  let types = [
    {id:'1hours',amount:1,duration:'hours'},
    {id:'2hours',amount:2,duration:'hours'},
    {id:'4hours',amount:4,duration:'hours'},
    {id:'6hours',amount:6,duration:'hours'},
    {id:'8hours',amount:8,duration:'hours'},
    {id:'1days',amount:1,duration:'days'},
    {id:'2days',amount:2,duration:'days'},
    {id:'3days',amount:3,duration:'days'},
    {id:'4days',amount:4,duration:'days'},
    {id:'5days',amount:5,duration:'days'},
    {id:'6days',amount:6,duration:'days'},
    {id:'1weeks',amount:1,duration:'weeks'},
    {id:'2weeks',amount:2,duration:'weeks'},
    {id:'3weeks',amount:3,duration:'weeks'},
    {id:'1months',amount:1,duration:'months'},
    {id:'2months',amount:2,duration:'months'},
    {id:'3months',amount:3,duration:'months'},
    {id:'4months',amount:4,duration:'months'},
    {id:'5months',amount:5,duration:'months'},
    {id:'6months',amount:6,duration:'months'},
    {id:'7months',amount:7,duration:'months'},
    {id:'8months',amount:8,duration:'months'},
    {id:'9months',amount:9,duration:'months'},
    {id:'10months',amount:10,duration:'months'},
    {id:'11months',amount:11,duration:'months'},
    {id:'1years',amount:1,duration:'years'}
  ];
  let item = types.filter((value)=>{
    return value.id == type;
  });
  if(item.length===1){
    let type = item[0];
    return locale=='th'
      ? moment().add(type.amount,type.duration).locale('th').format('D MMM YYYY H:mm:ss')
      : moment().add(type.amount,type.duration).format('D MMM YYYY H:mm:ss');
  } else {
    return moment().format('D MMM YYYY H:mm:ss');
  }
}

function generateUsername(length=6, numbers=false) {
  return generator.generate({
      length: length,
      numbers: numbers
  });
}

function generatePassword(length=6) {
  return _generatePassword(length, false, /\d/);
}

function saveUser(data){
  return axios({
    method: 'POST',
    url: `${apiUrl}/redius/user`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    data:{data:data}
  });
}

function addGroup(data){
  return axios({
    method: 'POST',
    url: `${apiUrl}/redius/group`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    },
    data:{data:data}
  });
}

function deleteUser(username, attribute) {
  return axios({
    method: 'DELETE',
    url: `${apiUrl}/redius/user/${username}/${attribute}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  });
}

function deleteGroup(username) {
  return axios({
    method: 'DELETE',
    url: `${apiUrl}/redius/group/${username}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  });
}

async function createUser(username, role, remark, expireType='1days', isInternail='in', isPrint=true, attribute='MD5-Password'){
  console.log(TOKEN);
  USERNAME = username;
  PASSWORD = generatePassword();
  EXPRIED  = getExpireDate(expireType);
  EXPRIED_TH  = getExpireDate(expireType,'th');
  IS_INTERNAIL = isInternail;

  let result1 = await saveUser({
    username: username,
    value: PASSWORD,
    attribute: attribute,
    remark: remark,
    op: ':='
  });

  let result2 = await saveUser({
    username: username,
    value: EXPRIED,
    attribute: 'Expiration',
    remark: remark,
    op: ':='
  });

  let result3 = await addGroup({
    username: username,
    groupname: role,
    priority: 5
  });

  console.log('result1',result1);
  console.log('result2',result2);
  console.log('result3',result3);
  if(result1.data.ok == true && result2.data.ok == true) {
    if(isPrint) {
      print();
    }
    return {
      username: USERNAME,
      password: PASSWORD,
      expired: EXPRIED_TH
    }
  } else {
    if(result1.data.error.code == 'ER_DUP_ENTRY'){
      if (confirm("บัญชีผู้ใช้งานนี้มีอยู่แล้ว! คุณต้องการบันทึกซ้ำใช่หรือไม่?")) {
        await deleteUser(USERNAME,'MD5-Password');
        await deleteUser(USERNAME,'Expiration');
        await deleteGroup(USERNAME);
        return createUser(username, role, remark, expireType, isInternail, isPrint, attribute);
      }
    }else {
      return {
        username: '',
        password: '',
        expired: ''
      }
    }
  }
}


function print() {
  var device = null;
  if(PRINTER_TYPE=='ip') {
     device = new escpos.Network(PRINTER_IP);
  } else {
     device = new escpos.USB();
  }

  const printer = new escpos.Printer(device);

  device.open(function () {
    var dateTime = moment().locale('th').format('DD MMM YYYY HH:mm:ss');

    let p = printer
      .model('qrprinter')
      .align('ct')
      .encode('tis620')
      .size(2, 1)
      .text('Khon Kaen Hospital')
      .size(1, 1)
      .text('Internet Account')
      .text('')
      .size(1, 1)
      .text('Username')
      .size(2, 2)
      .text(USERNAME)
      .size(1, 1)
      .text('Password')
      .size(2, 2)
      .text(PASSWORD)
      .size(1, 1)
      .text('Expired')
      .size(1, 1)
      .text(EXPRIED)
      .text('');

      if(IS_INTERNAIL=='in'){
        p.size(1, 1)
        .text('wifi: KKH-Visitor')
        .size(1, 1)
        .text('password: 043336789A')
        .size(1, 1)
        .text('wifi: KKH-Employee')
        .size(1, 1)
        .text('password: 0433367891')
        .text(dateTime)
        .text('')
        .cut()
        .close();
      }else {
        p.size(1, 1)
        .text('wifi: KKH-Visitor')
        .size(1, 1)
        .text('password: 043336789A')
        .text(dateTime)
        .text('')
        .cut()
        .close();
      }
  });
}

module.exports = {
  setToken: setToken,
  createUser: createUser,
  generatePassword: generatePassword,
  generateUsername: generateUsername
};
