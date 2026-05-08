const https = require('https');
https.get('https://files.catbox.moe/lubzno.png', (res) => {
  let chunks = [];
  res.on('data', d => chunks.push(d));
  res.on('end', () => {
    let base64 = Buffer.concat(chunks).toString('base64');
    console.log(base64.slice(0, 50) + "...");
    const fs = require('fs');
    fs.writeFileSync('logoBase64.txt', base64);
  });
});
