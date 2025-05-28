const apiKey = "###"; // Please set your API key for using Gemini API.
const agentCardUrls = [];

/**
 * This is a sample agent card.
 * You can see the specification of the agent card at the following official site.
 * Ref: https://google.github.io/A2A/specification/
 */
const getAgentCard_ = _ => (
  {
    "name": "Google Calendar Manager Agent",
    "description": [
      `Provide management for using Google Sheets.`,
      `- Return the schedule by searching Google Calendar.`,
      `- Create the schedule (event) to Google Calendar.`,
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
        "id": "search_schedule_on_Google_Calendar",
        "name": "Search schedule on Google Calendar",
        "description": "This agent can return the schedule by searching Google Calendar.",
        "tags": ["schedule", "calendar"],
        "examples": ["Return today's schedule.", "Return the schedule on 2025-01-01."],
        "inputModes": ["text/plain"],
        "outputModes": ["text/plain"]
      },
      {
        "id": "create_schedule_to_Google_Calendar",
        "name": "Create schedule to Google Calendar",
        "description": "This agent can create the schedule (event) to Google Calendar.",
        "tags": ["schedule", "event", "calendar"],
        "examples": ["Create a schedule. The start date, end date, title, and description are '2025-05-26 10:00:00', '2025-05-26 12:00:00', Meeting, Meeting with users, respectively."],
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
      search_schedule_on_Google_Calendar: {
        description: "Search the schedule on Google Calendar.",
        parameters: {
          type: "object",
          properties: {
            date: { description: "Search the schedule on Google Calendar by giving the date. The format of the date should be ISO format (yyyy-MM-dd).", type: "string" },
          },
          required: ["date"]
        }
      },


      create_schedule_to_Google_Calendar: {
        description: "Create an event (schedule) to Google Calendar.",
        parameters: {
          type: "object",
          properties: {
            startDatetime: { description: `Start datetime of the event (schedule). The format of the date should be ISO format ("yyyy-MM-dd HH:mm:ss").`, type: "string" },
            endDatetime: { description: `End datetime of the event (schedule). The format of the date should be ISO format ("yyyy-MM-dd HH:mm:ss").`, type: "string" },
            title: { description: `Title of event (schedule).`, type: "string" },
            description: { description: `Description of event (schedule).`, type: "string" },
          },
          required: ["startDatetime", "endDatetime", "title", "description"]
        }
      }
    },


    /**
     * This function retrieves events from the specific date on Google Calendar.
     */
    search_schedule_on_Google_Calendar: (args) => {
      console.log("Run the function search_schedule_on_Google_Calendar.");
      const { date } = args;
      let res;
      try {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);
        const events = CalendarApp.getDefaultCalendar().getEvents(start, end); // or CalendarApp.getCalendarById("###").getEvents(start, end);
        const timeZone = Session.getScriptTimeZone();
        if (events.length > 0) {
          res = events.map(e => `${Utilities.formatDate(e.getStartTime(), timeZone, "HH:mm")}-${Utilities.formatDate(e.getEndTime(), timeZone, "HH:mm")}: Title: ${e.getTitle()}, Description: ${e.getDescription() || "No description"}`).join("\n");
        } else {
          res = `No events on ${date}.`;
        }
      } catch ({ stack }) {
        res = stack;
      }
      console.log(res); // Check response.
      return { result: res };
      // return { result: { type: "text", text: res, metadata: null } };
    },


    /**
     * This function create an event to Google Calendar.
     */
    create_schedule_to_Google_Calendar: (args) => {
      console.log("Run the function create_schedule_to_Google_Calendar.");
      const { startDatetime, endDatetime, title, description } = args;
      let res;
      try {
        const cal = CalendarApp.getDefaultCalendar(); // or CalendarApp.getCalendarById("###");
        const timeZone = Session.getScriptTimeZone();
        cal.createEvent(
          title,
          Utilities.parseDate(startDatetime, timeZone, "yyyy-MM-dd HH:mm:ss"),
          Utilities.parseDate(endDatetime, timeZone, "yyyy-MM-dd HH:mm:ss")
        ).setDescription(description);
        res = `An event was created as Start: ${startDatetime}, End: ${endDatetime}, Title: ${title}, Description: ${description}`;
      } catch ({ stack }) {
        res = stack;
      }
      console.log(res); // Check response.
      return { result: res };
      // return { result: { type: "text", text: res, metadata: null } };
    },
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
