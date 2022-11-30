import { io } from "../../../index";
import { AuthSocket } from "../../../authentication";
import SocketEvent from "../../SocketEvent";

export default class CommandHistoryEvent extends SocketEvent {
  override readonly event = "CONSOLE_LOG";
  override readonly type = "PLUGIN";
  override readonly parameters = ["string"];

  override async onEvent(socket: AuthSocket, log: string) {
    const data: any | null = this.safeParse(log);
    if (!data) return socket.emit("error", "Malformed data provided for log");

    io.to("client" + socket.minecraft!._id.toLowerCase()).emit(
      "CONSOLE_LOG",
      socket.minecraft!!._id,
      data
    );
  }
}
