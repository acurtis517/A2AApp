const apiKey = "###"; // Please set your API key for using Gemini API.
const agentCardUrls = [];

/**
 * This is a sample agent card.
 * You can see the specification of the agent card at the following official site.
 * Ref: https://google.github.io/A2A/specification/
 */
const getAgentCard_ = _ => (
  {
    "name": "Google Sheets Manager Agent",
    "description": [
      `Provide management for using Google Sheets.`,
      `- Get values from cells.`,
      `- Put values to cells.`,
      '- Put an image into a cell on Google Sheets.',
    ].join("\n"),
    "provider": {
      "organization": "Tanaike",
      "url": "https://github.com/tanaikech"
    },
    "version": "1.0.0",
    "url": `${ScriptApp.getService().getUrl()}?accessKey=sample`,
    "defaultInputModes": ["text/plain"],
    "defaultOutputModes": ["text/plain"],
    "capabilities": {
      "streaming": false,
      "pushNotifications": false,
      "stateTransitionHistory": false,
    },
    "skills": [
      {
        "id": "get_values_from_cells",
        "name": "Get values from cells",
        "description": "From the given cell range, get values from cells on Google Sheets and return the values.",
        "tags": ["Google Sheets", "Google Spreadsheet", "range", "cells", "get"],
        "examples": [
          'Get a value from the active cell.',
          'What are the values of the active cell?',
          'Get a value from Google Sheets.',
          `Get values from Google Sheets. The condition is as follows. Spreadsheet ID is "123456789abcde". Sheet name is "Sheet1". Cell range is "A1:D5".`
        ],
        "inputModes": ["text/plain"],
        "outputModes": ["text/plain"]
      },
      {
        "id": "put_values_to_cells",
        "name": "Put values to cells",
        "description": "By giving the values and the cell range, put the values to the cells on Google Sheets.",
        "tags": ["Google Sheets", "Google Spreadsheet", "range", "cells", "put"],
        "examples": [
          'Put a value to the active cell.',
          'Put values to Google Sheets.',
          `Put values to Google Sheets. The condition is as follows. Spreadsheet ID is "123456789abcde". Sheet name is "Sheet1". Cell range is "A1". Values are '[["a1", "b1"],["a2", "b2"],["a3", "b3"]]'.`
        ],
        "inputModes": ["text/plain"],
        "outputModes": ["text/plain"]
      },
      {
        "id": "put_image_into_cell",
        "name": "Put image into cell",
        "description": "By giving the values and the cell range, put an image of Base64 data or an image URL into the cell on Google Sheets.",
        "tags": ["Google Sheets", "Google Spreadsheet", "range", "cells", "put", "image"],
        "examples": [
          'Put an image into the active cell.',
          'Put an image into Google Sheets.',
          `Put an image into Google Sheets. The condition is as follows. Spreadsheet ID is "123456789abcde". Sheet name is "Sheet1". Cell range is "A1". Image is retrieved from Google Drive.`,
          `Put an image into Google Sheets. The condition is as follows. Spreadsheet ID is "123456789abcde". Sheet name is "Sheet1". Cell range is "A1". Image URL is is "https://sampleURL.com/sample.png".`,
        ],
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
const getFunctionsA2A_ = _ => (
  {
    params_: {
      get_values_from_cells: {
        description: "Use this to get values from cells on Google Sheets.",
        parameters: {
          type: "object",
          properties: {
            spreadsheetId: {
              type: "string",
              description: `Spreadsheet ID.`
            },
            sheetName: {
              type: "string",
              description: `Sheet name.`
            },
            cellRange: {
              type: "string",
              description: `Cell range for getting values. This is required to be A1Notation like "A1", "A1:B5". The sheet name is not required to be included in the A1Notation.`
            }
          },
          required: ["spreadsheetId", "sheetName", "cellRange"]
        }
      },
      put_values_into_cells: {
        description: "Use this to put values into cells on Google Sheets.",
        parameters: {
          type: "object",
          properties: {
            spreadsheetId: {
              type: "string",
              description: `Spreadsheet ID.`
            },
            sheetName: {
              type: "string",
              description: `Sheet name.`
            },
            cellRange: {
              type: "string",
              description: `Cell range for getting values. This is required to be A1Notation like "A1", "A1:B5". The sheet name is not required to be included in the A1Notation.`
            },
            values: {
              type: "array",
              items: {
                type: "array",
                items: {
                  type: "string",
                  description: "Values for putting into cells. This is required to be 2-dimensional array."
                }
              }
            }
          },
          required: ["spreadsheetId", "sheetName", "cellRange", "values"]
        }
      },
      put_image_into_cell: {
        description: "Use this to put an image into a cell on Google Sheets.",
        parameters: {
          type: "object",
          properties: {
            spreadsheetId: {
              type: "string",
              description: `Spreadsheet ID.`
            },
            sheetName: {
              type: "string",
              description: `Sheet name.`
            },
            cellRange: {
              type: "string",
              description: `Cell range for getting values. This is required to be A1Notation like "A1", "A1:B5". The sheet name is not required to be included in the A1Notation.`
            },
            imageData: {
              type: "string",
              description: "Base64 data of the image data."
            },
            imageUrl: {
              type: "string",
              description: "Direct link of the image."
            },
          },
          required: ["spreadsheetId", "sheetName", "cellRange", "imageData", "imageUrl"]
        }
      }
    },

    get_values_from_cells: (object) => {
      console.log("Run the function get_values_from_cells.");
      const { spreadsheetId, sheetName, cellRange } = object;
      let res;
      try {
        if (spreadsheetId && sheetName && cellRange) {
          const values = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName).getRange(cellRange).getDisplayValues();
          res = JSON.stringify(values);
        } else {
          const r = [{ spreadsheetId }, { sheetName }, { cellRange }].filter(e => Object.values(e)[0]);
          const rr = r.flatMap(e => Object.keys(e)).join(",");
          res = `There is no value of "${rr}".`;
        }
      } catch ({ stack }) {
        res = stack;
      }
      console.log(res); // Check response.
      return { result: res };
      // return { result: { type: "text", text: res, metadata: null } };
    },

    put_values_into_cells: (object) => {
      console.log("Run the function put_values_to_cells.");
      const { spreadsheetId, sheetName, cellRange, values } = object;
      let res;
      try {
        if (spreadsheetId && sheetName && cellRange && values && Array.isArray(values) && Array.isArray(values[0])) {
          const range = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName).getRange(cellRange).offset(0, 0, values.length, values[0].length).setValues(values);
          res = `Values ${JSON.stringify(values)} were put into ${range.getA1Notation()} in ${sheetName} on Google Sheets ${spreadsheetId}.`;
        } else {
          const r = [{ spreadsheetId }, { sheetName }, { cellRange }, { values }].filter(e => Object.values(e)[0]);
          const rr = r.flatMap(e => Object.keys(e)).join(",");
          res = `There is no value of "${rr}".`;
        }
      } catch ({ stack }) {
        res = stack;
      }
      console.log(res); // Check response.
      return { result: res };
      // return { result: { type: "text", text: res, metadata: null } };
    },

    put_image_into_cell: (object) => {
      console.log("Run the function put_values_to_cells.");
      const { spreadsheetId, sheetName, cellRange, imageData, imageUrl } = object;
      let res;
      try {
        if (spreadsheetId && sheetName && cellRange && (imageData || imageUrl)) {
          let data;
          if (imageData) {
            data = `data:${MimeType.PNG};base64,${Utilities.base64Encode(imageData)}`;
          } else if (imageUrl) {
            data = imageUrl;
          }
          if (data) {
            const value = SpreadsheetApp.newCellImage().setSourceUrl(data).build();
            const range = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName).getRange(cellRange).offset(0, 0, 1, 1).setValues([[value]]);
            res = `Image data was put into ${range.getA1Notation()} in ${sheetName} on Google Sheets ${spreadsheetId}.`;
          } else {
            res = "Image couldn't be put into the cell.";
          }
        } else {
          const r = [{ spreadsheetId }, { sheetName }, { cellRange }, { imageData }].filter(e => Object.values(e)[0]);
          const rr = r.flatMap(e => Object.keys(e)).join(",");
          res = `There is no value of "${rr}".`;
        }
      } catch ({ stack }) {
        res = stack;
      }
      console.log(res); // Check response.
      return { result: res };
      // return { result: { type: "text", text: res, metadata: null } };
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
