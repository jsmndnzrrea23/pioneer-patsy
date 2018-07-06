/*
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* jshint node: true, devel: true */

'use strict';

const 
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),  
  request = require('request');

var app = express();
app.set('port', process.env.PORT || 2502);
app.set('view engine', 'ejs');
app.use(bodyParser.json({ verify: verifyRequestSignature }));
app.use(express.static('public'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var cart_payload = '';
var cart_quantity = 0;

var date = require('date-and-time');
Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}
var now = new Date().addHours(8);

date.format(now, 'MM/DD/YY hh:mm:ss A');

date.setLocales('en', {
    A: ['AM', 'PM']
});

var day = date.format(now, 'MM/DD/YY hh:mm:ss A');

var needle = require('needle');

var mysql = require('mysql');

var connection = mysql.createConnection({

});

connection.connect();

app.get('/contact', function(req, res){
  console.log('contact');
  res.sendFile('index.html', {root: path.join(__dirname, '/')});
});

// var menu = require('./menu.js');

/*
 * Be sure to setup your config values before running this code. You can 
 * set them using environment variables or modifying the config file in /config.
 *
 */

// App Secret can be retrieved from the App Dashboard
const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ? 
  process.env.MESSENGER_APP_SECRET :
  config.get('appSecret');

// Arbitrary value used to validate a webhook
const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
  (process.env.MESSENGER_VALIDATION_TOKEN) :
  config.get('validationToken');

// Generate a page access token for your page from the App Dashboard
const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
  (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
  config.get('pageAccessToken');

// URL where the app is running (include protocol). Used to point to scripts and 
// assets located at this address. 
const SERVER_URL = (process.env.SERVER_URL) ?
  (process.env.SERVER_URL) :
  config.get('serverURL');

const GOOGLE_KEY = (process.env.GOOGLE_KEY) ?
  (process.env.GOOGLE_KEY) :
  config.get('googleAPIKey');

  console.log(GOOGLE_KEY);


if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}

/*
 * Use your own validation token. Check that the token used in the Webhook 
 * setup is the same token used here.
 *
 */
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }  
});
/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent);
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  }
});


app.post('/broadcast', function(req, res){
  console.log('DONE');
  console.log(req.body);

  if(req.body.tempId == '1'){

  for(var x = 0; x < req.body.users.length; x++){
    var messageData = {
        recipient: {
          id: req.body.users[x].messenger_id
        },
        message: {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements: [{
                title: req.body.message,
                // subtitle: "Next-generation virtual reality",
                // item_url: "https://www.oculus.com/en-us/rift/",
                image_url: req.body.image_url,
                buttons: [{
                  type: "web_url",
                  url: req.body.link,
                  title: "Open Web URL"
                }]
              }]
            }
          }
        }
      };
    callSendAPI(messageData);
  }

  res.send({
    status: 'done'
  });

  }else if(req.body.tempId == '2'){

  for(var x = 0; x < req.body.users.length; x++){
    var messageData = {
        recipient: {
          id: req.body.users[x].messenger_id
        },
        message:{
          attachment:{
            type:"template",
            payload:{
              template_type:"button",
              text: req.body.message,
              buttons:[
                {
                  type:"postback",
                  title:"Start Chatting",
                  payload:"SAMPLE"
                }
              ]
            }
          }
        }
      };
    callSendAPI(messageData);
  }
  res.send({
    status: 'done'
  });

  }else if(req.body.tempId == '3'){

  for(var x = 0; x < req.body.users.length; x++){

     var messageData = {
        recipient: {
          id: req.body.users[x].messenger_id
        },
        message:{
          attachment:{
            type:"image",
            payload:{
              url:req.body.image_url
            }
          }
        }
      };
    callSendAPI(messageData);

      var text = req.body.message;
      sendTextMessage(req.body.users[x].messenger_id, text);

  }


  res.send({
    status: 'done'
  });


  }

});

