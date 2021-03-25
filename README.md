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

## Run Server
```sh
yarn build
```

------

# Secret Key

Your SECRET_KEY is inside the .env file. You must change the default value to one that only you know.

![Peek 2021-03-25 09-33](https://user-images.githubusercontent.com/40338524/112473515-3b310a80-8d4d-11eb-94bb-ff409c91d9b8.gif)

# Generate Token

To generate an access token, you must use your SECRET_KEY.

Using the route:

```javascript
/api/:session/:secretkey/generate-token
//example
/api/mysession/SECRETEXAMPLE/generate-token
```

### Response:

```json
{
  "status": "Success",
  "session": "wppconnect",
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

curl --request GET \
  --url http://localhost:21465/api/wppconnect:$2b$10$duQ5YYV6fojn5qFiFv.aEuY32_SnHgcmxdfxohnjG4EHJ5_Z6QWhe/start-session
```

```sh
#Send Message
# /api/:session/send-message

curl --request GET \
  --url http://localhost:21465/api/wppconnect:$2b$10$duQ5YYV6fojn5qFiFv.aEuY32_SnHgcmxdfxohnjG4EHJ5_Z6QWhe/send-message
```

See the `routes file` for all the routes. [here](/src/routes/index.js).
