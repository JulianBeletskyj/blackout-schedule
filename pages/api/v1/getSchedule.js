const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
const pdf = require('pdf-parse')

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.file',
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'public/credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient, callback) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const res = await drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  // console.log('Files:');
  // files.map((file) => {
  //   console.log(`${file.name} (${file.id})`);
  // });
  console.log(files[0].id)
  const returnData = [];
  const fs = require('fs')
  const file = fs.createWriteStream('grafik.pdf');

  drive.files.get({
    fileId: files[0].id,
    alt: 'media',
  }, {responseType: 'stream'},
  function(err, res) {
    if (err) {
      returnData.push(["ERR"]);
      returnData.push("" + err);
    } else {
      res.data.pipe(file);
      returnData.push("Downloaded");
    }
    callback(returnData);
  })
}

/**
 * Downloads a file
 * @param{string} realFileId file ID
 * @return{obj} file status
 * */
async function downloadFile(authClient, realFileId, callback) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const returnData = [];
  const fs = require('fs')
  const file = fs.createWriteStream('grafik.pdf');

  drive.files.get({
    fileId: realFileId,
    alt: 'media',
  }, {responseType: 'stream'},
  function(err, res) {
    if (err) {
      returnData.push(["ERR"]);
      returnData.push("" + err);
    } else {
      res.data.pipe(file);
      returnData.push("Downloaded");
    }
    callback(returnData);
  })
}

const parsePDF = async (pdfPath) => {
  return new Promise((resolve, reject) => {
    const pdf_table_extractor = require("pdf-table-extractor")
    pdf_table_extractor(
      pdfPath,
      (result) => {
        const list = result.pageTables.reduce((acc, page) => {
          const row = page.tables.map(row => {
            const [streets, ...timeRanges] = row
            return {
              streets: streets,
              timeRanges: timeRanges.filter(time => time !== '')
            }
          })
          return [...acc, ...row]
        }, []).filter((_, i) => i > 4)
        resolve(list)
      },
      (error) => {
        console.log(error)
        reject(error)
      }
    )
  })
}


export default async (req, res) => {
  try {
    // const dataBuffer = await fs.readFile('grafik.pdf')
    // var pdf_table_extractor = require("pdf-table-extractor")
    const result = await parsePDF('public/grafik.pdf')
    res.status(200).json({ data: result })
  } catch (err) {
    res.status(400).json({ error: 'Have no actual schedule' })
  }
  
  
  // authorize().then((client) => {
  //   // listFiles(client, (result) => {
  //   //   console.log(result);
  //   // })
  //   downloadFile(client, '12d5guK6uZCW5zOGUfHPLBbXOz5PjoNzP', (result) => {
  //     console.log(result);
  //   })
  // }).catch(console.error);
  
  
}