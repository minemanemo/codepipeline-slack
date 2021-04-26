const https = require('https');

exports.handler = (event, context, callback) => {
  const { Sns } = event.Records[0];
  const message = Sns.Message || 'is not from SNS';
  console.log('🚀 ', message);

  const options = {
    hostname: 'hooks.slack.com',
    path: '/services/TK96ZMETG/B0205PWN084/iGnw8eqzvRg6ajjgxWl3e1va',
    method: 'POST',
    port: 443,
    headers: { 'Content-Type': 'application/json' },
  };

  const data = JSON.stringify({ text: message });

  const req = https.request(options, (res) => {
    res.on('data', (d) => process.stdout.write(d));

    callback(null, event.num * 10);
  });

  req.on('error', (error) => console.error(error));

  req.write(data);
  req.end();
};