const MT = "Medical Treatment\na. Original Medical Report/Clinical Abstract\nb. Medical Certificate from physician or hospital complete with Admitting Notes & Discharge Summary (if confined)\nc. Physician's prescription for medicines bought\nd. Clinical test or laboratory results\ne. Detailed original hospital Statement of Account\nf. Copy of Operative or Histopathology reports\ng. Police report (for accidents)\nh. Original official receipts for expenses related to the treatment of injury or Sickness";
const ME = "Medical Evaluation\nArranged by Emergency Assistance Provider";
const RMR = "Repatriation of Mortal Remains\nArranged by Emergency Assistance Provider";
const HI = "Hospital Income\na. Original Medical Report/Clinical Abstract\nb. Medical Certificate from physician or hospital complete with Admitting Notes & Discharge Summary (if confined)\nc. Hospital Statement of Account indicating the Admission & Discharge dates\nd. Copy of Operative or Histopathology reports\ne. Police report (for accidents)";
const CVCMC = "Compassionate Visit & Care of Minor Children \na. Original Medical Report/Clinical Abstract\nb. Medical Certificate from physician or hospital complete with Admitting Notes & Discharge Summary (if confined)\nc. Clinical test or laboratory results\nd. Copy of Operative or Histopathology reports\ne. Police report (for accidents)\nf. Original invoice & official receipt of transportation and hotel expenses of the family member who took care of the Insured Person\ng. Copy of flight itenerary and official receipts of airfare of the family member";
const ETCT = "Emergency Trip Cancellation & Termination\na. Original medical report and/or Death Certificate of the Insured, Insured's family member, business partner or co-director\nb. Proof of relationship between insured Person and the immediate family member, business partner or co-director\nc. Original copy of invoice and receipts for proof of advance payment made for trasportation and accommodation expenses issued by the agency or directly by the wholesaler (Airline & Hotel) and a copy of the voucher issued by the Travel Agency.\nd. Police report (for accidents)";
const FDMCF = "Flight Delay & Missed Connecting Flight\na. Original certificate from Airline stating the reason for the flight delay/missed connecting flight\nb. Copy of the original flight itenerary and new flight itenerary are required for flight delay and missed connecting flight claims\nc. For claims arising from international flights, original official receipts of expenses incurred due to accident will be required.";
const HJ = "Hijack\na. Original certificate from Airline regarding the incident";
const BDDB = "Baggage Delay or Damage to Baggage\na. Original Property Irregularity Report (PIR) from airline or written proof of damage from the hotel management\nb. Original acknowledgement of baggage receipt stating exact date and time\nc. Photograph of the damaged item\nd. Original certification of settlement of the compensation payment by the airline company or hotel";
const LB = "Loss of Baggage\na. Original formal complaint before the police at the place where the incident occured, duly listing the contents of the luggage and value (for Baggage Loss)\nb. Original Property Irregularity Report (PIR) from Airline or Hotel \nc. Original Receipts of lost or damaged items (if available)\nd. Certification from hotel or any other party that the loss was not indemnified, or if settlement was made, certification specifying amount settled";
const LPM = "Loss of Personal Money\na. Police report and any document that will show proof of possession such as bank withdrawal and ATM receipt";
const LTD = "Loss of Travel Documents\na. Original Police report from the place where the incident occured\nb. Original receipts of transportation, accommodation, and/or communication expenses to go to the place where documents will be issued";
const PL = "Personal Liability\na. Original Police report from the place where the incident occurred\nb. Should be reported to the Emergency Assistance Provider right after the incident";
const PA = "Personal Accident\na. Certified true copy of death certificate\nb. Certified true copy of birth certificate of the deceased\nc. Certified true copy of birth certificate of the beneficiaries\nd. Certified true copy of marriage contract (if married)\ne. Police report (for accidents)\nf. Letter of Guardianship executed by the Court of Law if the beneficiary is a minor and the share of the insurance proceeds exceeds Php 500,000.00 or if the minor's share proceeds is below Php 500,000.00 but the guardian is not parent\ng. IDs of the beneficiary";
const ED = "Emergency Dentistry\na. Original medical report (due to accident)\nb. Dental Certificate";
const SR = "Staff Replacement\na. Original medical report\nb. Medical certificate from physician or hospital\nc. Employment Certificate of Staff\nd. Original invoice & official receipt of hotel accommodation incurred by replacement employee\n\nNote: Only transport tickets arranged by the Company or its authorize representative are covered under this Policy.";
const LDGE = "Loss or Damage to Golf Equipment\na. Police Report\nb. Pictures of Damaged Property\nc. Value/Amount of Damaged Property with supporting documents";
const LHCPG = "Loss of Hand Carried Personal Gadget (Laptop, Tablet, Mobile Phone)\na. Police Report\nb. Value/Amount of lost hand carried gadget with supporting documents";

app.post('/safetrip_req', function(req, res){
  const mid = req.body.mid;

  if(req.body.sttype == 'MT'){
    var sctype = MT;
    safetripReq(mid, sctype);
  }
  else if(req.body.sttype == 'ME'){
    var sctype = ME;
    safetripReq(mid, sctype);    
  }  
  else if(req.body.sttype == 'RMR'){
    var sctype = RMR;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'HI'){
    var sctype = HI;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'CVCMC'){
    var sctype = CVCMC;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'ETCT'){
    var sctype = ETCT;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'FDMCF'){
    var sctype = FDMCF;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'HJ'){
    var sctype = HJ;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'BDDB'){
    var sctype = BDDB;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'LB'){
    var sctype = LB;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'LPM'){
    var sctype = LPM;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'LTD'){
    var sctype = LTD;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'PL'){
    var sctype = PL;
    saferipReq(mid, sctype);    
  }
  else if(req.body.sttype == 'PA'){
    var sctype = PA;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'ED'){
    var sctype = ED;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'SR'){
    var sctype = SR;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'LDGE'){
    var sctype = LDGE;
    safetripReq(mid, sctype);    
  }
  else if(req.body.sttype == 'LHCPG'){
    var sctype = LHCPG;
    safetripReq(mid, sctype);    
  }             
});

app.post('/submit_success', function(req, res){

  if(req.body.sctype == 'MT'){
    sendTextMessage(req.body.mid, MT);
  }
  else if(req.body.sctype == 'HI'){
    sendTextMessage(req.body.mid, HI);
  }
  else if(req.body.sctype == 'CVCMC'){
    sendTextMessage(req.body.mid, CVCMC);
  }
  else if(req.body.sctype == 'ETCT'){
    sendTextMessage(req.body.mid, ETCT);
  }
  else if(req.body.sctype == 'FDMCF'){
    sendTextMessage(req.body.mid, FDMCF);
  }
  else if(req.body.sctype == 'HJ'){
    sendTextMessage(req.body.mid, HJ);
  }
  else if(req.body.sctype == 'BDDB'){
    sendTextMessage(req.body.mid, BDDB);
  }          
  else{

    var text = 'Thank you '+req.body.fname+'! Please submit your photos here!';
    sendTextMessage(req.body.mid, text);

    res.send({
      status: 'done'
    });

  }

});

app.post('/quotation_inquiry', function(req, res){

  var text = 'Hi '+req.body.fname+'! Your inquiry has been submitted, one of our customer representative will get back to you shortly :)';
  sendTextMessage(req.body.mid, text);

  res.send({
    status: 'done'
  });

});

