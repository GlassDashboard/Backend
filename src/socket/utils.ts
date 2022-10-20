import { FileData } from "src/ftp/utils";
import { Readable } from "stream";
import { AuthSocket } from "./authentication";
import {io} from "./index";

export async function getFileData(server: AuthSocket, path: string, root: boolean = false): Promise<FileData | null> {
    return new Promise((resolve, _) => {
        server.timeout(5000).emit("FETCH_FILE", JSON.stringify({ path, root }), (err, file) => {
            if (err) return resolve(null);

            const data = safeParse(file)
            if (!data || !data.name || !data.directory || !data.size) // Fake or Malformed data
                return resolve(null);

            resolve(data as FileData);
        })
    })
}

export function readFile(server: AuthSocket, path: string, root: boolean = false): Readable {
    const stream = new Readable()
    stream._read = () => {}

    let room;

    server.timeout(5000).emit('DOWNLOAD_FILE', JSON.stringify({ path, root }), (err, id) => {
        if (err) {
            console.log(err)
            return stream.push(null) // End stream
        }

        // prefixed so people can't fake the id and listen to other server data
        room = `download-${id}`
        server.join(room)
    })

    server.on('EOF', (id) => {
        if (room != `download-${id}`) return;
        stream.push(null)
        server.leave(`download-${id}`)
    })

    server.on('BUFFER', (id, buffer) => {
        if (room != `download-${id}`) return;
        stream.push(buffer)
    })

    return stream
}

export function safeParse(json: string): any | null {
    try { return JSON.parse(json) }
    catch(_) { return null }
}