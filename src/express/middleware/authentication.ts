import { Request, NextFunction } from "express";
import { Discord, getDiscord } from "../../authentication/discord";
import { unsign } from "cookie-signature";
import { User } from "../../data/models/user";
import {
  hasPermission,
  ServerPermission,
} from "../../authentication/permissions";
import { ClientMinecraftServer } from "src/minecraft/server";

function getAuthorizationData(req: Request): AuthenticationData | null {
  const authentication = req.headers.authorization;
  if (!authentication) return null;

  const data = authentication.split(" ").map((s) => {
    return decodeURIComponent(s);
  });
  if (data.length != 2) return null;

  return {
    type: data[0].toLowerCase(),
    token: data[1],
    valid: ["bearer"].includes(data[0].toLowerCase()),
  };
}

async function validateToken(
  data: AuthenticationData
): Promise<Discord | null> {
  if (data.type.toLowerCase() == "bearer") {
    // Ensure the token provided is signed and real
    const token = unsign(
      data.token,
      process.env.COOKIE_SECRET || "hello world"
    );
    if (!token) return null;

    const discord = await getDiscord(token);
    if (!discord) return null;

    return discord;
  }

  return null;
}

export async function loggedIn(req: Request, res, next: NextFunction) {
  const isAuthed = getAuthorizationData(req);
  if (!isAuthed)
    return res
      .status(401)
      .json({
        error: true,
        message: "Invalid or missing authorization header!",
      });

  const discord: Discord | null = await validateToken(isAuthed);
  if (!discord)
    return res
      .status(401)
      .json({
        error: true,
        message: "Invalid or invalid signature provided for token!",
      });

  const authReq = <AuthenticatedRequest>req;
  authReq.discord = discord;

  next();
}

export function isAdmin(req: Request, res, next: NextFunction) {
  loggedIn(req, res, async () => {
    const auth = <AuthenticatedRequest>req;
    const user: User = await auth.discord.getUser();

    if (!user.admin)
      return res
        .status(403)
        .json({ error: true, message: "You are not authorized to do this!" });

    next();
  });
}

export function requiresPermission(permission: ServerPermission) {
  return (req: Request, res, next: NextFunction) => {
    loggedIn(req, res, async () => {
      const authed = <AuthenticatedRequest>req;

      let name: string | undefined =
        <string>req.params["server"] || <string>req.query["server"];
      if (!name && req.method == "POST") name = req.body["server"];

      if (!name)
        return res
          .status(400)
          .json({
            error: true,
            message: "Malformed request! You did not specify a server.",
          });

      const servers: ClientMinecraftServer[] =
        await authed.discord.getServers();
      const server: ClientMinecraftServer | undefined = await servers.find(
        (server: ClientMinecraftServer) => server._id == name
      );

      if (!server)
        return res
          .status(403)
          .json({ error: true, message: "You are not authorized to do this!" });

      if (server.permissions == 0)
        return res
          .status(500)
          .json({
            error: true,
            message:
              "Failed to properly evaluate your permissions! Please contact a developer.",
          });

      if (!hasPermission(server, permission))
        return res
          .status(403)
          .json({ error: true, message: "You are not authorized to do this!" });

      next();
    });
  };
}

export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return "discord" in req;
}

export interface AuthenticatedRequest extends Request {
  discord: Discord;
}

export interface AuthenticationData {
  type: string;
  token: string;
  valid: boolean;
}