app.post('/promo_reg', function(req, res){

  var text = 'Hi '+req.body.fname+'! Your promo registration has been submitted, one of our customer representative will get back to you shortly :)';
  sendTextMessage(req.body.mid, text);

  res.send({
    status: 'done'
  });

});

app.get('/authorize', function(req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will 
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});


  var GlobalMenu;
  

function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an 
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the 
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger' 
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam, 
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message' 
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some 
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've 
 * created. If we receive a message with an attachment (image, video, audio), 
 * then we'll simply confirm that we've received the attachment.
 * 
 */
function receivedMessage(event) {
  var senderID = event.sender.id;
  var senderName = event.sender.name;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    // Just logging message echoes to console
    console.log("Received echo for message %s and app %d with metadata %s", 
      messageId, appId, metadata);
    return;
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload;
    console.log("Quick reply for message %s with payload %s",
      messageId, quickReplyPayload);

    var post = {LastClicked: quickReplyPayload}

    console.log('insert');
    var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
       
    });

    processPostback(quickReplyPayload, senderID, senderName, timeOfMessage);
    // sendTextMessage(senderID, "Quick reply tapped");
    return;
  }

  if (messageText) {

    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      case 'image':
        sendImageMessage(senderID);
        break;

      case 'gif':
        sendGifMessage(senderID);
        break;

      case 'audio':
        sendAudioMessage(senderID);
        break;

      case 'video':
        sendVideoMessage(senderID);
        break;

      case 'file':
        sendFileMessage(senderID);
        break;

      case 'button':
        sendButtonMessage(senderID);
        break;

      case 'generic':
        sendGenericMessage(senderID);
        break;

      case 'receipt':
        sendReceiptMessage(senderID);
        break;

      case 'quick reply':
        sendQuickReply(senderID);
        break;        

      case 'read receipt':
        sendReadReceipt(senderID);
        break;        

      case 'typing on':
        sendTypingOn(senderID);
        break;        

      case 'typing off':
        sendTypingOff(senderID);
        break;        

      case 'account linking':
        sendAccountLinking(senderID);
        break;

      case '123456':
        var text = "Thank you. You insurance claim is already ready to be claimed at any our participating stores.";
        sendTextMessage(senderID, text);
        break;

      default:{

        needle.get('https://graph.facebook.com/v2.6/'+senderID+'?access_token='+PAGE_ACCESS_TOKEN, function(error, response) {  

          connection.query("SELECT * FROM patsy_users WHERE MessengerId = '"+senderID+"'", function(err, rows, fields){

            for (var i = 0; i < rows.length; i++) {    
              
              if (rows[i].Tag == 'CONCERNS'){

                var text = "Thanks! we'll get back to you soon :)";
                sendTextMessage(senderID, text);

                //sms concern

/*                var GlobalMenu;              

                var InitialData = {
                  name : response.body.first_name+" "+response.body.last_name,
                  //from : "Nazarrea",
                  to : "inquiries@kumon.ph",
                  //number : "09055449732",
                  message : messageText,
                  subject : "KUMON BOT INQUIRY"                   
                };

                var GlobalHeader = {
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                };
                 
                needle.post('https://anytime-mailer.herokuapp.com/kumon_inquire', InitialData, GlobalHeader, function(err, resp, body) {

                });*/

                var post = {Tag:"", MessageTag: "Concern", LastClicked:"SENT_CONCERN"};
                var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
                     
                });
                console.log(query.sql);

              }else{

                var state = 'DEFAULT_MESSAGE';
                connection.query('UPDATE patsy_users SET LastClicked = ? WHERE MessengerId = ?', [state, senderID])

                var messageData = {
                  recipient: {
                    id: senderID
                  },
                  message: {
                    text: "Not sure I understand what you are saying, but I am learning more everyday ;).\n\nYou may select from the options below.",
                    quick_replies: [
                      {
                        content_type:"text",
                        title:"Main Menu",
                        payload:"GET_STARTED"
                      },                        
                      {
                        content_type:"text",
                        title:"Customers",
                        payload:"CUSTOMERS"
                      },                        
                      {
                        content_type:"text",
                        title:"Partners",
                        payload:"PARTNERS"
                      },                                         
                      {
                        content_type:"text",
                        title:"Submit Concerns",
                        payload:"SUBMIT_CONCERNS"
                      }
                    ]
                  }
                };

                callSendAPI(messageData);

              }

            }// END FOR LOOP 

          }); // END SELECT QUERY

        });          

      } // end default

    }
    
  } else if (messageAttachments) {
    console.log(messageAttachments);
    console.log(messageAttachments[0].payload.coordinates);
    if(messageAttachments[0].type == 'location'){

    // sendTextMessage(senderID, "Message with attachment received");
    var locationurl = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+messageAttachments[0].payload.coordinates.lat+','+messageAttachments[0].payload.coordinates.long+'&key='+GOOGLE_KEY;
    console.log(locationurl);
    needle.get(locationurl, function(error, response) {
      if (!error && response.statusCode == 200){

        console.log(response.body);
        // var result = JSON.parse(response.body);
        // console.log(result.results);
        var result = response.body.results;
        console.log(result);

        //var text = '';
        var addr = []
        var loc = {
          address: ''
        };
        for(var i = 0; i <result[0].address_components.length; i++){
          if(result[0].address_components[i].types[0] == 'street_number'){
            loc.address = result[0].address_components[i].long_name;
          }
          if(result[0].address_components[i].types[0] == 'route'){
            loc.address = loc.address+" "+result[0].address_components[i].long_name;
          }
        }
        for(var i = 0; i <result[1].address_components.length; i++){
          if(result[1].address_components[i].types[0] == 'neighborhood'){
            loc.address = loc.address+", "+result[1].address_components[i].long_name;
          }
          if(result[1].address_components[i].types[0] == 'sub_locality'){
            loc.address = loc.address+", "+result[1].address_components[i].long_name;
          }
          if(result[1].address_components[i].types[0] == 'locality'){
            loc.address = loc.address+", "+result[1].address_components[i].long_name;
          }
          if(result[1].address_components[i].types[0] == 'administrative_area_level_1'){
            loc.address = loc.address+", "+result[1].address_components[i].long_name;
          }
          if(result[1].address_components[i].types[0] == 'country'){
            loc.address = loc.address+", "+result[1].address_components[i].long_name;
          }
        }

        connection.query('SELECT id, name, address, (6371 * acos(cos(radians("'+messageAttachments[0].payload.coordinates.lat+'")) * cos(radians(lat)) * cos(radians(lng) - radians("'+messageAttachments[0].payload.coordinates.long+'")) + sin(radians("'+messageAttachments[0].payload.coordinates.lat+'")) * sin(radians(lat )))) AS distance FROM markers WHERE Tag IN (SELECT Tag FROM patsy_users WHERE MessengerId = "'+senderID+'") HAVING distance < 25 ORDER BY distance LIMIT 1;', function(err, rows, fields){
        if (err) throw err;
          for (var i = 0; i < rows.length; i++) {

            var text = 'Nearest store: '+rows[i].name+'\naddress: '+rows[i].address+'\ndistance: '+rows[i].distance.toFixed(1)+' km';
            sendTextMessage(senderID, text);

          }
        });   

      }
        
    });

    } else if(messageAttachments[0].type == 'image') {
        
      connection.query("SELECT * FROM patsy_users WHERE MessengerId = '"+senderID+"'", function(err, rows, fields){

        var ticketID = rows[0].Tag;

        for(var x = 0; x < messageAttachments.length; x++){

          var imgUrl = messageAttachments[x].payload.url;

          var post = {TicketId: ticketID, MessengerId: senderID, ImgDir: imgUrl, SubmitDate: day};
          var query = connection.query("INSERT INTO pioneer_submit_photos SET ?", post, function(err, result) {
            console.log("inserted");
          });

        }

        sendTextMessage(senderID, "Thank you for submitting your requirements :)");

      });

    } else {

      processPostback("GET_STARTED", senderID);

    }

  }

}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var delivery = event.delivery;
  var messageIDs = delivery.mids;
  var watermark = delivery.watermark;
  var sequenceNumber = delivery.seq;

  if (messageIDs) {
    messageIDs.forEach(function(messageID) {
      console.log("Received delivery confirmation for message ID: %s", 
        messageID);
    });
  }

  console.log("All message before %d were delivered.", watermark);
}


