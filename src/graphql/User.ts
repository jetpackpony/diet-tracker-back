import { extendType, objectType, stringArg } from "nexus";
import { join } from "path";
import { login } from "../db/models/index.js";

export const User = objectType({
  name: "User",
  sourceType: {
    module: join(process.cwd(), "src/db/models/index.ts"),
    export: "UserModel"
  },
  definition(t) {
    t.id("id", {
      resolve: (user) => user._id.toString()
    });
    t.string("userName");
  }
});

export const LoginResult = objectType({
  name: "LoginResult",
  sourceType: {
    module: join(process.cwd(), "src/db/models/index.ts"),
    export: "LoginResultModel"
  },
  definition(t) {
    t.field("user", { type: "User" });
    t.string("token");
  },
});

export const UserQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("login", {
      type: "LoginResult",
      args: {
        userName: stringArg(),
        password: stringArg()
      },
      async resolve(_root, _args, ctx) {
        return login(ctx.db, _args);
      }
    });
  }
});