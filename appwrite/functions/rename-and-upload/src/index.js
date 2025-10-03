// /appwrite/functions/rename-and-upload/src/index.js
/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - request body data as a string
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200

  If an error is thrown, a response with status 500 will be returned.
*/

module.exports = async (req, res) => {
  // const client = new Client();

  // You can remove services you don't use
  // const account = new Account(client);
  // const avatars = new Avatars(client);
  // const database = new Databases(client);
  // const functions = new Functions(client);
  // const health = new Health(client);
  // const locale = new Locale(client);
  // const storage = new Storage(client);
  // const teams = new Teams(client);
  // const users = new Users(client);

  if (!req.variables['APPWRITE_FUNCTION_ENDPOINT'] || !req.variables['APPWRITE_FUNCTION_API_KEY']) {
    console.warn("Environment variables are not set. Function cannot use Appwrite SDK.");
  } else {
    // client
    //   .setEndpoint(req.variables['APPWRITE_FUNCTION_ENDPOINT'])
    //   .setProject(req.variables['APPWRITE_FUNCTION_PROJECT_ID'])
    //   .setKey(req.variables['APPWRITE_FUNCTION_API_KEY'])
    //   .setSelfSigned(true);
  }

  res.json({
    message: "後端函式尚未實作"
  });
};