function generateText(senderID, text){
  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      text: text,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };
  return messageData;
}


function generateMenu(senderID){
  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: []
        }
      }
    }
  };

  for(var i = 0; i < GlobalMenu.category.length; i++){
    var temp_menu = {
      title:      GlobalMenu.category[i].title,
      image_url:  SERVER_URL + GlobalMenu.category[i].imageurl,
      buttons: [{
        type:     "postback",
        title:    "Show Items",
        payload:  "MENU_"+GlobalMenu.category[i].payload 
      }]
    };
    messageData.message.attachment.payload.elements.push(temp_menu);
  }

  return messageData;
}

function generateItem(senderID, category){
  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: []
        }
      }
    }
  };

  for(var i = 0; i < GlobalMenu.category.length; i++){
    if(GlobalMenu.category[i].payload == category){
      for(var j = 0; j < GlobalMenu.category[i].item.length; j++){
        // var temp_item_title;
        var temp_item_choice;
        var temp_item_payload;
        if(GlobalMenu.category[i].item[j].variant.length == 1){
          temp_item_choice = "Add to Cart (P"+GlobalMenu.category[i].item[j].variant[0].price+")";
          temp_item_payload = "MENU_"+GlobalMenu.category[i].item[j].variant[0].payload+"_ADD";
        }
        else if(GlobalMenu.category[i].item[j].variant.length > 1){
          temp_item_choice = "Select Variant";
          temp_item_payload = "MENU_"+GlobalMenu.category[i].item[j].payload;
        }
        else{
          temp_item_choice = "No Choice";
        }
        console.log(SERVER_URL + GlobalMenu.category[i].item[j].imageurl);
        var temp_item = {
          title:      GlobalMenu.category[i].item[j].title,
          subtitle:   GlobalMenu.category[i].item[j].description,
          image_url:  SERVER_URL + GlobalMenu.category[i].item[j].imageurl,
          buttons: [{
            type:     "postback",
            title:    temp_item_choice,
            payload:  temp_item_payload
          }, {
            type:     "postback",
            title:    "Back to categories",
            payload:  "MAIN_VIEWMENU"
          }, {
            type:     "postback",
            title:    "Share",
            payload:  "MAIN_VIEWMENU"
          }]
        };
        console.log(temp_item);
        messageData.message.attachment.payload.elements.push(temp_item);
      }
    }
  }

  return messageData;
}

