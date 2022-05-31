const axios = require('axios');
const cheerio = require("cheerio");
//const moment = require("moment");
var moment = require('moment-timezone');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('removed');

//https://www.upsc.gov.in/recruitment/criteria-adopted

axios.get('http://localhost:3000', { timeout: 5000 })
  .then(response => {
    console.log('return' + response);
    
    const $ = cheerio.load(response.data);
    let res = processCase2table($, ['br']);
    //console.log(res);

    containerObject = JSON.stringify(res[1]);
   
    containerObject = JSON.parse(containerObject);
   
    sanitizeKeysRecursively(containerObject);

    //console.log(containerObject);
    //console.log(containerObject["Date of Upload"]);
    latestDateOfUpload = sanitizeValues(containerObject["Date of Upload"]);
    var latestUploadForChecking = getDateInMomentFormat(latestDateOfUpload);
   
    var currentDate = moment().tz("Asia/Kolkata").format('YYYY-MM-DD');

    //console.log(`${currentDate} ${latestUpload}`);
    //console.log(moment(currentDate).isSame(latestUpload));
    var initialMessage = "";
    var pastDataHolder = [];
    if (moment(currentDate).isSame(latestUploadForChecking)) {    
      initialMessage = 'Hi, Latest Uploaded Scrutiny is  ==== >>>> ';
      var counter = 0;
      for (var key in res) {
        if (counter <5 && res.hasOwnProperty(key)) {
          counter++;
          var val = res[key];
          sanitizeKeysRecursively(val);
          AdvertisementNumber = sanitizeValues(val["Advertisement Number"]);
          VacancyNumber = sanitizeValues(containerObject["Vacancy Number"]);
          NameofPost = sanitizeValues(containerObject["Name of Post"]);
          latestDateOfUpload = sanitizeValues(containerObject["Date of Upload"]);
          //console.log(AdvertisementNumber);
          Final  = "\n" + AdvertisementNumber  + " | " +
          + VacancyNumber  + " | "
          + NameofPost  + " | "
          + latestDateOfUpload ;
          pastDataHolder.push(Final);
        }
      }  
    } else {
      var counter = 0;
      for (var key in res) {
        if (counter < 5 && res.hasOwnProperty(key)) {
          counter++;
          var val = res[key];
          //console.log(val);
          sanitizeKeysRecursively(val);
          AdvertisementNumber = sanitizeValues(val["Advertisement Number"]);
          VacancyNumber = sanitizeValues(val["Vacancy Number"]);
          NameofPost = sanitizeValues(val["Name of Post"]);
          latestDateOfUpload = sanitizeValues(val["Date of Upload"]);
          //console.log(AdvertisementNumber);
          initialMessage = 'Hi, No latest uploads, Past Uploaded Scrutiny is  ==== >>>> ';
          Final  = "<br>" + AdvertisementNumber  + " | " +
          + VacancyNumber  + " | "
          + NameofPost  + " | "
          + latestDateOfUpload ;
          pastDataHolder.push(Final);
        }
      }      
    }
  console.log(initialMessage + pastDataHolder);

  // send email

  const msg = {
    to: 'rahulsingh3364@gmail.com',
    from: 'rahulsingh3364@gmail.com', // Use the email address or domain you verified above
    subject: 'UPSC Scrutiny Details',
    text: 'and easy to do anywhere, even with Node.js',
    html: initialMessage + pastDataHolder,
  };

  //ES8
  (async () => {
    try {
      await sgMail.send(msg);
    } catch (error) {
      console.error(error);
  
      if (error.response) {
        console.error(error.response.body)
      }
    }
  })();

  })
  .catch(error => {
    console.log('Got Error  ==== >>>>  ' + error);
  });

  function getDateInMomentFormat(str1){
    // str1 format should be dd/mm/yyyy. Separator can be anything e.g. / or -. It wont effect
    //console.log(`${str1}`);
    var dt1   = parseInt(str1.substring(0,2));
    
    var mon1  = str1.substring(3,5);
    
    var yr1   = parseInt(str1.substring(6,10));
    //console.log(`${dt1} ${mon1} ${yr1}`);
    return yr1 + "-" + mon1 + "-" + dt1;
    }

  function sanitizeKeysRecursively(objIn) {
    Object.entries(objIn).forEach(function(kv) {
      var sanitizedKey = kv[0].replace("\n", "").trim();
  
      // call the function recursively on any values that are objects
      if (typeof kv[1] === 'object') {
        sanitizeKeysRecursively(kv[1]);
      }
  
      // set the sanitized key and remove the unsanitized one
      if (sanitizedKey != kv[0]) {
        objIn[kv[0].replace("\n", "").trim()] = kv[1];
        delete objIn[kv[0]];
      }
    });
  }
  

  function sanitizeValues(input) {
    return input.replace("\n", "").trim();
  }

  function processCase2table(cheerio_table_object, remove_tags=[] ){
	let columns = [];
	let items = {};
	// preprocessing, eg. remove tags
	if (remove_tags.length){
		remove_tags.forEach(tag => {  
			cheerio_table_object(tag).replaceWith('');									
		});
	} 
	
	// get columns
	cheerio_table_object('thead tr th').each((index, el) => { 
		columns.push(cheerio_table_object(el).text()); 
	});
	
	cheerio_table_object('tr').each((tr_index, tr) => {
		let item = {}; 
		// console.log('tr: ', cheerio.load(tr).html() );
		cheerio_table_object('td:not([colspan])', tr ).each((index, td) => { 
			item[columns[index]] = cheerio.load(td).text(); 
		}); 
		// adding item into the items object	
		if (Object.entries(item).length !== 0) {
			items[tr_index] = item;
		}
	});
	 
	return items;
}
