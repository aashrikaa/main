import express from "express";
import loadDb from "./loadDb"; // dummy middleware to load db (sets request.db)
import authenticate from "./authentication"; // middleware for doing authentication
import permit from "./permission"; // middleware for checking if user's role is permitted to make request

const app = express(),
      api = express.Router();

// first middleware will setup db connection
app.use(loadDb);

// authenticate each request
// will set `request.user`
app.use(authenticate);

// setup permission middleware,
// check `request.user.role` and decide if ok to continue 
app.use("/api/private", permit("admin"));
app.use(["/api/foo", "/api/bar"], permit("owner", "employee"));

// setup requests handlers
api.get("/private/whatever", (req, res) => response.json({whatever: true}));
api.get("/foo", (req, res) => response.json({currentUser: req.user}));
api.get("/bar", (req, res) => response.json({currentUser: req.user}));

// setup permissions based on HTTP Method

// account creation is public
api.post("/account", (req, res) => req.json({message: "created"}));

// account update & delete (PATCH & DELETE) are only available to account owner
api.patch("/account", permit('owner'), (req, res) => req.json({message: "updated"}));
api.delete("/account", permit('owner'), (req, res) => req.json({message: "deleted"}));

// viewing account "GET" available to account owner and account member
api.get("/account", permit('owner', 'employee'),  (req, res) => req.json({currentUser: request.user}));

// mount api router
app.use("/api", api);

// start 'er up
app.listen(process.env.PORT || 3000);
// middleware for doing role-based permissions
export default function permit(...allowed) {
  const isAllowed = role => allowed.indexOf(role) > -1;

  // return a middleware
  return (req, res, next) => {
    if (req.user && isAllowed(req.user.role))
      next(); // role is allowed, so continue on the next middleware
    else {
      response.status(403).json({message: "Forbidden"}); // user is forbidden
    }
  }
}
export default function loadDb(req, res, next) {

  // dummy db
  request.db = {
    users: {
      findByApiKey: async token => {
        switch {
          case (token == '1234') {
            return {role: 'superAdmin', id: 1234};
          case (token == '5678') {
            return {role: 'admin', id: 5678};
          case (token == '1256') {
            return {role: 'editor', id: 1256};
          case (token == '5621') {
            return {role: 'user', id: 5621};
          default:
            return null; // no user
        }
      }
    }
  };

  next();
}
export default async function authorize(req, res, next) {
  const apiToken = req.headers['x-api-token'];

  // set user on-success
  request.user = await req.db.users.findByApiKey(apiToken);

  // always continue to next middleware
  next();
}