function generateVariant(senderID, category, item){
  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: []
        }
      }
    }
  };

  for(var i = 0; i < GlobalMenu.category.length; i++){
    if(GlobalMenu.category[i].payload == category){
      for(var j = 0; j < GlobalMenu.category[i].item.length; j++){
        if(GlobalMenu.category[i].item[j].tag == item){
          for(var k = 0; k < GlobalMenu.category[i].item[j].variant.length; k++){

            if(GlobalMenu.category[i].item[j].variant[k] != ''){
              var title = GlobalMenu.category[i].item[j].variant[k].title + "\u000A"+GlobalMenu.category[i].item[j].variant[k].description;
            }
            else{
              var title = GlobalMenu.category[i].item[j].variant[k].title;
            }

            title = "asd\u000Aqwe";

            var temp_variant = {
              title:      GlobalMenu.category[i].item[j].variant[k].title,
              // image_url:  SERVER_URL + "/assets/rift.png",
              buttons: [{
                type:     "postback",
                title:    "Add to Cart(P"+GlobalMenu.category[i].item[j].variant[k].price+")",
                payload:  "MENU_"+GlobalMenu.category[i].item[j].variant[k].payload+"_ADD"
              }, {
                type:     "postback",
                title:    "Back to meals",
                payload:  "MENU_"+category
              }]
            };
            messageData.message.attachment.payload.elements.push(temp_variant);
          }
        }
      }
    }
  }

  return messageData;
}

function generateQuantity(senderID, item_name, tag, action){
  var text;
  text = "How many items of "+item_name+" do you want?";

  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      text: text,
      quick_replies: []
    }
  };

  for(var i = 1; i <= 6; i++){
    var temp_quantity = {
      content_type:   "text",
      title:          i,
      payload:        tag+"_"+i 
    };
    messageData.message.quick_replies.push(temp_quantity);
  }

  return messageData;
}

function generateNextChoice(senderID){
  var text = "Would you like to continue shopping?";

  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      text: text,
      quick_replies: [{
        content_type:   "text",
        title:          "Yes, continue",
        payload:        "MAIN_VIEWMENU"
      }, {
        content_type:   "text",
        title:          "Place Order",
        payload:        "MAIN_PLACEORDER"
      }, {
        content_type:   "text",
        title:          "Show Cart",
        payload:        "MAIN_SHOWCART"
      }]
    }
  };

  return messageData;
}

function generateCart(senderID, cart){
  console.log("generate Cart");
  if(cart.length == 0){
    var messageData = generateText(senderID, "Cart is Empty.");
  }
  else{
    var messageData = {
      recipient: {
        id: senderID
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: []
          }
        }
      }
    };

    for(var i = 0; i < cart.length; i++){
      var temp_cart = {
        title:      cart[i].OrderTitle,
        subtitle:   "Quantity: "+cart[i].OrderQuantity+"\u000AUnit Price: P"+cart[i].UnitPrice+"\u000ATotal Price: P"+cart[i].TotalPrice,
        image_url:  SERVER_URL+cart[i].OrderImageUrl,
        buttons: [{
          type:     "postback",
          title:    "Place Order",
          payload:  "MAIN_PLACEORDER"
        }, {
          type:     "postback",
          title:    "Change Quantity",
          payload:  "MENU_"+cart[i].OrderTag+"_CHANGE"
        }, {
          type:     "postback",
          title:    "Remove from cart",
          payload:  "MENU_"+cart[i].OrderTag+"_DELETE"
        }]
      };
      messageData.message.attachment.payload.elements.push(temp_cart);
    }
  }
    

  return messageData;
}

function generateReceipt(senderID, cart, address){
  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type:  "receipt",
          recipient_name: "Randy",
          order_number:   senderID,
          currency:       "PHP", 
          payment_method: "Cash on Delivery",
          timestamp:      Math.floor(Date.now()/1000)+57600
        }
      }
    }
  };

  messageData.message.attachment.payload.elements = [];

  var total = 0;
  for(var i = 0; i < cart.length; i++){
    var element = {
      title:      cart[i].OrderTitle,
      subtitle:   "Unit Price: P"+cart[i].UnitPrice,
      quantity:   cart[i].OrderQuantity,
      price:      cart[i].TotalPrice,
      currency:   "PHP",
      image_url:  SERVER_URL + cart[i].OrderImageUrl
    };
    messageData.message.attachment.payload.elements.push(element);
    total += parseFloat(cart[i].TotalPrice);
  }

  messageData.message.attachment.payload.summary = {
    subtotal: total*0.88,
    // total_tax: total*0.12,
    total_cost: total
  };

  messageData.message.attachment.payload.adjustments = [{
    name: "VAT",
    amount: total*0.12
  }];

  return messageData;
}


function generateLocation(senderID){
  console.log('location');
 
  var text;
  text = "Location:";

  var messageData = {
    recipient: {
      id: senderID
    },
    message: {
      text: text,
      quick_replies: [{
        "content_type":"location",
      }]
    }
  };

  return messageData;

}


