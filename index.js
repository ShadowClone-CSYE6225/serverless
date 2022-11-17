const aws = require("aws-sdk");
aws.config.update({region:'us-east-1'})
const ses = new aws.SES({ region: "us-east-1" });
const dynamoDatabase = new aws.DynamoDB({
    apiVersion: '2012-08-10',
    region: process.env.AWS_REGION || 'us-east-1'
});

exports.handler = async function (event) {
    const message = event.Records[0].Sns.Message
    const messageFromWebApp = JSON.parse(message);
    const emailAddress = messageFromWebApp.email;
    const token = messageFromWebApp.token;
    const seconds = 300;
    const secondsInEpoch = Math.round(Date.now() / 1000);
    const expirationTime = secondsInEpoch + seconds;

//Creating a table for DynamoDB 
const item = {
    Item: {
        "Email": {
            S: `${emailAddress}`
        },
        "Token":{ 
        S: `${token}`
        },
        "TimeToLive":{
        S: expirationTime.toString()
        },
    },
    TableName : "csye6225",
    ReturnConsumedCapacity: "TOTAL"
  }

  //Putting an item to DynamoDB Table
  const data = await dynamoDatabase.putItem(item, function(error, data){
    if(error) console.error(error, error.stack)
    else return data
})

console.log("Item inserted into table", data)

const body = `
<!DOCTYPE html>
<html>
    <head>
    </head>
    <body>
      <p>Hi, ${emailAddress}</p>
      <p>Please verify your email</br>
      <b>Link will be valid only for 5 minutes!</b></br>
      Find your link below:</p>
      <p><a href=prod.pratiktalreja.me/v1/user/verifyUserEmail?token=${token}&email=${emailAddress} >
        demo.pratiktalreja.me/v1/user/verifyUserEmail?token=${token}&email=${emailAddress} </a> </p>
        </body></html>
    </body>
</html>`;

const params = {
  Destination: {
    ToAddresses: [emailAddress],
  },
  Message: {
    Body: {
      Html: {
        Charset: "UTF-8",
        Data: body,
      },
    }, 
    Subject: {
        Charset: "UTF-8",
        Data: "Please verify your email for Pratik's website",
      },
    },
    Source: "ShadowClone@prod.pratiktalreja.me",
  };

  return ses.sendEmail(params).promise()
  
};           