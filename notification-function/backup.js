/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */

 const axios = require('axios');
 const cheerio = require("cheerio");
 var moment = require('moment-timezone');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('removed key');

 
 exports.helloWorld = async (req, res) => {
   var Final = req.query.message || req.body.message || 'Hello World!';
 //console.log("Executing Fx");
 let responseData = null;
 
 //return actual response from server
 let getData = async () => {
 try {
 let resp = await getExternalData();
 responseData = resp.data;
 //console.log("the outuput::",responseData);
 } catch (error) {
 console.log("error" + error);
 } finally {
 //return responseData;
 }
 }
 
 console.log("Awating....")
 await getData();
 console.log("Done....")
 
  const $ = cheerio.load(responseData);
     let r = processCase2table($, ['br']);
    //console.log(res);

    containerObject = JSON.stringify(r[1]);
   
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
      for (var key in r) {
        if (counter <5 && r.hasOwnProperty(key)) {
          counter++;
          var val = r[key];
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
      for (var key in r) {
        if (counter < 5 && r.hasOwnProperty(key)) {
          counter++;
          var val = r[key];
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
   res.status(200).send(Final);
 };
 
 //returns promise 
 let getExternalData = () => {
 return axios.get('https://www.upsc.gov.in/recruitment/criteria-adopted', { timeout: 5000 });
 }

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
 
 