function processPostback(payload, senderID, senderName, timeOfPostback){
  timeOfPostback = Math.floor(timeOfPostback/1000);
  console.log("\nPOSTBACK PAYLOAD: "+payload+" SenderID: "+senderID+" Sender Name: "+senderName+"\n");
  var payload_tag = payload.split('_');
  if(payload == 'GET_STARTED'){
    needle.get('https://graph.facebook.com/v2.6/'+senderID+'?access_token='+PAGE_ACCESS_TOKEN, function(error, response) {  
    var name = response.body.first_name+" "+response.body.last_name;
    var fname = response.body.first_name;
    var lname = response.body.last_name;
    var post  = {BotTag: "PIONEER", MessengerId: senderID, Fname: fname, Lname: lname, LastActive: day, LastClicked: 'GET_STARTED'};

    sendTypingOn(senderID);

    connection.query("SELECT 1 FROM patsy_users WHERE MessengerId = '"+senderID+"'", function (error, results, fields) {
    if (error) {
        console.log(error);
    }
    if (results.length  > 0) {
        console.log('fail');
        console.log("fail user already exists"+"\r\n");
        var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
           
        });
        console.log(query.sql);
    } else {
        console.log('insert');
        var query = connection.query('INSERT INTO patsy_users SET ?', post, function(err, result) {
               
        });
        console.log(query.sql);
        console.log("success"+"\r\n");
    }
    console.log(results);
    });

      var text = "Hi "+fname+"! Thank you for choosing Pioneer Insurance. Let me know how I can help by choosing the following options";
      sendTextMessage(senderID, text);

      sendTypingOn(senderID);

          var messageData = {
            recipient: {
              id: senderID
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: [{
                    title: "Make a claim",              
                    image_url: SERVER_URL + "/assets/claim.jpg",
                    buttons: [{
                      type: "postback",
                      title: "Claim Now",
                      payload: "CLAIMS" 
                    }],                    
                  }, {
                    title: "Products",              
                    image_url: SERVER_URL + "/assets/products.jpg",
                    buttons: [{
                      type: "postback",
                      title: "Learn More", 
                      payload: "PRODUCTS"
                    }],                    
                  }, {
                    title: "Promo Registration",              
                    image_url: SERVER_URL + "/assets/promo_reg.jpg",
                    buttons: [{
                      type: "postback",
                      title: "Learn More", 
                      payload: "PROMO_REG"
/*                      type: "web_url",
                      url: "https://pioneer-web.herokuapp.com/promo?mid="+senderID+"&fname="+fname+"&lname="+lname+"&title=Promo Registration",
                      title: "Register",
                      webview_height_ratio: "tall",
                      messenger_extensions: true           */                                        
                    }],                    
                  }, {
                    title: "Careers",              
                    image_url: SERVER_URL + "/assets/careers.jpg",
                    buttons: [{
                      type: "postback",
                      title: "Learn More", 
                      payload: "CAREERS"
                    }],                    
                  }, {
                    title: "Other Concerns",              
                    image_url: SERVER_URL + "/assets/concerns.jpg",
                    buttons: [{
                      type: "postback",
                      title: "Submit Concerns", 
                      payload: "CONCERNS"
                    }],                    
                  }]
                }
              }
            }
          };  

          callSendAPI(messageData);

    });  
  }

  else if(payload == 'CLAIMS'){

    var messageData = {
      recipient: {
        id: senderID
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [{
              title: "Claims Requirements",              
              image_url: SERVER_URL + "/assets/claims_req.jpg",
              buttons: [{
                type: "postback",
                title: "Know more", 
                payload: "REQUIREMENTS"
              }],                    
            }, {
              title: "Claims Submission",              
              image_url: SERVER_URL + "/assets/claims_subm.jpg",
              buttons: [{
                type: "postback",
                title: "Submit requirements", 
                payload: "SUBMISSION"
              }],                    
            }]
          }
        }
      }
    };  

    callSendAPI(messageData);

  }

  else if(payload == 'REQUIREMENTS'){

          var messageData = {
            recipient: {
              id: senderID
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: [{
                    title: "Safe Trip",              
                    image_url: SERVER_URL + "/assets/safetrip.jpg",
                    buttons: [{
                      type: "web_url",
                      url: "https://pioneer-web.herokuapp.com/safetrip_req?mid="+senderID,
                      title: "Know more",
                      webview_height_ratio: "tall",
                      messenger_extensions: true                             
                    }]
                  }, {
                    title: "MediCash",              
                    image_url: SERVER_URL + "/assets/medicash.jpg",
                    buttons: [{
                      type: "postback",
                      title:"Know more",
                      payload:"REQ_MEDICASH"
                    }]
                  }, {
                    title: "Compulsory Third Party Liability",              
                    image_url: SERVER_URL + "/assets/ctpl.jpg",
                    buttons: [{
                      type: "postback",
                      title:"Know more",
                      payload:"REQ_CTPL"             
                    }]
                  }, {
                    title: "Instalife",              
                    image_url: SERVER_URL + "/assets/instalife.jpg",
                    buttons: [{
                      type: "postback",
                      title:"Know more",
                      payload:"REQ_INSTALIFE"
                    }]
                  }, {
                    title: "Personal Accident",              
                    image_url: SERVER_URL + "/assets/personal_accident.jpg",
                    buttons: [{
                      type: "postback",
                      title:"Know more",
                      payload:"REQ_PERSONAL"
                    }]
                  }]
                }
              }
            }
          };  

          callSendAPI(messageData);

  }

  else if (payload == 'SUBMISSION') {

    needle.get('https://graph.facebook.com/v2.6/'+senderID+'?access_token='+PAGE_ACCESS_TOKEN, function(error, response) {  
    var fname = response.body.first_name;
    var lname = response.body.last_name;

    var post = {LastClicked: 'PRODUCTS'}

    console.log('insert');
    var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
       
    });

       sendTypingOn(senderID);   

          var messageData = {
            recipient: {
              id: senderID
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "generic",
                  elements: [{
                    title: "Safe Trip",              
                    image_url: SERVER_URL + "/assets/safetrip.jpg",
                    buttons: [{
                      type: "postback",
                      title:"Buy",
                      payload:"BUY"            
                    }, {
                      type: "web_url",
                      url: "https://pioneer-web.herokuapp.com/submit_photos?mid="+senderID+"&fname="+fname+"&lname="+lname+"&title=Claim&tag=safetrip",
                      title: "Claim Now",
                      webview_height_ratio: "tall",
                      messenger_extensions: true               
                    }, {
                      type: "postback",
                      title:"Product Info",
                      payload:"SAFETRIP_INFO"            
                    }]
                  }, {
                    title: "MediCash",              
                    image_url: SERVER_URL + "/assets/medicash.jpg",
                    buttons: [{
                      type: "postback",
                      title:"Buy",
                      payload:"BUY"               
                    }, {
                      type: "web_url",
                      url: "https://pioneer-web.herokuapp.com/submit_photos?mid="+senderID+"&fname="+fname+"&lname="+lname+"&title=Claim&tag=medicash",
                      title: "Claim Now",
                      webview_height_ratio: "tall",
                      messenger_extensions: true               
                    }, {
                      type: "postback",
                      title:"Product Info",
                      payload:"MEDICASH_INFO"            
                    }]
                  }/*, {
                    title: "Compulsory Third Party Liability",              
                    image_url: SERVER_URL + "/assets/ctpl.jpg",
                    buttons: [{
                      type: "postback",
                      title:"Buy",
                      payload:"BUY"              
                    }, {
                      type: "web_url",
                      url: "https://pioneer-web.herokuapp.com/submit_photos?mid="+senderID+"&fname="+fname+"&lname="+lname+"&title=Claim&tag=ctpl",
                      title: "Claim Now",
                      webview_height_ratio: "tall",
                      messenger_extensions: true               
                    }, {
                      type: "postback",
                      title:"Product Info",
                      payload:"CTPL_INFO"            
                    }]
                  }, {
                    title: "Instalife",              
                    image_url: SERVER_URL + "/assets/instalife.jpg",
                    buttons: [{
                      type: "postback",
                      title:"Participating Stores",
                      payload:"PART_STORES"            
                    }, {
                      type: "web_url",
                      url: "https://pioneer-web.herokuapp.com/submit_photos?mid="+senderID+"&fname="+fname+"&lname="+lname+"&title=Claim&tag=instalife",
                      title: "Claim Now",
                      webview_height_ratio: "tall",
                      messenger_extensions: true               
                    }, {
                      type: "postback",
                      title:"Product Info",
                      payload:"INSTALIFE_INFO"            
                    }]
                  }, {
                    title: "Personal Accident",              
                    image_url: SERVER_URL + "/assets/personal_accident.jpg",
                    buttons: [{
                      type: "postback",
                      title:"Participating Stores",
                      payload:"PART_STORES"            
                    }, {
                      type: "web_url",
                      url: "https://pioneer-web.herokuapp.com/submit_photos?mid="+senderID+"&fname="+fname+"&lname="+lname+"&title=Claim&tag=personal accident",
                      title: "Claim Now",
                      webview_height_ratio: "tall",
                      messenger_extensions: true               
                    }, {
                      type: "postback",
                      title:"Product Info",
                      payload:"PA_INFO"            
                    }]
                  }*/]
                }
              }
            }
          };  

          callSendAPI(messageData);

    });

  }

  else if(payload == 'BUY'){

    sendTypingOn(senderID);

    var messageData = {
      recipient: {
        id: senderID
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "Awesome! pls select below",
            buttons:[{
              type: "postback",
              title:"Via Insure Shop",
              payload:"INSURE_SHOP"               
            }, {
              type: "postback",
              title:"Participating Stores",
              payload:"PART_STORES"            
            }]
          }
        }
      }
    };  

    callSendAPI(messageData);

  }

  else if(payload == 'PART_STORES'){

/*    var post = {LastClicked: 'PART_STORES'}

    console.log('insert');
    var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
       
    });*/

    sendTypingOn(senderID);

      var messageData = {
        recipient: {
          id: senderID
        },
        message: {
          text: "Select participating stores:",
          quick_replies: [
            {
              content_type:"text",
              title:"SM Stores",
              payload:"SM_STORE"
            },
            {
              content_type:"text",
              title:"USSC",
              payload:"USSC"
            },            
            {
              content_type:"text",
              title:"Pioneer Branches",
              payload:"PIONEER"
            }
          ]
        }
      };

      callSendAPI(messageData);

  }

  else if(payload == 'SM_STORE'){

    var post = {Tag: 'SM'}

    console.log('insert');
    var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
       
    });

      sendTypingOn(senderID);    

      var messageData = {
        recipient: {
          id: senderID
        },
        message: {
          text: "Click send location to recommend the nearest participating SM stores",
          quick_replies: [
            {
              content_type:"location"
            }
          ]
        }
      };

      callSendAPI(messageData);

  }

  else if(payload == 'USSC'){

    var post = {Tag: 'USSC'}

    console.log('insert');
    var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
       
    });

      sendTypingOn(senderID);    

      var messageData = {
        recipient: {
          id: senderID
        },
        message: {
          text: "Click send location to recommend the nearest participating USSC stores",
          quick_replies: [
            {
              content_type:"location"
            }
          ]
        }
      };

      callSendAPI(messageData);

  }

  else if(payload == 'PIONEER'){

    var post = {Tag: 'PIONEER'}

    console.log('insert');
    var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
       
    });

      sendTypingOn(senderID);    

      var messageData = {
        recipient: {
          id: senderID
        },
        message: {
          text: "Click send location to recommend the nearest participating Pioneer stores",
          quick_replies: [
            {
              content_type:"location"
            }
          ]
        }
      };

      callSendAPI(messageData);

  }

  else if(payload == 'INSURE_SHOP'){

    var post = {LastClicked: 'INSURE_SHOP'}

    console.log('insert');
    var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
       
    });

    sendTypingOn(senderID);

    var messageData = {
      recipient: {
        id: senderID
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: "Awesome. Please click the link below to be redirected to website:",
            buttons:[{
              type: "web_url",
              url: "http://www.pioneer.com.ph/products/safe-trip",
              title: "Medicash Dengue"
            }, {
              type: "web_url",
              url: "http://www.pioneer.com.ph/products/safe-trip",
              title: "Safe Trip"
            }, {
              type: "web_url",
              url: "http://www.pioneer.com.ph/products/compulsory-third-party-liability",
              title: "Cumpolsory Third Party Liability"
            }]
          }
        }
      }
    };  

    callSendAPI(messageData);

  }  

  else if(payload == 'CAREERS'){

    var post = {LastClicked: 'CAREERS'}

    console.log('insert');
    var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
       
    });

    sendTypingOn(senderID);    

    var text = "Thank you for your interest. Email us today at talentacquisition@pioneer.com.ph. Attach your updated resume in .doc or .pdf format.";
    sendTextMessage(senderID, text);

  }

  else if(payload == "CONCERNS"){

    var post = {LastClicked: 'CONCERNS', Tag: 'CONCERNS'}

    console.log('insert');
    var query = connection.query("UPDATE patsy_users SET ? WHERE MessengerId = '"+senderID+"'", post, function(err, result) {
       
    });

    needle.get('https://graph.facebook.com/v2.6/'+senderID+'?access_token='+PAGE_ACCESS_TOKEN, function(error, response) {  

      sendTypingOn(senderID);

      var text = "Hi "+response.body.first_name+"! :) Please type your concerns here. I'll make sure to send it to our representative. They will respond to you as soon as they can. Kindly wait for a proper response from them. Thank you.";
      sendTextMessage(senderID, text); 

    });
  }

  else if(payload == 'PROMO_REG'){

    sendTextMessage(senderID, "under development :)");

  }


}// End processpostback


