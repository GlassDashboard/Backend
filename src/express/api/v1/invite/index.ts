import { Request, Router } from "express";
export const router = Router();

import { Invite, InviteModel } from "../../../../data/models/invite";
import { User, UserModel } from "../../../../data/models/user";
import {
  AuthenticatedRequest,
  loggedIn,
} from "../../../middleware/authentication";
import ratelimit from "../../../middleware/ratelimit";
import { DocumentType } from "@typegoose/typegoose";

router.get(
  "/confirm/:invite",
  loggedIn,
  ratelimit(3, "10s"),
  ratelimit(50, "1m", true),
  async (req: Request, res) => {
    const auth = req as AuthenticatedRequest;

    const invite = req.params.invite as string;
    if (!invite)
      return res
        .status(400)
        .json({ error: true, message: "No invite provided." });

    const data: DocumentType<Invite> | null = await InviteModel.findById(
      invite
    );
    if (!data)
      return res
        .status(404)
        .json({ error: true, message: "Invite not found." });

    if (data.invalid)
      return res
        .status(400)
        .json({
          error: true,
          message: "This invite was invalidated by an administrator.",
        });

    if (data.adminOnly) {
      const user: User | null = await auth.discord.getUser();
      if (user == null || !user.admin)
        return res
          .status(403)
          .json({
            error: true,
            message: "You are not permitted to accept this invite!",
          });
    }

    if (data.uses === 0)
      return res
        .status(400)
        .json({ error: true, message: "Invite has no uses left." });

    // Set the user as invited
    const user = await UserModel.findById(auth.discord.id);
    if (user == null)
      return res
        .status(500)
        .json({
          error: true,
          message:
            "Your user profile was not found! Try logging out then back in.",
        });

    if (user.invite != undefined)
      return res
        .status(400)
        .json({ error: true, message: "You have already used an invite." });

    user.invite = data._id;
    await user.save();

    data.uses -= 1;
    await data.save();

    return res.json({
      error: false,
      message: "",
      invite: data.toJson(),
    });
  }
);
