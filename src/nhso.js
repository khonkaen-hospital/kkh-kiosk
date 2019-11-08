
const axios = require('axios').default;
var convert = require('xml-js');

function nhso(userPersonId, token, personId = '1409900017301'){

  let request = new Promise((resolve, reject) => {
    let body = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tok="http://tokenws.ucws.nhso.go.th/">
      <soapenv:Header/>
        <soapenv:Body>
              <tok:searchCurrentByPID>
                  <user_person_id>${userPersonId}</user_person_id>
                  <smctoken>${token}</smctoken>
                  <person_id>${personId}</person_id>
              </tok:searchCurrentByPID>
          </soapenv:Body>
      </soapenv:Envelope>`;

      axios({
        method: 'POST',
        url: 'http://ucws.nhso.go.th/ucwstokenp1/UCWSTokenP1',
        headers: {
          'Content-Type': 'text/xml',
        },
        data:body
      })
      .then(function (response) {
        console.log('response=',response);
        var result = convert.xml2json(response.data, {compact: true, spaces: 4});
        let rawdata = JSON.parse(result);
        let data = rawdata['S:Envelope']['S:Body']['ns2:searchCurrentByPIDResponse']['return'];
        let status = data['ws_status']._text;
        if(status=='NHSO-000001') {
          console.log(status,data)
        } else {
          console.log(status,data)
        }
        resolve({status:status, data: data})
      })
      .catch(function (error) {
        reject(error);
      });
  })

  return request;
}

module.exports = nhso;
