# WPPConnect Team
## _WPPConnect Server_

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

Wppconnect Server is a ready-to-use API, just download, install, and start using, simple as that.

- Javascript ES6
- NodeJS
- Restfull

## Features

|                                                            |     |
| ---------------------------------------------------------- | --- |
| Multiple Sessions                                          | ✔ |
| Send **text, image, video and docs**                | ✔ |
| Get **contacts list** | ✔   |
| Receive messages                                            | ✔ |
| Open/Close Session                                        | ✔|
| Change Profile/Username                                         | ✔   |
| Create Group                                         | ✔ | 
| Join Group by Invite Code                                         | ✔ | 
| Webhook                                         | ✔ |

## Libraries Used

- WPPConnect
- Axios
- Bcrypt
- Cors
- Dotenv
- Express
- Nodemon
- SocketIO

## Installation

Install the dependencies and start the server.

```sh
yarn install
//or
npm install
```

## Run Server
```sh
yarn dev
```

## Build Server
```sh
yarn build
```

------

# Configuration

This server use config.json file to define some options, default values are:

```json
{
  // secret key to genereta access token
  "secretKey": "THISISMYSECURETOKEN", 
  "host": "http://localhost",
  "port": "21465",
  // starts all sessions when starting the server.
  "startAllSession": true,
  "webhook": {
    "url": null,
    // automatically downloads files to upload to the webhook
    "autoDownload": true,
    //marks messages as read when the webhook returns ok
    "readMessage": false,
    //sends all unread messages to the webhook when the server starts
    "allUnreadOnStart": true
  },
  //functionality that archives conversations, runs when the server starts
  "archive": {
    "enable": true,
    //maximum interval between filings.
    "waitTime": 10,
    "daysToArchive": 45
  },
  "log": {
    "level": "error",
    "logger": [ "console", "file" ]
  }
}
```

# Secret Key

Your `secretKey` is inside the `config.json` file. You must change the default value to one that only you know.

<!-- ![Peek 2021-03-25 09-33](https://user-images.githubusercontent.com/40338524/112473515-3b310a80-8d4d-11eb-94bb-ff409c91d9b8.gif) -->

# Generate Token

To generate an access token, you must use your `SECRET_KEY`.

Using the route:

```shell
  curl -X POST --location "http://localhost:21465/api/mySession/eUsouSeCreTo/generate-token"
```

### Response:

```json
{
  "status": "Success",
  "session": "mySession",
  "token": "$2b$10$duQ5YYV6fojn5qFiFv.aEuY32_SnHgcmxdfxohnjG4EHJ5_Z6QWhe",
  "full": "wppconnect:$2b$10$duQ5YYV6fojn5qFiFv.aEuY32_SnHgcmxdfxohnjG4EHJ5_Z6QWhe"
}
```

# Using Token

Save the value of the "full" response. Then use this value to call the routes.

# Examples

```sh
#Starting Session
# /api/:session/start-session

curl -X POST --location "http://localhost:21465/api/mySession/start-session" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer \$2b\$10\$JcHd97xHN6ErBuiLd7Yu4.r6McvOvEZZDQTQwev2MRK_zQObUZZ9C"
```

```sh
#Get QrCode
# /api/:session/start-session
# when the session is starting if the method is called again it will return the base64 qrCode

curl -X POST --location "http://localhost:21465/api/mySession/start-session" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer \$2b\$10\$JcHd97xHN6ErBuiLd7Yu4.r6McvOvEZZDQTQwev2MRK_zQObUZZ9C"
```

```sh
#Send Message
# /api/:session/send-message
curl -X POST --location "http://localhost:21465/api/mySession/send-message" \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer \$2b\$10\$8aQFQxnWREtBEMZK_iHMe.u7NeoNkjL7s6NYai_83Pb31Ycss6Igm" \
    -d "{
          \"phone\": \"5511982743910\",
          \"message\": \"*Abner* Rodrigues\"
        }"
```

See the `routes file` for all the routes. [here](/src/routes/index.js) and HTTP [file](/requests.http).

# Swagger UI
Swagger ui can be found at  `/api-docs`