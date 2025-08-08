import dotenv from "dotenv";
dotenv.config();

import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { queue as RenderMediaQueue } from "./workers/renderMedia";
import session from "express-session";
import { Express } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { ensureLoggedIn } from "connect-ensure-login";

const localStrategy = new LocalStrategy(
  {
    usernameField: "username",
    passwordField: "password",
  },
  (username, password, cb) => {
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return cb(null, { user: "bull-board" });
    }
    return cb(null, false);
  },
);

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user as Express.User | false | null);
});

passport.use(localStrategy);

const queues = [new BullMQAdapter(RenderMediaQueue)];

const createBullDashboardAndAttachRouter = (app: Express) => {
  const adapter = new ExpressAdapter();
  adapter.setBasePath("/admin/queues");
  createBullBoard({
    queues,
    serverAdapter: adapter,
  });
  app.set("views", `${__dirname}/../web/views`);
  app.set("view engine", "ejs");
  app.use(
    "/admin/*",
    session({
      secret: "keyboard cat",
      cookie: {},
      saveUninitialized: true,
      resave: true,
    }),
  );
  app.use("/admin/*", passport.initialize());
  app.use("/admin/*", passport.session());
  app.get("/admin/queues/login", (req, res) => {
    res.render("login", { invalid: req.query.invalid === "true" });
  });
  app.post(
    "/admin/queues/login",
    passport.authenticate("local", {
      failureRedirect: "/admin/queues/login?invalid=true",
      successRedirect: "/admin/queues",
    }),
  );

  app.use(
    "/admin/queues",
    ensureLoggedIn({ redirectTo: "/admin/queues/login" }),
    adapter.getRouter(),
  );
};

export { createBullDashboardAndAttachRouter };
