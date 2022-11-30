import { Router } from "express";
import {
  AuthenticatedRequest,
  requiresPermission,
} from "../../../../middleware/authentication";
import { ServerPermission } from "../../../../../authentication/permissions";
import { basename, join, normalize } from "path";
import { ClientMinecraftServer } from "src/minecraft/server";
import { User } from "../../../../../data/models/user";
import { readFile, getFileData, writeFile } from "../../../../../socket/utils";
import { ExpressFile, FileRequest } from "../../../../index";
export const router = Router({ mergeParams: true });

router.get(
  "/download/:path*",
  requiresPermission(ServerPermission.READ_FILES),
  async (req, res) => {
    const auth = req as AuthenticatedRequest;
    const accessible: ClientMinecraftServer[] = await User.getAssociatedServers(
      auth.discord.id
    );

    const server: ClientMinecraftServer | undefined = accessible.find(
      (s) => s._id === req.params.server.toLowerCase()
    );
    if (!server)
      return res
        .status(403)
        .json({
          error: true,
          message: "You do not have permission to do that.",
        });

    let path = req.params.path;
    if (!path)
      return res
        .status(400)
        .json({
          error: true,
          message: "An internal error has occurred",
          code: 2,
        });
    if (!!req.params[0]) path += "/" + req.params[0];
    path = normalize(path).replace(/\\/g, "/");

    const root = req.query.hasOwnProperty("root");
    if (root) {
      const user = await auth.discord.getUser();
      if (!user.admin)
        return res
          .status(403)
          .json({
            error: true,
            message: "You do not have permission to do that.",
          });
    }

    const socket = server.getSocket();
    if (!socket)
      return res
        .status(500)
        .json({ error: true, message: "The server is not currently online!" });

    const file = await getFileData(socket, path, root);
    if (!file)
      return res
        .status(404)
        .json({ error: true, message: "This file does not exist!" });

    const [download, size] = await readFile(socket, path, root);
    res.set("Content-Length", size.toString());

    res.attachment(basename(path));
    download.pipe(res);
  }
);

router.post(
  ["/upload/:path*", "/upload"],
  requiresPermission(ServerPermission.WRITE_FILES),
  async (req, res) => {
    const auth = req as AuthenticatedRequest;
    const accessible: ClientMinecraftServer[] = await User.getAssociatedServers(
      auth.discord.id
    );

    const server: ClientMinecraftServer | undefined = accessible.find(
      (s) => s._id === req.params.server.toLowerCase()
    );
    if (!server)
      return res
        .status(403)
        .json({
          error: true,
          message: "You do not have permission to do that.",
        });

    let path = req.params.path || "/";
    if (!!req.params[0]) path += "/" + req.params[0];
    path = normalize(path).replace(/\\/g, "/");

    const root = req.query.hasOwnProperty("root");
    if (root) {
      const user = await auth.discord.getUser();
      if (!user.admin)
        return res
          .status(403)
          .json({
            error: true,
            message: "You do not have permission to do that.",
          });
    }

    const socket = server.getSocket();
    if (!socket)
      return res
        .status(500)
        .json({ error: true, message: "The server is not currently online!" });

    const fileReq = req as FileRequest;
    const files: ExpressFile[] = Array.isArray(fileReq.files.file)
      ? fileReq.files.file
      : [fileReq.files.file];

    for (const file of files) {
      const filePath = join(path, file.name).replace(/\\/g, "/");
      const stream = writeFile(socket, filePath, root);

      // Upload file.data to stream in chunks of 1mb
      let offset = 0;
      while (offset < file.data.length) {
        stream._write(
          file.data.slice(offset, offset + 1024 * 1024) as Buffer,
          "binary",
          () => {}
        );
        offset += 1024 * 1024;
      }

      stream.end();
    }

    return res.json({
      error: false,
      message: `Successfully uploaded ${files.length} files`,
      files,
    });
  }
);

router.get(
  "/:path*",
  requiresPermission(ServerPermission.READ_FILES),
  async (req, res) => {
    const auth = req as AuthenticatedRequest;
    const accessible: ClientMinecraftServer[] = await User.getAssociatedServers(
      auth.discord.id
    );

    const server: ClientMinecraftServer | undefined = accessible.find(
      (s) => s._id === req.params.server.toLowerCase()
    );
    if (!server)
      return res
        .status(403)
        .json({
          error: true,
          message: "You do not have permission to do that.",
        });

    let path = req.params.path;
    if (!path)
      return res
        .status(400)
        .json({
          error: true,
          message: "An internal error has occurred",
          code: 2,
        });
    if (!!req.params[0]) path += "/" + req.params[0];
    path = normalize(path).replace(/\\/g, "/");

    const root = req.query.hasOwnProperty("root");
    if (root) {
      const user = await auth.discord.getUser();
      if (!user.admin)
        return res
          .status(403)
          .json({
            error: true,
            message: "You do not have permission to do that.",
          });
    }

    const socket = server.getSocket();
    if (!socket)
      return res
        .status(500)
        .json({ error: true, message: "The server is not currently online!" });

    const file = await getFileData(socket, path, root);
    if (!file)
      return res
        .status(404)
        .json({ error: true, message: "This file does not exist!" });

    return res.json(file);
  }
);
