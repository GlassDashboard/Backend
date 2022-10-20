import { Stats } from "fs";
import { fs } from 'memfs'

// var name: String,
//     var directory: Boolean,
// var accessible: Boolean,
//     var size: Long? = null,
// var content: String? = null,
// var children: List<FileData>? = null,
// var error: String? = null
export interface FileData {
    name: string,
    directory: boolean,
    accessible: boolean,
    size?: number,
    content?: string,
    children?: FileData[],
    error?: string
}

export function generateStat(file: FileData): Stats {
    fs.writeFileSync('/template.txt', 'No Data'); // Create a temp. file to generate a basic stats
    const stats: Stats = fs.statSync('/template.txt') // Get default stats
    fs.unlinkSync('/template.txt')

    // Attach extra info
    stats['isDirectory'] = () => { return file.directory || false }
    stats['size'] = file.size || -1
    stats['name'] = file.name

    // Return stats
    return stats;
}