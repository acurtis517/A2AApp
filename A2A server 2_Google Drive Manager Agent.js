const apiKey = "###"; // Please set your API key for using Gemini API.
const agentCardUrls = [];

/**
 * This is a sample agent card.
 * You can see the specification of the agent card at the following official site.
 * Ref: https://google.github.io/A2A/specification/
 */
const getAgentCard_ = _ => (
  {
    "name": "Google Drive Manager Agent",
    "description": [
      `Provide management for using Google Drive.`,
      `- Return an image data from a given filename by searching Google Drive.`,
    ].join("\n"),
    "provider": {
      "organization": "Tanaike",
      "url": "https://github.com/tanaikech"
    },
    "version": "1.0.0",
    "url": `${ScriptApp.getService().getUrl()}?accessKey=sample`,
    "defaultInputModes": ["text/plain"],
    "defaultOutputModes": ["text/plain", "image/png"],
    "capabilities": {
      "streaming": false,
      "pushNotifications": false,
      "stateTransitionHistory": false,
    },
    "skills": [
      {
        "id": "get_image_from_google_drive",
        "name": "Get Images from Google Drive",
        "description": "Return an image data from a given filename by searching Google Drive.",
        "tags": ['image', 'google drive'],
        "examples": [
          'Return an image file of "sample.png" on Google Drive.',
          'Show an image file of "sample.png" on Google Drive.'
        ],
        "inputModes": ["text/plain"],
        "outputModes": ["image/png"]
      }
    ]
  }
);

/**
 * This is an object including sample functions. These functions are used for creating the response data to the A2A client.
 * You can see the specification of this object as follows.
 * Ref: https://github.com/tanaikech/GeminiWithFiles?tab=readme-ov-file#use-function-calling
 * 
 * get_exchange_rate is from the Google's sample as follows.
 * Ref: https://github.com/google/A2A/blob/main/samples/python/agents/langgraph/agent.py#L19
 */
const getFunctionsA2A_ = _ => (
  {
    params_: {
      get_image_from_google_drive: {
        description: "Use this to get image data from Google Drive by giving a filename.",
        parameters: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Filename of the image file on Google Drive."
            }
          },
          required: ["filename"]
        }
      }
    },

    get_image_from_google_drive: (object) => {
      console.log("Run the function get_image_from_google_drive.");
      const { filename } = object;
      let result;
      try {
        const files = DriveApp.searchFiles(`title contains '${filename}' and mimeType contains 'image' and trashed=false`);
        if (files.hasNext()) {
          const file = files.next();

          /**
           * You can see the format of the response value from the following official document.
           * Ref: https://google.github.io/A2A/specification/#65-part-union-type
           */
          result = {
            type: "file",
            file: {
              name: file.getName(),
              bytes: Utilities.base64Encode(file.getBlob().getBytes()),
              mimeType: file.getMimeType(),
            },
            metadata: null
          };

        } else {
          result = { type: "text", text: `There is no file of "${filename}".`, metadata: null };
        }
      } catch ({ stack }) {
        result = res;
        // result = { type: "text", text: stack, metadata: null };
      }
      return { result };
    }
  }
);

// doGet and doPost are used for connecting between the A2A server and the A2A client with the HTTP request.
const doGet = (e) => main(e);
const doPost = (e) => main(e);

function main(eventObject) {
  try {
    const object = {
      eventObject,
      agentCard: getAgentCard_,
      functions: getFunctionsA2A_,
      apiKey,
      agentCardUrls,
    };
    const res = new A2AApp({ accessKey: "sample" }).server(object);
    console.log(res.getContent()); // Check response.
    return res;
  } catch ({ stack }) {
    console.log(stack);
    return ContentService.createTextOutput(stack);
  }
}

/**
 * This function is used for retrieving the URL of the Web Apps.
 * Please directly run this function and copy the URL from the log.
 */
function getServerURL() {
  const serverURL = `${ScriptApp.getService().getUrl()}?accessKey=sample`;
  console.log(serverURL);


  // The following comment line is used for automatically detecting the scope of "https://www.googleapis.com/auth/drive.readonly". This scope is used for accessing Web Apps. So, please don't remove the comment.
  // DriveApp.getFiles();
}

/**
 * This function is used for retrieving the URL for registering the AgentCard to Python demo script.
 * Please directly run this function and copy the URL from the log.
 */
function getRegisteringAgentCardURL() {
  const registeringAgentCardURL = `${ScriptApp.getService().getUrl()}?access_token=${ScriptApp.getOAuthToken()}&accessKey=sample`;
  console.log(registeringAgentCardURL);
}
