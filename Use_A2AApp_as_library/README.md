# Use A2AApp as a Library

To build an A2A network, you'll need to create several clients and servers. Using A2AApp as a library can significantly streamline this process. This section explains how to use A2AApp as a library.

---

### Library Project Key

```
1OuHIiA5Ge0MG_SpKdv1JLz8ZS3ouqhvrF5J6gRRr6xFiFPHxkRsgjMI6
```

---

## Usage

To use A2AApp as a library, follow these installation steps:

### 1. Create a GAS Project

You can use this library with both standalone and container-bound Google Apps Script (GAS) projects.

### 2. Install the Library

Follow the instructions [here to install this library](https://developers.google.com/apps-script/guides/libraries). The library's project key is **`1OuHIiA5Ge0MG_SpKdv1JLz8ZS3ouqhvrF5J6gRRr6xFiFPHxkRsgjMI6`**.

### 3. Prepare Your Script

When using A2AApp as a library, you'll need to modify your script as shown below. You don't need to copy and paste `A2AApp.gs` and `GeminiWithFiles.gs` because they are included in the library.

#### For Clients

Modify [A2AClient.js](https://github.com/tanaikech/A2AApp/blob/master/A2AClient.js) as follows:

**From:**

```javascript
const obj = new A2AApp().client(object);
```

**To:**

```javascript
const obj = new A2AApp.a2aApp().setServices({ lock: LockService.getScriptLock() }).client(object);
```

#### For Servers

Modify [A2A server 1_Google Sheets Manager Agent.js](https://github.com/tanaikech/A2AApp/blob/master/A2A%20server%201_Google%20Sheets%20Manager%20Agent.js) as follows. Apply the same change to other servers.

**From:**

```javascript
const res = new A2AApp({ accessKey: "sample" }).server(object);
```

**To:**

```javascript
const res = new A2AApp.a2aApp({ accessKey: "sample" }).setServices({ lock: LockService.getScriptLock() }).server(object);
```