function receivedPostback(event) {
  var senderID = event.sender.id;
  var senderName = event.sender.name;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);
  console.log(event);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful

  processPostback(payload, senderID, senderName, timeOfPostback);

  // sendTextMessage(senderID, "Postback called");
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark;
  var sequenceNumber = event.read.seq;

  console.log("Received message read event for watermark %d and sequence " +
    "number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/rift.png"
        }
      }
    }
  };

  callSendAPI(messageData);
}

function sendGifMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: SERVER_URL + "/assets/instagram_logo.gif"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "audio",
        payload: {
          url: SERVER_URL + "/assets/sample.mp3"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 *
 */
function sendVideoMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "video",
        payload: {
          url: SERVER_URL + "/assets/allofus480.mov"
        }
      }
    }
  };

  callSendAPI(messageData);


}

/*
 * Send a file using the Send API.
 *
 */
function sendFileMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "file",
        payload: {
          url: SERVER_URL + "/assets/test.txt"
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a text message using the Send API.
 *
 */
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */

function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is test text",
          buttons:[{
            type: "web_url",
            url: "https://www.oculus.com/en-us/rift/",
            title: "Open Web URL"
          }, {
            type: "postback",
            title: "Trigger Postback",
            payload: "DEVELOPER_DEFINED_PAYLOAD"
          }, {
            type: "phone_number",
            title: "Call Phone Number",
            payload: "+16505551234"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a Structured Message (Generic Message type) using the Send API.
 *
 */
function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: SERVER_URL + "/assets/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: SERVER_URL + "/assets/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Send a receipt message using the Send API.
 *
 */
function sendReceiptMessage(recipientId) {
  // Generate a random receipt ID as the API requires a unique ID
  var receiptId = "order" + Math.floor(Math.random()*1000);

  var messageData = {
    recipient: {
      id: recipientId
    },
    message:{
      attachment: {
        type: "template",
        payload: {
          template_type: "receipt",
          recipient_name: "Peter Chang",
          order_number: receiptId,
          currency: "USD",
          payment_method: "Visa 1234",        
          timestamp: "1428444852", 
          elements: [{
            title: "Oculus Rift",
            subtitle: "Includes: headset, sensor, remote",
            quantity: 1,
            price: 599.00,
            currency: "USD",
            image_url: SERVER_URL + "/assets/riftsq.png"
          }, {
            title: "Samsung Gear VR",
            subtitle: "Frost White",
            quantity: 1,
            price: 99.99,
            currency: "USD",
            image_url: SERVER_URL + "/assets/gearvrsq.png"
          }],
          address: {
            street_1: "1 Hacker Way",
            street_2: "",
            city: "Menlo Park",
            postal_code: "94025",
            state: "CA",
            country: "US"
          },
          summary: {
            subtotal: 698.99,
            shipping_cost: 20.00,
            total_tax: 57.67,
            total_cost: 626.66
          },
          adjustments: [{
            name: "New Customer Discount",
            amount: -50
          }, {
            name: "$100 Off Coupon",
            amount: -100
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "What's your favorite movie genre?",
      quick_replies: [
        {
          "content_type":"text",
          "title":"Action",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_ACTION"
        },
        {
          "content_type":"text",
          "title":"Comedy",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_COMEDY"
        },
        {
          "content_type":"text",
          "title":"Drama",
          "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_DRAMA"
        }
      ]
    }
  };

  callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {
  console.log("Sending a read receipt to mark message as seen");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "mark_seen"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  console.log("Turning typing indicator on");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_on"
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  console.log("Turning typing indicator off");

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: "typing_off"
  };

  callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "Welcome. Link your account.",
          buttons:[{
            type: "account_link",
            url: SERVER_URL + "/authorize"
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });  
}


function callSendAPI2(messageData, position) {
  console.log(messageData[position]);

  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData[position]

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if(position < messageData.length - 1){
        callSendAPI2(messageData, position+1);
      }

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s", 
          messageId, recipientId);
      } else {
      console.log("Successfully called Send API for recipient %s", 
        recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });  
}

function safetripReq(mid, sctype){
  var messageData = {
    recipient: {
      id: mid
    },
    message: {
      text: sctype,
      quick_replies: [
        {
          "content_type":"text",
          "title":"Back to Claims",
          "payload":"CLAIMS"
        },
        {
          "content_type":"text",
          "title":"Back to Main Menu",
          "payload":"GET_STARTED"
        }        
      ]
    }
  };

  callSendAPI(messageData);
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid 
// certificate authority.
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

