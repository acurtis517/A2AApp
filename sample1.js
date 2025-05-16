/**
 * This function is used for retrieving the URL for registering the AgentCard.
 * Please directly run this function and copy the URL from the log.
 */
function getRegisteringAgentCardURL() {
  const registeringAgentCardURL = `${ScriptApp.getService().getUrl()}?access_token=${ScriptApp.getOAuthToken()}`;
  console.log(registeringAgentCardURL);

  // The following comment line is used for automatically detecting the scope of "https://www.googleapis.com/auth/drive.readonly". This scope is used for accessing Web Apps. So, please don't remove the comment.
  // DriveApp.getFiles(); 
}


/**
 * Please set your Web Apps URL.
 * This URL is as follows. I think that in order to test the sample, the following URL can be used.
 * https://script.google.com/macros/s/###/exec
 * 
 * If you want to use the access key to Web Apps, please use the following URL.
 * In this case, please include {accessKey: "sample"} to the method "a2aApp".
 * https://script.google.com/macros/s/###/exec?accessKey=sample
 */
const WebAppsURL = "https://script.google.com/macros/s/###/exec";

/**
 * This is a sample agent card.
 * You can see the specification of the agent card at the following official site.
 * Ref: https://google.github.io/A2A/specification/
 * 
 * This agent card of "Currency Exchange Rates Tool" is from
 * https://google.github.io/A2A/specification/#56-sample-agent-card
 * https://github.com/google/A2A/blob/main/samples/python/agents/langgraph/__main__.py#L28
 */
const getAgentCard_ = _ => (
  {
    "name": "Google Resource Manager Agent",
    "description": [
      `Provide management for using Google resources.`,
      `Also, help with exchange values between various currencies.`,
      `1. Return an image data from a given filename by searching Google Drive.`,
      `2. Run with exchange values between various currencies. For example, this answers "What is the exchange rate between USD and GBP?".`,
    ].join("\n"),
    "provider": {
      "organization": "Tanaike",
      "url": "https://github.com/tanaikech"
    },
    "version": "1.0.0",
    "url": WebAppsURL,
    "defaultInputModes": ["text/plain"],
    "defaultOutputModes": ["text/plain"],
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
      },
      {
        "id": "convert_currency",
        "name": "Currency Exchange Rates Tool",
        "description": "Helps with exchange values between various currencies",
        "tags": ['currency conversion', 'currency exchange'],
        "examples": ['What is exchange rate between USD and GBP?'],
        "inputModes": ["text/plain"],
        "outputModes": ["text/plain"]
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
const getFunctions_ = _ => (
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
      },
      get_exchange_rate: {
        description: "Use this to get current exchange rate.",
        parameters: {
          type: "object",
          properties: {
            currency_from: {
              type: "string",
              description: "Source currency. Default is USD."
            },
            currency_to: {
              type: "string",
              description: "Destination currency. Default is EUR."
            },
            currency_date: {
              type: "string",
              description: "Date of the currency. Default is latest."
            }
          },
          required: ["currency_from", "currency_to", "currency_date"]
        }
      },
    },

    get_image_from_google_drive: ({ filename }) => {
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
          result = `There is no file of "${filename}".`;
        }
      } catch (err) {
        result = err.message;
      }
      return {
        returnThis: true, // When this is true, the response value to the A2A client is this result of this function. When you want to directly return the data from the function, please use this.
        result,
      }
    },

    /**
     * Ref: https://github.com/google/A2A/blob/main/samples/python/agents/langgraph/agent.py#L19
     * When returnThis is not used, the response value to the A2A client is generated using this result of this function.
     */
    get_exchange_rate: ({ currency_from, currency_to, currency_date }) => ({
      returnThis: false, // When this is false, the response value to the A2A client is generated using this result of this function.

      /**
       * You can see the format of the response value from the following official document.
       * Ref: https://google.github.io/A2A/specification/#65-part-union-type
       */
      result: {
        type: "text",
        text: JSON.parse(UrlFetchApp.fetch(`https://api.frankfurter.app/${currency_date}?from=${currency_from}&to=${currency_to}`).getContentText()),
        metadata: null
      }

    }),

  }
);

// doGet and doPost are used for connecting between the A2A server and the A2A client with the HTTP request.
const doGet = e => main(e);
const doPost = e => main(e);

// This is the main function.
function main(eventObject) {
  const apiKey = "###"; // Please set your API key for using Gemini API.

  const object = {
    eventObject,
    agentCard: getAgentCard_,
    functions: getFunctions_,
    apiKey,
  };
  return A2AApp.a2aApp().server(object);
}

